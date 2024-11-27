import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetServerSideProps } from 'next';
import prisma from '@/utils/db';

// Type definitions for reported posts and comments
interface Report {
  reason: string;
  createdAt: string;
}

interface ReportedPost {
  id: number;
  title: string;
  description: string;
  reports: Report[];
}

interface ReportedComment {
  id: number;
  content: string;
  reports: Report[];
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const cookies = req.cookies;
  const token = cookies.token || null;

  console.log('Token in getServerSideProps:', token);

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const jwt = require('jsonwebtoken');
    const SECRET_KEY = process.env.JWT_SECRET || 'default_secret_key';

    // Decode token and extract userId
    const decodedToken = jwt.verify(token, SECRET_KEY) as { userId: number };

    console.log('Decoded token:', decodedToken);

    if (!decodedToken.userId) {
      console.error('Decoded token does not contain userId');
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    // Fetch the user's role using userId
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.userId },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return {
        redirect: {
          destination: '/unauthorized',
          permanent: false,
        },
      };
    }

    return {
      props: {
        token,
        role: user.role,
      },
    };
  } catch (error) {
    console.error('Error validating token or fetching user role:', error);
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
};

export default function ReportsPage({ token, role }: { token: string; role: string }) {
  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [reportedComments, setReportedComments] = useState<ReportedComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (role !== 'ADMIN') {
      setError('You are unauthorized to view this page.');
      return;
    }

    const fetchReports = async () => {
      console.log('Starting fetchReports...');
      try {
        if (!token) {
          setError('Authorization token not found. Please log in as an admin.');
          return;
        }

        console.log('Token before fetch:', token);
        const res = await fetch('/api/reports', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token.trim()}`,
          },
        });

        console.log('Response status:', res.status);
        if (!res.ok) {
          const errorText = await res.text();
          console.error('API Error:', errorText);
          throw new Error('Failed to fetch reported content');
        }

        const data = await res.json();
        console.log('Fetched reports:', data);

        setReportedPosts(data.reportedPosts || []);
        setReportedComments(data.reportedComments || []);
      } catch (err) {
        console.error('Error in fetchReports:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [token, role]);

  const handleHideContent = async (id: number, type: 'post' | 'comment') => {
    console.log(`Hiding ${type} with ID:`, id);
    try {
      const res = await fetch('/api/reports/hide', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify(
          type === 'post' ? { blogPostId: id } : { commentId: id }
        ),
      });

      console.log('Hide response status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        throw new Error('Failed to hide content');
      }

      alert('Content hidden successfully');
      router.reload();
    } catch (error) {
      console.error('Error hiding content:', error);
      alert('Error hiding content');
    }
  };

  if (role !== 'ADMIN') {
    return (
      <div className="max-w-4xl mx-auto p-6 text-white">
        <p className="bg-red-600 text-white p-4 rounded">
          You are unauthorized to view this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto p-6 text-white">Loading...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-white">
        <p className="bg-red-600 text-white p-4 rounded">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 text-white">
      <h1 className="text-3xl font-bold">Reported Content</h1>

      <section className="mt-6">
        <h2 className="text-2xl font-bold">Reported Blog Posts</h2>
        {reportedPosts.length === 0 ? (
          <p className="text-gray-400 mt-4">No reported posts</p>
        ) : (
          <ul className="space-y-4 mt-4">
            {reportedPosts.map((post) => (
              <li key={post.id} className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold">{post.title}</h3>
                <p className="text-gray-400">{post.description}</p>
                <p className="text-sm text-gray-500">
                  Reports: {post.reports.length}
                </p>
                <button
                  onClick={() => handleHideContent(post.id, 'post')}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
                >
                  Hide Post
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h2 className="text-2xl font-bold">Reported Comments</h2>
        {reportedComments.length === 0 ? (
          <p className="text-gray-400 mt-4">No reported comments</p>
        ) : (
          <ul className="space-y-4 mt-4">
            {reportedComments.map((comment) => (
              <li key={comment.id} className="bg-gray-800 p-4 rounded-lg">
                <p>{comment.content}</p>
                <p className="text-sm text-gray-500">
                  Reports: {comment.reports.length}
                </p>
                <button
                  onClick={() => handleHideContent(comment.id, 'comment')}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
                >
                  Hide Comment
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}