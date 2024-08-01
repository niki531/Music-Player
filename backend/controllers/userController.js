import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { secret, expiresIn } from '../config/jwtConfig.js';
import crypto from 'crypto';
import pkg from 'node-machine-id';
const { machineIdSync } = pkg;

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
      subscribe: '',
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

    const token = jwt.sign({ uid, username }, secret, { expiresIn: '1h' });

    ctx.status = 200;
    ctx.body = { msg: 'Login successful', token, user: { uid, username }};
  } catch (err) {
    console.error('Error during login:', err);
    ctx.status = 500;
    ctx.body = { err: 500, msg: 'Internal server error' };
  }
};

export const logoutUser = async (ctx) => {
  console.log(`Logging out user: ${uid}, token: ${token}`);

  const { uid } = ctx.state.user;
  const token = ctx.state.token;

  await blacklistToken(token);

  console.log(`User ${uid} logged out`);

  ctx.status = 200;
  ctx.body = { message: 'Logged out successfully' };
};

export const getUserInfo = async (ctx) => {
  const { uid } = ctx.state.user;
  try {
    const user = await User.findOne({ uid }, 'uid name subscribe subscribe_expired');

    if (!user) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }

    ctx.body = { user };
  } catch (error) {
    console.error('Error fetching user info:', error);
    ctx.status = 500;
    ctx.body = { error: 'Internal Server Error' };
  }
};


export const updateUserPlayingStatus = async (ctx) => {
  //console.log('Received request to update playing status');
  const { uid } = ctx.params;
  const { playing } = ctx.request.body;

  console.log('UID:', uid);
  console.log('Playing:', playing);

  try {
    await User.updateOne({ uid }, { playing });

    ctx.status = 200;
    ctx.body = { msg: 'Playing status updated' };
  } catch (error) {
    console.error('Error updating playing status:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to update playing status' };
  }
};


export const getUserPlayingStatus = async (ctx) => {
  //console.log('Received request to check playing status'); 
  const { uid } = ctx.params; 

  try {
    const user = await User.findOne({ uid }, { playing: 1 }); 

    if (!user) {
      ctx.status = 404;
      ctx.body = { error: 'User not found' };
      return;
    }

    ctx.status = 200;
    ctx.body = { playing: user.playing };
  } catch (error) {
    console.error('Error fetching playing status:', error);
    ctx.status = 500;
    ctx.body = { error: 'Failed to fetch playing status' };
  }
};
