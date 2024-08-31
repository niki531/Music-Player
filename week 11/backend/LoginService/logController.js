import User from './Model/user.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { secret, expiresIn } from './config/jwtConfig.js';

function generateUid(username, password) {
  const secret = 'user_name_secret_key'; 
  const hash = crypto.createHash('md5');
  hash.update(username + password + secret);
  return hash.digest('hex');
}

export const registerUser = async (ctx) => {
  const { username, password } = ctx.request.body;
  const uid = generateUid(username, password);

  console.log('Received registration request:', username);

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      ctx.status = 400;
      ctx.body = { msg: 'Username already exists' };
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      uid,
      name: username,
      secret: hashedPassword,
      subscribe: 'premium',
      subscribe_expired: null,
      last_login: new Date(),
      playing: ''
    });

    console.log('Creating new user:', user);

    await user.save();
    
    const token = jwt.sign({ uid, username }, secret, { expiresIn: '1h' });

    ctx.status = 201;
    ctx.body = { msg: 'User created successfully', token };
  } catch (err) {
    console.error('Error during registration:', err);
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};

export const loginUser = async (ctx) => {
  const { username, password } = ctx.request.body;
  const uid = generateUid(username, password);
  const name = username;

  try {
    const user = await User.findOne({ name });
    if (!user) {
      ctx.status = 404;
      ctx.body = { err: 404, msg: 'User not found' };
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.secret);
    if (!isPasswordValid) {
      ctx.status = 401;
      ctx.body = { err: 401, msg: 'Invalid credentials' };
      return;
    }

    const token = jwt.sign({ uid, username, subscribe: user.subscribe }, secret, { expiresIn: '1h' });

    ctx.status = 200;
    ctx.body = { msg: 'Login successful', token, user: { uid, username, subscribe: user.subscribe }};
  } catch (err) {
    console.error('Error during login:', err);
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};

