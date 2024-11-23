import prisma from "@/utils/db";
import { comparePassword, generateToken } from "@/utils/auth";

export default async function handler(req, res) {
  

  if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
  }
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }
  
  // if (!JWT_SECRET || !JWT_EXPIRES_IN) {
  //     return res.status(500).json({ message: 'Internal server error: missing configuration.' });
  // }
  try {
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
      });
    
      if (!user || !(await comparePassword(password, user.passwordHash))) {
        return res.status(401).json({
          message: "Invalid credentials.",
        });
      }
    
      const token = generateToken({ userId: user.id, email: user.email });

      // Set the token in an HTTP-only, Secure, SameSite cookie
      res.setHeader('Set-Cookie', `token=${token}; Max-Age=3600; path=/; HttpOnly; Secure; SameSite=Strict`);


      return res.status(200).json({
        token,
      });
      } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Internal server error.' });
        }
}
