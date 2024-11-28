import jwt from 'jsonwebtoken';
import prisma from '@/utils/db';
import { NextApiRequest } from 'next';

const JWT_SECRET = process.env.JWT_SECRET as string;

interface DecodedToken {
  userId: number;
}

// Middleware to authenticate a user
export async function authenticateUser(req: NextApiRequest): Promise<null | { id: number; role: string }> {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) throw new Error("No token provided");

    const token = authorization.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) throw new Error("User not found");
    return user;
  } catch (error) {
    console.error("User authentication failed:", error);
    return null;
  }
}

// Middleware to authenticate an admin
export async function authenticateAdmin(req: NextApiRequest): Promise<null | { id: number; role: string }> {
  const user = await authenticateUser(req);
  if (user && user.role === 'ADMIN') {
    return user;
  }
  return null;
}
