import { useState } from 'react';

export default function SettingsPage() {
  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatar: string | File; // Allow both string and File types
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    avatar: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, avatar: file });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formPayload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value instanceof File) {
        formPayload.append(key, value);
      } else {
        formPayload.append(key, value as string);
      }
    });

    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        body: formPayload,
      });

      if (!response.ok) throw new Error('Failed to update settings');
      alert('Settings updated successfully');
    } catch (error) {
      console.error(error);
      alert('Error updating settings');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="First Name"
          className="w-full p-3 border rounded"
        />
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Last Name"
          className="w-full p-3 border rounded"
        />
        <input
          type="text"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          placeholder="Phone Number"
          className="w-full p-3 border rounded"
        />
        <input
          type="file"
          name="avatar"
          onChange={handleFileChange} // Use a separate handler for file input
          className="w-full p-3 border rounded"
        />
        <input
          type="password"
          name="currentPassword"
          value={formData.currentPassword}
          onChange={handleChange}
          placeholder="Current Password"
          className="w-full p-3 border rounded"
        />
        <input
          type="password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="New Password"
          className="w-full p-3 border rounded"
        />
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          className="w-full p-3 border rounded"
        />
        <button type="submit" className="w-full p-3 bg-blue-600 text-white rounded">
          Update Settings
        </button>
      </form>
    </div>
  );
}