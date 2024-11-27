import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { jwtDecode } from 'jwt-decode'; // Add this to decode JWT tokens

interface LandingProps {
  firstname: string;
  lastname: string;
  token: string | null;
}

interface DecodedToken {
  role: string; // Assuming the role is included in the token payload
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const cookies = req.cookies;

  // Extract data from cookies
  const firstname = cookies.firstname || 'User';
  const lastname = cookies.lastname || '';
  const token = cookies.token || null;

  return {
    props: {
      firstname,
      lastname,
      token,
    },
  };
};

export default function LandingPage({ firstname, lastname, token }: LandingProps) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [token]);

  const handleLogout = async () => {
    try {
      await fetch('/api/users/logout', { method: 'POST' });
      document.cookie = 'token=; Max-Age=0; path=/'; // Clear the token
      setIsLoggedIn(false);
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="text-center mt-20 space-y-8">
      <header>
        <h1 className="text-5xl font-bold text-red-600">Scriptorium</h1>
        <p className="text-lg mt-4 max-w-2xl mx-auto">
          A modern platform where you can write, execute, and share your code in multiple languages.
          Collaborate, create reusable templates, and explore ideas in a secure, isolated environment.
        </p>
      </header>
      <section className="grid gap-8 md:grid-cols-3 mt-12">
        <div className="p-6 bg-blue-800 rounded-lg shadow-md hover:shadow-xl">
          <h2 className="text-xl font-semibold text-white">Write Code</h2>
          <p className="mt-2 text-gray-200">
            Use Scriptorium to write and execute code in languages like Python, JavaScript, and more.
          </p>
        </div>
        <div className="p-6 bg-blue-800 rounded-lg shadow-md hover:shadow-xl">
          <h2 className="text-xl font-semibold text-white">Collaborate</h2>
          <p className="mt-2 text-gray-200">
            Share your work with others by creating templates and linking them to blog posts.
          </p>
        </div>
        <div className="p-6 bg-blue-800 rounded-lg shadow-md hover:shadow-xl">
          <h2 className="text-xl font-semibold text-white">Secure Sandbox</h2>
          <p className="mt-2 text-gray-200">
            Run code in a safe, isolated environment to ensure performance and reliability.
          </p>
        </div>
      </section>
      <div>
        {isLoggedIn ? (
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-700 hover:bg-red-600 rounded-lg font-medium text-white"
            >
              Logout
            </button>
            {/* Reports Dashboard Button */}
            <button
              onClick={() => router.push('/admin/reports')}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 rounded-lg font-medium text-white"
            >
              Reports Dashboard
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg font-medium text-white"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="ml-4 px-6 py-3 bg-red-700 hover:bg-red-600 rounded-lg font-medium text-white"
            >
              Signup
            </button>
          </>
        )}
      </div>
    </div>
  );
}