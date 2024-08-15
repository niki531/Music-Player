import mongoose from 'mongoose';

const uri = 'mongodb+srv://user1:EAdjuH2FZEsLSH6J@cluster0.mxw8665.mongodb.net/';

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
});

export default mongoose;
