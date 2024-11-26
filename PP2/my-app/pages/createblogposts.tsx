import { useState } from 'react';
import { useRouter } from 'next/router';
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

export default function CreateBlogPost({ token }: { token: string | null }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    templateIds: '', 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('You are not authenticated. Please log in.');
      return;
    }

  const parsedTemplateIds = formData.templateIds
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id)
    .map(Number); 

  if (parsedTemplateIds.some((id) => isNaN(id))) {
      setError('Template IDs must be valid numbers.');
        return;
  }

  if (parsedTemplateIds.length === 0) {
      setError('Template IDs are required.');
      return;
  }


    setLoading(true);
    setError('');

    // Debugging the form data before the request
    console.log('Submitting Blog Post:');
    console.log('Title:', formData.title);
    console.log('Description:', formData.description);
    console.log('Tags:', formData.tags);
    console.log('Template IDs:', parsedTemplateIds);

    try {
      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          tags: (formData.tags || '').split(',').map((tag) => tag.trim()),
          templateIds: parsedTemplateIds, 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating blog post:', errorData);
        throw new Error(errorData.message || 'Failed to create blog post');
      }

      console.log('Blog post created successfully!');
      router.push('/blogposts'); 
    } catch (err: any) {
      console.error('Error:', err.message); 
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Create a New Blog Post</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Section */}
        <div>
          <label className="block text-lg font-semibold text-gray-700">Post Title</label>
          <p className="text-sm text-gray-500 mb-2">
            This is the title of your blog post.
          </p>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-500 text-black"
            placeholder="Enter your post title"
            required
          />
        </div>

        {/* Description Section */}
        <div>
          <label className="block text-lg font-semibold text-gray-700">Description</label>
          <p className="text-sm text-gray-500 mb-2">
            Write a brief description or summary for your blog post.
          </p>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-500 text-black"
            rows={5}
            placeholder="Write a brief description of your post"
            required
          ></textarea>
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-700">Tags</label>
          <p className="text-sm text-gray-500 mb-2">
            Add relevant tags separated by commas (e.g., technology, coding, web development).
          </p>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-500 text-black"
            placeholder="e.g., technology, coding, web development"
          />
        </div>

        {/* Template IDs Section */}
        <div>
          <label className="block text-lg font-semibold text-gray-700">Template IDs</label>
          <p className="text-sm text-gray-500 mb-2">
            Enter the template IDs associated with this post, separated by commas (e.g., 1, 2, 3).
          </p>
          <input
            type="text"
            name="templateIds"
            value={formData.templateIds}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:ring focus:ring-blue-500 text-black"
            placeholder="e.g., 1, 2, 3"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
}