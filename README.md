# Arbitrum subgraphs

This project contains subgraphs to track Arbitrum token bridge and cross chain messaging.

## arb-bridge-eth

Tracks ETH and token deposits from L1 to L2, both classic and nitro versions. It also tracks retryable tickets. Entity `sender` field is always original address of the deposit/retryable creator, not aliased or unaliased version of address.

`Nitro`  
Query endpoint: https://api.thegraph.com/subgraphs/name/gvladika/arb-bridge-eth-nitro  
Playground: https://thegraph.com/hosted-service/subgraph/gvladika/arb-bridge-eth-nitro

`Nova`  
Query endpoint: https://api.thegraph.com/subgraphs/name/gvladika/arb-bridge-eth-nova  
Playground: https://thegraph.com/hosted-service/subgraph/gvladika/arb-bridge-eth-nova

`Goerli Nitro`  
Query endpoint: https://api.thegraph.com/subgraphs/name/gvladika/arb-bridge-eth-goerli  
Playground: https://thegraph.com/hosted-service/subgraph/gvladika/arb-bridge-eth-goerli

#### Query example - get first 3 deposits (including Eth deposits and token deposits)

```
  deposits(first: 3) {
    type
    sender
    receiver
    ethValue
    l1Token {
      id
      name
      symbol
    }
    sequenceNumber
    tokenAmount
    isClassic
    timestamp
    transactionHash
    blockCreatedAt
  }
```

Result:

```
{
  "data": {
    "deposits": [
      {
        "type": "EthDeposit",
        "sender": "0x3808d4d05ae4d21d20bbd0143e8f41e09b3ce309",
        "receiver": "0x3808d4d05ae4d21d20bbd0143e8f41e09b3ce309",
        "ethValue": "1000000000000000",
        "l1Token": null,
        "sequenceNumber": "9277",
        "tokenAmount": null,
        "isClassic": false,
        "timestamp": "1662276473",
        "transactionHash": "0x00000947484b2117be463199be889da38caf1a231d29e6128d81d12e6a0a1cee",
        "blockCreatedAt": "15470347"
      },
      {
        "type": "TokenDeposit",
        "sender": "0xa2e06c19ee14255889f0ec0ca37f6d0778d06754",
        "receiver": "0xa2e06c19ee14255889f0ec0ca37f6d0778d06754",
        "ethValue": "0",
        "l1Token": {
          "id": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          "name": "Wrapped Ether",
          "symbol": "WETH"
        },
        "sequenceNumber": "20556",
        "tokenAmount": "600000000000000000",
        "isClassic": false,
        "timestamp": "1662696576",
        "transactionHash": "0x00000a61331187be51ab9ae792d74f601a5a21fb112f5b9ac5bccb23d4d5aaba",
        "blockCreatedAt": "15500657"
      },
      {
        "type": "EthDeposit",
        "sender": "0x49211e8da72a9549541c7914f85837b294abf992",
        "receiver": "0x49211e8da72a9549541c7914f85837b294abf992",
        "ethValue": "24000000000000000",
        "l1Token": null,
        "sequenceNumber": "390496",
        "tokenAmount": null,
        "isClassic": true,
        "timestamp": "1648568434",
        "transactionHash": "0x00000a813d47f2c478dcc3298d5361cb3aed817648f25cace6d0c1a59d2b8309",
        "blockCreatedAt": "14481946"
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
