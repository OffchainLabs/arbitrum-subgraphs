import { addressToId, getJoinId, handleGatewaySet, handleDeposit, DISABLED_GATEWAY_ADDR } from "../../src/mapping";
import { Address, BigInt, Bytes, ethereum, store, log } from "@graphprotocol/graph-ts";
import { newMockEvent, test, assert, createMockedFunction } from "matchstick-as";
import { GatewaySet as GatewaySetEvent } from "../../generated/L2GatewayRouter/L2GatewayRouter";
import { DepositFinalized as DepositFinalizedEvent } from "../../generated/templates/L2ArbitrumGateway/L2ArbitrumGateway";
import { Gateway, Token, TokenGatewayJoinTable } from "../../generated/schema";

const createGatewaySet = (token: Address, gateway: Address): GatewaySetEvent => {
    let mockEvent = newMockEvent();
  
    let parameters = new Array<ethereum.EventParam>();
    let tokenParam = new ethereum.EventParam("l1Token", ethereum.Value.fromAddress(token));
    let gatewayParam = new ethereum.EventParam("gateway", ethereum.Value.fromAddress(gateway));
    
    parameters.push(tokenParam);
    parameters.push(gatewayParam);
  
    let newGatewayEvent = new GatewaySetEvent(mockEvent.address, mockEvent.logIndex, mockEvent.transactionLogIndex,
        mockEvent.logType, mockEvent.block, mockEvent.transaction, parameters)
  
    return newGatewayEvent
}

const createDisabledGatewayEvent = (token: Address): GatewaySetEvent => {
    return createGatewaySet(token, DISABLED_GATEWAY_ADDR)
}

const createDepositFinalized = (token: Address, gateway: Address): DepositFinalizedEvent => {
    let mockEvent = newMockEvent();
  
    let parameters = new Array<ethereum.EventParam>();
    let tokenParam = new ethereum.EventParam("l1Token", ethereum.Value.fromAddress(token));
    // let fromParam = new ethereum.EventParam("_from", ethereum.Value.fromAddress(from));
    // let toParam = new ethereum.EventParam("_to", ethereum.Value.fromAddress(to));
    // let amountParam = new ethereum.EventParam("_amount", ethereum.Value.fromI32(amount));
    
    parameters.push(tokenParam);
    // parameters.push(fromParam);
    // parameters.push(toParam);
    // parameters.push(amountParam);
    
    let tx = mockEvent.transaction
    tx.to = gateway

    let newDepositFinalized = new DepositFinalizedEvent(mockEvent.address, mockEvent.logIndex, mockEvent.transactionLogIndex,
        mockEvent.logType, mockEvent.block, tx, parameters)
  
    return newDepositFinalized
}

test("Can process gateway set event followed by deposit", () => {
    const tokenAddr = Address.fromString("0xc778417e063141139fce010982780140aa0cd5ab")
    const gatewayAddr = Address.fromString("0xf94bc045c4e926cc0b34e8d1c41cd7a043304ac9")
    
    let newGatewaySetEvent1 = createGatewaySet(tokenAddr, gatewayAddr)
    handleGatewaySet(newGatewaySetEvent1)


    const joinTableId = getJoinId(
        addressToId(gatewayAddr),
        addressToId(tokenAddr)
    )

    let joinTableRes1 = TokenGatewayJoinTable.load(joinTableId)
    if(!joinTableRes1) throw new Error("No join table found")

    assert.stringEquals(
        joinTableRes1.gateway.toString(),
        gatewayAddr.toHexString()
    )
    assert.stringEquals(
        joinTableRes1.token.toString(),
        tokenAddr.toHexString()
    )
    
    let newDepositFinalizedEvent1 = createDepositFinalized(tokenAddr, gatewayAddr);
    handleDeposit(newDepositFinalizedEvent1);
    
    let joinTableRes2 = TokenGatewayJoinTable.load(joinTableId)
    if(!joinTableRes2) throw new Error("No join table found")

    assert.stringEquals(
        joinTableRes2.gateway.toString(),
        gatewayAddr.toHexString()
    )
    assert.stringEquals(
        joinTableRes2.token.toString(),
        tokenAddr.toHexString()
    )
})

test("Can disable then enable gateway", () => {
    const tokenAddr = Address.fromString("0xc778417e063141139fce010982780140aa065431")
    const gatewayAddr = Address.fromString("0xf94bc045c4e926cc0b34e8d1c41cd7a0145156a5")
    const joinTableId = getJoinId(
        addressToId(gatewayAddr),
        addressToId(tokenAddr)
        )
    const disabledJoinTableId = getJoinId(
        addressToId(DISABLED_GATEWAY_ADDR),
        addressToId(tokenAddr)
    )
    
    let newGatewaySetEvent0 = createDisabledGatewayEvent(tokenAddr)
    handleGatewaySet(newGatewaySetEvent0)

    let joinTableRes0 = TokenGatewayJoinTable.load(disabledJoinTableId)
    if(!joinTableRes0) throw new Error("No join table found")

    assert.stringEquals(
        joinTableRes0.gateway.toString(),
        DISABLED_GATEWAY_ADDR.toHexString()
    )

    assert.stringEquals(
        joinTableRes0.token.toString(),
        tokenAddr.toHexString()
    )
    let newGatewaySetEvent1 = createGatewaySet(tokenAddr, gatewayAddr)
    handleGatewaySet(newGatewaySetEvent1)

    let joinTableRes1 = TokenGatewayJoinTable.load(joinTableId)
    if(!joinTableRes1) throw new Error("No join table found")

    assert.stringEquals(
        joinTableRes1.gateway.toString(),
        gatewayAddr.toHexString()
    )
    assert.stringEquals(
        joinTableRes1.token.toString(),
        tokenAddr.toHexString()
    )
    
    let newDepositFinalizedEvent1 = createDepositFinalized(tokenAddr, gatewayAddr);
    handleDeposit(newDepositFinalizedEvent1);
    
    let joinTableRes2 = TokenGatewayJoinTable.load(joinTableId)
    if(!joinTableRes2) throw new Error("No join table found")

    assert.stringEquals(
        joinTableRes2.gateway.toString(),
        gatewayAddr.toHexString()
    )
    assert.stringEquals(
        joinTableRes2.token.toString(),
        tokenAddr.toHexString()
    )
})
