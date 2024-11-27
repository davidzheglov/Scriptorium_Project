import { useState, useEffect, ChangeEvent } from 'react';
import {black} from "next/dist/lib/picocolors";

interface Tag {
    id: number;
    name: string;
}

interface Template {
    id: number;
    title: string;
    explanation: string;
    tags: Tag[];
}

const TemplatesPage = () => {
    const [templates, setTemplates] = useState<Template[]>([
        {
            id: 1,
            title: 'Sorting Algorithm',
            explanation: 'This template demonstrates different sorting algorithms in JavaScript.',
            tags: [{ id: 1, name: 'JavaScript' }, { id: 2, name: 'Algorithm' }],
        },
        {
            id: 2,
            title: 'React Component Lifecycle',
            explanation: 'A template showing the React component lifecycle methods and hooks.',
            tags: [{ id: 3, name: 'React' }, { id: 4, name: 'Component' }],
        },
        {
            id: 3,
            title: 'SQL Database Querying',
            explanation: 'A template to help query SQL databases using complex joins.',
            tags: [{ id: 5, name: 'SQL' }, { id: 6, name: 'Database' }],
        },
        {
            id: 4,
            title: 'CSS Flexbox Layout',
            explanation: 'A template showcasing CSS Flexbox for responsive layouts.',
            tags: [{ id: 7, name: 'CSS' }, { id: 8, name: 'Flexbox' }],
        },

    ]);

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filteredTemplates, setFilteredTemplates] = useState<Template[]>(templates);

    useEffect(() => {
        // Filter templates based on search query
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
                        <h2 style={{color: 'black'}}>{template.title}</h2>
                        <p style={{color: 'black'}}>{template.explanation}</p>
                        <div className="tags">
                            {template.tags.map((tag) => (
                                <span key={tag.id} className="tag">{tag.name}</span>
                            ))}
                        </div>
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
      `}</style>
        </div>
    );
};

export default TemplatesPage;
