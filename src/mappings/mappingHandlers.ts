import { Transaction, IbcEvent, ContractMessage, LoopAirDropEvent, LoopAirDropMessage } from "../types";
import { CosmosEvent, CosmosMessage, CosmosTransaction} from "@subql/types-cosmos";

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

export async function handleTransaction(tx: CosmosTransaction): Promise<void> {
  const record = new TransactionEntity(tx.tx.txhash);
  record.blockHeight = BigInt(tx.block.block.block.header.height);
  record.timestamp = tx.block.block.header.time;
  record.txType = tx.tx.type;
  record.txFeeDenom = tx.tx.auth_info.fee.amount.denom;
  record.txFeeAmount = tx.tx.auth_info.fee.amount.amount;
  await record.save();
}

export async function handleTransaction(
  tx: CosmosTransaction
): Promise<void> {
     
  const transactionEntity = Transaction.create({
    id: `${tx.hash}`,
    blockHeight: BigInt(tx.block.block.header.height),
    txDate: new Date(tx.block.block.header.time),
    sender: sender,
    txFeeDenom: tx.auth_info.fee.amount.denom,
    txFeeAmount: tx.auth_info.fee.amount.amount,
  });

  await transactionEntity.save();
}
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

export async function handleLoopAirDropMessage(
    msg: CosmosMessage
): Promise<void> {

    const airdropClaim = LoopAirDropMessage.create({
        id: `${msg.tx.hash}-${msg.idx}`,
        blockHeight: BigInt(msg.block.block.header.height),
        sender: msg.msg.decodedMsg.sender || '',
        amount: msg.msg.decodedMsg.msg.claim.amount || 0,
    });

    logger.info("Saving loop air drop message.")
    await airdropClaim.save();
}

