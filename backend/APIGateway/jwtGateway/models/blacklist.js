import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const blacklistConnection = mongoose.createConnection('mongodb+srv://user1:EAdjuH2FZEsLSH6J@cluster0.mxw8665.mongodb.net/blacklist', {
    useNewUrlParser: true,
    useUnifiedTopology: true

});

const blacklistSchema = new Schema({
    token: { type: String, required: true },
    expiry: { type: Date, required: true }
});

const Blacklist = blacklistConnection.model('Blacklist', blacklistSchema, 'blacklists');

export default Blacklist;