import mongoose from './db.js';
const { Schema } = mongoose;

const userConnection = mongoose.createConnection('mongodb+srv://user1:EAdjuH2FZEsLSH6J@cluster0.mxw8665.mongodb.net/users', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new Schema({
  uid: String,
  name: String,
  secret: String,
  subscribe: String,
  subscribe_expired: Date,
  last_login: Date,
  playing: String
});

const User = userConnection.model('User', userSchema,'users');

export default User;
