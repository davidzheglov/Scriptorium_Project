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

    let voteChange = 0;

    if (existingVote) {
      // If the existing vote type is the same, remove it to "toggle off" the vote
      if (existingVote.type === type) {
        await prisma.vote.delete({ where: { id: existingVote.id } });

        voteChange = type === 'upvote' ? -1 : 1; // Decrement counter for the removed vote
        await updateCounters(id, itemType, voteChange, type);
        return res.status(200).json({ message: `${type} removed` });
      }

      // Otherwise, update the vote type to the new type
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { type },
      });

      voteChange = type === 'upvote' ? 1 : -1; // Increase new vote, decrease previous vote
      await updateCounters(id, itemType, voteChange, type);
      return res.status(200).json({ message: `Vote changed to ${type}` });
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

    voteChange = type === 'upvote' ? 1 : -1;
    await updateCounters(id, itemType, voteChange, type);

    return res.status(201).json({ message: `Voted ${type}` });
  } catch (error) {
    console.error("Error processing vote:", error);
    res.status(500).json({ message: 'Failed to process vote' });
  }
}

// Helper function to update vote counters
async function updateCounters(id, itemType, voteChange, type) {
  const updateData = type === 'upvote' 
    ? { upvotes: { increment: voteChange } }
    : { downvotes: { increment: voteChange } };

  if (itemType === 'blogPost') {
    await prisma.blogPost.update({
      where: { id },
      data: updateData,
    });
  } else if (itemType === 'comment') {
    await prisma.comment.update({
      where: { id },
      data: updateData,
    });
  }
}