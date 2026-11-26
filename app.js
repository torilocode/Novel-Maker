require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const multer = require('multer');
const sharp = require('sharp');
const User = require('./models/User');
const Story = require('./models/Story');

const app = express();

mongoose.connect(process.env.MONGO_URI, { dbName: 'novelmaker' })
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '5mb' }));

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed.'));
        }
    }
});

app.use(session({
    secret: process.env.SESSION_SECRET || 'novelmaker_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, dbName: 'novelmaker' }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.use(passport.initialize());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value.toLowerCase().trim();
        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

        if (user) {
            if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }
            return done(null, user);
        }

        const baseHandle = email.split('@')[0].replace(/[^a-z0-9]/g, '').slice(0, 18) || 'writer';
        let uniqueUsername = baseHandle;
        while (await User.exists({ username: uniqueUsername })) {
            uniqueUsername = `${baseHandle}${Math.floor(1000 + Math.random() * 9000)}`;
        }

        user = await User.create({
            nickname: uniqueUsername,
            username: uniqueUsername,
            email,
            googleId: profile.id
        });

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

// Rotas de autenticação com Google
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
}));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login', session: false }),
    (req, res) => {
        req.session.user = {
            id: req.user._id,
            nickname: req.user.nickname,
            username: req.user.username,
            email: req.user.email,
            bio: req.user.bio,
            avatar: req.user.avatar || null
        };
        res.redirect('/profile');
    }
);

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

app.use((req, res, next) => {
    const originalRender = res.render;
    res.render = function (view, options = {}, callback) {
        res.locals.activePage = options.activePage || view;
        originalRender.call(this, view, options, callback);
    };
    next();
});

function requireAuth(req, res, next) {
    if (!req.session.user) return res.redirect('/login');
    next();
}

// --- ROTAS DE PÁGINAS ---
app.get('/', (req, res) => {
    res.render('index', { activePage: 'home' });
});

app.get('/login', (req, res) => {
    if (req.session.user) return res.redirect('/writer');
    res.render('login', { activePage: 'login', error: null, mode: 'login' });
});

// Novo projeto em branco
app.get('/writer', requireAuth, (req, res) => {
    res.render('writer', { activePage: 'writer', story: null });
});

// Editar projeto existente
app.get('/writer/:id', requireAuth, async (req, res) => {
    try {
        const story = await Story.findOne({ _id: req.params.id, author: req.session.user.id });
        if (!story) return res.redirect('/writer');
        res.render('writer', { activePage: 'writer', story });
    } catch (err) {
        res.redirect('/writer');
    }
});

// Rota pública do leitor de histórias (ex: /read/ID_DA_HISTORIA?chapter=2)
app.get('/read/:storyId', async (req, res) => {
    try {
        const story = await Story.findById(req.params.storyId).populate('author', 'username nickname');
        if (!story) {
            return res.status(404).render('404', {
                activePage: 'discover',
                icon: 'book-x',
                title: 'Novel Not Found',
                message: 'This manuscript does not exist or may have been deleted by its author.'
            });
        }

        const isAuthor = Boolean(
            req.session.user && story.author && req.session.user.id.toString() === story.author._id.toString()
        );

        const parsedChapter = parseInt(req.query.chapter, 10);
        const initialChapter = (!isNaN(parsedChapter) && parsedChapter >= 0 && parsedChapter < story.chapters.length)
            ? parsedChapter
            : 0;

        res.render('reader', {
            activePage: 'discover',
            story,
            isAuthor,
            initialChapter
        });
    } catch (err) {
        console.error(err);
        return res.status(404).render('404', {
            activePage: 'discover',
            icon: 'book-x',
            title: 'Novel Not Found',
            message: 'The link you followed appears to be invalid or broken.'
        });
    }
});

// Rota pública do catálogo Discover
app.get('/discover', async (req, res) => {
    const stories = await Story.find().populate('author', 'username nickname').sort({ updatedAt: -1 });
    res.render('discover', { activePage: 'discover', stories });
});

// Redireciona /profile para /profile/username do usuário logado
app.get('/profile', requireAuth, (req, res) => {
    res.redirect(`/profile/${req.session.user.username}`);
});

// Rota pública de perfil por username (ex: /profile/fulano123)
app.get('/profile/:username', async (req, res) => {
    try {
        const cleanUsername = req.params.username.replace(/^@/, '').toLowerCase().trim();
        const profileUser = await User.findOne({ username: cleanUsername });

        if (!profileUser) {
            return res.status(404).render('404', {
                activePage: 'discover',
                icon: 'user-x',
                title: 'Author Not Found',
                message: 'No writer with that @username was found on NovelMaker.'
            });
        }

        const stories = await Story.find({ author: profileUser._id }).sort({ updatedAt: -1 });

        const isOwnProfile = Boolean(
            req.session.user && req.session.user.id.toString() === profileUser._id.toString()
        );

        const isFollowing = Boolean(
            req.session.user &&
            !isOwnProfile &&
            Array.isArray(profileUser.followers) &&
            profileUser.followers.some(id => id.toString() === req.session.user.id.toString())
        );

        res.render('profile', {
            activePage: isOwnProfile ? 'profile' : 'discover',
            profileUser,
            stories,
            isOwnProfile,
            isFollowing
        });
    } catch (err) {
        console.error(err);
        return res.status(404).render('404', {
            activePage: 'discover',
            icon: 'user-x',
            title: 'Author Not Found',
            message: 'The author profile link you followed appears to be invalid.'
        });
    }
});

// Upload e compressão de avatar (128x128 WebP)
app.post('/profile/avatar', requireAuth, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.redirect('/profile');
        }

        const compressedBuffer = await sharp(req.file.buffer)
            .resize(128, 128, { fit: 'cover', position: 'centre' })
            .webp({ quality: 80 })
            .toBuffer();

        const base64Avatar = `data:image/webp;base64,${compressedBuffer.toString('base64')}`;

        await User.findByIdAndUpdate(req.session.user.id, { avatar: base64Avatar });
        req.session.user.avatar = base64Avatar;

        res.redirect('/profile');
    } catch (err) {
        console.error('Avatar upload error:', err);
        res.redirect('/profile');
    }
});

// Editar Nickname e Bio pelo Modal
app.post('/profile/edit', requireAuth, async (req, res) => {
    try {
        const rawNickname = (req.body.nickname || '').trim();
        const rawBio = (req.body.bio || '').trim();

        const cleanNickname = rawNickname.slice(0, 32) || req.session.user.username;
        const cleanBio = rawBio.slice(0, 220);

        await User.findByIdAndUpdate(req.session.user.id, {
            nickname: cleanNickname,
            bio: cleanBio
        });

        req.session.user.nickname = cleanNickname;
        req.session.user.bio = cleanBio;

        res.redirect('/profile');
    } catch (err) {
        console.error('Profile update error:', err);
        res.redirect('/profile');
    }
});

// Seguir / Deixar de seguir (Toggle via Fetch API)
app.post('/api/users/:userId/follow', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, redirect: '/login' });
    }

    try {
        const currentUserId = req.session.user.id;
        const targetUserId = req.params.userId;

        if (currentUserId.toString() === targetUserId.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot follow yourself' });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const alreadyFollowing = Array.isArray(targetUser.followers) && targetUser.followers.some(
            id => id.toString() === currentUserId.toString()
        );

        if (alreadyFollowing) {
            await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
            await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
        } else {
            await User.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
            await User.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });
        }

        const updatedTarget = await User.findById(targetUserId).select('followers');

        res.json({
            success: true,
            following: !alreadyFollowing,
            followersCount: updatedTarget.followers.length
        });
    } catch (err) {
        console.error('Follow toggle error:', err);
        res.status(500).json({ success: false, message: 'Error toggling follow' });
    }
});

// Projects: tabela detalhada
app.get('/projects', requireAuth, async (req, res) => {
    const stories = await Story.find({ author: req.session.user.id }).sort({ updatedAt: -1 });
    res.render('projects', { activePage: 'projects', stories });
});

// Renomear projeto na página Projects
app.post('/projects/:id/rename', requireAuth, async (req, res) => {
    try {
        const cleanTitle = (req.body.title || '').trim().slice(0, 80) || 'Untitled Novel';
        await Story.findOneAndUpdate(
            { _id: req.params.id, author: req.session.user.id },
            { title: cleanTitle }
        );
        res.redirect('/projects');
    } catch (err) {
        console.error('Rename project error:', err);
        res.redirect('/projects');
    }
});

// Upload de capa personalizada (proporção 2:3 -> 140x210 WebP)
app.post('/projects/:id/cover', requireAuth, upload.single('cover'), async (req, res) => {
    try {
        if (!req.file) return res.redirect('/projects');

        const compressedCover = await sharp(req.file.buffer)
            .resize(140, 210, { fit: 'cover', position: 'centre' })
            .webp({ quality: 80 })
            .toBuffer();

        const base64Cover = `data:image/webp;base64,${compressedCover.toString('base64')}`;

        await Story.findOneAndUpdate(
            { _id: req.params.id, author: req.session.user.id },
            { coverImage: base64Cover }
        );

        res.redirect('/projects');
    } catch (err) {
        console.error('Cover upload error:', err);
        res.redirect('/projects');
    }
});

// Excluir projeto na página Projects (com validação do nome case-insensitive)
app.post('/projects/:id/delete', requireAuth, async (req, res) => {
    try {
        const story = await Story.findOne({
            _id: req.params.id,
            author: req.session.user.id
        });

        if (!story) {
            return res.redirect('/projects');
        }

        const typedTitle = (req.body.confirmTitle || '').trim().toLowerCase();
        const actualTitle = (story.title || '').trim().toLowerCase();

        if (typedTitle !== actualTitle) {
            return res.redirect('/projects');
        }

        await Story.findByIdAndDelete(story._id);
        res.redirect('/projects');
    } catch (err) {
        console.error('Delete project error:', err);
        res.redirect('/projects');
    }
});

// --- API DE SALVAMENTO DE HISTÓRIA ---
app.post('/api/stories/save', requireAuth, async (req, res) => {
    try {
        const { storyId, title, chapters } = req.body;
        const cleanTitle = (title && title.trim() !== '') ? title.trim() : 'Untitled Novel';

        if (storyId) {
            const updated = await Story.findOneAndUpdate(
                { _id: storyId, author: req.session.user.id },
                { title: cleanTitle, chapters },
                { returnDocument: 'after' }
            );
            return res.json({ success: true, storyId: updated._id });
        }

        const themes = ['cover-emerald', 'cover-amber', 'cover-cognac'];
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];

        const created = await Story.create({
            author: req.session.user.id,
            title: cleanTitle,
            coverTheme: randomTheme,
            chapters
        });

        res.json({ success: true, storyId: created._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error saving story' });
    }
});

// --- AUTENTICAÇÃO ---
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const cleanUsername = username.replace(/^@/, '').toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
        const cleanEmail = email.toLowerCase().trim();

        if (!cleanUsername || !cleanEmail || !password) {
            return res.render('login', {
                activePage: 'login',
                error: 'Please fill in all fields with a valid username.',
                mode: 'register'
            });
        }

        const existingUser = await User.findOne({
            $or: [{ email: cleanEmail }, { username: cleanUsername }]
        });

        if (existingUser) {
            return res.render('login', {
                activePage: 'login',
                error: 'Email or username is already in use.',
                mode: 'register'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            nickname: cleanUsername,
            username: cleanUsername,
            email: cleanEmail,
            password: hashedPassword
        });

        req.session.user = {
            id: newUser._id,
            nickname: newUser.nickname,
            username: newUser.username,
            email: newUser.email,
            bio: newUser.bio,
            avatar: newUser.avatar || null
        };

        res.redirect('/profile');
    } catch (err) {
        res.render('login', {
            activePage: 'login',
            error: 'Could not create account.',
            mode: 'register'
        });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
            return res.render('login', {
                activePage: 'login',
                error: 'Invalid email or password.',
                mode: 'login'
            });
        }

        req.session.user = {
            id: user._id,
            nickname: user.nickname,
            username: user.username,
            email: user.email,
            bio: user.bio,
            avatar: user.avatar || null
        };

        res.redirect('/profile');
    } catch (err) {
        res.render('login', {
            activePage: 'login',
            error: 'An error occurred during login.',
            mode: 'login'
        });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// URL pública: /novel/:storyId -> renderiza a view interna 'novel-details'
app.get('/novel/:storyId', async (req, res) => {
    try {
        const story = await Story.findById(req.params.storyId).populate('author', 'username nickname avatar');
        if (!story) {
            return res.status(404).render('404', {
                activePage: 'discover',
                icon: 'book-x',
                title: 'Novel Not Found',
                message: 'This manuscript does not exist or may have been deleted by its author.'
            });
        }

        const isAuthor = Boolean(
            req.session.user && story.author && req.session.user.id.toString() === story.author._id.toString()
        );

        res.render('novel-details', {
            activePage: 'discover',
            story,
            isAuthor
        });
    } catch (err) {
        console.error(err);
        return res.status(404).render('404', {
            activePage: 'discover',
            icon: 'book-x',
            title: 'Novel Not Found',
            message: 'The link you followed appears to be invalid or broken.'
        });
    }
});

// Salvar sinopse / detalhes do projeto na página Projects
app.post('/projects/:id/details', requireAuth, async (req, res) => {
    try {
        const cleanSynopsis = (req.body.synopsis || '').trim().slice(0, 1200);
        await Story.findOneAndUpdate(
            { _id: req.params.id, author: req.session.user.id },
            { synopsis: cleanSynopsis }
        );
        res.redirect('/projects');
    } catch (err) {
        console.error('Update details error:', err);
        res.redirect('/projects');
    }
});

// Fallback 404 — ÚLTIMA ROTA ANTES DO app.listen
app.use((req, res) => {
    res.status(404).render('404', {
        activePage: '',
        icon: 'compass',
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist on NovelMaker.'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));