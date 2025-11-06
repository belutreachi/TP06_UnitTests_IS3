const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Task = require('../models/Task');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}-${random}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 10
  }
});

const parseFilters = (query) => {
  const filters = {};

  if (query.status) {
    const status = String(query.status).toLowerCase();
    if (status === 'hecha' || status === 'no_hecha') {
      filters.status = status;
    }
  }

  if (query.startDate) {
    filters.startDate = String(query.startDate);
  }

  if (query.endDate) {
    filters.endDate = String(query.endDate);
  }

  if (query.search) {
    const trimmed = String(query.search).trim();
    if (trimmed) {
      filters.search = trimmed;
    }
  }

  return filters;
};

// All routes require authentication
router.use(authMiddleware);

// Get user's tasks
router.get('/', async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const tasks = await Task.findByUserId(req.user.id, filters);
    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// Get all tasks (admin only)
router.get('/all', adminMiddleware, async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const tasks = await Task.findAll(filters);
    res.json(tasks);
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ message: 'Error fetching all tasks' });
  }
});

// Get task stats
router.get('/stats', async (req, res) => {
  try {
    const filters = parseFilters(req.query);
    const view = String(req.query.view || '').toLowerCase();

    const stats = req.user.role === 'admin' && view === 'all'
      ? await Task.getStatsForAll(filters)
      : await Task.getStatsByUserId(req.user.id, filters);

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Error fetching task stats' });
  }
});

// Create task
router.post('/', upload.array('attachments', 10), async (req, res) => {
  try {
    const { title, description, due_date } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    const files = req.files || [];
    const task = await Task.create(title, description, due_date, req.user.id);

    if (files.length > 0) {
      await Task.addAttachments(task.id, files);
    }

    const createdTask = await Task.findById(task.id);
    res.status(201).json(createdTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Update task
router.put('/:id', upload.array('attachments', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date } = req.body;

    // Check if task exists and belongs to user
    const existingTask = await Task.findById(id);
    if (!existingTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (existingTask.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own tasks' });
    }

    await Task.update(id, title, description, due_date);

    const files = req.files || [];
    if (files.length > 0) {
      await Task.addAttachments(id, files);
    }

    const updatedTask = await Task.findById(id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Toggle task completion
router.patch('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if task exists and belongs to user
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only complete your own tasks' });
    }

    await Task.toggleComplete(id);
    const updatedTask = await Task.findById(id);
    res.json(updatedTask);
  } catch (error) {
    console.error('Toggle complete error:', error);
    res.status(500).json({ message: 'Error toggling task completion' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if task exists and belongs to user
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own tasks' });
    }

    await Task.delete(id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// Delete attachment
router.delete('/:id/attachments/:attachmentId', async (req, res) => {
  try {
    const { id, attachmentId } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own tasks' });
    }

    const attachment = await Task.findAttachmentById(attachmentId, { publicOnly: false });

    if (!attachment || Number(attachment.task_id) !== Number(id)) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    await Task.deleteAttachment(attachmentId);
    const attachments = await Task.getAttachments(id);

    res.json({ message: 'Attachment deleted successfully', attachments });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: 'Error deleting attachment' });
  }
});

module.exports = router;
