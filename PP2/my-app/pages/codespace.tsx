import React, { useState } from 'react';
import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { req } = context;
    const cookies = req.cookies;

    // Extract the JWT token from cookies
    const token = cookies.token || null;

    return {
        props: {
            token,
        },
    };
};

interface CodeEditorProps {
    token: string | null; // Add the token as a prop
}

const CodeEditor: React.FC<CodeEditorProps> = ({ token }) => {
    const [code, setCode] = useState<string>('# Write your code here');
    const [output, setOutput] = useState<string>('');
    const [language, setLanguage] = useState<string>('python');
    const [stdin, setStdin] = useState<string>('');
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showSavePopup, setShowSavePopup] = useState<boolean>(false);
    const [templateTitle, setTemplateTitle] = useState<string>('');
    const [templateExplanation, setTemplateExplanation] = useState<string>('');
    const [templateTags, setTemplateTags] = useState<string>('');

    const languages: string[] = [
        'python', 'javascript', 'java', 'c', 'cpp',
        'go', 'ruby', 'php', 'rust', 'kotlin', 'dart',
    ];

    const runCode = async () => {
        setIsLoading(true);
        setOutput('');

        try {
            const response = await fetch('/api/code/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language,
                    code,
                    stdin,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setOutput(data.output || 'No output');
            } else {
                setOutput(`Error: ${data.error}`);
            }
        } catch (error: any) {
            setOutput(`Network Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const saveTemplate = async () => {
        console.log('Token:', token); // Log the token

        const tagsArray = templateTags.split(',').map(tag => tag.trim());
        const templateData = {
            title: templateTitle,
            explanation: templateExplanation,
            tags: tagsArray,
            code,
        };

        try {
            const response = await fetch('/api/templates/index', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '', // Ensure token is not undefined
                },
                body: JSON.stringify(templateData),
            });

            console.log('Response status:', response.status); // Log response status

            if (response.ok) {
                alert('Template saved successfully!');
                setShowSavePopup(false);
            } else {
                const errorData = await response.text(); // Use text() instead of json() to see raw error
                console.error('Error response:', errorData);
                alert(`Failed to save template: ${errorData || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving template:', error);
        }
    };


    return (
        <div className={`flex h-screen w-screen ${theme === 'light' ? 'bg-white text-black border border-gray-200' : 'bg-gray-900 text-white border border-gray-700'}`}>
            {/* Left Side: Code Editor */}
            <div className="w-2/3 h-full p-4 border-r">
                <div className="flex justify-between items-center mb-4">
                    {/* Language Selector */}
                    <select
                        value={language}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLanguage(e.target.value)}
                        className={`p-2 rounded ${theme === 'light' ? 'bg-gray-100 text-black' : 'bg-gray-800 text-white'}`}
                    >
                        {languages.map(lang => (
                            <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                        ))}
                    </select>

                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                        className={`p-2 rounded ${theme === 'light' ? 'bg-gray-200 text-black' : 'bg-gray-700 text-white'}`}
                    >
                        {theme === 'light' ? '🌙' : '☀️'}
                    </button>

                    {/* Save Code as Template Button */}
                    <button
                        onClick={() => setShowSavePopup(true)}
                        className={`p-2 rounded ${theme === 'light' ? 'bg-gray-200 text-black' : 'bg-gray-700 text-white'}`}
                    >
                        Save Code as Template
                    </button>
                </div>

                {/* Code Input */}
                <textarea
                    value={code}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCode(e.target.value)}
                    className={`w-full h-3/5 p-4 rounded ${theme === 'light' ? 'bg-gray-50 text-black' : 'bg-gray-800 text-white'}`}
                    placeholder="Write your code here..."
                />

                {/* Stdin Input */}
                <input
                    type="text"
                    value={stdin}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStdin(e.target.value)}
                    placeholder="Standard Input (optional)"
                    className={`w-full p-2 mt-2 rounded ${theme === 'light' ? 'bg-gray-100 text-black' : 'bg-gray-800 text-white'}`}
                />

                {/* Run Button */}
                <button
                    onClick={runCode}
                    disabled={isLoading}
                    className={`mt-2 p-2 rounded flex items-center justify-center w-full 
                    ${isLoading ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                >
                    {isLoading ? 'Running...' : 'Run Code'}
                </button>
            </div>

            {/* Right Side: Terminal/Output */}
            <div className={`flex-none w-1/3 h-full p-4 ${theme === 'light'
                ? 'bg-gray-100'
                : 'bg-gray-800'}`}>
                <h3 className="font-bold">Output</h3>
                <pre className={`w-full h-full overflow-auto p-2 rounded ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-green-400'}`}>
                    {output || 'Output will be displayed here...'}
                </pre>
            </div>

            {/* Save Template Pop-up */}
            {showSavePopup && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-50">
                    <div className="bg-white p-6 rounded shadow-lg max-w-md mx-auto">
                        <h2 className="mb-4 text-xl font-bold">Save Template</h2>
                        <input
                            type="text"
                            placeholder="Title"
                            value={templateTitle}
                            onChange={(e) => setTemplateTitle(e.target.value)}
                            className="w-full p-2 mb-2 border rounded"
                        />
                        <textarea
                            placeholder="Explanation"
                            value={templateExplanation}
                            onChange={(e) => setTemplateExplanation(e.target.value)}
                            className="w-full p-2 mb-2 border rounded"
                        />
                        <input
                            type="text"
                            placeholder="Tags (comma-separated)"
                            value={templateTags}
                            onChange={(e) => setTemplateTags(e.target.value)}
                            className="w-full p-2 mb-4 border rounded"
                        />
                        <button
                            onClick={saveTemplate}
                            className="p-2 bg-blue-500 text-white rounded mr-2"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setShowSavePopup(false)}
                            className="p-2 bg-gray-300 text-black rounded"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CodeEditor;
