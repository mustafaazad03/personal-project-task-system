import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { transformTask } from './transform';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const query = projectId
      ? db.select().from(tasks).where(and(
          eq(tasks.userId, userId),
          eq(tasks.projectId, projectId)
        ))
      : db.select().from(tasks).where(eq(tasks.userId, userId));

    const filteredTasks = await query;
    const tasksCamel = filteredTasks.map(transformTask);
    
    return NextResponse.json(tasksCamel);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const newTaskData = {
      title: body.title,
      description: body.description,
      priority: body.priority,
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      projectId: body.projectId || null,
      userId: body.userId,
      updatedAt: new Date(),
    };

    const [insertedTask] = await db.insert(tasks)
      .values(newTaskData)
      .returning();

    if (!insertedTask) {
      throw new Error('Task creation failed');
    }

    return NextResponse.json(transformTask(insertedTask));
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const updateData = {
      ...body,
      updatedAt: new Date(),
    };
    delete updateData.id; // Remove id from update data

    const [updatedTask] = await db.update(tasks)
      .set(updateData)
      .where(eq(tasks.id, body.id))
      .returning();

    if (!updatedTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transformTask(updatedTask));
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const [deletedTask] = await db.delete(tasks)
      .where(eq(tasks.id, body.id))
      .returning();

    if (!deletedTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}