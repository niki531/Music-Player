import { createChannel } from '../../mq.js';

export async function sendStatistics(serviceName, statsData) {
    const channel = await createChannel();
    const statsEntry = {
        serviceName,
        timestamp: new Date().toISOString(),
        statsData
    };

    channel.sendToQueue('statistics', Buffer.from(JSON.stringify(statsEntry)));
    console.log(`Statistics sent: ${JSON.stringify(statsEntry)}`);
}
