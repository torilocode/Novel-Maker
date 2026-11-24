require('dotenv').config();

const express = require('express');
const path = require('path');
const connectDB = require('./public/config/db'); // 1. Importa a conexão com o MongoDB

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Conecta ao banco de dados
//connectDB();

// Middlewares para processar JSON nas futuras requisições da API
app.use(express.json());

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rotas das páginas principais
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/writer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'writer.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor executando em http://localhost:${PORT}`);
});