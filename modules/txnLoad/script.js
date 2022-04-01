const defaultTransaction = `{
  from: "0x5386ec99bec784de0ad4a262d89976bc385008dc",
  to: "0xcedcc0740aebd71f6cd8d0079db7d2df9a126938",
  value: "0x100",
  gasLimit: "0x24A22",
  gasPrice: "0x0"
}`;

let w3;

function stringToObject(objString) {
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
      txnHashesTimes.push([hash, now]);
    });
    await delay(interTxnDelay);
    if(i == batchSize-1) lastTxnProm = txnProm;
  }
  await delay(1000); // a hacky way to make sure all txn hash are stored in txnHashes
  return [txnHashesTimes, lastTxnProm];
}

function initialize() {
  // puts default transaction payload
  const txnInput = document.querySelector("#txnInput");
  txnInput.innerHTML = defaultTransaction;

  // adds event listener for button
  const genBtn = document.querySelector("#genTxnLoad");
  genBtn.addEventListener("click", genLoadHandler);
}

async function genLoadHandler() {
  console.log('Processing...');
  const numTxns = document.querySelector("#numTxns").value;
  const numBatches = document.querySelector("#numBatches").value;
  const txnDelay = document.querySelector("#txnDelay").value;
  let batchDelay = document.querySelector("#batchDelay").value;
  const nodeAddr = document.querySelector("#nodeAddr").value;

  const txnInput = document.querySelector("#txnInput").value;
  const txnOptions = stringToObject(txnInput);

  if(batchDelay > 1000) {
    batchDelay = batchDelay - 1000; // bcoz extra 1000ms delay is already there in sendTransaction() function
  }

  w3 = new Web3(nodeAddr);
  const proms = [];
  for(let i=0; i<numBatches; i++) {
    // proms[i] = sendTransactions(txnOptions, numTxns, txnDelay);
    // sleep(batchDelay);
    const txnSentReturn = await sendTransactions(txnOptions, numTxns, txnDelay);
    const hashTimes = txnSentReturn[0];
    const lastTxnProm = txnSentReturn[1];
    console.log('waiting for them to get inside blocks');
    await lastTxnProm;

    const txnRcptsProms = [];
    for(let i=0; i<numTxns; i++) {
      const prom = w3.eth.getTransactionReceipt(hashTimes[i][0]);
      txnRcptsProms.push(prom);
    }
    const rcpts = await Promise.all(txnRcptsProms)
    console.log(rcpts);

    const blockProms = [];
    let totalGasUsed = 0;
    for(let i=0; i<numTxns; i++) {
      const blockNumber = rcpts[i].blockNumber;
      const prom = w3.eth.getBlock(blockNumber);
      blockProms.push(prom);
      totalGasUsed += rcpts[i].gasUsed;
    }
    
    const blockTimes = await Promise.all(blockProms); // actually grabs entire blocks
    for(let i=0; i<numTxns; i++) {
      blockTimes[i] = new Date(blockTimes[i].timestamp * 1000); // we don't need to store entire block, so replace block data with just its timestamp
    }
    // console.log(blockTimes);

    const allLatencies = [];
    for(let i=0; i<numTxns; i++) {
      const timeGenerated = hashTimes[i][1];
      const timeInBlock = blockTimes[i];
      let latency = timeInBlock - timeGenerated; //milliseconds interval
      allLatencies.push(latency);
      console.log(latency, "ms");
    }

    let sum = 0;
    for(let i=0; i<allLatencies.length; i++) {
      sum += allLatencies[i];
    }
    let avgLatency = sum/allLatencies.length;
    console.log('Avg Latency:',avgLatency,"ms");

    const latencyText = document.querySelector("#avglatency");
    latencyText.innerHTML = avgLatency + " ms";

    const totalGasText = document.querySelector("#totalgas");
    totalGasText.innerHTML = totalGasUsed + " Gas";

    await delay(batchDelay);
  }

  // const allPromises = [];
  // const allLatencies = [];
  // for(let i=0; i<numBatches; i++) {
  //   for (let j=0; j<numTxns; j++) {
  //     // console.log(proms[i][1]);
  //     allPromises.push(proms[i][j][0]);
  //     proms[i][j][0]
  //     .then(() => {
  //       const date2 = new Date();
  //       const date1 = proms[i][j][1];
  //       let diff = date2 - date1; //milliseconds interval
  //       allLatencies.push(diff);
  //       // console.log("Latency-"+i+','+j+": "+ diff + " ms");
  //     });
  //   } 
  // }

  // Promise.all(allPromises).then(() => {
  //   console.log("i'm done!");
  //   let sum = 0;
  //   for(let i=0; i<allLatencies.length; i++) {
  //     sum += allLatencies[i];
  //   }
  //   let avgLatency = sum/allLatencies.length;
  //   console.log('Avg Latency:',avgLatency,"ms");
  // });
}

function calculateThroughput(nodeAddr) {
  w3 = new Web3(nodeAddr);
  

}

initialize();