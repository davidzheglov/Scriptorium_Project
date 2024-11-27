import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface BlogPost {
  id: number;
  title: string;
  description: string;
  tags: { name: string }[];
  templates: { id: number }[];
  user: { id: number; firstName: string; lastName: string; avatar: string } | null;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  userVote: 'upvote' | 'downvote' | null;
  comments: Comment[];
}

interface Comment {
  id: number;
  content: string;
  user: { firstName: string; lastName: string; avatar: string } | null;
  createdAt: string;
  upvotes: number;
  downvotes: number;
}

interface DecodedToken {
  id: number;
  email: string;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  const { req } = context;
  const token = req.cookies.token || null;

  const API_URL = process.env.API_URL || 'http://localhost:3000/api';

  if (!id) {
    return { notFound: true };
  }

  console.log('Fetching blog post with ID:', id);
  try {
    const res = await fetch(`${API_URL}/blogs/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch blog post');
    }

    const blogPost = await res.json();
    console.log('Fetched blog post:', blogPost);

    return {
      props: { blogPost, token },
    };
  } catch (error: unknown) {
    console.error('Error fetching blog post:', error instanceof Error ? error.message : error);
    return {
      props: { error: 'Failed to load blog post' },
    };
  }
};

export default function BlogPostPage({
  blogPost,
  token,
  error,
}: {
  blogPost?: BlogPost;
  token: string;
  error?: string;
}) {
  console.log('blogPost prop received:', blogPost);

  const [post, setPost] = useState<BlogPost | null>(blogPost || null);
  const [comments, setComments] = useState<Comment[]>(blogPost?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: post?.title || '',
    description: post?.description || '',
    tags: Array.isArray(post?.tags) ? post.tags.map((tag) => tag.name).join(', ') : '',
    templates: Array.isArray(post?.templates) ? post.templates.map((template) => template.id).join(', ') : '',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false); 

  const router = useRouter();

  let currentUserId: number | null = null;

  try {
    const decodedToken: DecodedToken = jwtDecode(token);
    currentUserId = decodedToken.id;
  } catch (error) {
    console.error('Failed to decode token:', error);
  }

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        description: post.description || '',
        tags: Array.isArray(post.tags) ? post.tags.map((tag) => tag.name).join(', ') : '',
        templates: Array.isArray(post.templates) ? post.templates.map((template) => template.id).join(', ') : '',
      });
    }
  }, [post]);

  if (error) {
    return <div className="max-w-4xl mx-auto p-6 text-white">Blog post not found</div>;
  }

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return; 
    setIsVoting(true);

    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: post?.id,
          type: voteType,
          itemType: 'blogPost',
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to ${voteType}`);
      }

      console.log(`${voteType} successful. Reloading page to reflect changes.`);
      router.reload(); 
    } catch (error) {
      console.error(`Error during ${voteType}:`, error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleEdit = async () => {
    if (currentUserId !== post?.user?.id) {
      setErrorMessage('You are not authorized to edit this blog post.');
      return;
    }

    try {
      const res = await fetch(`/api/blogs/${post?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          tags: formData.tags.split(',').map((tag) => tag.trim()),
          templateIds: formData.templates.split(',').map((id) => parseInt(id.trim(), 10)),
        }),
      });

      if (res.status === 403) {
        setErrorMessage('You are not authorized to edit this blog post.');
        return;
      }

      if (!res.ok) throw new Error('Failed to update blog post');

      console.log('Post updated successfully. Reloading page...');
      router.reload();
    } catch (error) {
      console.error('Error updating blog post:', error);
    }
  };

  const handleAddComment = async () => {
    try {
      const res = await fetch('/api/comments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newComment,
          blogPostId: post?.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to add comment');

      console.log('Comment added successfully. Reloading page...');
      router.reload();
    } catch (err: unknown) {
      console.error('Error adding comment:', err instanceof Error ? err.message : err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 text-white">
      {errorMessage && (
        <div className="bg-red-600 text-white p-4 rounded mb-4">
          {errorMessage}
        </div>
      )}
      {isEditing ? (
        currentUserId === post?.user?.id ? (
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border rounded bg-gray-800 text-white"
              placeholder="Title"
            />
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded bg-gray-800 text-white"
              placeholder="Description"
            />
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full p-2 border rounded bg-gray-800 text-white"
              placeholder="Tags (comma-separated)"
            />
            <input
              type="text"
              value={formData.templates}
              onChange={(e) => setFormData({ ...formData, templates: e.target.value })}
              className="w-full p-2 border rounded bg-gray-800 text-white"
              placeholder="Template IDs (comma-separated)"
            />
            <button onClick={handleEdit} className="px-4 py-2 bg-blue-600 text-white rounded">
              Save Changes
            </button>
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-300 text-black rounded">
              Cancel
            </button>
          </form>
        ) : (
          <div className="text-red-500 text-center mt-4">
            You are not authorized to edit this blog post.
          </div>
        )
      ) : (
        <>
          <h1 className="text-3xl font-bold">{post?.title || 'Untitled'}</h1>
          <p className="text-sm text-gray-300">
            By {post?.user?.firstName || 'Unknown'} {post?.user?.lastName || ''} on{' '}
            {post?.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Invalid Date'}
          </p>
          <div className="mt-4">
            <p className="text-lg text-gray-200 whitespace-pre-line">{post?.description || 'No content available.'}</p>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-bold">Tags:</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {post?.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-700 text-white rounded-full text-sm"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={() => handleVote('upvote')}
              disabled={post?.userVote === 'upvote' || isVoting}
              className={`px-4 py-2 rounded ${
                post?.userVote === 'upvote' ? 'bg-green-600' : 'bg-gray-600'
              } text-white`}
            >
              Upvote ({post?.upvotes || 0})
            </button>
            <button
              onClick={() => handleVote('downvote')}
              disabled={post?.userVote === 'downvote' || isVoting}
              className={`px-4 py-2 rounded ${
                post?.userVote === 'downvote' ? 'bg-red-600' : 'bg-gray-600'
              } text-white`}
            >
              Downvote ({post?.downvotes || 0})
            </button>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className={`mt-2 px-4 py-2 ${
              currentUserId === post?.user?.id ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            } rounded`}
            disabled={currentUserId !== post?.user?.id}
          >
            Edit
          </button>
        </>
      )}

      <section className="mt-8">
        <h2 className="text-2xl font-bold">Comments</h2>
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 border rounded-lg mt-4 bg-gray-800 text-white">
            <div className="flex items-center space-x-4">
              <img
                src={comment.user?.avatar || '/default-avatar.png'}
                alt={`${comment.user?.firstName || 'Anonymous'}'s avatar`}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="font-bold">
                  {comment.user?.firstName || 'Anonymous'} {comment.user?.lastName || ''}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <p className="mt-2">{comment.content}</p>
          </div>
        ))}
      </section>

      <div className="mt-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full p-2 border rounded bg-gray-800 text-white"
          placeholder="Write a comment..."
        />
        <button onClick={handleAddComment} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Add Comment
        </button>
      </div>
    </div>
  );
}