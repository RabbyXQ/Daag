import { NextResponse } from 'next/server';
import prisma from '../lib/prisma'; // Adjust the import path for your Prisma client
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

// Logging the history of actions
const logHistory = (action: string, userId: string, data: any) => {
  return {
    action,
    userId,
    timestamp: new Date().toISOString(),
    details: data,
  };
};

// GET: Retrieve all participators
export async function GET(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = String(decoded.userId);

    const participators = await prisma.participator.findMany({
      where: { createdBy: userId },
    });

    if (!participators.length) {
      return NextResponse.json({ error: 'No participator records found' }, { status: 404 });
    }

    return NextResponse.json(participators, { status: 200 });
  } catch (error) {
    console.error('JWT verification error:', error);
    return NextResponse.json({ error: 'Unauthorized', details: error.message }, { status: 401 });
  }
}

// POST: Create a new participator
export async function POST(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const data = await req.json();

    const userId = String(decoded.userId);

    // Create new participator entry
    const newParticipator = await prisma.participator.create({
      data: {
        name: data.name,
        relation: data.relation,
        portion: data.portion, // Ensure this field exists in your schema
        createdBy: userId,
        updatedBy: userId,
        history: {
          create: logHistory('create', userId, data),
        },
      },
      select: {
        id: true,
        name: true,
        relation: true,
      },
    });

    return NextResponse.json({ id: newParticipator.id }, { status: 201 });
  } catch (error) {
    console.error('Creation error:', error.message);
    return NextResponse.json({ error: 'Error creating participator', details: error.message }, { status: 500 });
  }
}

// PUT: Update an existing participator
export async function PUT(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const data = await req.json();

    if (!data.id) {
      return NextResponse.json({ error: 'Participator ID is required' }, { status: 400 });
    }

    const userId = String(decoded.userId); // Ensure userId is treated as a string

    const participator = await prisma.participator.findUnique({
      where: { id: data.id, createdBy: userId }, // Use userId for the createdBy check
    });

    if (!participator) {
      return NextResponse.json({ error: 'Participator record not found' }, { status: 404 });
    }

    const updatedParticipator = await prisma.participator.update({
      where: { id: data.id },
      data: {
        name: data.name,
        portion: data.portion,
        relation: data.relation,
        updatedBy: userId,
        history: {
          create: logHistory('update', userId, data), // Create a new history record
        },
      },
    });

    return NextResponse.json(updatedParticipator, { status: 200 });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Error updating participator' }, { status: 500 });
  }
}

// DELETE: Delete a participator
export async function DELETE(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const userId = String(decoded.userId); // Ensure userId is treated as a string

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Participator ID is required' }, { status: 400 });
    }

    const participator = await prisma.participator.findUnique({
      where: { id, createdBy: userId }, // Use userId for the createdBy check
    });

    if (!participator) {
      return NextResponse.json({ error: 'Participator record not found' }, { status: 404 });
    }

    // Log the deletion in history
    await prisma.history.create({
      data: logHistory('delete', userId, participator),
    });

    await prisma.participator.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Participator record deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Error deleting participator' }, { status: 500 });
  }
}
