import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAlbumCover = async(ctx) => {
  const { album_id } = ctx.params;
  const coverPath = path.join(__dirname, '../library/cover', `${album_id}.jpg`);

  try {
    await fs.access(coverPath);
    ctx.type = 'image/jpeg';
    ctx.body = await fs.readFile(coverPath);
  } catch (err) {
    ctx.status = 404;
    ctx.body = { err: 404, msg: "Image doesn't exist" };
  }
}

