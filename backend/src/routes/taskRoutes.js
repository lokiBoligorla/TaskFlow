const express = require('express');
const { getTasks, createTask, updateTask, deleteTask, getDashboardStats } = require('../controllers/taskController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard-stats', authenticate, getDashboardStats);
router.get('/', authenticate, getTasks);

// Members can only view tasks. Admin can do everything.
router.put('/:id', authenticate, updateTask);

// Admin only routes
router.post('/', authenticate, authorizeAdmin, createTask);
router.delete('/:id', authenticate, authorizeAdmin, deleteTask);

module.exports = router;
