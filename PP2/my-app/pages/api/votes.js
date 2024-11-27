import prisma from '@/utils/db';
import { authenticateUser } from '@/middleware/auth';

export default async function handler(req, res) {
  const user = await authenticateUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id, type, itemType } = req.body; // id: item ID, type: 'upvote' or 'downvote', itemType: 'blogPost' or 'comment'

  if (!['upvote', 'downvote'].includes(type) || !['blogPost', 'comment'].includes(itemType)) {
    return res.status(400).json({ message: 'Invalid type or itemType' });
  }

  try {
    // Check if the vote already exists
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId: user.id,
        blogPostId: itemType === 'blogPost' ? id : null,
        commentId: itemType === 'comment' ? id : null,
      },
    });

    if (existingVote) {
      // Prevent simultaneous upvote and downvote
      if (existingVote.type === type) {
        // Remove vote (toggle off)
        await prisma.vote.delete({ where: { id: existingVote.id } });
        await updateCounters(id, itemType, type, 'remove');
        return res.status(200).json({ message: `${type} removed` });
      } else {
        // Switch vote type
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type },
        });
        await updateCounters(id, itemType, type, 'switch', existingVote.type);
        return res.status(200).json({ message: `Vote switched to ${type}` });
      }
    }

    // Create a new vote
    await prisma.vote.create({
      data: {
        type,
        userId: user.id,
        blogPostId: itemType === 'blogPost' ? id : null,
        commentId: itemType === 'comment' ? id : null,
      },
    });

    await updateCounters(id, itemType, type, 'add');
    return res.status(201).json({ message: `Voted ${type}` });
  } catch (error) {
    console.error('Error processing vote:', error);
    res.status(500).json({ message: 'Failed to process vote' });
  }
}

// Helper function to update vote counters
async function updateCounters(id, itemType, type, action, prevType = null) {
  const incrementField = type === 'upvote' ? 'upvotes' : 'downvotes';
  const decrementField = prevType === 'upvote' ? 'upvotes' : 'downvotes';

  const data = {};

  if (action === 'add') {
    data[incrementField] = { increment: 1 };
  } else if (action === 'remove') {
    data[incrementField] = { decrement: 1 };
  } else if (action === 'switch') {
    data[incrementField] = { increment: 1 };
    data[decrementField] = { decrement: 1 };
  }

  const model = itemType === 'blogPost' ? prisma.blogPost : prisma.comment;

  await model.update({
    where: { id },
    data,
  });
}
