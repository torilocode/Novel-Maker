require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const User = require('./models/User');
const Story = require('./models/Story');

const app = express();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '5mb' }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'novelmaker_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
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

// Perfil: grade 4xN limpa (capa + título)
// Redireciona /profile para /profile/@username do usuário logado
app.get('/profile', requireAuth, (req, res) => {
    res.redirect(`/profile/${req.session.user.username}`);
});

// Rota pública de perfil por @username (ex: /profile/@fulano123)
app.get('/profile/:username', async (req, res) => {
    try {
        // Pega o nome que veio na URL e limpa espaços/maiúsculas
        const cleanUsername = req.params.username.replace(/^@/, '').toLowerCase().trim();

        // Procura esse usuário no MongoDB
        const profileUser = await User.findOne({ username: cleanUsername });
        if (!profileUser) {
            return res.status(404).send('Author not found');
        }

        // Busca as histórias desse usuário
        const stories = await Story.find({ author: profileUser._id }).sort({ updatedAt: -1 });

        // Verifica se quem está olhando é o próprio dono do perfil
        const isOwnProfile = Boolean(
            req.session.user && req.session.user.id.toString() === profileUser._id.toString()
        );

        res.render('profile', {
            activePage: isOwnProfile ? 'profile' : 'explore',
            profileUser,
            stories,
            isOwnProfile
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

// Projects: tabela detalhada
app.get('/projects', requireAuth, async (req, res) => {
    const stories = await Story.find({ author: req.session.user.id }).sort({ updatedAt: -1 });
    res.render('projects', { activePage: 'projects', stories });
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
                { returnDocument: 'after' } // <-- Troque { new: true } por isso
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
        const { nickname, username, email, password } = req.body;
        const cleanUsername = username.replace(/^@/, '').toLowerCase().trim();

        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase().trim() }, { username: cleanUsername }]
        });

        if (existingUser) {
            return res.render('login', {
                activePage: 'login',
                error: 'Email or @username is already in use.',
                mode: 'register'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            nickname: nickname.trim(),
            username: cleanUsername,
            email: email.toLowerCase().trim(),
            password: hashedPassword
        });

        req.session.user = {
            id: newUser._id,
            nickname: newUser.nickname,
            username: newUser.username,
            email: newUser.email,
            bio: newUser.bio
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

        if (!user || !(await bcrypt.compare(password, user.password))) {
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
            bio: user.bio
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));