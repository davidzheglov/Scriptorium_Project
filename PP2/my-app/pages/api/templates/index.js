import prisma from '@/utils/db';
import { authenticateUser } from '@/middleware/auth';

export default async function handler(req, res) {
    console.log('Request Method:', req.method); // Log the method
    console.log('Request Path:', req.url);     // Log the request path
    console.log('Headers:', req.headers);     // Log headers for debugging

    if (req.method === 'POST') {
        const user = await authenticateUser(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const { title, code, explanation, tags } = req.body;

        try {
            const newTemplate = await prisma.template.create({
                data: {
                    title,
                    code,
                    explanation,
                    user: { connect: { id: user.id } },
                    tags: {
                        connectOrCreate: tags.map((tag) => ({
                            where: { name: tag },
                            create: { name: tag },
                        })),
                    },
                },
            });
            return res.status(201).json(newTemplate);
        } catch (error) {
            console.error('Error creating template:', error);
            return res.status(500).json({ message: 'Error creating template', error });
        }
    } else if (req.method === 'GET') {
        const user = await authenticateUser(req);
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        try {
            const templates = await prisma.template.findMany({
                where: { userId: user.id },
                include: { tags: true },
            });
            return res.status(200).json(templates);
        } catch (error) {
            console.error('Error retrieving templates:', error);
            return res.status(500).json({ message: 'Error retrieving templates', error });
        }
    } else {
        console.log('Unsupported Method:', req.method); // Debugging unsupported method
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}



