import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

type WelcomePageProps = {
  firstname: string;
  lastname: string;
};

export default function WelcomePage({ firstname, lastname }: WelcomePageProps) {
  const router = useRouter();

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

// This function runs server-side and extracts cookies
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;

  // Parse cookies from the request headers
  const cookies = req.headers.cookie
      ?.split('; ')
      .reduce((acc: Record<string, string>, cookie) => {
        const [key, value] = cookie.split('=');
        acc[key] = value;
        return acc;
      }, {}) || {};

  // Get firstname and lastname cookies or provide defaults
  const firstname = cookies.firstname || 'User';
  const lastname = cookies.lastname || '';

  return {
    props: {
      firstname,
      lastname,
    },
  };
};

