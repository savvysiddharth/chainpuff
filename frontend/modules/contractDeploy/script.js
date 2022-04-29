const defaultContractDeployment = `{ 
  from: "0x5386ec99bec784de0ad4a262d89976bc385008dc", 
  gasLimit: "0xFF24A22"
}`;

const defaultContractArguments = `[ 99 ]`;

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

// function sleep(milliseconds) { // a blocking function
//   var start = new Date().getTime();
//   for (var i = 0; i < 1e7; i++) {
//     if ((new Date().getTime() - start) > milliseconds){
//       break;
//     }
//   }
// }

// function delay(delayInms) { // non-blocking function
//   return new Promise(resolve => {
//     setTimeout(() => {
//       resolve(2);
//     }, delayInms);
//   });
// }


// async function sendTransactions(txnOptions, batchSize, interTxnDelay) {
//   const txnHashesTimes = []
//   let lastTxnProm;
//   for(let i=0; i<batchSize; i++) {
//     const txnProm = w3.eth.sendTransaction(txnOptions).on('transactionHash', function(hash){
//       // console.log(hash);
//       let now = new Date();
//       // let now = Date.now();
//       txnHashesTimes.push([hash, now]);
//     });
//     if(interTxnDelay > 0) await delay(interTxnDelay);
//     if(i == batchSize-1) lastTxnProm = txnProm;
//   }
//   await delay(1000); // a hacky way to make sure all txn hash are stored in txnHashes
//   return [txnHashesTimes, lastTxnProm];
// }

getMethods = (obj) => Object.getOwnPropertyNames(obj).filter(item => typeof obj[item] === 'function')


// async function genLoadHandler() {
//   const nodeAddr = document.querySelector("#nodeAddr").value;
//   w3 = new Web3(nodeAddr);

//   const mycontract = JSON.parse(contractRawJson);
//   console.log(mycontract);
// }

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
    localStorage.setItem(contractAddress, JSON.stringify(COMPILED_CODE));
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