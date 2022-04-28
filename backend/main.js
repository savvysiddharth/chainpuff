const express = require('express');
const solc = require('solc');
const app = express();
const bodyParser = require('body-parser');
const port = 3000;

app.use(bodyParser.json());
// app.use(express.urlencoded( {extended: true} ));
const cors=require("cors");
app.use(cors({
   credentials: true, // for authorization
}));

app.get('/', (req, res) => {
  res.send('Hello World!')
});


app.post('/compile', (req, res) => {
  const sourceCode = req.body.code;
  console.log(sourceCode);
  
  const { abi, bytecode } = compile(sourceCode, 'SimpleStorage');
  const artifact = JSON.stringify({ abi, bytecode }, null, 2);
  res.send(artifact);
  // res.send('{"fuck":"you"}');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});

function compile(sourceCode, contractName) {
  const input = {
    language: 'Solidity',
    sources: { main: { content: sourceCode } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } },
  };
  const output = solc.compile(JSON.stringify(input));
  const artifact = JSON.parse(output).contracts.main[contractName];
  return {
    abi: artifact.abi,
    bytecode: artifact.evm.bytecode.object,
  };
}