const { db } = require('../config/database');

const Task = {
  create: (title, description, dueDate, userId) => {
    return new Promise((resolve, reject) => {
      const query = 'INSERT INTO tasks (title, description, due_date, user_id) VALUES (?, ?, ?, ?)';
      db.run(query, [title, description, dueDate, userId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, title, description, due_date: dueDate, completed: false, user_id: userId });
        }
      });
    });
  },

  findByUserId: (userId) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC';
      db.all(query, [userId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  },

  findAll: () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT tasks.*, users.username 
        FROM tasks 
        JOIN users ON tasks.user_id = users.id 
        ORDER BY tasks.created_at DESC
      `;
      db.all(query, [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  },

  findById: (id) => {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM tasks WHERE id = ?';
      db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  },

  update: (id, title, description, dueDate) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE tasks 
        SET title = ?, description = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      db.run(query, [title, description, dueDate, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  },

  toggleComplete: (id) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE tasks 
        SET completed = NOT completed, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  },

  delete: (id) => {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM tasks WHERE id = ?';
      db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }
};

module.exports = Task;
