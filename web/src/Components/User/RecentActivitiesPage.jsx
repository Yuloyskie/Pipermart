import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../shared/Header';
import Footer from '../shared/Footer';
import RecentActivities from './RecentActivities';
import './RecentActivitiesPage.css';
import mainBg from '../../../media/Main BG.jpg';

const RecentActivitiesPage = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsLoggedIn(true);
      setUser(JSON.parse(userData));
    } else {
      setIsLoggedIn(false);
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="recent-activities-page-container">
          <div className="unauthorized-message">
            <p>Please log in to view your recent activities.</p>
            <Link to="/login" className="btn-login-link">Go to Login</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Page Background with Image */}
      <div className="page-background">
        <img 
          src={mainBg}
          alt="Background" 
          className="background-image" 
        />
        <div className="background-overlay"></div>
      </div>

      <Header />
      <div className="recent-activities-page-container">
        <div className="activities-page-content">
          <div className="activities-page-header">
            <h1>My Recent Activities</h1>
            <p className="activities-subtitle">Track your history across all features</p>
          </div>
          <RecentActivities userId={user._id} currentUser={user} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RecentActivitiesPage;
