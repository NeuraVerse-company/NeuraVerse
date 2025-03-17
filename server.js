const express = require('express');
const app = express();
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/neuracast', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'NeuraCast.html'));
});

app.get('/neurainformation', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'NeuraInformation.html'));
});

app.get('/quem-somos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'QuemSomos.html'));
});

app.get('/projetos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Projetos.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));