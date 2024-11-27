import prisma from '@/utils/db';
import { authenticateUser } from '@/middleware/auth';

export default async function handler(req, res) {
  const user = await authenticateUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { page = 1, limit = 10, search = '', sort = 'date' } = req.query;
  const skip = (page - 1) * limit;

  try {
    const comments = await prisma.comment.findMany({
      where: {
        content: {
          contains: search,
        },
      },
      include: {
        user: { select: { firstName: true, lastName: true, avatar: true } },
        votes: { where: { userId: user.id } }, // Get votes by the current user
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: sort === 'date' ? { createdAt: 'desc' } : undefined,
    });

    // Sort by rating if `sort` is set to 'rating'
    if (sort === 'rating') {
      comments.sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));
    }

    // Map userVote into the comment objects
    const commentsWithUserVote = comments.map((comment) => {
      const userVote = comment.votes.length > 0 ? comment.votes[0].type : null;
      return {
        ...comment,
        userVote, // Add the user's vote type to each comment
      };
    });

    res.status(200).json(commentsWithUserVote);
  } catch (error) {
    console.error('Error retrieving comments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
























// import prisma from '@/utils/db';
// import { authenticateUser } from '@/middleware/auth';

// export default async function handler(req, res) {
//   const user = await authenticateUser(req);
//   if (!user) return res.status(401).json({ error: "Unauthorized" });
//   if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

//   const { page = 1, limit = 10, search = '', sort = 'date' } = req.query;
//   const skip = (page - 1) * limit;

//   try {
//     const comments = await prisma.comment.findMany({
//       where: {
//         content: {
//           contains: search,
//         },
//       },
//       include: {
//         user: { select: { firstName: true, lastName: true, avatar: true } },
//       },
//       skip: parseInt(skip),
//       take: parseInt(limit),
//       orderBy: sort === 'date' ? { createdAt: 'desc' } : undefined,
//     });

//     // Sort by rating if `sort` is set to 'rating'
//     if (sort === 'rating') {
//       comments.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
//     }

//     res.status(200).json(comments);
//   } catch (error) {
//     console.error("Error retrieving comments:", error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }