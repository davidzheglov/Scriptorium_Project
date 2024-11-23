import prisma from '@/utils/db';
import { authenticateUser } from '@/middleware/auth';

export default async function handler(req, res) {
  const user = await authenticateUser(req);

  if (!user) {
    return res.status(401).json({ message: 'You are not an authorized user and you are not allowed to do this.' });
  }

  switch (req.method) {
    case 'GET':
      return handleGetRequest(res, user);
    case 'PUT':
      return handlePutRequest(req, res, user);
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

// Handler to fetch user profile data (GET)
async function handleGetRequest(res, user) {
  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        phoneNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(userProfile);
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return res.status(500).json({ message: 'Failed to fetch user profile' });
  }
}

// Handler to update user profile data (PUT)
async function handlePutRequest(req, res, user) {
  const { firstName, lastName, avatar, phoneNumber } = req.body;

  try {
    const updatedProfile = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        avatar,
        phoneNumber,
        updatedAt: new Date(),
      },
    });

    return res.status(200).json({ message: 'Profile updated successfully', user: updatedProfile });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
}