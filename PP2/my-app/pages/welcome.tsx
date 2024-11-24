import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function WelcomePage() {
  const router = useRouter();

  // Extract firstname and lastname from cookies
  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
  };

  const firstname = getCookie('firstname') || 'User';
  const lastname = getCookie('lastname') || '';

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-900 to-red-800">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white">
          Welcome to Scriptorium, {firstname} {lastname}!
        </h1>
        <button
          onClick={() => router.push('/')}
          className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
        >
          Start
        </button>
      </div>
    </div>
  );
}

