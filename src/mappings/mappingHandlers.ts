import { IbcEvent } from "../types";
import {
  CosmosEvent
} from "@subql/types-cosmos";

const EVENT_TYPES = {
  RECEIVE: 1,
  TRANSFER: 2
};

const makeIbcEventRecord = (event: CosmosEvent, eventType: number): IbcEvent => {
  const packetData =  JSON.parse(event.event.attributes.find(attr => attr.key === 'packet_data').value);

  let amount = -1;
  if (packetData.amount !== undefined && packetData.amount !== null){
    amount = packetData.amount;
  }

  let denom = 'undefined';
  if (packetData.denom !== undefined && packetData.denom !== null){
    denom = packetData.denom;
  }

  return IbcEvent.create({
    id: `${event.tx.hash}-${event.msg.idx}-${event.idx}`,
    blockHeight: BigInt(event.block.block.header.height),
    txHash: event.tx.hash,
    amount: BigInt(amount),
    denom: denom.split("/").at(-1),
    eventDatetime: new Date(event.block.block.header.time),
    eventType
  });
};

export async function handleReceivePacketEvent(event: CosmosEvent): Promise<void> {
  logger.info("Handling receive packet event");
  const ibcEventRecord = makeIbcEventRecord(event, EVENT_TYPES.RECEIVE);
  await ibcEventRecord.save();
}

export async function handleTransferPacketEvent(event: CosmosEvent): Promise<void> {
  logger.info("Handling transfer packet event");
  const ibcEventRecord = makeIbcEventRecord(event, EVENT_TYPES.TRANSFER);
  await ibcEventRecord.save();
}