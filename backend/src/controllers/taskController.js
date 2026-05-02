const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTasks = async (req, res) => {
  try {
    // Everyone only sees their assigned tasks or tasks in projects they belong to
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assignedToId: req.user.id },
          { project: { members: { some: { id: req.user.id } } } },
          { project: { createdById: req.user.id } }
        ]
      },
      include: {
        project: { select: { id: true, title: true } },
        assignedTo: { select: { id: true, name: true } }
      }
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createTask = async (req, res) => {
  const { title, description, projectId, assignedToId, status, dueDate } = req.body;

  if (!title || !projectId) {
    return res.status(400).json({ error: 'Title and Project ID are required' });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId: parseInt(projectId),
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
        status: status || 'TODO',
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: { assignedTo: true }
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateTask = async (req, res) => {
  const { title, description, assignedToId, status, dueDate } = req.body;

  try {
    const existingTask = await prisma.task.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!existingTask) return res.status(404).json({ error: 'Task not found' });

    // Only Admin can update tasks
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can update tasks' });
    }

    let dataToUpdate = {};
    if (title) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (assignedToId !== undefined) dataToUpdate.assignedToId = assignedToId ? parseInt(assignedToId) : null;
    if (status) dataToUpdate.status = status;
    if (dueDate !== undefined) dataToUpdate.dueDate = dueDate ? new Date(dueDate) : null;

    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: dataToUpdate,
      include: { assignedTo: true, project: true }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Error updating task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    await prisma.task.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting task' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Everyone only sees their own data
    const whereCondition = {
      OR: [
        { assignedToId: req.user.id },
        { project: { members: { some: { id: req.user.id } } } },
        { project: { createdById: req.user.id } }
      ]
    };

    const totalTasks = await prisma.task.count({ where: whereCondition });
    const completedTasks = await prisma.task.count({ where: { ...whereCondition, status: 'COMPLETED' } });
    const pendingTasks = await prisma.task.count({ where: { ...whereCondition, status: { in: ['TODO', 'IN_PROGRESS'] } } });
    
    const now = new Date();
    const overdueTasks = await prisma.task.count({
      where: {
        ...whereCondition,
        status: { not: 'COMPLETED' },
        dueDate: { lt: now }
      }
    });

    res.json({ totalTasks, completedTasks, pendingTasks, overdueTasks });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask, getDashboardStats };
