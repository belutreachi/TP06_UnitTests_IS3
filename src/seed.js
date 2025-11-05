const bcrypt = require('bcryptjs');
const { db } = require('./config/database');

async function seedAdmin() {
  return new Promise((resolve, reject) => {
    // Check if admin already exists
    db.get('SELECT * FROM users WHERE username = ?', ['admin'], async (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row) {
        console.log('Admin user already exists');
        resolve();
        return;
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
      
      db.run(query, ['admin', 'admin@tiktask.com', hashedPassword, 'admin'], function(err) {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Admin user created - Username: admin, Password: Admin123!');
          resolve();
        }
      });
    });
  });
}

module.exports = { seedAdmin };
