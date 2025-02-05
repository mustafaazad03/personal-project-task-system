'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import jwt from 'jsonwebtoken';
import { useTheme } from 'next-themes';
import { format } from 'date-fns';
import TaskModal from '@/components/task-modal';

interface TaskModalData {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialData?: Partial<Task>;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string;
  projectId?: string | null;
  userId: string;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
  userId: string;
}

interface NewTask {
  title: string;
  description?: string;
  priority: Task['priority'];
  status: Task['status'];
  dueDate: string;
  projectId?: string;
  userId: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [taskModal, setTaskModal] = useState<TaskModalData>({
    isOpen: false,
    mode: 'create',
  });

  const openCreateTaskModal = () => {
    setTaskModal({
      isOpen: true,
      mode: 'create',
      initialData: {
        priority: 'medium',
        status: 'pending',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        projectId: activeProject,
      },
    });
  };
  
  const openEditTaskModal = (task: Task) => {
    setTaskModal({
      isOpen: true,
      mode: 'edit',
      initialData: {
        ...task,
        dueDate: format(new Date(task.dueDate), 'yyyy-MM-dd'),
      },
    });
  };

  const closeTaskModal = () => {
    setTaskModal((prev) => ({ ...prev, isOpen: false }));
  };
  

  const handleTaskSubmit = async (data: Partial<Task>) => {
    try {
      if (!userId || !activeProject) return;
  
      const taskData = {
        ...data,
        userId,
        projectId: activeProject,
      };
  
      if (taskModal.mode === 'create') {
        await createTask(taskData);
      } else {
        if (!taskModal.initialData?.id) {
          throw new Error('Missing task id for updating the task');
        }
        await updateTask(taskModal.initialData.id, taskData);
      }
  
      closeTaskModal();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to handle task');
    }
  };

  const getUserId = useCallback((): string | null => {
    try {
      const authCookie = document.cookie.split(';').find(c => c.trim().startsWith('authToken='));
      if (!authCookie) return null;
      const token = authCookie.split('=')[1];
      const decoded = jwt.decode(token);
      return decoded && typeof decoded !== 'string' ? (decoded as any).id : null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }, []);

  // Fetch projects from API
  const fetchProjects = useCallback(async (currentUserId: string) => {
    try {
      const res = await fetch(`/api/projects?userId=${currentUserId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setProjects(data);
        if (!activeProject && data.length) {
          setActiveProject(data[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    }
  }, [activeProject]);

  // Fetch tasks filtered by active project and userId
  const fetchTasks = useCallback(async (currentUserId: string, projectId?: string) => {
    try {
      const url = `/api/tasks?userId=${currentUserId}${projectId ? `&projectId=${projectId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentUserId = getUserId();
    if (!currentUserId) {
      router.push('/');
      return;
    }
    setUserId(currentUserId);
    fetchProjects(currentUserId);
  }, [fetchProjects, router, getUserId]);

  useEffect(() => {
    if (userId && activeProject) {
      setIsLoading(true);
      fetchTasks(userId, activeProject);
    }
  }, [userId, activeProject, fetchTasks]);

  // Create a new task
  const createTask = async (taskData: Partial<NewTask>) => {
    try {
      if (!userId) throw new Error('User not authenticated');
      if (!activeProject) throw new Error('No project selected');

      const newTask = {
        ...taskData,
        userId,
        projectId: activeProject,
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || new Date().toISOString(),
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const createdTask = await response.json();
      setTasks(prev => [...prev, createdTask]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  // Update task
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      setTasks(prev =>
        prev.map(task => task.id === taskId ? { ...task, ...updatedTask } : task)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  // Create a new project
  const createProject = async (e: FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !userId) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim(), userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create project');
      }

      const project = await response.json();
      setProjects(prev => [...prev, project]);
      setNewProjectName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  // Update project
  const updateProject = async (projectId: string) => {
    if (!editingProjectName.trim()) return;

    try {
      const response = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, name: editingProjectName.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update project');
      }

      const updatedProject = await response.json();
      setProjects(prev =>
        prev.map(project => project.id === projectId ? updatedProject : project)
      );
      setEditingProjectId(null);
      setEditingProjectName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  // Delete project
  const deleteProject = async (projectId: string) => {
    if (projects[0]?.id === projectId) return; // Prevent deletion of default project

    try {
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      setProjects(prev => prev.filter(project => project.id !== projectId));
      if (activeProject === projectId && projects.length > 1) {
        setActiveProject(projects[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  // Handle logout
  const handleLogout = useCallback(() => {
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/');
  }, [router]);

  if (!userId) {
    return <div className="p-4 text-center">Redirecting to login...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error: {error}
        <button
          onClick={() => setError(null)}
          className="ml-4 text-blue-500 hover:text-blue-700"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-gray-200 transition-colors">
      <header className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="bg-gray-200 dark:bg-gray-800 px-3 py-1 rounded transition-colors"
          >
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="container mx-auto p-4 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="md:w-1/4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Projects</h2>
          <ul className="space-y-2">
            {projects.map((project) => (
              <li key={project.id} className="flex items-center justify-between">
                {editingProjectId === project.id ? (
                  <div className="flex items-center w-full gap-2">
                    <input
                      type="text"
                      value={editingProjectName}
                      onChange={(e) => setEditingProjectName(e.target.value)}
                      className="flex-1 p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button
                      onClick={() => updateProject(project.id)}
                      className="text-green-500 hover:text-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingProjectId(null);
                        setEditingProjectName('');
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center w-full gap-2">
                    <button
                      onClick={() => setActiveProject(project.id)}
                      className={`flex-1 text-left px-3 py-2 rounded transition-colors ${
                        activeProject === project.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      {project.name}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingProjectId(project.id);
                          setEditingProjectName(project.name);
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      {project.id !== projects[0]?.id && (
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={createProject} className="mt-4 flex gap-2 flex-col">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project name"
              className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              type="submit"
              disabled={!newProjectName.trim()}
              className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              Create
            </button>
          </form>
        </aside>

        {/* Main Content */}
        <main className="md:w-3/4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Tasks</h2>
            <button
              onClick={openCreateTaskModal}
              disabled={!activeProject}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Add Task
            </button>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <p className="text-center text-gray-500">No tasks found. Create a new task to get started!</p>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{task.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300 mt-2">
                            {task.description || 'No description'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              task.priority === 'high'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : task.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              task.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : task.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateTask(task.id, {
                              status: task.status === 'completed' ? 'pending' : 'completed'
                            })}
                            className={`px-3 py-1 rounded transition-colors ${
                              task.status === 'completed'
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {task.status === 'completed' ? 'Reopen' : 'Complete'}
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this task?')) {
                                deleteTask(task.id);
                              }
                            }}
                            className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => openEditTaskModal(task)}
                            className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <TaskModal
        isOpen={taskModal.isOpen}
        onClose={closeTaskModal}
        onSubmit={handleTaskSubmit}
        initialData={taskModal.initialData}
        mode={taskModal.mode}
      />
    </div>
  );
}