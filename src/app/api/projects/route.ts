import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

function transformProject(project: any) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    userId: project.userId,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userProjects = await db.select()
      .from(projects)
      .where(eq(projects.userId, userId));

    const projectsCamel = userProjects.map(transformProject);
    return NextResponse.json(projectsCamel);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
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

    const newProjectData = {
      name: body.name,
      description: body.description || null,
      userId: body.userId,
    };

    const [insertedProject] = await db.insert(projects)
      .values(newProjectData)
      .returning();

    if (!insertedProject) {
      throw new Error('Project creation failed');
    }

    return NextResponse.json(transformProject(insertedProject));
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const updateData = {
      ...(body.name && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
    };

    const [updatedProject] = await db.update(projects)
      .set(updateData)
      .where(eq(projects.id, body.id))
      .returning();

    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transformProject(updatedProject));
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    const [deletedProject] = await db.delete(projects)
      .where(eq(projects.id, body.id))
      .returning();

    if (!deletedProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}