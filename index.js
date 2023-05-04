const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const app = express();
const PORT = 3333;

// Note: Setting CORS to allow chat.openapi.com is required for ChatGPT to access your plugin
app.use(cors({ origin: [`http://localhost:${PORT}`, 'https://chat.openai.com'] }));
app.use(express.json());

const api_url = 'https://example.com';

app.get('/.well-known/ai-plugin.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'ai-plugin.json'));
});

app.get('/openapi.yaml', (req, res) => {
  const yamlData = yaml.load(fs.readFileSync(path.join(__dirname, 'openapi.yaml'), 'utf8'));
  res.json(yamlData);
});

app.get('/openapi.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'openapi.json'));
});

app.all('/:path', async (req, res) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  const url = `${api_url}/${req.params.path}`;
  console.log(`Forwarding call: ${req.method} ${req.params.path} -> ${url}`);

  try {
    const response = await axios({
      method: req.method,
      url,
      headers,
      params: req.query,
      data: req.body,
    });

    res.send(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'An error occurred while forwarding the request.' });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
