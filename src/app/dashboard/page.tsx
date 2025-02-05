'use client';

import { useRouter } from 'next/navigation';
import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import jwt from 'jsonwebtoken';
import { useTheme } from 'next-themes';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate: string;
  projectId?: string | null;
}

interface Project {
  id: string;
  name: string;
  description?: string | null;
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

  const getUserId = useCallback((): string | null => {
    const authCookie = document.cookie.split(';').find(c => c.trim().startsWith('authToken='));
    if (!authCookie) return null;
    const token = authCookie.split('=')[1];
    const decoded = jwt.decode(token);
    return decoded && typeof decoded !== 'string' ? (decoded as any).id : null;
  }, []);

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await res.json();
      setProjects(data);
      if (!activeProject && data.length) {
        setActiveProject(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    }
  }, [activeProject, setProjects, setError, setActiveProject]);

  // Fetch tasks filtered by active project and userId
  // const fetchTasks = useCallback(async (projectId: string) => {
  //   try {
  //     const userId = getUserId();
  //     if (!userId) throw new Error('User is not authenticated');
  //     const url = `/api/tasks?userId=${userId}` + (projectId ? `&projectId=${projectId}` : '');
  //     const response = await fetch(url);
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch tasks');
  //     }
  //     const data = await response.json();
  //     setTasks(data);
  //   } catch (err) {
  //     setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, [setTasks, setError, setIsLoading, getUserId]);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Redirect if not authenticated
    if (!document.cookie.includes('authToken=')) {
      router.push('/');
      return;
    }
    fetchProjects();
  }, [fetchProjects, router]);

  useEffect(() => {
    if (activeProject) {
      setIsLoading(true);
      fetchTasks();
    }
  }, [activeProject]);

  // Create a new task
  const createTask = async (newTask: Omit<Task, 'id'>) => {
    try {
      const userId = getUserId();
      if (!userId) throw new Error('No auth token found');
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTask, userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      const createdTask = await response.json();
      // Only add task if it belongs to the current active project
      if (createdTask.projectId === activeProject) {
        setTasks(prev => [...prev, createdTask]);
      }
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
        prev.map(task =>
          task.id === taskId ? { ...task, ...updatedTask } : task
        )
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
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });
      if (!res.ok) {
        throw new Error('Failed to create project');
      }
      const project = await res.json();
      setProjects(prev => [...prev, project]);
      setNewProjectName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  // Update an existing project
  const updateProject = async (projectId: string) => {
    if (!editingProjectName.trim()) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId, name: editingProjectName.trim() }),
      });
      if (!res.ok) {
        throw new Error('Failed to update project');
      }
      const updatedProject = await res.json();
      setProjects(prev =>
        prev.map(project =>
          project.id === projectId ? updatedProject : project
        )
      );
      setEditingProjectId(null);
      setEditingProjectName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    }
  };

  // Delete project (except the General project)
  const deleteProject = async (projectId: string) => {
    if (projects[0]?.id === projectId) return; // Prevent deletion of General project
    try {
      const res = await fetch('/api/projects', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: projectId }),
      });
      if (!res.ok) {
        throw new Error('Failed to delete project');
      }
      setProjects(prev => prev.filter(project => project.id !== projectId));
      // If the deleted project was active, switch to the first available project
      if (activeProject === projectId && projects.length > 1) {
        setActiveProject(projects[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (!document.cookie.includes('authToken=')) {
    return <div className="p-4 text-center">Redirecting...</div>;
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
            onClick={() => router.push('/')}
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
                  <>
                    <input
                      type="text"
                      value={editingProjectName}
                      onChange={(e) => setEditingProjectName(e.target.value)}
                      className="flex-1 p-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <button
                      onClick={() => updateProject(project.id)}
                      className="ml-2 text-green-500 hover:text-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingProjectId(null);
                        setEditingProjectName('');
                      }}
                      className="ml-1 text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setActiveProject(project.id);
                        setIsLoading(true);
                        fetchTasks();
                      }}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
                        activeProject === project.id
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      {project.name}
                    </button>
                    <div className="flex gap-1 ml-2">
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
                  </>
                )}
              </li>
            ))}
          </ul>
          <form onSubmit={createProject} className="mt-4 flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project"
              className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              type="submit"
              className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition-colors"
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
              onClick={() => {
                createTask({
                  title: 'New Task',
                  description: 'Task description',
                  priority: 'medium',
                  status: 'pending',
                  dueDate: new Date().toISOString(),
                  projectId: activeProject,
                });
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Add Task
            </button>
          </div>
          {isLoading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="border p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{task.title}</h3>
                    <div className="flex gap-2">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          task.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {task.priority}
                      </span>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          updateTask(task.id, { status: 'completed' });
                        }}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        Mark as completed
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">{task.description}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    Due: {new Date(task.dueDate).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}