import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';

interface BlogPost {
  id: number;
  title: string;
  description: string;
  tags: { name: string }[];
  user: { firstName: string; lastName: string; avatar: string };
  createdAt: string;
  upvotes: number;
  downvotes: number;
  comments: Comment[];
}

interface Comment {
  id: number;
  content: string;
  user: { firstName: string; lastName: string; avatar: string };
  createdAt: string;
  upvotes: number;
  downvotes: number;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  const { req } = context;
  const token = req.cookies.token || null;

  if (!id) {
    return { notFound: true };
  }

  try {
    const res = await fetch(`${process.env.API_URL}/blogs/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error('Failed to fetch blog post');
    }

    const blogPost = await res.json();

    return {
      props: { blogPost, token },
    };
  } catch (error) {
    return {
      props: { error: 'Failed to load blog post' },
    };
  }
};

export default function BlogPostPage({ blogPost, token }: { blogPost: BlogPost; token: string }) {
  const [comments, setComments] = useState(blogPost.comments || []);
  const [newComment, setNewComment] = useState('');
  const router = useRouter();

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
          blogPostId: blogPost.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to add comment');

      const { comment } = await res.json();
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">{blogPost.title}</h1>
        <p className="text-sm text-gray-500">
          By {blogPost.user.firstName} {blogPost.user.lastName} on{' '}
          {new Date(blogPost.createdAt).toLocaleDateString()}
        </p>
      </header>
      <p>{blogPost.description}</p>
      <div className="flex items-center space-x-4 mt-4">
        <button>👍 {blogPost.upvotes}</button>
        <button>👎 {blogPost.downvotes}</button>
      </div>

      <section className="mt-8">
        <h2 className="text-2xl font-bold">Comments</h2>
        {comments.map((comment) => (
          <div key={comment.id} className="p-4 border rounded-lg mt-4">
            <div className="flex items-center space-x-4">
              <img
                src={comment.user.avatar || '/default-avatar.png'}
                alt={`${comment.user.firstName}'s avatar`}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="font-bold">
                  {comment.user.firstName} {comment.user.lastName}
                </p>
                <p className="text-sm text-gray-500">
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
          className="w-full p-2 border rounded-lg"
          placeholder="Write a comment..."
        />
        <button onClick={handleAddComment} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Add Comment
        </button>
      </div>
    </div>
  );
}

