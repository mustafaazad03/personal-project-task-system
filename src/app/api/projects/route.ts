import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

function transformProject(project: any) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
  };
}

export async function GET() {
  try {
    const allProjects = await db.query.projects.findMany();
    console.log(allProjects);
    if (allProjects) {
      const projectsCamel = allProjects.map(transformProject);
      return NextResponse.json(projectsCamel);
    }
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newProjectData = {
      name: body.name,
      description: body.description || null,
      userId: body.userId || null,
    };

    const insertedProjects = await db.insert(projects)
      .values(newProjectData)
      .returning();

    if (!insertedProjects.length) {
      throw new Error('Project creation failed');
    }

    return NextResponse.json(transformProject(insertedProjects[0]));
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const updatedProjects = await db.update(projects)
      .set({
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
      })
      .where(eq(projects.id, body.id))
      .returning();

    if (!updatedProjects.length) {
      throw new Error('Project update failed');
    }

    return NextResponse.json(transformProject(updatedProjects[0]));
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    await db.delete(projects).where(eq(projects.id, body.id));
    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}