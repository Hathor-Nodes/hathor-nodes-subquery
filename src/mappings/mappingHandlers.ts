import { Transaction, IbcEvent, ContractMessage } from "../types";
import { CosmosEvent, CosmosMessage, CosmosTransaction} from "@subql/types-cosmos";

export async function handleTransactionData(
  tx: CosmosTransaction
): Promise<void> {
  const record = new Transaction(tx.hash);
  record.blockHeight = BigInt(tx.block.block.header.height);
  record.timestamp = new Date(tx.block.block.header.time);
  record.payer = tx.decodedTx.authInfo.fee.payer;
  record.granter = tx.decodedTx.authInfo.fee.granter;

  if (tx.decodedTx.authInfo.fee.amount[0] === undefined) {
    record.feeDenom = '';
    record.feeAmount = BigInt(0);
  } else {
    record.feeDenom = tx.decodedTx.authInfo.fee.amount[0].denom;
    record.feeAmount = BigInt(tx.decodedTx.authInfo.fee.amount[0].amount);    
  } 

  await record.save();
}

export async function handleMsgExecuteContract(
  msg: CosmosMessage
): Promise<void> {
  const messageRecord = ContractMessage.create({
    id: `${msg.tx.hash}-${msg.idx}`,    
    blockHeight: BigInt(msg.block.block.header.height),
    timestamp: new Date(msg.block.block.header.time),    
    txHash: msg.tx.hash,
    txFeeDenom: msg.tx.decodedTx.authInfo.fee.amount[0].denom,
    weightedTxFeeAmount: BigInt(msg.tx.decodedTx.authInfo.fee.amount[0].amount) 
      / BigInt(msg.tx.decodedTx.body.messages.length),
    sender: msg.msg.decodedMsg.sender,
    contract: msg.msg.decodedMsg.contract,
  });
  await messageRecord.save();
}

const EVENT_TYPES = {
  RECEIVE: 1,
  TRANSFER: 2,
};

const makeIbcEventRecord = (
  event: CosmosEvent,
  eventType: number
): IbcEvent => {
  const packetData = JSON.parse(
    event.event.attributes.find((attr) => attr.key === "packet_data").value
  );

  let amount = 0;
  if (packetData.amount !== undefined && packetData.amount !== null) {
      amount = packetData.amount;
  }

  let denom = "undefined";
  if (packetData.denom !== undefined && packetData.denom !== null) {
    denom = packetData.denom;
  }

  return IbcEvent.create({
    id: `${event.tx.hash}-${event.msg.idx}-${event.idx}`,
    blockHeight: BigInt(event.block.block.header.height),
    timestamp: new Date(event.block.block.header.time),
    txHash: event.tx.hash,
    txFeeDenom: event.tx.decodedTx.authInfo.fee.amount[0].denom,
    weightedTxFeeAmount: BigInt(event.tx.decodedTx.authInfo.fee.amount[0].amount) 
      / BigInt(event.tx.decodedTx.body.messages.length),
    eventType,
    amount: BigInt(amount),
    denom: denom.split("/").at(-1),
  });
};

export async function handleReceivePacketEvent(
  event: CosmosEvent
): Promise<void> {
  const ibcEventRecord = makeIbcEventRecord(event, EVENT_TYPES.RECEIVE);
  await ibcEventRecord.save();
}

export async function handleTransferPacketEvent(
  event: CosmosEvent
): Promise<void> {
  const ibcEventRecord = makeIbcEventRecord(event, EVENT_TYPES.TRANSFER);
  await ibcEventRecord.save();
}
