import { useState, useEffect, ChangeEvent } from 'react';
import { useRouter } from 'next/router';

interface Tag {
    id: number;
    name: string;
}

interface Template {
    id: number;
    title: string;
    explanation: string;
    tags: Tag[];
    code: string; // Added code field to the Template interface
}

const TemplatesPage = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
    const router = useRouter(); // For navigation

    // Fetch templates from API on mount
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await fetch('/api/templates/visitor_get');
                if (response.ok) {
                    const data = await response.json();
                    setTemplates(data); // Set the templates from the API response
                } else {
                    console.error('Failed to fetch templates');
                }
            } catch (error) {
                console.error('Error fetching templates:', error);
            }
        };

        fetchTemplates();
    }, []);

    // Filter templates based on search query
    useEffect(() => {
        if (searchQuery) {
            setFilteredTemplates(
                templates.filter((template) => {
                    return (
                        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        template.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        template.tags.some((tag) => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    );
                })
            );
        } else {
            setFilteredTemplates(templates);
        }
    }, [searchQuery, templates]);

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleEditClick = (templateId: number, code: string) => {
        // Navigate to the code editor page with the template code
        router.push(`/codespace?templateId=${templateId}&code=${encodeURIComponent(code)}`);
    };


    return (
        <div className="container">
            <h1>Your Saved Templates</h1>

            <input
                type="text"
                color={"black"}
                placeholder="Search by title, explanation, or tags..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-bar"
            />

            <div className="templates-list">
                {filteredTemplates.map((template) => (
                    <div key={template.id} className="template-card">
                        <h2 style={{ color: 'black' }}>{template.title}</h2>
                        <p style={{ color: 'black' }}>{template.explanation}</p>
                        <div className="tags">
                            {template.tags.map((tag) => (
                                <span key={tag.id} className="tag">{tag.name}</span>
                            ))}
                        </div>
                        <button
                            onClick={() => handleEditClick(template.id, template.code)} // Trigger edit action
                            className="edit-button"
                        >
                            Edit
                        </button>
                    </div>
                ))}
            </div>

            <style jsx>{`
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .search-bar {
                    width: 100%;
                    padding: 10px;
                    margin-bottom: 20px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    color: #0a0a0a;
                }

                .templates-list {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .template-card {
                    padding: 15px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    background-color: #f9f9f9;
                }

                .tags {
                    margin-top: 10px;
                }

                .tag {
                    display: inline-block;
                    padding: 5px 10px;
                    margin-right: 8px;
                    background-color: #e0e0e0;
                    border-radius: 3px;
                    font-size: 12px;
                }

                .edit-button {
                    margin-top: 10px;
                    padding: 8px 16px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                }

                .edit-button:hover {
                    background-color: #0056b3;
                }
            `}</style>
        </div>
    );
};

export default TemplatesPage;
