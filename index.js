const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3333;

app.use(bodyParser.json());
app.use(cors());

// Your custom endpoints here
app.get('/getDocs', (req, res) => {
  // Example endpoint to return a list of todos
  res.json({ todos: ['get groceries', 'walk the dog'] });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
