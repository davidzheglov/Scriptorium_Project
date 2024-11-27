export default function UnauthorizedPage() {
    return (
      <div className="max-w-4xl mx-auto p-6 text-white">
        <h1 className="text-4xl font-bold text-red-600">Unauthorized</h1>
        <p className="mt-4 text-lg text-gray-300">
          You do not have permission to access this page.
        </p>
        <a
          href="/"
          className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          Return to Home
        </a>
      </div>
    );
  }