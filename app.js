const express = require('express');
const path = require('path');
const app = express();

// Configura o EJS e a pasta views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Mantém a pasta public para CSS, JS e imagens
app.use(express.static(path.join(__dirname, 'public')));

// Rotas usando res.render() e passando qual página está ativa
app.get('/', (req, res) => {
  res.render('index', { activePage: 'home' });
});

app.get('/writer', (req, res) => {
  res.render('writer', { activePage: 'writer' });
});

app.get('/profile', (req, res) => {
  res.render('profile', { activePage: 'profile' });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});