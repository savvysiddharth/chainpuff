# ChainPuff


ChainPuff provides an user interface to send transaction work load to ethereum node or ethereum based nodes (eg: Quorum). ChainPuff will process the transaction request generated and will give back the performance metrics (eg: Latency, Throughput).


## Running Compilation Handler Backend

Following command will run the backend in developer mode.

```
cd backend
npm run dev
```

## Running Frontend

Install `live-server` package with `npm i -g live-server` 

```
cd frontend
sh start-dev-mode.sh
```
This will start the frontend server in developer mode.


## Screenshots

#### ChainPuff Menu
![homepage](https://user-images.githubusercontent.com/12862695/167370318-4db1710f-0a6f-45a1-8116-b6812ffd2c20.png)

#### Transaction Load Generation
![txn_load_gen](https://user-images.githubusercontent.com/12862695/167370290-cf8e4b0f-ba6d-4ae3-a8eb-0fbef7f3996e.png)

#### Contract Deployment
![contract_deployment](https://user-images.githubusercontent.com/12862695/167371099-431ef36f-977c-470e-ad57-a49b03cc5424.png)

#### Contract Load Generation
![contract_load_gen](https://user-images.githubusercontent.com/12862695/167370226-191db782-59d6-42be-bad2-630ac3464a49.png)

#### Performance Metrics (Tested on Quorum Node)
![res_600txn](https://user-images.githubusercontent.com/12862695/167370338-42645b1f-5cf6-40a4-85af-e36a40b53c0b.png)


