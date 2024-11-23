import prisma from '@/utils/db';
import { authenticateUser } from '@/middleware/auth';

export default async function handler(req, res) {
  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { reason, blogPostId, commentId } = req.body;

  if (!reason || (!blogPostId && !commentId)) {
    return res.status(400).json({ message: 'Reason and target (blog post or comment) are required' });
  }

  try {
    const report = await prisma.report.create({
      data: {
        reason,
        userId: user.id,
        blogPostId: blogPostId || null,
        commentId: commentId || null,
      },
    });

    res.status(201).json({ message: 'Report submitted successfully', report });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: 'Failed to submit report' });
  }
}
