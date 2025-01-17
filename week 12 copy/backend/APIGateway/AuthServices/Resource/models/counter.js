import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const counterSchema = new Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema, 'counters');

export default Counter;
