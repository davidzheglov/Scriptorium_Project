import prisma from '@/utils/db';
import { authenticateAdmin } from '@/middleware/auth';

export default async function handler(req, res) {
  const admin = await authenticateAdmin(req);
  if (!admin) {
    return res.status(403).json({ message: 'Forbidden: Admin access only' });
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { blogPostId, commentId } = req.body;

  try {
    if (blogPostId) {
      await prisma.blogPost.update({
        where: { id: blogPostId },
        data: { hidden: true },
      });
    } else if (commentId) {
      await prisma.comment.update({
        where: { id: commentId },
        data: { hidden: true },
      });
    } else {
      return res.status(400).json({ message: 'Specify blogPostId or commentId to hide content' });
    }

    res.status(200).json({ message: 'Content hidden successfully' });
  } catch (error) {
    console.error("Error hiding content:", error);
    res.status(500).json({ message: 'Failed to hide content' });
  }
}
