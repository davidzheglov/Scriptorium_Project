import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('/api/users/login', formData);
      if (response.status === 200) {
        const { token, firstname, lastname } = response.data;

        // Store token and user details in cookies
        document.cookie = `token=${token}; path=/; Secure; SameSite=Strict`;
        document.cookie = `firstname=${firstname}; path=/; Secure; SameSite=Strict`;
        document.cookie = `lastname=${lastname}; path=/; Secure; SameSite=Strict`;

        router.push('/welcome'); // Redirect to Welcome page
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-900 to-red-800">
      <div className="bg-white text-black p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-red-600">Login</h1>
        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}


