import prisma from '@/utils/db';
import { authenticateUser } from '@/middleware/auth';

export default async function handler(req, res) {
    const { query } = req.query;

    try {
        const templates = await prisma.template.findMany({
            where: {
                OR: [
                    { title: { contains: query } },
                    { explanation: { contains: query } },
                    { code: { contains: query } },
                    { tags: { some: { name: { contains: query } } } },
                ],
            },
            include: { tags: true },
        });
        res.status(200).json(templates);
    } catch (error) {
        console.error("Search Error:", error); 
        res.status(500).json({ message: 'Error searching templates', error });
    }
}