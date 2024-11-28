import { exec } from 'child_process';
import fs from 'fs/promises';
import { NextApiRequest, NextApiResponse } from 'next';

const dockerImages: Record<string, string> = {
    python: 'sandbox-python:3.10',
    java: 'sandbox-java:17',
    javascript: 'sandbox-node:18',
    c: 'sandbox-c:latest',
    cpp: 'sandbox-cpp:latest',
    go: 'sandbox-go:1.20',
    ruby: 'sandbox-ruby:3.2',
    php: 'sandbox-php:8.2',
    rust: 'sandbox-rust:1.73',
    kotlin: 'sandbox-kotlin:latest',
    dart: 'sandbox-dart:stable',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { language, code, stdin }: { language?: string; code?: string; stdin?: string } = req.body;

    if (!language || !code) {
        return res.status(400).json({ error: 'Language and code are required.' });
    }

    const image = dockerImages[language];
    if (!image) {
        return res.status(400).json({ error: 'Unsupported language.' });
    }

    try {
        // Save the code to a temporary file
        const fileExtension: Record<string, string> = {
            python: '.py',
            java: '.java',
            javascript: '.js',
            c: '.c',
            cpp: '.cpp',
            go: '.go',
            ruby: '.rb',
            php: '.php',
            rust: '.rs',
            kotlin: '.kt',
            dart: '.dart', // Dart file extension
        };

        const filePath = `/tmp/${Date.now()}${fileExtension[language]}`;
        await fs.writeFile(filePath, code);

        // Fix permissions for non-root user inside the Docker container
        await fs.chmod(filePath, 0o755); // Ensure the code is executable if necessary

        // Run the Docker container and pipe stdin
        const command = `echo "${stdin || ''}" | docker run --rm -i -v ${filePath}:/usr/src/app/sandbox${fileExtension[language]} ${image}`;

        const output = await new Promise<string>((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                fs.unlink(filePath).catch((err) => console.error("Failed to delete temp file:", err)); // Clean up the temp file
                if (error) {
                    // Log the error details
                    console.error("Execution Error:", stderr || error.message);
                    return reject({ message: stderr || error.message, stack: error.stack });
                }
                resolve(stdout.trim());
            });
        });

        res.status(200).json({ output });
    } catch (error: unknown) {
        // Log detailed error
        console.error("Execution failed:", error);
        res.status(500).json({ error: `Execution failed: ${(error as Error).message}` });
    }
}




