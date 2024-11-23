import prisma from '@/utils/db';
import { authenticateUser } from '@/middleware/auth';

export default async function handler(req, res) {
  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: 'Content is required' });
  }

  try {
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!comment || comment.userId !== user.id) {
      return res.status(403).json({ message: 'Not allowed to edit this comment' });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: { content },
    });

    return res.status(200).json({ message: 'Comment updated successfully', comment: updatedComment });
  } catch (error) {
    console.error("Error updating comment:", error);
    return res.status(500).json({ message: 'Failed to update comment' });
  }
}