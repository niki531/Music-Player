import amqp from 'amqplib';
import mongoose from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const {
  RABBITMQ_URL,
  STATISTICS_QUEUE_NAME,
} = process.env;

const statisticsCache = []; 

export async function startStatisticsService() {
  try {
    const statsConnection = mongoose.createConnection('mongodb+srv://user1:EAdjuH2FZEsLSH6J@cluster0.mxw8665.mongodb.net/statistics', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const statisticsCollection = statsConnection.collection('statistics');

    const connection = await amqp.connect(RABBITMQ_URL);
    console.log('Connected to RabbitMQ');
    const channel = await connection.createChannel();

    await channel.assertQueue(STATISTICS_QUEUE_NAME, { durable: true });
    console.log(`Waiting for messages in queue: ${STATISTICS_QUEUE_NAME}`);

    channel.consume(
      STATISTICS_QUEUE_NAME,
      (msg) => {
        if (msg !== null) {
          try {
            const statsMessage = JSON.parse(msg.content.toString());
            statsMessage.receivedAt = new Date();
            statisticsCache.push(statsMessage); 

            console.log(
              `Statistics received: [${statsMessage.serviceName}] - ${statsMessage.data}`
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

    setInterval(async () => {
      if (statisticsCache.length > 0) {
        try {
          await statisticsCollection.insertMany(statisticsCache);
          console.log(`Saved ${statisticsCache.length} statistics to the database.`);
          statisticsCache.length = 0; 
        } catch (error) {
          console.error('Error saving statistics to database:', error);
        }
      }
    }, 10 * 60 * 1000); 

    process.on('SIGINT', async () => {
      console.log('Closing connections...');
      await channel.close();
      await connection.close();
      await statsConnection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting Statistics Service:', error);
    process.exit(1);
  }
}

