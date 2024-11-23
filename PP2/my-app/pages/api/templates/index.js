import prisma from '@/utils/db';
import { authenticateUser } from '@/middleware/auth';



export default async function handler(req, res) {
    if (req.method === 'POST') {
        const user = await authenticateUser(req);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        const { title, code, explanation, tags } = req.body;

        try {
            const newTemplate = await prisma.template.create({
                data: {
                    title,
                    code,
                    explanation,
                    user: { connect: { id: user.id } },
                    tags: {
                        connectOrCreate: tags.map(tag => ({
                            where: {name: tag},
                            create: {name: tag}
                        })),
                    },
                },
            });
            res.status(201).json(newTemplate);
        } catch (error) {
            res.status(500).json({ message: "Error creating template", error });
        }
    } else if (req.method === 'GET') {
        const user = await authenticateUser(req);
        if (!user) return res.status(401).json({ message: "Unauthorized" });

        try {
            const templates = await prisma.template.findMany({
                where: { userId: user.id },
                include: { tags: true },
            });
            res.status(200).json(templates);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving templates", error });
        }
    }
    else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end('Method ${req.method} Not allowed')
    }
}
