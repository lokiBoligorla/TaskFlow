import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosInstance';
import { AuthContext } from '../context/AuthContext';
import { Plus, UserPlus, Clock, Trash2, Edit } from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'TODO', assignedToId: '', dueDate: '' });

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', { ...newTask, projectId: id });
      setShowTaskModal(false);
      setNewTask({ title: '', description: '', status: 'TODO', assignedToId: '', dueDate: '' });
      fetchProject();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      fetchProject();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await api.delete(`/tasks/${taskId}`);
        fetchProject();
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  if (loading) return <div className="text-center py-10">Loading Project Details...</div>;
  if (!project) return <div className="text-center py-10">Project not found</div>;

  const columns = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
  
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h2>
          <p className="text-gray-600">{project.description}</p>
        </div>
        {user?.role === 'ADMIN' && (
          <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <UserPlus className="w-4 h-4" />
              Members
            </button>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="flex gap-6 flex-1 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colTasks = project.tasks?.filter(t => t.status === col) || [];
          return (
            <div key={col} className="bg-gray-50/50 rounded-xl p-4 min-w-[320px] w-80 border border-gray-200 flex flex-col">
              <div className="flex justify-between items-center mb-4 px-1">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  {col.replace('_', ' ')}
                  <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {colTasks.map((task) => (
                  <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-primary/50 transition-colors">
                    <h4 className="font-medium text-gray-900 mb-1">{task.title}</h4>
                    {task.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>}
                    
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                        <Clock className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        {task.assignedTo ? (
                          <div className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-xs font-medium" title={task.assignedTo.name}>
                            {task.assignedTo.name.charAt(0)}
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">?</div>
                        )}
                      </div>
                      
                      {/* Simple status mover for demo without actual drag-and-drop */}
                      <div className="flex items-center gap-2">
                        <select 
                          className="text-xs border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary py-1 px-2"
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={user?.role !== 'ADMIN'}
                        >
                          <option value="TODO">To Do</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="COMPLETED">Completed</option>
                        </select>

                        {user?.role === 'ADMIN' && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                    No tasks yet
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Add New Task</h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows="3"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newTask.assignedToId}
                      onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                    >
                      <option value="">Unassigned</option>
                      {project.members?.map(member => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
