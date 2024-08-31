import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { LibraryIndex } from '../models/library.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateLibraryData() {
  try {
    const data = await fs.readFile(path.join(__dirname, '..', 'Library', 'index.json'), 'utf-8');
    const lines = data.split('\n').filter(line => line.trim().length > 0);
    const objects = lines.map(line => JSON.parse(line));

    await LibraryIndex.insertMany(objects);
    console.log('Library data migrated successfully');
  } catch (error) {
    console.error('Error migrating library data:', error);
  }
}

migrateLibraryData();
