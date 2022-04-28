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
    }).catch(err => {
      console.log('ERROR OCCURRED!');
      console.log(err);
    });
    if(interTxnDelay > 0) await delay(interTxnDelay);
    if(i == batchSize-1) lastTxnProm = txnProm;
  }
  await delay(1000); // a hacky way to make sure all txn hash are stored in txnHashes
  return [txnHashesTimes, lastTxnProm];
}

async function genLoadHandler() {
  console.log('Processing...');
  myChart.destroy();
  myChart = getNewChart();
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
  let sumLatency = 0;
  let totalTxns = 0;
  let totalGasUsed = 0;
  let totalBlocks = 0;
  for(let i=0; i<numBatches; i++) { // 'i' IS CURRENT BATCH NUMBER IN THIS LOOP!!
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
    const rcpts = await Promise.all(txnRcptsProms);
    console.log(rcpts);

    const blockProms = [];
    const blockNums = [];
    for(let j=0; j<numTxns; j++) {
      const blockNumber = rcpts[j].blockNumber;
      blockNums.push(blockNumber);
      const prom = w3.eth.getBlock(blockNumber);
      blockProms.push(prom);
      totalGasUsed += rcpts[j].gasUsed;
    }
    const uniqueBlockNums = Array.from(new Set(blockNums));
    uniqueBlockNums.sort();
    console.log(uniqueBlockNums);
    totalBlocks += uniqueBlockNums.length;
    
    // Calculating Latencies
    let blocks = await Promise.all(blockProms); // actually grabs entire blocks
    const blockTimes = [];
    
    for(let j=0; j<numTxns; j++) { // we don't need to store entire block, so replace block data with just its timestamp
      blockTimes[j] = new Date(blocks[j].timestamp * 1000);
    }
    blocks = []; // just deleting full blocks from memory

    const allLatencies = [];
    for(let j=0; j<numTxns; j++) {
      const timeGenerated = hashTimes[j][1];
      const timeInBlock = blockTimes[j];
      let latency = (timeInBlock - timeGenerated); //milliseconds interval
      allLatencies.push(latency);
      console.log(latency, "ms");
      const txnNum = i*numTxns + j; // i is batch number
      if(txnNum%2 == 0) addData(myChart, txnNum, latency); // no need to add all points in graph
    }
    
    for(let j=0; j<allLatencies.length; j++) {
      sumLatency += allLatencies[j];
    }
    totalTxns += allLatencies.length;
    let avgLatency = sumLatency/totalTxns;
    console.log('Avg Latency:',avgLatency,"ms");

    const latencyText = document.querySelector("#avglatency");
    latencyText.innerHTML = avgLatency + " ms";

    const totalGasText = document.querySelector("#totalgas");
    totalGasText.innerHTML = totalGasUsed + " Gas";

    //Calculating Throughput
    const uniqueBlockProms = [];
    for(let j=0; j<uniqueBlockNums.length; j++) {
      const prom = w3.eth.getBlock(uniqueBlockNums[j]);
      uniqueBlockProms.push(prom);
    }
    const uniqueBlocks = await Promise.all(uniqueBlockProms);
    console.log('uniqblk', uniqueBlocks);

    const firstTxnTime = hashTimes[0][1];
    const firstBlockTime = new Date(uniqueBlocks[0].timestamp * 1000);
    let totalTime = firstBlockTime - firstTxnTime; // initialize with first txn latency
    let totalTxns_inThisBatch = uniqueBlocks[0].transactions.length; // initialize
    for(let j=1; j<uniqueBlocks.length; j++) {
      const currblock = uniqueBlocks[j];
      const prevblock = uniqueBlocks[j-1];
      const currblock_time = new Date(currblock.timestamp * 1000);
      const prevblock_time = new Date(prevblock.timestamp * 1000);
      totalTime += (currblock_time - prevblock_time);
      totalTxns_inThisBatch += currblock.transactions.length;
    }
    totalTime /= 1000;
    console.log('totalTxns: ', totalTxns_inThisBatch);
    console.log('totalTime: ',totalTime);
    let throughput = totalTxns_inThisBatch/totalTime;

    const throughputText = document.querySelector("#throughput");
    throughputText.innerHTML = roundUp(throughput, 2, 3) + " Txn/sec";

    console.log('totalGas: ', totalGasUsed);
    console.log('totalBlocks: ',totalBlocks);
    let avgGas = totalGasUsed / totalBlocks;
    const gasPerBlockText = document.querySelector("#avggas");
    gasPerBlockText.innerHTML = roundUp(avgGas, 2, 3) + " Gas/block";

    await delay(batchDelay);
  }
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
  const txnInput = document.querySelector("#txnInput");
  txnInput.innerHTML = defaultTransaction;

  // adds event listener for button
  const genBtn = document.querySelector("#genTxnLoad");
  genBtn.addEventListener("click", genLoadHandler);
}

initialize();

const ctx = document.getElementById('myChart');

function addData(chart, label, data) {
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset) => {
      dataset.data.push(data);
  });
  chart.update();
}

function getNewChart() {
  const newChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'latency (ms)',
            data: [],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1,
            pointRadius: 0
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: false,
                color: "white"
            },
            x: {
              color: "white"
            }
        }
    }
  });
  return newChart;
}

let myChart = getNewChart();