// app/api/land/route.ts
import { NextResponse } from 'next/server';
import prisma from '../lib/prisma';
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

export async function GET(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  console.log('Token:', token); // Debugging log

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded); // Debugging log

    // Ensure `userId` is treated as a string
    const userId = String(decoded.userId);
    
    const lands = await prisma.land.findMany({
      where: { createdBy: userId }, // Ensuring userId is string
    });

    if (!lands.length) {
      return NextResponse.json({ error: 'No land records found' }, { status: 404 });
    }

    return NextResponse.json(lands, { status: 200 });
  } catch (error) {
    console.error('JWT verification error:', error); // Debugging log
    return NextResponse.json({ error: 'Unauthorized', details: error.message }, { status: 401 });
  }
}


export async function POST(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const data = await req.json();

    // Convert the userId to a string (assuming Prisma model requires it)
    const userId = String(decoded.userId);

    // Create new land entry
    const newLand = await prisma.land.create({
      data: {
        name: data.name,
        location: data.location,
        size: data.size,
        owner: data.owner,
        landType: data.landType,
        marketValue: data.marketValue,
        notes: data.notes,
        polygons: data.polygons, // Ensure this is handled as JSON
        createdBy: userId, // Pass userId as a string
        updatedBy: userId, // Pass userId as a string
        history: {
          create: logHistory('create', userId, data), // Ensure history stores userId as a string
        },
      },
      select: {
        id: true, // Explicitly select the id to return it
        name: true, // You can add more fields to return here if needed
      },
    });

    // Return the newly created land with the ID
    return NextResponse.json({ id: newLand.id }, { status: 201 });
  } catch (error) {
    console.error('Creation error:', error.message); // Log the actual error
    return NextResponse.json({ error: 'Error creating land', details: error.message }, { status: 500 });
  }
}



export async function PUT(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  console.log('Token:', token); // Debugging log

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded); // Debugging log

    const data = await req.json();
    console.log('Request body:', data); // Debugging log

    // Ensure the ID is provided
    if (!data.id) {
      return NextResponse.json({ error: 'Land ID is required' }, { status: 400 });
    }

    const land = await prisma.land.findUnique({
      where: { id: data.id, createdBy: decoded.userId },
    });

    if (!land) {
      return NextResponse.json({ error: 'Land record not found' }, { status: 404 });
    }

    const updatedLand = await prisma.land.update({
      where: { id: data.id },
      data: {
        name: data.name,
        location: data.location,
        size: data.size,
        owner: data.owner,
        landType: data.landType,
        marketValue: data.marketValue,
        notes: data.notes,
        polygons: data.polygons,
        updatedBy: decoded.userId,
        history: {
          push: logHistory('update', decoded.userId, data),
        },
      },
    });

    return NextResponse.json(updatedLand, { status: 200 });
  } catch (error) {
    console.error('Update error:', error); // Debugging log
    return NextResponse.json({ error: 'Error updating land' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  console.log('Token:', token); // Debugging log

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decoded); // Debugging log

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Land ID is required' }, { status: 400 });
    }

    const land = await prisma.land.findUnique({
      where: { id, createdBy: decoded.userId },
    });

    if (!land) {
      return NextResponse.json({ error: 'Land record not found' }, { status: 404 });
    }

    await prisma.land.update({
      where: { id },
      data: {
        history: {
          push: logHistory('delete', decoded.userId, land),
        },
      },
    });

    await prisma.land.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Land record deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete error:', error); // Debugging log
    return NextResponse.json({ error: 'Error deleting land' }, { status: 500 });
  }
}
