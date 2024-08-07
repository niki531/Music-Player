import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import jpeg from 'jpeg-js';
import { parseFile } from 'music-metadata';
import { LibraryIndex } from '../models/library.js';
import os from 'os';
import { PlaylistIndex, playlistConnection } from '../models/playlist.js';
import Counter from '../models/counter.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cpuCount = os.cpus().length;

async function generateTrackId(artist, title, album) {
  const hash = crypto.createHash('md5');
  hash.update((artist || []).join(',') + title + album);
  return hash.digest('hex').substring(0, 16);
}

async function generateAlbumId(album) {
  const hash = crypto.createHash('md5');
  hash.update(album || 'Unknown Album');
  return hash.digest('hex').substring(0, 16);
}

async function saveCover(picture, filePath, albumId) {
  const cover = picture && picture[0];
  let coverPath = '';
  if (cover) {
    const imageBuffer = cover.data;
    const coverDir = path.join(__dirname, '../../Library/cover');
    await fs.mkdir(coverDir, { recursive: true });
    coverPath = path.join(coverDir, `${albumId}.jpg`);
    
    let jpegImageData;
    if (cover.format === 'image/jpeg') {
      jpegImageData = imageBuffer;
    } else {
      const rawImageData = jpeg.decode(imageBuffer);
      jpegImageData = jpeg.encode(rawImageData, 100).data;
    }

    await fs.writeFile(coverPath, jpegImageData);
  }
  return coverPath;
}

async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.sequence_value;
}

async function indexCreate(filePath) {
  try {
    const metadata = await parseFile(filePath);
    const { common, format } = metadata;

    const trackId = await generateTrackId(common.artists, common.title, common.album);
    const albumId = await generateAlbumId(common.album);
    const coverPath = await saveCover(common.picture, filePath, albumId);
    const relativeFilePath = path.relative(__dirname, filePath);

    const track = new LibraryIndex({
      track_id: trackId,
      title: common.title || path.basename(filePath, '.mp3'),
      artist: common.artists || [],
      album: common.album || 'Unknown Album',
      album_id: albumId,
      genre: common.genre ? common.genre.join(', ') : '',
      copyright: common.copyright || '',
      length: format.duration ? new Date(format.duration * 1000).toISOString().substr(14, 5) : '00:00',
      track_number: common.track.no || 0,
      quality: 'STD',
      file: relativeFilePath
    });

    await track.save();
    console.log(`Index Created: ${trackId} ${filePath}`);
    
    const author = (!common.album || common.album === 'Unknown Album') ? 'Unknown Artist' : (common.artists ? common.artists.join(', ') : 'Unknown Artist');

    const existingPlaylistIndex = await PlaylistIndex.findOne({ pid: albumId });


    const playlistIndex = await PlaylistIndex.findOneAndUpdate(
      { pid: albumId },
      {
        pid: albumId,
        author: existingPlaylistIndex && existingPlaylistIndex.author ? existingPlaylistIndex.author : author,
        name: common.album || 'Unknown Album',
        image: coverPath ? coverPath.replace(path.join(__dirname, '../../Library/'), '') : '', 
        last_update: new Date(),
        $inc: { added: 1 },
        public: true,
        type: 'album',
      },
      { upsert: true, new: true }
    );

    const nextOrder = await getNextSequenceValue(`p_${albumId}_order`);

    await playlistConnection.collection(`p_${albumId}`).insertOne({
      tid: trackId,
      order: nextOrder
    });

    console.log(`Track added to Playlist: ${playlistIndex.pid} ${playlistIndex.name}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

async function walkDirectory(dir) {
  let files = await fs.readdir(dir);
  let results = [];
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      results = results.concat(await walkDirectory(filePath));
    } else if (filePath.endsWith('.mp3')) {
      results.push(filePath);
    }
  }
  return results;
}

async function libraryInit(libraryPath) {
  const files = await walkDirectory(libraryPath);
  let queue = [];
  let runningTasks = 0;

  for (const file of files) {
    if (runningTasks >= cpuCount) {
      await Promise.race(queue);
      queue = queue.filter(p => p.isFulfilled || p.isRejected);
    }
    const task = indexCreate(file).finally(() => runningTasks--);
    queue.push(task);
    runningTasks++;
  }

  await Promise.all(queue);
  console.log('All files have been processed.');
}

async function libraryLoad() {
  try {
    const library = await LibraryIndex.find({});
    return library;
  } catch (error) {
    console.error('Error loading library from MongoDB:', error);
    throw error;
  }
}

async function deleteCounter(sequenceName) {
  await Counter.deleteOne({ _id: sequenceName });
}

async function decrementCounter(sequenceName) {
  const sequenceDocument = await Counter.findById(sequenceName);
  if (sequenceDocument) {
    const updatedSequenceDocument = await Counter.findByIdAndUpdate(
      sequenceName,
      { $inc: { sequence_value: -1 } },
      { new: true }
    );
    return updatedSequenceDocument.sequence_value;
  } else {
    console.warn(`Counter ${sequenceName} does not exist.`);
    return null;
  }
}

async function updatePlaylistOrder(playlistCollection) {
  const tracks = await playlistCollection.find().sort({ order: 1 }).toArray();
  for (let i = 0; i < tracks.length; i++) {
    await playlistCollection.updateOne(
      { _id: tracks[i]._id },
      { $set: { order: i + 1 } }
    );
  }
}

async function updateLibrary(libraryPath) {
  const allFiles = await walkDirectory(libraryPath);
  const allFilePaths = new Set(allFiles);

  const existingLibrary = await libraryLoad();
  const existingFilePaths = new Set(existingLibrary.map(entry => entry.file));
  const newFiles = allFiles.filter(file => !existingFilePaths.has(file));

  for (const file of newFiles) {
    await indexCreate(file);
  }

  const filesToDelete = existingLibrary.filter(entry => !allFilePaths.has(entry.file));
  for (const file of filesToDelete) {
    console.log(`Deleting track: ${file.track_id} from album: ${file.album_id}`);

    const deleteResult = await LibraryIndex.deleteOne({ _id: file._id });
    console.log(`LibraryIndex delete result: ${JSON.stringify(deleteResult)}`);

    const playlistCollection = playlistConnection.collection(`p_${file.album_id}`);
    const deletePlaylistResult = await playlistCollection.deleteMany({ tid: file.track_id });
    console.log(`Playlist delete result: ${JSON.stringify(deletePlaylistResult)}`);

    const playlistIndex = await PlaylistIndex.findOneAndUpdate(
      { pid: file.album_id },
      { $inc: { added: -1 } },
      { new: true }
    );
    console.log(`Updated PlaylistIndex: ${playlistIndex ? playlistIndex.pid : 'not found'}`);

    
    const remainingTracks = await playlistCollection.countDocuments();
    console.log(`Remaining tracks in playlist ${file.album_id}: ${remainingTracks}`);
    if (remainingTracks === 0) {
      const deletePlaylistIndexResult = await PlaylistIndex.deleteOne({ pid: file.album_id });
      console.log(`PlaylistIndex delete result: ${JSON.stringify(deletePlaylistIndexResult)}`);
      await playlistCollection.drop();
      console.log(`Playlist collection p_${file.album_id} deleted`);
      await deleteCounter(`p_${file.album_id}_order`);
      console.log(`Counter for playlist p_${file.album_id} deleted`);
    } else {

      await updatePlaylistOrder(playlistCollection);
      console.log(`Updated playlist order for album: ${file.album_id}`);

      await decrementCounter(`p_${file.album_id}_order`);
      console.log(`Decremented counter for playlist p_${file.album_id}`);
    }
  }

  console.log('Library updated successfully.');
}



async function main() {
  const libraryPath = path.join(__dirname, '../../Library');
  
  try {
    const library = await libraryLoad();
    if (library.length > 0) {
      await updateLibrary(libraryPath);
    } else {
      await libraryInit(libraryPath);
    }
  } catch (error) {
    console.error('Failed to load or initialize the library:', error);
  }
}
main();
export { main };

