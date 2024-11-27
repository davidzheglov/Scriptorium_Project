import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';

interface BlogPost {
  id: number;
  title: string;
  description: string;
  tags: { name: string }[];
  user?: { firstName: string; lastName: string; avatar: string };
  createdAt: string;
  upvotes: number;
  downvotes: number;
}

interface BlogPostsPageProps {
  token: string | null; // Token passed from server-side
}

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



export default function BlogPostsPage({ token }: BlogPostsPageProps) {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const fetchBlogPosts = async (page: number) => {
    setLoading(true);
    try {
      // if (!token) {
      //   throw new Error('Authentication token is missing');
      // }

      console.log('Fetching blog posts with token:', token); // Debug statement

      const res = await fetch(`/api/blogs?page=${page}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch blog posts');
      }

      const data = await res.json();
      console.log('Fetched blog posts data:', data); // Debugging fetched data

      setBlogPosts(data); // Set the fetched array directly
      setTotalPages(1); // Update the totalPages if needed (default to 1 if not paginated)
    } catch (err: any) {
      console.error('Error fetching blog posts:', err.message); // Debugging errors
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = () => {
    router.push('createblogposts'); // Redirect to a create post page
  };

  useEffect(() => {
    fetchBlogPosts(currentPage);
  }, [currentPage]);

  // Debugging state updates
  useEffect(() => {
    console.log('Updated blogPosts state:', blogPosts);
  }, [blogPosts]);


  const handleUpvote = async (postId: number) => {
    try {
      await fetch(`/api/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: postId, type: 'upvote', itemType: 'blogPost' }),
      });
      fetchBlogPosts(currentPage); // Refresh the posts after voting
    } catch (error) {
      console.error('Upvote failed:', error);
    }
  };
  
  const handleDownvote = async (postId: number) => {
    try {
      await fetch(`/api/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: postId, type: 'downvote', itemType: 'blogPost' }),
      });
      fetchBlogPosts(currentPage); // Refresh the posts after voting
    } catch (error) {
      console.error('Downvote failed:', error);
    }
  };


  // const handleEdit = (postId: number) => {
  //   router.push(`/blogposts/${postId}`);
  // };

  const handleDelete = async (postId: number) => {
    try {
      await fetch(`/api/blogs/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      fetchBlogPosts(currentPage);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Blog Posts</h1>
        <button
          onClick={handleCreatePost}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Create New Post
        </button>
      </header>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : blogPosts.length > 0 ? (
        <div className="space-y-4">
          {blogPosts.map((post) => (
            <div key={post.id} className="p-4 border rounded-lg hover:shadow-md">
              <div className="flex items-center space-x-4">
                <img
                  src={post.user?.avatar || '/default-avatar.png'}
                  alt={`${post.user?.firstName || 'Unknown'}'s avatar`}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h2
                    className="text-xl font-semibold cursor-pointer"
                    onClick={() => router.push(`/blogposts/${post.id}`)}
                  >
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    By {post.user?.firstName || 'Unknown'} {post.user?.lastName || ''} on{' '}
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  
                    <button onClick={() => handleDelete(post.id)}>🗑️</button>
                </div>
              </div>
              <p className="mt-2">{post.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <button onClick={() => handleUpvote(post.id)}>👍 {post.upvotes}</button>
                <button onClick={() => handleDownvote(post.id)}>👎 {post.downvotes}</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No blog posts available.</p>
      )}

      <footer className="mt-6 flex justify-between items-center">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-gray-300 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </footer>
    </div>
  );
}