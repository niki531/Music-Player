import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const ImageService = {
  async getAlbumCover(call, callback) {
    //console.log("starting this function");
    const { pid } = call.request;
    const coverPath = path.join(__dirname, '../../library/cover', `${pid}.jpg`);

    try {
      await fs.access(coverPath);
      const imageData = await fs.readFile(coverPath);

      callback(null, {
        image_data: imageData,
        content_type: 'image/jpeg',
      });
    } catch (err) {
      callback(null, {
        error_msg: "Image doesn't exist",
      });
    }
  }
};
