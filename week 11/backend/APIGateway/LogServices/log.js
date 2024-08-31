import { createChannel } from '../mq.js';
export async function logMessage(serviceName, logLevel, message) {
    const channel = await createChannel();
    const logEntry = {
        serviceName,
        timestamp: new Date().toISOString(),
        logLevel,
        message
    };

    channel.sendToQueue('log', Buffer.from(JSON.stringify(logEntry)));
    console.log(`Logged: ${message}`);
}