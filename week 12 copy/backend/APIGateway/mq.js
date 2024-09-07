import amqp from 'amqplib';

let connection;

async function getRabbitMQConnection() {
    if (!connection) {
        connection = await amqp.connect('amqp://localhost'); 
    }
    return connection;
}

export async function createChannel() {
    const conn = await getRabbitMQConnection();
    const channel = await conn.createChannel();
    await channel.assertQueue('log'); 
    return channel;
}
