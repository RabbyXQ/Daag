import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma'; // Adjust the import path for your Prisma client
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

// POST: Add a new participator
export async function POST(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
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

    return NextResponse.json({ id: newParticipator.id, name: newParticipator.name }, { status: 201 });
  } catch (error) {
    console.error('Creation error:', error.message);
    return NextResponse.json({ error: 'Error creating participator', details: error.message }, { status: 500 });
  }
}
