import prisma from '@/utils/db';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { query } = req.query;

    if (typeof query !== 'string') {
        return res.status(400).json({ message: 'Invalid query parameter' });
    }

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