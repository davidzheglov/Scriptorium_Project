import jwt from 'jsonwebtoken';
import prisma from '@/utils/db';

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate a user
export async function authenticateUser(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error("No token provided");

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) throw new Error("User not found");
    return user;
  } catch (error) {
    console.error("User authentication failed:", error);
    return null;
  }
}

// Middleware to authenticate an admin
export async function authenticateAdmin(req) {
  const user = await authenticateUser(req);
  if (user && user.role === 'ADMIN') {
    return user;
  }
  return null;
}