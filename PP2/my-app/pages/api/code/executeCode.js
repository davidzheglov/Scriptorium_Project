import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export default async function handler(req, res) {
    const { code, language, input } = req.body;

    console.log("Request received:", { code, language, input });

    try {
        const result = await executeCode(code, language, input);
        res.status(200).json({ output: result });
    } catch (error) {
        console.error("Execution error:", error);
        res.status(500).json({
            error: {
                message: error.message,
                details: error.details,
                language,
                input
            }
        });
    }
}

function executeCode(code, language, input) {
    return new Promise((resolve, reject) => {
        const fileName = language === 'java'
            ? '/tmp/HelloWorld'
            : path.join('/tmp', `code-${Date.now()}`);

        const fileExtension = getFileExtension(language);
        fs.writeFileSync(`${fileName}.${fileExtension}`, code);

        let command;
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
                reject({ message: 'Unsupported language', details: 'The provided language is not supported.' });
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

function getFileExtension(language) {
    switch (language) {
        case 'c': return 'c';
        case 'cpp': return 'cpp';
        case 'java': return 'java';
        case 'python': return 'py';
        case 'javascript': return 'js';
        default: return '';
    }
}

function cleanUpTempFiles(fileName, language) {
    const extension = getFileExtension(language);
    try {
        fs.unlinkSync(`${fileName}.${extension}`);
        if (language === 'c' || language === 'cpp') {
            fs.unlinkSync(fileName);
        } else if (language === 'java') {
            fs.unlinkSync(`/tmp/HelloWorld.class`);
        }
    } catch (err) {
        console.error("Error cleaning up temp files:", err);
    }
}






