import { NextResponse } from 'next/server';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

const logHistory = (action: string, userId: string, data: any) => {
  return {
    action,
    userId,
    timestamp: new Date().toISOString(),
    details: data,
  };
};

// GET Land by ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const landId = parseInt(params.id); // Convert ID to integer if necessary

    const land = await prisma.land.findUnique({
      where: {
        id: landId,
        createdBy: String(decoded.userId),
      },
    });

    if (!land) {
      return NextResponse.json({ error: 'Land record not found' }, { status: 404 });
    }

    return NextResponse.json(land, { status: 200 });
  } catch (error) {
    console.error('GET error:', error.message);
    return NextResponse.json({ error: 'Unauthorized', details: error.message }, { status: 401 });
  }
}

// PUT to update Land by ID
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const data = await req.json();
    const landId = parseInt(params.id); // Convert ID to integer if necessary

    const land = await prisma.land.findUnique({
      where: {
        id: landId,
        createdBy: String(decoded.userId),
      },
    });

    if (!land) {
      return NextResponse.json({ error: 'Land record not found' }, { status: 404 });
    }

    const updatedLand = await prisma.land.update({
      where: { id: landId },
      data: {
        name: data.name,
        location: data.location,
        size: data.size,
        owner: data.owner,
        landType: data.landType,
        marketValue: data.marketValue,
        notes: data.notes,
        polygons: data.polygons,
        updatedBy: String(decoded.userId),
        history: {
          push: logHistory('update', String(decoded.userId), data),
        },
      },
    });

    return NextResponse.json(updatedLand, { status: 200 });
  } catch (error) {
    console.error('Update error:', error.message);
    return NextResponse.json({ error: 'Error updating land', details: error.message }, { status: 500 });
  }
}

// DELETE Land by ID
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const landId = parseInt(params.id); // Convert ID to integer if necessary

    const land = await prisma.land.findUnique({
      where: {
        id: landId,
        createdBy: String(decoded.userId),
      },
    });

    if (!land) {
      return NextResponse.json({ error: 'Land record not found' }, { status: 404 });
    }

    await prisma.land.update({
      where: { id: landId },
      data: {
        history: {
          push: logHistory('delete', String(decoded.userId), land),
        },
      },
    });

    await prisma.land.delete({
      where: { id: landId },
    });

    return NextResponse.json({ message: 'Land record deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete error:', error.message);
    return NextResponse.json({ error: 'Error deleting land', details: error.message }, { status: 500 });
  }
}
