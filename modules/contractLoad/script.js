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
      // let now = Date.now();
      txnHashesTimes.push([hash, now]);
    });
    if(interTxnDelay > 0) await delay(interTxnDelay);
    if(i == batchSize-1) lastTxnProm = txnProm;
  }
  await delay(1000); // a hacky way to make sure all txn hash are stored in txnHashes
  return [txnHashesTimes, lastTxnProm];
}

async function genLoadHandler() {
  
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

function initialize() {
  // puts default transaction payload
  
}

initialize();