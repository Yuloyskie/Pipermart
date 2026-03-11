import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AdminHeader from './AdminHeader';
import AdminFooter from './AdminFooter';

const AdminProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get(`${API_BASE_URL}/api/v1/users/me`);

        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Profile fetch error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, API_BASE_URL]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const colors = {
    background: '#F8FAFC',
    card: '#FFDBAC',
    text: '#0F172A',
    textLight: '#475569',
    border: '#E2E8F0',
    primary: '#0F766E'
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
        Loading Admin Profile...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundImage: 'linear-gradient(135deg, rgba(13, 74, 47, 0.7), rgba(139, 111, 71, 0.6)), url(/media/BGadmin.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <AdminHeader />
      <main style={{ flex: 1, padding: '32px 20px', overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '28px', border: `1px solid ${colors.border}`, borderRadius: '16px', background: colors.card, boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)' }}>
        {/* Avatar */}
        <div>
          <img 
            src={user?.avatar?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}`} 
            alt={user?.name} 
            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '18px', border: `2px solid ${colors.border}` }}
          />
        </div>

        {/* Basic Info */}
        <p style={{ color: colors.text }}><strong>Full Name:</strong> {user?.name}</p>
        <p style={{ color: colors.text }}><strong>Email:</strong> {user?.email}</p>
        {user?.contact && <p style={{ color: colors.text }}><strong>Contact:</strong> {user.contact}</p>}

        {/* Address */}
        {user?.address && (
          <div>
            <p style={{ color: colors.text }}><strong>City:</strong> {user.address.city || '-'}</p>
            <p style={{ color: colors.text }}><strong>Barangay:</strong> {user.address.barangay || '-'}</p>
            <p style={{ color: colors.text }}><strong>Street:</strong> {user.address.street || '-'}</p>
            <p style={{ color: colors.text }}><strong>Zip Code:</strong> {user.address.zipcode || '-'}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to="/admin/profile/edit" style={{ color: colors.primary, fontWeight: 600 }}>Edit Profile</Link>
          <Link to="/admin/change-password" style={{ color: colors.primary, fontWeight: 600 }}>Change Password</Link>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
        </div>
      </main>
      <AdminFooter />
    </div>
  );
};

export default AdminProfile;
