import prisma from '@/utils/db';
import { authenticateUser } from '@/middleware/auth';

export default async function handler(req, res) {
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
async function handleCreateBlogPost(req, res, user) {
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { title, description, tags, templateIds } = req.body;

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
    console.error("Error creating blog post:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleGetBlogPosts(req, res) {
  const { page = 1, limit = 10, search = '', sort = 'date' } = req.query;
  const skip = (page - 1) * limit;

  try {
    const blogPosts = await prisma.blogPost.findMany({
      where: {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
          { tags: { some: { name: { contains: search } } } },
        ],
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } }, // Include user details
        tags: true, // Include tags
        templates: true, // Include templates
        reports: { select: { reason: true, createdAt: true } }, // Include reports
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    if (sort === 'rating') {
      blogPosts.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
    }

    res.status(200).json(blogPosts);
  } catch (error) {
    console.error("Error retrieving blog posts:", error);
    res.status(500).json({ message: 'Internal server error' });
  }
}