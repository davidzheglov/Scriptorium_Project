import { useRouter } from 'next/router';

export default function Navbar() {
  const router = useRouter();

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
      </div>
    </nav>
  );
}


