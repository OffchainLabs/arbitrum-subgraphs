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

`Sepolia`  
Query endpoint: https://api.thegraph.com/subgraphs/name/fionnachan/arb-bridge-eth-sepolia  
Playground: https://thegraph.com/hosted-service/subgraph/fionnachan/arb-bridge-eth-sepolia

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

## arb-retryables

Tracks Nitro retryables on L2 side. It includes ticket status for every retryable, execution params as well as retryable submission params (through parsing tx calldata).

`Nitro`  
Query endpoint: https://api.thegraph.com/subgraphs/name/gvladika/arbitrum-retryables  
Playground: https://thegraph.com/hosted-service/subgraph/gvladika/arbitrum-retryables

`Nova`  
To be added (Nova is not supported by Graph hosted service atm)

`Goerli Nitro`  
Query endpoint: https://api.thegraph.com/subgraphs/name/gvladika/arbitrum-retryables-goerli
Playground: https://thegraph.com/hosted-service/subgraph/gvladika/arbitrum-retryables-goerli

`Sepolia`  
Query endpoint: https://api.thegraph.com/subgraphs/name/gvladika/arbitrum-retryables-sepolia
Playground: https://thegraph.com/hosted-service/subgraph/gvladika/arbitrum-retryables-sepolia

#### Query example - get last 10 retryables tickets which failed to redeem

```
{
  retryables(orderBy: createdAtTimestamp, orderDirection: desc, first:3, where: {status: "RedeemFailed"}) {
    id
    retryTxHash
  }
}
```

Result:

```
{
  "data": {
    "retryables": [
      {
        "id": "0x97016fdc9ec92b6899ea5b685bbfd21435e5843b19a3d375fce79e08d4c914d1",
        "retryTxHash": "0xafdeba836ec4ae1b9234c943bc434069e686773ea8977fefcd16114f17e4251b"
      },
      {
        "id": "0x9d6c19f5fb9055d64b37b9a58c56806bbc5a973d0cdca18cfbfa7b609d4812f1",
        "retryTxHash": "0xdaebe273820c3ab7197682c532f0e112ad2a97680ea3ed9b78710e0adf8b3ea5"
      },
      {
        "id": "0xc3803fd826e9b834a31c8ef52426292bb3d56bc23695d82657dfe74215e8d94a",
        "retryTxHash": "0x2150aaa2a6715b3a0611651f4162191de1aab6c93095956e43f38b553c161343"
      }
    ]
  }
}
```

#### Query example - get total stats

```
{
  totalRetryableStats(id: "NitroStats") {
    id
    totalCreated
    autoRedeemed
    successfullyRedeemed
    failedToRedeem
    canceled
  }
}
```

Result:

```
{
  "data": {
    "totalRetryableStats": {
      "id": "NitroStats",
      "totalCreated": "83845",
      "autoRedeemed": "83710",
      "successfullyRedeemed": "83822",
      "failedToRedeem": "21",
      "canceled": "0"
    }
  }
}
```

#### Query example - get latest 2 retryables including all the fields

```
{
  retryables(orderBy: createdAtTimestamp, orderDirection: desc, first:2) {
    id
    status
    retryTxHash
    timeoutTimestamp
    createdAtTimestamp
    createdAtBlockNumber
    createdAtTxHash
    redeemedAtTimestamp
    isAutoRedeemed
    sequenceNum
    donatedGas
    gasDonor
    maxRefund
    submissionFeeRefund
    requestId
    l1BaseFee
    deposit
    callvalue
    gasFeeCap
    gasLimit
    maxSubmissionFee
    feeRefundAddress
    beneficiary
    retryTo
    retryData
  }
}
```

Result:

```
{
  "data": {
    "retryables": [
      {
        "id": "0xdef8e761a76ee0c466536c5fa7c4d3a13df912cbacb879cfe2d6d9e17a4a8884",
        "status": "Redeemed",
        "retryTxHash": "0x1dd3570cdb33b954fd0c94c4a37fe1cec2c1a73946df6bf3c8539dfb2153b0b2",
        "timeoutTimestamp": "1677077599",
        "createdAtTimestamp": "1676472799",
        "createdAtBlockNumber": "61174964",
        "createdAtTxHash": "0xdef8e761a76ee0c466536c5fa7c4d3a13df912cbacb879cfe2d6d9e17a4a8884",
        "redeemedAtTimestamp": "1676472799",
        "isAutoRedeemed": true,
        "sequenceNum": "0",
        "donatedGas": "284615",
        "gasDonor": "0xfd81392229b6252cf761459d370c239be3afc54f",
        "maxRefund": "1776913467122000",
        "submissionFeeRefund": "84592690642000",
        "requestId": "0x000000000000000000000000000000000000000000000000000000000007813b",
        "l1BaseFee": "42296345321",
        "deposit": "1800859226480000",
        "callvalue": "0",
        "gasFeeCap": "130000000",
        "gasLimit": "284615",
        "maxSubmissionFee": "100000000000000",
        "feeRefundAddress": "0xfd81392229b6252cf761459d370c239be3afc54f",
        "beneficiary": "0xfd81392229b6252cf761459d370c239be3afc54f",
        "retryTo": "0xfd81392229b6252cf761459d370c239be3afc54f",
        "retryData": "0x4ff746f60000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002054655cabed180b3705ececcde806c0879b5b60ebb4705b013cb80bf3d3960736"
      },
      ...
    ]
  }
}
```

## layer1-token-gateway

// TODO

## layer2-token-gateway

// TODO
