import amqp from 'amqplib';
import mongoose from './db.js';

const STATISTICS_QUEUE_NAME = 'statistics';
const RABBITMQ_URL = 'amqp://localhost';

//console.log('this is',STATISTICS_QUEUE_NAME);
const statisticsCache = {
  playHistory: [],
  albumStats: {},
  trackStats: {},
  playCounts: {}
};


export async function startStatisticsService() {
  try {
    const statsConnection = mongoose.createConnection('mongodb+srv://user1:EAdjuH2FZEsLSH6J@cluster0.mxw8665.mongodb.net/statistics', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    const playHistoryCollection = statsConnection.collection('playHistory');
    const albumCollection = statsConnection.collection('albumStats');
    const trackCollection = statsConnection.collection('trackStats');

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
            const { serviceName, statsData } = statsMessage;
            
            switch(serviceName) {
              case 'StreamService': // 播放历史
                statisticsCache.playHistory.push(statsData);
                break;
              case 'TrackService': // 音轨统计
                //console.log("TrackService statsData:", statsData);  
                if (statsData.plays !== undefined) {
                  statisticsCache.trackStats[statsData.trackId] = 
                    (statisticsCache.trackStats[statsData.trackId] || { likes: 0, plays: 0 });
                  statisticsCache.trackStats[statsData.trackId].plays += statsData.plays;
                } else if (statsData.likes !== undefined) {
                  statisticsCache.trackStats[statsData.trackId] = 
                    (statisticsCache.trackStats[statsData.trackId] || { likes: 0, plays: 0 });
                  statisticsCache.trackStats[statsData.trackId].likes += statsData.likes;
                } else {
                  console.error("No valid values");
                }
                break;
              case 'AlbumService': // 专辑统计
                //("AlbumService statsData:", statsData);  
                if (statsData.plays !== undefined) {
                  statisticsCache.albumStats[statsData.albumId] = 
                    (statisticsCache.albumStats[statsData.albumId] || { sales: 0, likes: 0, plays: 0 });
                  statisticsCache.albumStats[statsData.albumId].plays += statsData.plays;
                } else if (statsData.likes !== undefined) {
                  statisticsCache.albumStats[statsData.albumId] = 
                    (statisticsCache.albumStats[statsData.albumId] || { sales: 0, likes: 0, plays: 0 });
                  statisticsCache.albumStats[statsData.albumId].likes += statsData.likes;
                } else {
                  console.error("No valid values");
                }
                break;
              case 'UserService': // 用户统计
                console.log("UserService statsData:", statsData);
              
                const { uid, trackId, plays } = statsData;
              
                if (plays !== undefined) {
                  // 如果当前用户在缓存中不存在，初始化为一个空对象
                  if (!statisticsCache.playCounts[uid]) {
                    statisticsCache.playCounts[uid] = {};
                  }
              
                  // 如果当前 trackId 的统计不存在，初始化为 0
                  statisticsCache.playCounts[uid][trackId] = 
                    (statisticsCache.playCounts[uid][trackId] || 0) + plays;
              
                  console.log(`Cached play count for user ${uid} and track ${trackId}`);
                } else {
                  console.error("No valid values for plays");
                }
                break;
            }
    
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
      // 保存播放历史
      //console.log('playlist updated',statisticsCache.playHistory.length);

      if (statisticsCache.playHistory.length > 0) {
        //console.log('playlist updated');
        try {
          await playHistoryCollection.insertMany(statisticsCache.playHistory);
          //console.log(`Saved ${statisticsCache.playHistory.length} play histories to the database.`);
          statisticsCache.playHistory = [];  
        } catch (error) {
          console.error('Error saving play histories to database:', error);
        }
      }
    
      // 保存音轨统计
      const trackUpdates = Object.keys(statisticsCache.trackStats).map(trackId => {
        const { likes, plays } = statisticsCache.trackStats[trackId];
        return {
          updateOne: {
            filter: { trackId },  
            update: {
              $inc: {
                likes: likes || 0,     
                plays: plays || 0           
              }
            },
            upsert: true  
          }
        };
      });
    
      if (trackUpdates.length > 0) {
        try {
          await trackCollection.bulkWrite(trackUpdates);
          //console.log(`Updated play counts for ${trackUpdates.length} tracks.`);
          statisticsCache.trackStats = {}; 
        } catch (error) {
          console.error('Error updating play counts:', error);
        }
      }
    
      // 保存专辑统计
      const albumStatUpdates = Object.keys(statisticsCache.albumStats).map(albumId => {
        const { sales, likes, plays } = statisticsCache.albumStats[albumId];
        return {
          updateOne: {
            filter: { albumId },  
            update: {
              $inc: {
                sales: sales || 0,         
                likes: likes || 0,     
                plays: plays || 0           
              }
            },
            upsert: true  
          }
        };
      });

      //console.log("albumupdated", albumStatUpdates.length);

      if (albumStatUpdates.length > 0) {
        try {
          await albumCollection.bulkWrite(albumStatUpdates);  
          //console.log(`Updated statistics for ${albumStatUpdates.length} albums.`);
          statisticsCache.albumStats = {}; 
        } catch (error) {
          console.error('Error updating album stats:', error);
        }
      }

    
      // 保存用户音轨播放统计
      console.log("Starting batch update for play counts...");
      console.log("Current statisticsCache.playCounts:", JSON.stringify(statisticsCache.playCounts, null, 2));

  // 遍历所有用户的播放记录
      for (const uid in statisticsCache.playCounts) {
        const userPlayCounts = statisticsCache.playCounts[uid];

        // 确保用户有有效的播放记录
        if (!userPlayCounts || Object.keys(userPlayCounts).length === 0) {
          console.log(`No play counts to update for user ${uid}`);
          continue;
        }

        console.log(`Preparing play count updates for user ${uid}`);

        // 获取或创建用户的 collection
        const userCollectionName = `u_${uid}`;
        const userCollection = statsConnection.collection(userCollectionName);
        const playCountUpdates = [];

        // 遍历用户的每个 trackId
        for (const trackId in userPlayCounts) {
          const plays = userPlayCounts[trackId];
          console.log(`Updating track ${trackId} for user ${uid}, plays: ${plays}`);

          playCountUpdates.push({
            updateOne: {
              filter: { trackId },  // 查找 trackId
              update: { $inc: { plays } },  // 增加播放次数
              upsert: true  // 如果不存在则创建
            }
          });
        }

        try {
          if (playCountUpdates.length > 0) {
            console.log(`Bulk writing ${playCountUpdates.length} updates for user ${uid}`);
            // 批量写入用户的播放记录
            await userCollection.bulkWrite(playCountUpdates);
            console.log(`Successfully updated play counts for user ${uid}`);
          } else {
            console.log(`No updates needed for user ${uid}`);
          }
        } catch (error) {
          console.error(`Error updating play counts for user ${uid}:`, error);
        }

        // 清空缓存
        statisticsCache.playCounts[uid] = {};
        console.log(`Cleared play counts cache for user ${uid}`);
      }

      console.log("Batch update completed.");
    }, 60 * 1000);  // 每10分钟执行一次

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

