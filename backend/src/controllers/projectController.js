const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getProjects = async (req, res) => {
  try {
    // Everyone only sees projects they created or are members of
    const whereCondition = {
      OR: [
        { createdById: req.user.id },
        { members: { some: { id: req.user.id } } }
      ]
    };

    const projects = await prisma.project.findMany({
      where: whereCondition,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } }
      }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: { select: { id: true, name: true, email: true } },
        tasks: {
          include: {
            assignedTo: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    // Access control for Members
    if (req.user.role === 'MEMBER') {
      const isMember = project.members.some(m => m.id === req.user.id);
      const isCreator = project.createdById === req.user.id;
      if (!isMember && !isCreator) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const createProject = async (req, res) => {
  const { title, description, memberIds } = req.body;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    const project = await prisma.project.create({
      data: {
        title,
        description,
        createdById: req.user.id,
        members: {
          connect: memberIds ? memberIds.map(id => ({ id: parseInt(id) })) : []
        }
      },
      include: { members: true }
    });
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

const updateProject = async (req, res) => {
  const { title, description, memberIds } = req.body;

  try {
    const project = await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        description,
        members: {
          set: memberIds ? memberIds.map(id => ({ id: parseInt(id) })) : []
        }
      },
      include: { members: true }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Error updating project' });
  }
};

const deleteProject = async (req, res) => {
  try {
    await prisma.project.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting project' });
  }
};

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject };
