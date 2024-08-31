import amqp from 'amqplib';
import mongoose from './db.js';
import dotenv from 'dotenv';

dotenv.config();
const {
  RABBITMQ_URL,
  LOG_QUEUE_NAME,
} = process.env;

export async function startLogService() {
  try {
    const logConnection = mongoose.createConnection('mongodb+srv://user1:EAdjuH2FZEsLSH6J@cluster0.mxw8665.mongodb.net/logs', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const logsCollection = logConnection.collection('logs');

    const connection = await amqp.connect(RABBITMQ_URL);
    console.log('Connected to RabbitMQ');
    const channel = await connection.createChannel();

    await channel.assertQueue(LOG_QUEUE_NAME, { durable: true });
    console.log(`Waiting for messages in queue: ${LOG_QUEUE_NAME}`);

    channel.consume(
      LOG_QUEUE_NAME,
      async (msg) => {
        if (msg !== null) {
          try {
            const logMessage = JSON.parse(msg.content.toString());
            logMessage.receivedAt = new Date();

            await logsCollection.insertOne(logMessage);
            console.log(
              `Log saved: [${logMessage.logLevel}] ${logMessage.serviceName} - ${logMessage.message}`
            );

            channel.ack(msg);
          } catch (error) {
            console.error('Error processing message:', error);
            channel.nack(msg, false, true);
          }
        }
      },
      {
        noAck: false,
      }
    );

    process.on('SIGINT', async () => {
      console.log('Closing connections...');
      await channel.close();
      await connection.close();
      await logConnection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting Log Service:', error);
    process.exit(1);
  }
}

