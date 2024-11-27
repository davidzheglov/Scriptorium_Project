import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Your existing import
import { format } from 'date-fns';

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
  user: { id: number; firstName: string; lastName: string; avatar: string } | null;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  userVote: 'upvote' | 'downvote' | null; // Add this field
}

interface BlogPostsPageProps {
  blogPost?: BlogPost;
  token: string | null;
  error?: string;
  userId: number;
}

// interface DecodedToken {
//   id: number;
//   email: string;
// }

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.query;
  const { req } = context;
  const cookies = req.cookies;
  const token = cookies.token || null;

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

    if (!res.ok) {
      throw new Error('Failed to fetch blog post');
    }

    const blogPost = await res.json();
    console.log('Fetched blog post:', blogPost);

    return {
      props: { blogPost, token, userId,},
    };
  } catch (error: unknown) {
    console.error('Error fetching blog post:', error instanceof Error ? error.message : error);
    return {
      props: { error: 'Failed to load blog post' },
    };
  }
};


// export const getServerSideProps: GetServerSideProps = async (context) => {
//   const { req } = context;
//   const cookies = req.cookies;

//   const token = cookies.token || null;

//   const jwt = require('jsonwebtoken');
//   const SECRET_KEY = process.env.JWT_SECRET || 'default_secret_key';
//   let userId = null;

//   if (token) {
//     try {
//       const decodedToken = jwt.verify(token, SECRET_KEY) as { userId: number };
//       userId = decodedToken.userId;
//     } catch (error) {
//       console.error('Error decoding token:', error);
//     }
//   }

//   return {
//     props: {
//       token,
//       userId,
//     },
//   };
// };



export default function BlogPostPage({
  blogPost,
  token,
  error,
  userId,
}: BlogPostsPageProps) {
  console.log('blogPost prop received:', blogPost);

  const [post, setPost] = useState<BlogPost | null>(blogPost || null);
  const [comments, setComments] = useState<Comment[]>([]); // Start with an empty array
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
  useEffect(() => {
    console.log('Logged-in User ID:', userId);
  }, [userId]); // This will log whenever `userId` changes



  

  // let currentUserId: number | null = null;
  // if (token){
  //   try {
  //     const decodedToken: DecodedToken = jwtDecode(token);
  //     currentUserId = decodedToken.id;
  //   } catch (error) {
  //     console.error('Failed to decode token:', error);
  //   }
  // }
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
    if (userId !== post?.user?.id) {
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

  // Functionality to handle reporting a post
  const handleReportPost = async (reason: string) => {
    try {
      const res = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason,
          blogPostId: post?.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit report');
      console.log('Report submitted successfully');
      alert('Report submitted successfully!');
    } catch (error) {
      console.error('Error reporting content:', error);
    }
  };

  // Functionality to handle reporting a comment
  const handleReportComment = async (commentId: number, reason: string) => {
    try {
      const res = await fetch('/api/reports/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason,
          commentId,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit report');
      console.log('Report submitted successfully');
      alert('Comment report submitted successfully!');
    } catch (error) {
      console.error('Error reporting comment:', error);
    }
  };

  const handleCommentVote = async (commentId: number, voteType: 'upvote' | 'downvote') => {
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: commentId,
          type: voteType,
          itemType: 'comment',
        }),
      });
  
      if (!res.ok) {
        throw new Error(`Failed to ${voteType} comment`);
      }
  
      console.log(`Comment ${voteType} successful. Reloading comments.`);
      fetchComments();
    } catch (error) {
      console.error(`Error during comment ${voteType}:`, error);
    }
  };
  
  const [sortCriteria, setSortCriteria] = useState<'date' | 'rating'>('date');
  
  const fetchComments = async () => {
    if (!post?.id) return; // Ensure the blog post ID exists
  
    try {
      const res = await fetch(`/api/blogs/${post.id}/comments?sort=${sortCriteria}`, {
        headers: {
          Authorization: `Bearer ${token}`, // Pass the token for authentication
        },
      });
  
      if (!res.ok) {
        throw new Error('Failed to fetch comments');
      }
  
      const fetchedComments = await res.json();
      setComments(fetchedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]); // Reset comments if there's an error
    }
  };
  
  
  // Trigger fetching comments whenever the sort criteria changes
  useEffect(() => {
    fetchComments();
  }, [sortCriteria, post?.id]); // Fetch comments when sorting changes or when the post ID changes
  
  

  const handleEditComment = async (commentId: number, currentContent: string) => {
    const updatedContent = prompt('Edit your comment:', currentContent);
    if (!updatedContent || updatedContent.trim() === '') return;
  
    try {
      const res = await fetch(`/api/comments/${commentId}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: updatedContent }),
      });
  
      if (!res.ok) {
        throw new Error('Failed to update comment');
      }
  
      console.log('Comment updated successfully. Reloading comments...');
      router.reload(); // Reload the page to reflect the updated comment
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };
  
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
  
    try {
      const res = await fetch(`/api/comments/${commentId}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!res.ok) {
        throw new Error('Failed to delete comment');
      }
  
      console.log('Comment deleted successfully. Reloading comments...');
      router.reload(); // Reload the page to reflect the updated comments
    } catch (error) {
      console.error('Error deleting comment:', error);
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
        userId === post?.user?.id ? (
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
  {post?.createdAt ? new Date(post.createdAt).toISOString().split('T')[0] : 'Invalid Date'}
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
              disabled={post?.userVote === 'upvote' || isVoting || (!token)}
              className={`px-4 py-2 rounded ${
                post?.userVote === 'upvote' ? 'bg-green-600' : 'bg-gray-600'
              } text-white`}

            >
              Upvote ({post?.upvotes || 0})
            </button>
            <button
              onClick={() => handleVote('downvote')}
              disabled={post?.userVote === 'downvote' || isVoting || (!token)}
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
              userId === post?.user?.id ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            } rounded`}
            disabled={userId !== post?.user?.id}
          >
            Edit
          </button>
          <button
            onClick={() => {
              const reason = prompt('Enter a reason for reporting this content:');
              if (reason) handleReportPost(reason);
            }}
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded"
          >
            Report Post
          </button>
        </>
      )}

<section className="mt-8">
  <div className="flex justify-between items-center">
    <h2 className="text-2xl font-bold">Comments</h2>
    <select
      className="p-2 bg-gray-700 text-white rounded"
      value={sortCriteria}
      onChange={(e) => setSortCriteria(e.target.value as 'date' | 'rating')}
    >
      <option value="date">Sort by Date</option>
      <option value="rating">Sort by Rating</option>
    </select>
  </div>

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
            {format(new Date(comment.createdAt), 'yyyy-MM-dd')} 
          </p>
        </div>
        
      </div>
      <p className="mt-2">{comment.content}</p>
      <div className="flex space-x-4 mt-2">
        <button
          onClick={() => handleCommentVote(comment.id, 'upvote')}
          className={`px-4 py-2 rounded ${
            comment.userVote === 'upvote' ? 'bg-green-600' : 'bg-gray-600'
          } text-white`}
          disabled = {!token}
        >
          👍 {comment.upvotes}
        </button>
        <button
          onClick={() => handleCommentVote(comment.id, 'downvote')}
          className={`px-4 py-2 rounded ${
            comment.userVote === 'downvote' ? 'bg-red-600' : 'bg-gray-600'
          } text-white`}
          disabled = {!token}
        >
          👎 {comment.downvotes}
        </button>
        <button
          onClick={() => {
            const reason = prompt('Enter a reason for reporting this comment:');
            if (reason) handleReportComment(comment.id, reason);
          }}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Report Comment
        </button>
        <div className="flex space-x-2 mt-2">
        {/* Render Edit and Delete buttons for the comment owner */}
        {/* comment.user?.id === userId && */(
          <>
          { comment.user.id === userId && (
            <button
              onClick={() => handleEditComment(comment.id, comment.content)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ✏️
            </button> )}
                {console.log('Comment User ID:', comment.user?.id)}
                {comment.user.id === userId && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    🗑️
                  </button>
              )}
          </>
        )}
      </div>
      </div>
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