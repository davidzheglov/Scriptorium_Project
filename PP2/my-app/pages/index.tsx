import { useRouter } from 'next/router';

export default function LandingPage() {
  const router = useRouter();

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
          <h2 className="text-xl font-semibold">Write Code</h2>
          <p className="mt-2">Use Scriptorium to write and execute code in languages like Python, JavaScript, and more.</p>
        </div>
        <div className="p-6 bg-blue-800 rounded-lg shadow-md hover:shadow-xl">
          <h2 className="text-xl font-semibold">Collaborate</h2>
          <p className="mt-2">Share your work with others by creating templates and linking them to blog posts.</p>
        </div>
        <div className="p-6 bg-blue-800 rounded-lg shadow-md hover:shadow-xl">
          <h2 className="text-xl font-semibold">Secure Sandbox</h2>
          <p className="mt-2">Run code in a safe, isolated environment to ensure performance and reliability.</p>
        </div>
      </section>
      <div>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-3 bg-blue-700 hover:bg-blue-600 rounded-lg font-medium"
        >
          Login
        </button>
        <button
          onClick={() => router.push('/signup')}
          className="ml-4 px-6 py-3 bg-red-700 hover:bg-red-600 rounded-lg font-medium"
        >
          Signup
        </button>
      </div>
    </div>
  );
}
