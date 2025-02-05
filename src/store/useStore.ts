import { create } from 'zustand';

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: Date;
  projectId?: number;
}

interface Project {
  id: number;
  name: string;
  description?: string;
}

interface TaskStore {
  tasks: Task[];
  projects: Project[];
  setTasks: (tasks: Task[]) => void;
  setProjects: (projects: Project[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: number, task: Partial<Task>) => void;
  deleteTask: (id: number) => void;
  addProject: (project: Project) => void;
}

export const useStore = create<TaskStore>((set) => ({
  tasks: [],
  projects: [],
  setTasks: (tasks) => set({ tasks }),
  setProjects: (projects) => set({ projects }),
  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  updateTask: (id, updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updatedTask } : task
      ),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),
}));