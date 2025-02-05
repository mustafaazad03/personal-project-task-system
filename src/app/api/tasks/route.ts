import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { transformTask } from './transform';

export async function GET() {
  try {
    const allTasks = await db.query.tasks.findMany();
    const tasksCamel = allTasks.map(transformTask);
    return NextResponse.json(tasksCamel);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newTaskData = {
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      projectId: body.projectId || null,
      userId: body.userId || null,
    };

    const insertedTask = await db.insert(tasks)
      .values(newTaskData)
      .returning();

    if (!insertedTask.length) {
      throw new Error('Task creation failed');
    }

    return NextResponse.json(transformTask(insertedTask[0]));
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const body = await request.json();
    const updatedTasks = await db.update(tasks)
      .set({
        ...body
      })
      .where(eq(tasks.id, body.id))
      .returning();
    return NextResponse.json(transformTask(updatedTasks[0]));
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const body = await request.json();
    await db.delete(tasks).where(eq(tasks.id, body.id));
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}