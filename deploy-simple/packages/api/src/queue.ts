import amqp, { type Channel, type ChannelModel } from "amqplib";

const EVIDENCE_QUEUE_NAME = "evidence.events";

declare global {
  // eslint-disable-next-line no-var
  var __evidexRabbit: {
    conn: ChannelModel;
    channel: Channel;
  } | undefined;
}

export async function getRabbitChannel(): Promise<Channel> {
  if (globalThis.__evidexRabbit?.channel) {
    return globalThis.__evidexRabbit.channel;
  }

  const url = process.env.RABBITMQ_URL;
  if (!url) {
    throw new Error("RABBITMQ_URL is not configured.");
  }

  const conn = await amqp.connect(url);
  const channel = await conn.createChannel();

  await channel.assertQueue(EVIDENCE_QUEUE_NAME, {
    durable: true
  });

  globalThis.__evidexRabbit = {
    conn,
    channel
  };

  return channel;
}

export async function publishEvidenceEvent(event: Record<string, unknown>): Promise<void> {
  const channel = await getRabbitChannel();
  channel.sendToQueue(EVIDENCE_QUEUE_NAME, Buffer.from(JSON.stringify(event)), {
    contentType: "application/json",
    persistent: true
  });
}
