import mongoose from './db.js';
const { Schema } = mongoose;

const libraryConnection = mongoose.createConnection('mongodb+srv://user1:EAdjuH2FZEsLSH6J@cluster0.mxw8665.mongodb.net/library', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});


const libraryIndexSchema = new Schema({
  track_id: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: [String], required: true },
  album: { type: String, required: true },
  album_id: { type: String, required: true },
  genre: { type: String },
  copyright: { type: String },
  length: { type: String, required: true },
  track_number: { type: Number, required: true },
  quality: { type: String, default: 'STD' },
  file: { type: String, required: true }
});

const userLibrarySchema = new Schema({
  type: { type: String, required: true },
  id: { type: String, required: true },
  added_date: { type: Date, default: Date.now }
});

const LibraryIndex = libraryConnection.model('LibraryIndex', libraryIndexSchema,'library');
const UserLibrary = libraryConnection.model('UserLibrary', userLibrarySchema,'library');

export { LibraryIndex, UserLibrary,libraryConnection };
