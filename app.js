const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rotas das páginas principais
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

app.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'player.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor executando em http://localhost:${PORT}`);
});