import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AdminHeader from './AdminHeader';
import AdminFooter from './AdminFooter';

const AdminEditProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    city: '',
    barangay: '',
    street: '',
    zipcode: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const colors = {
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#0F172A',
    border: '#E2E8F0',
    primary: '#0F766E',
    danger: '#DC2626',
    success: '#059669'
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);

        if (response.data.success) {
          const currentUser = response.data.user;
          setUser(currentUser);
          setAvatarPreview(currentUser.avatar?.url || '');
          setFormData({
            name: currentUser.name || '',
            contact: currentUser.contact || '',
            city: currentUser.address?.city || '',
            barangay: currentUser.address?.barangay || '',
            street: currentUser.address?.street || '',
            zipcode: currentUser.address?.zipcode || ''
          });
        }
      } catch {
        navigate('/admin/profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, API_BASE_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Name is required');
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('contact', formData.contact || '');
      data.append('city', formData.city || '');
      data.append('barangay', formData.barangay || '');
      data.append('street', formData.street || '');
      data.append('zipcode', formData.zipcode || '');
      if (avatar) data.append('avatar', avatar);

      const response = await axios.put(
        `${API_BASE_URL}/api/v1/users/me/update`,
        data,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => navigate('/admin/profile'), 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: colors.background }}>
      <AdminHeader />
      <main style={{ flex: 1, padding: '32px 20px' }}>
        <div style={{ width: '100%', maxWidth: '760px', margin: '0 auto', textAlign: 'center', background: colors.card, border: `1px solid ${colors.border}`, borderRadius: '16px', padding: '28px', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)' }}>
          <h2 style={{ color: colors.text, marginBottom: '8px' }}>Edit Admin Profile</h2>
          <Link to="/admin/profile" style={{ color: colors.primary, fontWeight: 600 }}>Back to Profile</Link>

          {error && <p style={{ color: colors.danger }}>{error}</p>}
          {success && <p style={{ color: colors.success }}>{success}</p>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
            {avatarPreview && (
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 10px', border: `2px solid ${colors.border}` }}
              />
            )}
            <input type="file" accept="image/*" onChange={handleAvatarChange} />

            <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" required style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}` }} />
            <input value={user?.email || ''} disabled style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}`, background: '#f8fafc' }} />

            <input name="contact" value={formData.contact} onChange={handleChange} placeholder="Contact" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}` }} />
            <input name="city" value={formData.city} onChange={handleChange} placeholder="City" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}` }} />
            <input name="barangay" value={formData.barangay} onChange={handleChange} placeholder="Barangay" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}` }} />
            <input name="street" value={formData.street} onChange={handleChange} placeholder="Street" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}` }} />
            <input name="zipcode" value={formData.zipcode} onChange={handleChange} placeholder="Zip Code" style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${colors.border}` }} />

            <button type="submit" disabled={saving} style={{ marginTop: '8px', padding: '10px 14px', borderRadius: '8px', border: 0, background: colors.primary, color: '#fff', fontWeight: 600 }}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </main>
      <AdminFooter />
    </div>
  );
};

export default AdminEditProfile;
