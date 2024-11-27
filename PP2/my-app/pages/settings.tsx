import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';

interface SettingsPageProps {
  token: string | null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { req } = context;
  const cookies = req.cookies;

  const token = cookies.token || null;

  if (!token) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  return {
    props: { token },
  };
};

export default function SettingsPage({ token }: SettingsPageProps) {
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    avatar: string;
    newAvatar: File | null;
  }>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    avatar: '',
    newAvatar: null,
  });

  const [isEditing, setIsEditing] = useState<{
    firstName: boolean;
    lastName: boolean;
    phoneNumber: boolean;
  }>({
    firstName: false,
    lastName: false,
    phoneNumber: false,
  });

  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/users/profile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch profile');

        const profile = await res.json();
        setFormData({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          phoneNumber: profile.phoneNumber || '',
          avatar: profile.avatar ,
          newAvatar: null,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
        alert('Failed to load profile. Please log in again.');
        router.push('/login');
      }
    };

    fetchProfile();
  }, [token, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, newAvatar: file });
    }
  };

  const handleAvatarUpload = async () => {
    if (!formData.newAvatar) return;

    const formPayload = new FormData();
    formPayload.append('file', formData.newAvatar);

    try {
      const res = await fetch('/api/users/avatar-upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formPayload,
      });

      if (!res.ok) throw new Error('Failed to upload avatar');
      const data = await res.json();
      setFormData({ ...formData, avatar: data.url, newAvatar: null });
      alert('Avatar updated successfully');
    } catch (error) {
      console.error('Error updating avatar:', error);
      alert('Failed to update avatar');
    }
  };

  const handleEditSubmit = async (field: keyof typeof formData) => {
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [field]: formData[field] }),
      });

      if (!res.ok) throw new Error(`Failed to update ${field}`);
      alert(`${field} updated successfully`);
      setIsEditing({ ...isEditing, [field]: false });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-gray-100 shadow-lg rounded-lg flex space-x-8">
      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-4">
        <img
          src={formData.avatar}
          alt="Avatar"
          className="w-32 h-32 rounded-full shadow-lg object-cover transition-transform hover:scale-110"
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
        <button
          onClick={handleAvatarUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        >
          Upload Avatar
        </button>
      </div>

      {/* User Information Section */}
      <div className="flex-grow space-y-6">
        <h1 className="text-2xl font-bold text-gray-700">Settings</h1>
        <div className="space-y-4">
          {/* Editable Fields */}
          {['firstName', 'lastName', 'phoneNumber'].map((field) => (
            <div key={field} className="flex items-center space-x-4">
              <span className="font-medium text-gray-600 capitalize">
                {field.replace(/([A-Z])/g, ' $1')}:
              </span>
              {isEditing[field as keyof typeof isEditing] ? (
                <>
                  <input
                    type="text"
                    value={formData[field as keyof typeof formData] as string}
                    onChange={(e) =>
                      setFormData({ ...formData, [field]: e.target.value })
                    }
                    className="flex-grow p-2 border rounded focus:ring focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleEditSubmit(field as keyof typeof formData)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() =>
                      setIsEditing({ ...isEditing, [field]: false })
                    }
                    className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="text-gray-800">
                    {formData[field as keyof typeof formData] || 'N/A'}
                  </span>
                  <button
                    onClick={() =>
                      setIsEditing({ ...isEditing, [field]: true })
                    }
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          ))}

          {/* Email Field (Non-Editable) */}
          <div className="flex items-center space-x-4">
            <span className="font-medium text-gray-600">Email:</span>
            <span className="text-gray-800">{formData.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

