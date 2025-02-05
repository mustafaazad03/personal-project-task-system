export interface TaskAPI {
  id: number;
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate: string;
  projectId?: number;
}

type DBTask = Record<string, any>;

export function transformTask(task: DBTask): TaskAPI {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    projectId: task.projectId,
  };
}