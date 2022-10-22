import { IbcEvent, ContractMessage, LoopAirDropEvent } from "../types";
import { CosmosEvent, CosmosMessage } from "@subql/types-cosmos";

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

  let amount = -1;
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
    txHash: event.tx.hash,
    amount: BigInt(amount),
    denom: denom.split("/").at(-1),
    eventDatetime: new Date(event.block.block.header.time),
    eventType,
  });
};

export async function handleReceivePacketEvent(
  event: CosmosEvent
): Promise<void> {
  logger.info("Handling receive packet event");
  const ibcEventRecord = makeIbcEventRecord(event, EVENT_TYPES.RECEIVE);
  await ibcEventRecord.save();
}

export async function handleTransferPacketEvent(
  event: CosmosEvent
): Promise<void> {
  logger.info("Handling transfer packet event");
  const ibcEventRecord = makeIbcEventRecord(event, EVENT_TYPES.TRANSFER);
  await ibcEventRecord.save();
}

export async function handleMsgExecuteContract(
  msg: CosmosMessage
): Promise<void> {
  logger.info("Handling message execute contract");
  const messageRecord = ContractMessage.create({
    id: `${msg.tx.hash}-${msg.idx}`,
    blockHeight: BigInt(msg.block.block.header.height),
    txHash: msg.tx.hash,
    sender: msg.msg.decodedMsg.sender,
    contract: msg.msg.decodedMsg.contract,
    messageDatetime: new Date(msg.block.block.header.time),
  });
  await messageRecord.save();
}

export async function handleLoopAirDropEvent(
  event: CosmosEvent
): Promise<void> {
  logger.info("Handling loop air drop event");

  let amountObj = event.event.attributes.find(attr => attr.key === 'amount')
  let senderObj = event.event.attributes.find(attr => attr.key === 'to')

  let amount = '';
  let sender = '';

  if (amountObj && amountObj.value !== undefined && amountObj.value !== null) {
    amount = amountObj.value;
  }

  /*
  if (senderObj === undefined || senderObj === null || senderObj.value === undefined || senderObj.value === null) {
    senderObj = event.event.attributes.find(attr => attr.key === 'sender')
  }
 */

  if (senderObj && senderObj.value !== undefined && senderObj.value !== null) {
    sender = senderObj.value
  }


  const loopAirDropEventRecord = LoopAirDropEvent.create({
    id: `${event.tx.hash}-${event.msg.idx}-${event.idx}`,
    blockHeight: BigInt(event.block.block.header.height),
    txHash: event.tx.hash,
    amount: BigInt(amount),
    sender: sender,
    eventDatetime: new Date(event.block.block.header.time),
  });

  logger.info("Saving loop air drop event")

  await loopAirDropEventRecord.save();
}

