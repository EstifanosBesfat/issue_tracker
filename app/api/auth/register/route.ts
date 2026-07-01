import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? 'Validation failed' },
        { status: 400 }
      );
    }

    const { name, password } = validation.data;
    const email = validation.data.email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'USER',
        isActive: true,
      },
    });

    return NextResponse.json(
      { message: 'Account created successfully.', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
