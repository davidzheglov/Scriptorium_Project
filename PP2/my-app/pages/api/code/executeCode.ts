import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

interface RequestBody {
    code: string;
    language: string;
    input: string;
}

interface ErrorDetails {
    message: string;
    details: string;
    language?: string;
    input?: string;
}

export default async function handler(req: any, res: any): Promise<void> {
    const { code, language, input }: RequestBody = req.body;

    console.log("Request received:", { code, language, input });

    try {
        const result = await executeCode(code, language, input);
        res.status(200).json({ output: result });
    } catch (error: any) {
        console.error("Execution error:", error);
        res.status(500).json({
            error: {
                message: error.message,
                details: error.details,
                language,
                input,
            },
        });
    }
}

function executeCode(code: string, language: string, input: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const fileName = language === 'java'
            ? '/tmp/HelloWorld'
            : path.join('/tmp', `code-${Date.now()}`);

        const fileExtension = getFileExtension(language);
        if (!fileExtension) {
            reject({
                message: 'Unsupported language',
                details: 'The provided language is not supported.',
            });
            return;
        }

        fs.writeFileSync(`${fileName}.${fileExtension}`, code);

        let command: string;
        switch (language) {
            case 'c':
                command = `gcc ${fileName}.c -o ${fileName} && echo "${input}" | ${fileName}`;
                break;
            case 'cpp':
                command = `g++ ${fileName}.cpp -o ${fileName} && echo "${input}" | ${fileName}`;
                break;
            case 'java':
                command = `javac ${fileName}.java && echo "${input}" | java -cp /tmp HelloWorld`;
                break;
            case 'python':
                command = `echo "${input}" | python3 ${fileName}.py`;
                break;
            case 'javascript':
                command = `echo "${input}" | node ${fileName}.js`;
                break;
            default:
                reject({
                    message: 'Unsupported language',
                    details: 'The provided language is not supported.',
                });
                return;
        }

        exec(command, { timeout: 5000, maxBuffer: 1024 * 50 }, (error, stdout, stderr) => {
            cleanUpTempFiles(fileName, language);

            if (stderr) {
                console.error("stderr:", stderr);
                reject({ message: 'Compile Error', details: stderr });
                return;
            }

            if (error) {
                console.error("exec error:", error);
                reject({ message: 'Runtime Error', details: error.message || stderr });
                return;
            }

            resolve(stdout);
        });
    });
}

function getFileExtension(language: string): string {
    switch (language) {
        case 'c':
            return 'c';
        case 'cpp':
            return 'cpp';
        case 'java':
            return 'java';
        case 'python':
            return 'py';
        case 'javascript':
            return 'js';
        default:
            return '';
    }
}

function cleanUpTempFiles(fileName: string, language: string): void {
    const extension = getFileExtension(language);
    try {
        if (extension) {
            fs.unlinkSync(`${fileName}.${extension}`);
        }
        if (language === 'c' || language === 'cpp') {
            fs.unlinkSync(fileName);
        } else if (language === 'java') {
            fs.unlinkSync(`/tmp/HelloWorld.class`);
        }
    } catch (err) {
        console.error("Error cleaning up temp files:", err);
    }
}







