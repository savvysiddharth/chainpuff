const defaultTransaction = `{
  from: "0x5386ec99bec784de0ad4a262d89976bc385008dc",
  to: "0xcedcc0740aebd71f6cd8d0079db7d2df9a126938",
  value: "0x100",
  gasLimit: "0x24A22",
  gasPrice: "0x0"
}`;

const defaultContractDeployment = `{ 
  from: "0x5386ec99bec784de0ad4a262d89976bc385008dc", 
  gasLimit: "0xFF24A22"
}`;

const defaultContractArguments = `[ 47 ]`;

const compilerServer = "http://localhost:3000/compile/";

let COMPILED_CODE = null;

let w3;

function stringToObject(objString) { // string has to be in json-like format, but key should not be double-quoted
  let parsedObject = {};
  objString = objString.replace(/(\r\n|\n|\r|"|{|})/gm, "").trim();
  objString = objString.split(' ').join('')
  const entries = objString.split(',');
  for(let i=0; i<entries.length; i++) {
    const keyValPair = entries[i].split(':');
    // console.log(keyValPair);
    parsedObject[keyValPair[0]] = keyValPair[1];
  }
  return parsedObject;
}

function stringToArray(arrString) { // string has to be in this format: [ 23, 53, 64]
  arrString = arrString.replace(/(\r\n|\n|\r|"|\[|\])/gm, "").trim();
  if(arrString.length <= 0) return [];
  const parsedArray = arrString.split(',');
  console.log(parsedArray);
  for(let i=0; i<parsedArray.length; i++) {
    if(!isNaN(parseFloat(parsedArray[i]))) {
      parsedArray[i] = parseFloat(parsedArray[i]);
    } else {
      parsedArray[i] = parsedArray[i].trim();
    }
  }
  return parsedArray;
}

function sleep(milliseconds) { // a blocking function
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

function delay(delayInms) { // non-blocking function
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
}


async function sendTransactions(txnOptions, batchSize, interTxnDelay) {
  const txnHashesTimes = []
  let lastTxnProm;
  for(let i=0; i<batchSize; i++) {
    const txnProm = w3.eth.sendTransaction(txnOptions).on('transactionHash', function(hash){
      // console.log(hash);
      let now = new Date();
      // let now = Date.now();
      txnHashesTimes.push([hash, now]);
    });
    if(interTxnDelay > 0) await delay(interTxnDelay);
    if(i == batchSize-1) lastTxnProm = txnProm;
  }
  await delay(1000); // a hacky way to make sure all txn hash are stored in txnHashes
  return [txnHashesTimes, lastTxnProm];
}

const contractRawJson = `{
  "abi": [
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "initVal",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "address",
          "name": "_to",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_amount",
          "type": "uint256"
        }
      ],
      "name": "stored",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "get",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "retVal",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "x",
          "type": "uint256"
        }
      ],
      "name": "set",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "storedData",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ],
  "bytecode": "608060405234801561001057600080fd5b5060405161038a38038061038a833981810160405281019061003291906100b3565b7fc9db20adedc6cf2b5d25252b101ab03e124902a73fcb12b753f3d1aaa2d8f9f53382604051610063929190610130565b60405180910390a18060008190555050610159565b600080fd5b6000819050919050565b6100908161007d565b811461009b57600080fd5b50565b6000815190506100ad81610087565b92915050565b6000602082840312156100c9576100c8610078565b5b60006100d78482850161009e565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061010b826100e0565b9050919050565b61011b81610100565b82525050565b61012a8161007d565b82525050565b60006040820190506101456000830185610112565b6101526020830184610121565b9392505050565b610222806101686000396000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c80632a1afcd91461004657806360fe47b1146100645780636d4ce63c14610080575b600080fd5b61004e61009e565b60405161005b9190610109565b60405180910390f35b61007e60048036038101906100799190610155565b6100a4565b005b6100886100e7565b6040516100959190610109565b60405180910390f35b60005481565b7fc9db20adedc6cf2b5d25252b101ab03e124902a73fcb12b753f3d1aaa2d8f9f533826040516100d59291906101c3565b60405180910390a18060008190555050565b60008054905090565b6000819050919050565b610103816100f0565b82525050565b600060208201905061011e60008301846100fa565b92915050565b600080fd5b610132816100f0565b811461013d57600080fd5b50565b60008135905061014f81610129565b92915050565b60006020828403121561016b5761016a610124565b5b600061017984828501610140565b91505092915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006101ad82610182565b9050919050565b6101bd816101a2565b82525050565b60006040820190506101d860008301856101b4565b6101e560208301846100fa565b939250505056fea26469706673582212209e66c42fef83d3e622aac262c7c8e3ec9080f25acf9302d845b5b35df8eae1f264736f6c634300080c0033"
}`;

const deployedContractAddress = "0xE1fb0B56043b6477692D6F27BF725c995BF677d0";

getMethods = (obj) => Object.getOwnPropertyNames(obj).filter(item => typeof obj[item] === 'function')


async function genLoadHandler() {
  const nodeAddr = document.querySelector("#nodeAddr").value;
  w3 = new Web3(nodeAddr);

  const mycontract = JSON.parse(contractRawJson);
  console.log(mycontract);
}

function getContractMethods() {
  const contractInstance = new w3.eth.Contract(mycontract.abi, deployedContractAddress);
  console.log(contractInstance.methods);
  const arr = getMethods(contractInstance.methods);
  const methodList = arr.filter(func => func.endsWith(')'));
  console.log(methodList);
  // console.log(contractInstance.methods);
  // const res = await contractInstance.methods.get().call();
  // console.log("Obtained value at deployed contract is: "+ res);
}

// src : https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
function roundUp(value, minimumFractionDigits, maximumFractionDigits) {
  const formattedValue = value.toLocaleString('en', {
    useGrouping: false,
    minimumFractionDigits,
    maximumFractionDigits
  })
  return Number(formattedValue)
}

// sends code to backend server which returns compiled result
function compilationHandler() {
  const contractFileInput = document.querySelector("#contractFileInput");
  const compileResBox = document.querySelector("#compileResBox");

  compileResBox.innerHTML = "Please wait for compilation to finish....";

  if(contractFileInput.files.length == 0) {
    alert("Upload a file first..");
    return;
  }

  const fr = new FileReader();
  fr.readAsText(contractFileInput.files[0]);

  fr.onload = () => {
    const sourceCode = fr.result;
    // console.log(sourceCode);
    const data = {code: sourceCode};
    console.log(data);
    const response = fetch(compilerServer, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });

    response.then((res) => res.json())
    .then((data) => {
      COMPILED_CODE = data;
      console.log(data);
      compileResBox.innerHTML = '<pre>'+JSON.stringify(data, null, 2)+'</pre>';
    });
  };
}

async function deployHandler() {
  const nodeAddr = document.querySelector("#nodeAddr").value;
  w3 = new Web3(nodeAddr);

  if(COMPILED_CODE == null) {
    if(confirm("No code is compiled yet, want to start compilation?")) {
      compilationHandler();
      if(COMPILED_CODE == null) {
        return;
      }
    } else { // user does not want to compile
      return;
    }
  }
  const contractAbi = COMPILED_CODE.abi;
  const contractByteCode = COMPILED_CODE.bytecode;
  console.log(COMPILED_CODE);

  const contractDeployInput = document.querySelector("#contractDeployInput");
  const contractArguments = document.querySelector("#contractArguments");

  const basicParameters = stringToObject(contractDeployInput.value);
  const initArguments = stringToArray(contractArguments.value);

  console.log(basicParameters);
  console.log(initArguments);

  const deployResultArea = document.querySelector("#deployResult");
  deployResultArea.style.display = "block";

  const progressDisplay = document.querySelector("#contractAdress");

  createContract(contractAbi, contractByteCode, basicParameters, initArguments, progressDisplay)
  .then(async function(ci) {
    const contractAddress = ci.options.address;
    console.log("Address of contract: ", contractAddress);
    progressDisplay.innerHTML = contractAddress;
    sessionStorage.setItem(contractAddress, JSON.stringify(COMPILED_CODE));
  })
  .catch(console.error);

}

async function createContract(contractAbi, contractByteCode, basicParameters, initArguments, progressDisplay) {
  const contractInstance = new w3.eth.Contract(contractAbi);
  const ci = await contractInstance
    .deploy({ data: '0x'+contractByteCode, arguments: initArguments })
    .send(basicParameters)
    .on('transactionHash', function(hash){
      progressDisplay.innerHTML = "Waiting for deployment...";
      console.log("The transaction hash is: " + hash);
    });
  return ci;
};

function initialize() {
  // adds event listener for button
  const deployBtn = document.querySelector("#deployContract");
  deployBtn.addEventListener("click", deployHandler);

  const dropArea = document.querySelector("#dropArea");
  const dragText = document.querySelector("#dragText");
  const contractFileInput = document.querySelector("#contractFileInput");

  dropArea.addEventListener("dragover", (event)=>{
    event.preventDefault(); //preventing from default behaviour
    dropArea.classList.add("active");
    dragText.innerText = "Release to upload contract...";
  });

  dropArea.addEventListener("dragleave", ()=>{
    dropArea.classList.remove("active");
    dragText.innerText = "Drag and drop your solidity file here...";
  });

  dropArea.addEventListener("drop", (event)=>{
    event.preventDefault(); //preventing from default behaviour
    //getting user select file and [0] this means if user select multiple files then we'll select only the first one
    files = event.dataTransfer.files;
    contractFileInput.files = files;
    dragText.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> File uploaded!';
    // dropArea.classList.remove("");
  });

  contractFileInput.addEventListener("change", (event) => {
    dragText.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> File uploaded!';
  })

  const compileBtn = document.querySelector("#compileContract");
  compileBtn.addEventListener("click", compilationHandler);

  const contractDeployInput = document.querySelector("#contractDeployInput");
  contractDeployInput.innerHTML = defaultContractDeployment;

  const contractArguments = document.querySelector("#contractArguments");
  contractArguments.innerHTML = defaultContractArguments;

}

initialize();