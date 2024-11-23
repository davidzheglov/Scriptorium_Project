import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

export async function hashPassword(passwordHash) {
  return await bcrypt.hash(passwordHash, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(passwordHash, hash) {
  return await bcrypt.compare(passwordHash, hash);
}

export function generateToken(obj) {
  return jwt.sign(obj, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token) {
  if (!token?.startsWith("Bearer ")) {
    return null;
  }

  token = token.split(" ")[1];

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}