const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs').promises;
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

let nextGot = false;
let nextInfo = '';

async function readFilesInFolder(folderPath) {
  const fileNames = await fs.readdir(folderPath);
  let content = '';

  for (const fileName of fileNames) {
    const filePath = path.join(folderPath, fileName);
    const fileStat = await fs.stat(filePath);

    if (fileStat.isDirectory()) {
      content += await readFilesInFolder(filePath);
    } else if (path.extname(fileName) === '.md') {
      content += await fs.readFile(filePath, 'utf-8');
      content += '\n';
    }
  }

  return content;
}

async function getDocs() {
  const docsFolderPath = path.join(__dirname, 'docs');
  const combinedContent = await readFilesInFolder(docsFolderPath);
  return combinedContent;
}

app.use(async (req, res, next) => {
  if (req.method === 'POST' && req.body && req.body.message) {
    const message = req.body.message;
    if (shouldTriggerGetDocs(message)) {
      if (!nextGot) {
        nextInfo = await getDocs(); // Call the getDocs function and store the response in nextInfo
        nextGot = true;
      }
      res.json(nextInfo); // Send the stored response to the client
    } else {
      next();
    }
  } else {
    next();
  }
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

function shouldTriggerGetDocs(userMessage) {
  const lowerCaseMessage = userMessage.toLowerCase();
  return lowerCaseMessage.includes('next.js') || lowerCaseMessage.includes('next js') || lowerCaseMessage.includes('react next') || lowerCaseMessage.includes('next react');
}
