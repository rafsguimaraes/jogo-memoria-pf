// FireMemory - Back-end simples em Node.js (Express)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Exemplo: salvar pontuação
app.post('/api/pontuacao', (req, res) => {
  const { etapa, tentativas, tempo, usuario } = req.body;
  if (!etapa || !tentativas || !tempo) {
    return res.status(400).json({ erro: 'Dados incompletos' });
  }
  const registro = { etapa, tentativas, tempo, usuario: usuario || 'Anônimo', data: new Date() };
  fs.appendFileSync('pontuacoes.json', JSON.stringify(registro) + '\n');
  res.json({ ok: true });
});

// Exemplo: listar pontuações
app.get('/api/pontuacoes', (req, res) => {
  if (!fs.existsSync('pontuacoes.json')) return res.json([]);
  const linhas = fs.readFileSync('pontuacoes.json', 'utf-8').trim().split('\n');
  const dados = linhas.map(l => JSON.parse(l));
  res.json(dados);
});

app.listen(PORT, () => {
  console.log(`FireMemory backend rodando em http://localhost:${PORT}`);
});
