# Arbitrum subgraphs

This project contains subgraphs to track Arbitrum token bridge and cross chain messaging.

## arb-bridge-eth
Tracks ETH deposits from L1 to L2.  

`Nitro`  
Query endpoint: https://api.thegraph.com/subgraphs/name/gvladika/arb-bridge-eth-nitro  
Playground: https://thegraph.com/hosted-service/subgraph/gvladika/arb-bridge-eth-nitro

`Nova`  
Query endpoint: https://api.thegraph.com/subgraphs/name/gvladika/arb-bridge-eth-nova  
Playground: https://thegraph.com/hosted-service/subgraph/gvladika/arb-bridge-eth-nova  

`Goerli Nitro`  
Query endpoint: https://api.thegraph.com/subgraphs/name/gvladika/arb-bridge-eth-goerli  
Playground: https://thegraph.com/hosted-service/subgraph/gvladika/arb-bridge-eth-goerli  

#### Query example - get 1st Eth deposit
```
  ethDeposits(first: 1, orderBy: blockCreatedAt) {
    id
    senderAliased
    destAddr
    value
    msgData
    transactionHash
    blockCreatedAt
  }
```
Result:  
```
{
  "data": {
    "ethDeposits": [
      {
        "id": "0x1",
        "senderAliased": "0x7af5fb7b4d0df0d338a07e53a49a840cdc710100",
        "destAddr": "0x69e4fb7b4d0df0d338a07e53a49a840cdc70efef",
        "value": "1000000000000000000",
        "msgData": "0x69e4fb7b4d0df0d338a07e53a49a840cdc70efef0000000000000000000000000000000000000000000000000de0b6b3a7640000",
        "transactionHash": "0xc751ae7e91e8d05c57dc80fbba6c18933c8094d95d0f86a3b69e4ef637f2af81",
        "blockCreatedAt": "7222878"
      }
    ]
  }
}
```

## arbitrum-precompiles
// TODO

## layer1-token-gateway
// TODO

## layer2-token-gateway
// TODO
