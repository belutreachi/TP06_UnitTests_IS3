const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.NODE_ENV = 'test';

// usar SQLite en memoria durante tests
process.env.DATABASE_PATH = ':memory:';

// carpeta temporal para uploads de multer
const tmpUploads = fs.mkdtempSync(path.join(os.tmpdir(), 'tiktask-uploads-'));
process.env.UPLOADS_DIR = tmpUploads;

afterAll(() => {
  try { fs.rmSync(tmpUploads, { recursive: true, force: true }); } catch {}
});

process.env.DATABASE_PATH = ':memory:'; 

const { initDb } = require('../src/config/database');
const { seedAdmin } = require('../src/seed');

beforeAll(async () => {
  await initDb();
  await seedAdmin();   
});

