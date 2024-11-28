import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS as string, 10);
const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as string;

interface TokenPayload {
  [key: string]: any; // Adjust this type to include specific keys if needed
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  if (!token?.startsWith("Bearer ")) {
    return null;
  }

  token = token.split(" ")[1];

  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err) {
    return null;
  }
}
