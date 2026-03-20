import amqp, { type ConfirmChannel, type ChannelModel } from "amqplib";

const EVIDENCE_QUEUE_NAME = "evidence.events";

declare global {
  // eslint-disable-next-line no-var
  var __evidexRabbit: {
    conn: ChannelModel;
    channel: ConfirmChannel;
  } | undefined;
}

export async function getRabbitChannel(): Promise<ConfirmChannel> {
  if (globalThis.__evidexRabbit?.channel) {
    return globalThis.__evidexRabbit.channel;
  }

  const url = process.env.RABBITMQ_URL;
  if (!url) {
    throw new Error("RABBITMQ_URL is not configured.");
  }

  const conn = await amqp.connect(url);
  // SEC-5: Upgrade to ConfirmChannel to ensure publisher confirms
  const channel = await conn.createConfirmChannel();

  await channel.assertQueue(EVIDENCE_QUEUE_NAME, {
    durable: true
  });

  // Clear singleton on disconnect so next call reconnects
  const clearSingleton = () => { globalThis.__evidexRabbit = undefined; };
  conn.on("error", clearSingleton);
  conn.on("close", clearSingleton);

  globalThis.__evidexRabbit = {
    conn,
    channel
  };

  return channel;
}

export async function publishEvidenceEvent(event: Record<string, unknown>): Promise<void> {
  const channel = await getRabbitChannel();
  
  // Publish message
  channel.sendToQueue(EVIDENCE_QUEUE_NAME, Buffer.from(JSON.stringify(event)), {
    contentType: "application/json",
    persistent: true
  });
  
  // SEC-5: Wait for RabbitMQ acknowledgment to prevent silent data loss on crash
  await channel.waitForConfirms();
}
