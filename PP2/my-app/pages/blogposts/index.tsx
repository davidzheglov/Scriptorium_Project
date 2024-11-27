import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';

interface BlogPost {
  id: number;
  title: string;
  description: string;
  tags: { name: string }[];
  user: { id: number; firstName: string; lastName: string; avatar: string };
  createdAt: string;
  upvotes: number;
  downvotes: number;
  hidden: boolean;
  reports: { reason: string; createdAt: string }[];
}

interface BlogPostsPageProps {
  token: string | null;
  userId: number;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const cookies = req.cookies;

  const token = cookies.token || null;

  const jwt = require('jsonwebtoken');
  const SECRET_KEY = process.env.JWT_SECRET || 'default_secret_key';
  let userId = null;

  if (token) {
    try {
      const decodedToken = jwt.verify(token, SECRET_KEY) as { userId: number };
      userId = decodedToken.userId;
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  return {
    props: {
      token,
      userId,
    },
  };
};

export default function BlogPostsPage({ token, userId }: BlogPostsPageProps) {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const [sortOrder, setSortOrder] = useState<'date' | 'rating'>('date'); // State for sort order
  const router = useRouter();

  const fetchBlogPosts = async (page: number) => {
    setLoading(true);
    try {
      console.log('Fetching blog posts with token:', token);

      const res = await fetch(
        `/api/blogs?page=${page}&limit=10&search=${encodeURIComponent(searchQuery)}&sort=${sortOrder}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch blog posts');
      }

      // Updated to include totalCount from backend
      const { blogPosts: posts, totalCount } = await res.json();

      const visiblePosts = posts.filter(
        (post: BlogPost) => !post.hidden || (post.user.id === userId && post.hidden)
      );

      console.log('Visible posts:', visiblePosts);

      setBlogPosts(visiblePosts);
      setTotalPages(Math.ceil(totalCount / 10)); // Calculate total pages dynamically
    } catch (err: any) {
      console.error('Error fetching blog posts:', err.message);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogPosts(currentPage);
  }, [currentPage, searchQuery, sortOrder]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to the first page when a new search is initiated
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as 'date' | 'rating');
    setCurrentPage(1); // Reset to the first page when the sort order changes
  };


  const handleCreatePost = () => {
    router.push('createblogposts');
  };

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
      fetchBlogPosts(currentPage);
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
      fetchBlogPosts(currentPage);
    } catch (error) {
      console.error('Downvote failed:', error);
    }
  };

  useEffect(() => {
    console.log('Current User ID:', userId);
    fetchBlogPosts(currentPage);
  }, [currentPage]);

  return (
    
    <div className="max-w-4xl mx-auto p-6">
      <div className="max-w-4xl mx-auto p-6">
      {/* Search and Sort Bar */}
        <input
          type="text"
          placeholder="Search blog posts..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full max-w-md p-2 border rounded bg-gray-100 text-black"
        />
        <select
          value={sortOrder}
          onChange={handleSortChange}
          className="ml-4 p-2 border rounded bg-white text-black"
        >
          <option value="date">Sort by Date</option>
          <option value="rating">Sort by Rating</option>
        </select>
      </div>

      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Blog Posts</h1>
        <button
          onClick={handleCreatePost}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create New Post
        </button>
      </header>

      {loading ? (
        <p className="text-white">Loading...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : blogPosts.length > 0 ? (
        <div className="space-y-4">
          {blogPosts.map((post) => (
            <div
              key={post.id}
              className={`p-4 border rounded-lg ${
                post.hidden ? 'bg-gray-800' : 'bg-gray-900'
              } hover:shadow-md`}
            >
              <div className="flex items-center space-x-4">
                <img
                  src={post.user?.avatar || '/default-avatar.png'}
                  alt={`${post.user?.firstName || 'Unknown'}'s avatar`}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h2
                    className="text-xl font-semibold cursor-pointer text-white"
                    onClick={() => router.push(`/blogposts/${post.id}`)}
                  >
                    {post.title}
                  </h2>
                  <p className="text-sm text-gray-400">
                    By {post.user?.firstName || 'Unknown'} {post.user?.lastName || ''} on{' '}
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  {post.hidden && post.user.id === userId && (
                    <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-500">
                      <p className="text-red-600 font-semibold mb-2">
                        This post is hidden. Reports:
                      </p>
                      <ul className="list-disc ml-4 text-gray-700">
                        {post.reports.map((report, index) => (
                          <li key={index}>{report.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-2 text-white">{post.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <button
                  onClick={() => handleUpvote(post.id)}
                  disabled={post.hidden && post.user.id !== userId}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                >
                  👍 {post.upvotes}
                </button>
                <button
                  onClick={() => handleDownvote(post.id)}
                  disabled={post.hidden && post.user.id !== userId}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                >
                  👎 {post.downvotes}
                </button>
                {post.user.id === userId && (
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    🗑️
                  </button>
                )}
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
          className={`px-4 py-2 text-white rounded-lg ${
            currentPage === 1
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          Previous
        </button>
        <span className="text-white">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 text-white rounded-lg ${
            currentPage === totalPages
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          Next
        </button>
      </footer>
    </div>
  );
}