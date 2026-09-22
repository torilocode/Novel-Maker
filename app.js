const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Configura o Express para servir arquivos estáticos (HTML, CSS, JS) da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para parsing de dados de formulário e JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota Principal -> Envia o arquivo index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota do Editor -> Envia o arquivo editor.html
app.get('/editor', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

// Middleware para tratar Erro 404 (Rota não encontrada)
app.use((req, res) => {
    res.status(404).send('<h1>Erro 404: Página não encontrada</h1><a href="/">Voltar ao Início</a>');
});

// Inicialização do Servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});