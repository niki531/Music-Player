import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from '.。/models/db.js';
import User from '.。/models/user.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Koa();
const router = new Router();

app.use(bodyParser());
app.use(serve(path.join(__dirname, 'public')));

router.get('/login', async (ctx) => {
  ctx.type = 'html';
  ctx.body = await fs.promises.readFile(path.join(__dirname, 'public', 'login.html'), 'utf8');
});

router.post('/login', async (ctx) => {
  console.log('Login request received');
  const { name, secret } = ctx.request.body;
  console.log('Login data:', { name, secret });

  try {
    const user = await User.findOne({ name, secret });
    if (user) {
      ctx.body = {
        status: 0,
        msg: 'Success'
      };
    } else {
      ctx.body = {
        status: 1,
        msg: 'Username or Password error.'
      };
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      status: 1,
      msg: 'Internal server error'
    };
    console.error('Internal server error:', err);
  }
});

router.get('/signup', async (ctx) => {
  ctx.type = 'html';
  ctx.body = await fs.promises.readFile(path.join(__dirname, 'public', 'signup.html'), 'utf8');
});

router.post('/signup', async (ctx) => {
  console.log('Signup request received');
  const { name, secret } = ctx.request.body;
  console.log('Signup data:', { name, secret });

  try {
    const existingUser = await User.findOne({ name });
    if (existingUser) {
      ctx.body = {
        status: 1,
        msg: 'User Already Exist.'
      };
      return;
    }

    const newUser = new User({ name, secret, subscribe: 'free', subscribe_expired: new Date(), last_login: new Date(), playing: '' });
    await newUser.save();

    ctx.body = {
      status: 0,
      msg: 'Success'
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      status: 1,
      msg: 'Internal server error'
    };
    console.error('Internal server error:', err);
  }
});

app
  .use(router.routes())
  .use(router.allowedMethods());

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
