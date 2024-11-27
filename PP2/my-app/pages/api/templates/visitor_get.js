import prisma from '@/utils/db';



export default async function handler(req, res) {
    if (req.method === 'GET') {


        try {
            const templates = await prisma.template.findMany({
                include: { tags: true },
            });
            res.status(200).json(templates);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving templates", error });
        }
    }
    else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end('Method ${req.method} Not allowed')
    }
}
