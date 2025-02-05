import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Use an environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRES_IN = '1h';

interface AuthRequestBody {
  action: 'register' | 'login';
  email: string;
  password: string;
  name?: string;
}

export async function POST(request: Request) {
  try {
    const { action, email, password, name }: AuthRequestBody = await request.json();

    if (!action || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'register') {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

        console.log(existingUser);
      if (existingUser && existingUser.length > 0) {
        return NextResponse.json({ error: 'User already exists' }, { status: 400 });
      }

      // Hash the password and insert the new user into the database
      const hashedPassword = await bcrypt.hash(password, 10);
      const insertedUsers = await db
        .insert(users)
        .values({
          email,
          name: name || '',
          password: hashedPassword,
        })
        .returning();

      const newUser = insertedUsers[0];

      // Create a JWT token
      const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      return NextResponse.json({ token, user: newUser });
    } else if (action === 'login') {
      // Look up the user in the database
      const usersFound = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (usersFound.length === 0) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const user = usersFound[0];

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
      });

      return NextResponse.json({ token, user });
    } else {
      return NextResponse.json(
        { error: 'Invalid action specified. Use "register" or "login".' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}