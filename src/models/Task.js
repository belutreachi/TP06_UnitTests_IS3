const path = require('path');
const fs = require('fs');
const { db } = require('../config/database');

const fsPromises = fs.promises;
const rootDir = path.join(__dirname, '..', '..');

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

const normalizePublicPath = (filePath = '') => {
  if (!filePath) {
    return '';
  }

  const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/g, '');
  return `/${normalized}`;
};

const mapAttachmentRow = (row, { publicOnly = true } = {}) => {
  if (!row) {
    return null;
  }

  const attachment = {
    id: row.id,
    task_id: row.task_id,
    name: row.original_name,
    url: normalizePublicPath(row.file_path),
    mime_type: row.mime_type,
    size: row.size
  };

  if (!publicOnly) {
    attachment.file_path = row.file_path;
    attachment.file_name = row.file_name;
  }

  return attachment;
};

const fetchAttachmentsForTaskIds = (taskIds = [], options = {}) => {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      resolve({});
      return;
    }

    const placeholders = taskIds.map(() => '?').join(', ');
    const query = `
      SELECT id, task_id, original_name, file_name, file_path, mime_type, size
      FROM task_attachments
      WHERE task_id IN (${placeholders})
      ORDER BY created_at ASC
    `;

    db.all(query, taskIds, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        const attachmentsMap = {};
        (rows || []).forEach((row) => {
          const attachment = mapAttachmentRow(row, options);
          if (!attachmentsMap[row.task_id]) {
            attachmentsMap[row.task_id] = [];
          }
          if (attachment) {
            attachmentsMap[row.task_id].push(attachment);
          }
        });
        resolve(attachmentsMap);
      }
    });
  });
};

const includeAttachments = async (tasks = [], options = {}) => {
  const taskList = Array.isArray(tasks) ? tasks : [];
  const taskIds = taskList.map((task) => task.id).filter(Boolean);

  const attachmentsMap = await fetchAttachmentsForTaskIds(taskIds, options);

  return taskList.map((task) => ({
    ...task,
    attachments: attachmentsMap[task.id] || []
  }));
};

const getAttachmentsByTaskId = (taskId, options = {}) =>
  fetchAttachmentsForTaskIds([taskId], options).then((map) => map[taskId] || []);

const findAttachmentRowById = (attachmentId, options = {}) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT id, task_id, original_name, file_name, file_path, mime_type, size
      FROM task_attachments
      WHERE id = ?
    `;

    db.get(query, [attachmentId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? mapAttachmentRow(row, options) : null);
      }
    });
  });
};

const removeStoredFile = async (storedPath) => {
  if (!storedPath) {
    return;
  }

  const absolutePath = path.join(rootDir, storedPath);

  try {
    await fsPromises.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Error removing attachment file:', error);
    }
  }
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
          resolve({
            id: this.lastID,
            title,
            description,
            due_date: dueDate,
            completed: false,
            user_id: userId,
            attachments: []
          });
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

      db.all(query, [userId, ...params], async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            const tasksWithAttachments = await includeAttachments(rows || []);
            resolve(tasksWithAttachments);
          } catch (attachmentsError) {
            reject(attachmentsError);
          }
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

      db.all(query, params, async (err, rows) => {
        if (err) {
          reject(err);
        } else {
          try {
            const tasksWithAttachments = await includeAttachments(rows || []);
            resolve(tasksWithAttachments);
          } catch (attachmentsError) {
            reject(attachmentsError);
          }
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
      db.get(query, [id], async (err, row) => {
        if (err) {
          reject(err);
        } else {
          if (!row) {
            resolve(null);
            return;
          }

          try {
            const [taskWithAttachments] = await includeAttachments([row]);
            resolve(taskWithAttachments || null);
          } catch (attachmentsError) {
            reject(attachmentsError);
          }
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
      fetchAttachmentsForTaskIds([id], { publicOnly: false })
        .then((map) => {
          const attachments = map[id] || [];
          const query = 'DELETE FROM tasks WHERE id = ?';

          db.run(query, [id], function(err) {
            if (err) {
              reject(err);
            } else {
              Promise.all(attachments.map((attachment) => removeStoredFile(attachment.file_path)))
                .then(() => resolve({ changes: this.changes }))
                .catch((fileError) => {
                  console.error('Error cleaning up attachment files:', fileError);
                  resolve({ changes: this.changes });
                });
            }
          });
        })
        .catch(reject);
    });
  },

  getAttachments: (taskId, options = {}) => getAttachmentsByTaskId(taskId, options),

  addAttachments: (taskId, files = []) => {
    return new Promise((resolve, reject) => {
      if (!Array.isArray(files) || files.length === 0) {
        resolve([]);
        return;
      }

      const insertAttachment = (file) => {
        return new Promise((res, rej) => {
          const storedPath = path.posix.join('uploads', file.filename);
          const query = `
            INSERT INTO task_attachments (task_id, original_name, file_name, file_path, mime_type, size)
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          db.run(query, [taskId, file.originalname, file.filename, storedPath, file.mimetype, file.size], function(err) {
            if (err) {
              rej(err);
            } else {
              res(this.lastID);
            }
          });
        });
      };

      Promise.all(files.map(insertAttachment))
        .then(() => getAttachmentsByTaskId(taskId))
        .then(resolve)
        .catch(reject);
    });
  },

  findAttachmentById: (attachmentId, options = {}) => findAttachmentRowById(attachmentId, options),

  deleteAttachment: (attachmentId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const attachment = await findAttachmentRowById(attachmentId, { publicOnly: false });

        if (!attachment) {
          resolve(null);
          return;
        }

        const query = 'DELETE FROM task_attachments WHERE id = ?';
        db.run(query, [attachmentId], async function(err) {
          if (err) {
            reject(err);
          } else {
            await removeStoredFile(attachment.file_path);
            resolve(attachment);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
};

module.exports = Task;
