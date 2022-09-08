#!/bin/bash
# THIS FILE IS STEP 1
mkdir IBFT-Network
cd IBFT-Network

mkdir Node-0
cd Node-0
mkdir data
cd data
mkdir keystore

cd ../../

mkdir Node-1
cd Node-1
mkdir data
cd data
mkdir keystore

cd ../../

mkdir Node-2
cd Node-2
mkdir data
cd data
mkdir keystore

cd ../../

mkdir Node-3
cd Node-3
mkdir data
cd data
mkdir keystore

cd ../../

mkdir Node-4
cd Node-4
mkdir data
cd data
mkdir keystore

cd ../../

npx quorum-genesis-tool --consensus ibft --chainID 1337 --blockperiod 5 --requestTimeout 10 --epochLength 30000 --difficulty 1 --gasLimit '0xFFFFFF' --coinbase '0x0000000000000000000000000000000000000000' --validators 5 --members 0 --bootnodes 0 --outputPath 'artifacts'

pause "Manually move contents of artifact/[20XX-LONGDATE] to artifacts.."

# BIG PAUSE
pause "Manually modify artifacts/goQuorum/(static-nodes.json, permissioned-nodes.json) IP and ports..."
# PAUSE ENDS

cd artifacts/goQuorum/

cp static-nodes.json genesis.json permissioned-nodes.json ../../Node-0/data/
cp static-nodes.json genesis.json permissioned-nodes.json ../../Node-1/data/
cp static-nodes.json genesis.json permissioned-nodes.json ../../Node-2/data/
cp static-nodes.json genesis.json permissioned-nodes.json ../../Node-3/data/
cp static-nodes.json genesis.json permissioned-nodes.json ../../Node-4/data/

cd ..

cd validator0
cp nodekey* address ../../Node-0/data
cp account* ../../Node-0/data/keystore
cd ..

cd validator1
cp nodekey* address ../../Node-1/data
cp account* ../../Node-1/data/keystore
cd ..

cd validator2
cp nodekey* address ../../Node-2/data
cp account* ../../Node-2/data/keystore
cd ..

cd validator3
cp nodekey* address ../../Node-3/data
cp account* ../../Node-3/data/keystore
cd ..

cd validator4
cp nodekey* address ../../Node-4/data
cp account* ../../Node-4/data/keystore
cd ..

cd ..
# now in IBFT-Network

cd Node-0
geth --datadir data init data/genesis.json

cd ../Node-1
geth --datadir data init data/genesis.json

cd ../Node-2
geth --datadir data init data/genesis.json

cd ../Node-3
geth --datadir data init data/genesis.json

cd ../Node-4
geth --datadir data init data/genesis.json

echo 'You can now manually start all nodes.'

# $initAddress = `export ADDRESS=$(grep -o '"address": *"[^"]*"' ./data/keystore/accountKeystore | grep -o '"[^"]*"$' | sed 's/"//g')`
# $startNode0 = `geth --datadir data \
#     --networkid 1337 --nodiscover --verbosity 5 \
#     --syncmode full --nousb \
#     --istanbul.blockperiod 5 --mine --miner.threads 1 --miner.gasprice 0 --emitcheckpoints \
#     --http --http.addr 127.0.0.1 --http.port 22000 --http.corsdomain "*" --http.vhosts "*" \
#     --ws --ws.addr 127.0.0.1 --ws.port 32000 --ws.origins "*" \
#     --http.api admin,trace,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,istanbul \
#     --ws.api admin,trace,db,eth,debug,miner,net,shh,txpool,personal,web3,quorum,istanbul \
#     --unlock ${ADDRESS} --allow-insecure-unlock --password ./data/keystore/accountPassword \
#     --port 30300`

# gnome-terminal --tab --title="$Node0" --command="bash -c '$initAddress; $startNode0 ; $SHELL'"