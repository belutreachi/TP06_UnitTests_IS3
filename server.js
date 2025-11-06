require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const { initDb } = require('./src/config/database');
const { seedAdmin } = require('./src/seed');
const authRoutes = require('./src/routes/auth');
const taskRoutes = require('./src/routes/tasks');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for our simple frontend
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Serve index.html for all other non-API routes (SPA)
app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});




async function startServer() {
  try {
    // ✅ Crear carpeta para DB si es necesario
    if (process.env.DATABASE_PATH) {
      const fs = require('fs');
      const dbDir = path.dirname(process.env.DATABASE_PATH);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`📁 Created DB directory at: ${dbDir}`);
      } else {
        console.log(`📁 DB directory exists: ${dbDir}`);
      }
    }

    await initDb();
    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Open http://localhost:${PORT} in your browser`);
      console.log(`🔑 Default admin credentials:`);
      console.log(`   Username: admin`);
      console.log(`   Password: Admin123!`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
