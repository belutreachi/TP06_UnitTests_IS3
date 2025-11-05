const { db } = require('../config/database');

const buildFilterClauses = (filters = {}, tableAlias = 'tasks') => {
  const clauses = [];
  const params = [];

  if (filters.status === 'hecha') {
    clauses.push(`${tableAlias}.completed = 1`);
  } else if (filters.status === 'no_hecha') {
    clauses.push(`${tableAlias}.completed = 0`);
  }

  if (filters.startDate) {
    clauses.push(`DATE(${tableAlias}.due_date) >= DATE(?)`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    clauses.push(`DATE(${tableAlias}.due_date) <= DATE(?)`);
    params.push(filters.endDate);
  }

  if (filters.search) {
    const likeQuery = `%${filters.search.toLowerCase()}%`;
    clauses.push(`(LOWER(${tableAlias}.title) LIKE ? OR LOWER(COALESCE(${tableAlias}.description, '')) LIKE ?)`);
    params.push(likeQuery, likeQuery);
  }

  return { clauses, params };
};

const mapStatsRow = (row = {}) => {
  const total = row.total || 0;
  const completed = row.completed || 0;
  const pending = total - completed;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, pending, progress };
};

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

  findByUserId: (userId, filters = {}) => {
    return new Promise((resolve, reject) => {
      const { clauses, params } = buildFilterClauses(filters);
      let query = 'SELECT * FROM tasks WHERE user_id = ?';

      if (clauses.length > 0) {
        query += ' AND ' + clauses.join(' AND ');
      }

      query += ' ORDER BY created_at DESC';

      db.all(query, [userId, ...params], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  },

  findAll: (filters = {}) => {
    return new Promise((resolve, reject) => {
      const { clauses, params } = buildFilterClauses(filters);
      let query = `
        SELECT tasks.*, users.username
        FROM tasks
        JOIN users ON tasks.user_id = users.id
      `;

      if (clauses.length > 0) {
        query += ' WHERE ' + clauses.join(' AND ');
      }

      query += ' ORDER BY tasks.created_at DESC';

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  },

  getStatsByUserId: (userId, filters = {}) => {
    return new Promise((resolve, reject) => {
      const { clauses, params } = buildFilterClauses(filters);
      const conditions = [`user_id = ?`, ...clauses];
      const query = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
        FROM tasks
        WHERE ${conditions.join(' AND ')}
      `;

      db.get(query, [userId, ...params], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(mapStatsRow(row));
        }
      });
    });
  },

  getStatsForAll: (filters = {}) => {
    return new Promise((resolve, reject) => {
      const { clauses, params } = buildFilterClauses(filters);
      let query = `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
        FROM tasks
      `;

      if (clauses.length > 0) {
        query += ' WHERE ' + clauses.join(' AND ');
      }

      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(mapStatsRow(row));
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
