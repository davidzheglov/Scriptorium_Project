import { useRouter } from 'next/router';

interface NavbarProps {
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
}

export default function Navbar({ isLoggedIn, setIsLoggedIn }: NavbarProps) {
  const router = useRouter();

  const handleLogout = () => {
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <nav className="bg-black bg-opacity-90 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <h1
        onClick={() => router.push('/')}
        className="text-2xl font-bold text-red-600 cursor-pointer hover:text-white"
      >
        Scriptorium
      </h1>
      <div className="space-x-6">
        <button
          onClick={() => router.push('/settings')}
          className="text-white hover:text-red-600"
        >
          Settings
        </button>
        <button
          onClick={() => router.push('/blogposts')}
          className="text-white hover:text-red-600"
        >
          Blogposts
        </button>
        <button
          onClick={() => router.push('/codespace')}
          className="text-white hover:text-red-600"
        >
          Codespace
        </button>
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-700 rounded-lg hover:bg-red-600 font-medium"
          >
            Logout
          </button>
        ) : (
          <>
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-600 font-medium"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="px-4 py-2 bg-green-700 rounded-lg hover:bg-green-600 font-medium"
            >
              Signup
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
