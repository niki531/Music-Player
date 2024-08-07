import mongoose from './db.js';
const Schema = mongoose.Schema;

const playlistConnection = mongoose.createConnection('mongodb+srv://user1:EAdjuH2FZEsLSH6J@cluster0.mxw8665.mongodb.net/playlists', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const playlistIndexSchema = new Schema({
  pid: String,
  author: String,
  author_uid: String,
  name: String,
  description: String,
  added: Number,
  liked: Number,
  shared: Number,
  played: Number,
  public: Boolean,
  image: String,
  type: String,
  last_update: Date
});

const playlistSchema = new Schema({
  tid: String,
  order: Number
});

const PlaylistIndex = playlistConnection.model('PlaylistIndex', playlistIndexSchema,'playlists');
const Playlist = playlistConnection.model('Playlist', playlistSchema,'playlists');

export { PlaylistIndex, Playlist, playlistConnection };
