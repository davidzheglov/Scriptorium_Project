import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/utils/db';
import { authenticateUser } from '@/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const user = await authenticateUser(req);

  switch (req.method) {
    case 'POST':
      return handleCreateBlogPost(req, res, user);
    case 'GET':
      return handleGetBlogPosts(req, res);
    default:
      res.setHeader('Allow', ['POST', 'GET']);
      return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

// Create a new blog post
async function handleCreateBlogPost(
  req: NextApiRequest,
  res: NextApiResponse,
  user: { id: number } | null
): Promise<void> {
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { title, description, tags, templateIds }: { title: string; description: string; tags: string[]; templateIds: number[] } = req.body;

  try {
    const blogPost = await prisma.blogPost.create({
      data: {
        title,
        description,
        userId: user.id,
        tags: {
          connectOrCreate: tags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
        templates: {
          connect: templateIds.map((id) => ({ id })),
        },
      },
    });

    return res.status(201).json({ message: 'Blog post created successfully', blogPost });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

// Retrieve blog posts with pagination, search, and sort
async function handleGetBlogPosts(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { page = 1, limit = 10, search = '', sort = 'date' }: { page?: number; limit?: number; search?: string; sort?: string } = req.query as any;
  const skip = (parseInt(page as unknown as string) - 1) * parseInt(limit as unknown as string);

  try {
    // Get the total count of blog posts matching the search criteria
    const totalCount = await prisma.blogPost.count({
      where: {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { tags: { some: { name: { contains: search } } } },
        ],
      },
    });

    // Fetch the paginated blog posts
    const blogPosts = await prisma.blogPost.findMany({
      where: {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { tags: { some: { name: { contains: search } } } },
        ],
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        tags: true,
        templates: true,
        reports: { select: { reason: true, createdAt: true } },
      },
      skip,
      take: parseInt(limit as unknown as string),
      orderBy: { createdAt: 'desc' },
    });

    if (sort === 'rating') {
      blogPosts.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    }

    // Return the blog posts along with the total count
    res.status(200).json({ blogPosts, totalCount });
  } catch (error) {
    console.error('Error retrieving blog posts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
