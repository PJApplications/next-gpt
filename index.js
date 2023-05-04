const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

let nextGot = false;
let nextInfo = '';

const app = express();
const PORT = 3333;

// Note: Setting CORS to allow chat.openapi.com is required for ChatGPT to access your plugin
app.use(cors({ origin: [`http://localhost:${PORT}`, 'https://chat.openai.com'] }));
app.use(express.json());

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

const DOCS_DIR = path.join(__dirname, 'docs');

async function getDocs() {
  let combinedContent = '';

  async function processDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await processDirectory(entryPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const fileContent = fs.readFileSync(entryPath, 'utf-8');
        combinedContent += fileContent + '\n';
      }
    }
  }

  await processDirectory(DOCS_DIR);

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

app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});

function shouldTriggerGetDocs(userMessage) {
  const lowerCaseMessage = userMessage.toLowerCase();
  return lowerCaseMessage.includes('next.js') || lowerCaseMessage.includes('next js') || lowerCaseMessage.includes('react next') || lowerCaseMessage.includes('next react');
}
