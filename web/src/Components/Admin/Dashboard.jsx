import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { MdPeople, MdBarChart, MdTrendingUp, MdNotifications, MdSettings } from 'react-icons/md';
import AdminHeader from './AdminHeader';
import AdminFooter from './AdminFooter';
import logoImage from '../Admin/logowalangbg.png';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [analysisDistribution, setAnalysisDistribution] = useState([]);
  const [topDiseases, setTopDiseases] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [weeklyActivity, setWeeklyActivity] = useState([]);
  const [userOverview, setUserOverview] = useState(null);
  const [fullscreenChart, setFullscreenChart] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const [stats, growth, dist, diseases, activity, weekly, overview] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/v1/dashboard/stats`),
        axios.get(`${API_BASE_URL}/api/v1/dashboard/user-growth`),
        axios.get(`${API_BASE_URL}/api/v1/dashboard/analysis-distribution`),
        axios.get(`${API_BASE_URL}/api/v1/dashboard/top-diseases`),
        axios.get(`${API_BASE_URL}/api/v1/dashboard/recent-activity`),
        axios.get(`${API_BASE_URL}/api/v1/dashboard/weekly-activity`),
        axios.get(`${API_BASE_URL}/api/v1/dashboard/user-overview`)
      ]);
      
      if (stats.data.success) setDashboardData(stats.data.stats);
      if (growth.data.success) setUserGrowth(growth.data.data);
      if (dist.data.success) setAnalysisDistribution(dist.data.data);
      if (diseases.data.success) setTopDiseases(diseases.data.data);
      if (activity.data.success) setRecentActivity(activity.data.data);
      if (weekly.data.success) setWeeklyActivity(weekly.data.data);
      if (overview.data.success) setUserOverview(overview.data.data);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch user profile
        const userRes = await axios.get(`${API_BASE_URL}/api/v1/users/me`);
        if (userRes.data.success) {
          setUser(userRes.data.user);
        }

        // Fetch dashboard stats
        const statsRes = await axios.get(`${API_BASE_URL}/api/v1/dashboard/stats`);
        if (statsRes.data.success) {
          setDashboardData(statsRes.data.stats);
        }

        // Fetch user growth
        const growthRes = await axios.get(`${API_BASE_URL}/api/v1/dashboard/user-growth`);
        if (growthRes.data.success) {
          setUserGrowth(growthRes.data.data);
        }

        // Fetch analysis distribution
        const distRes = await axios.get(`${API_BASE_URL}/api/v1/dashboard/analysis-distribution`);
        if (distRes.data.success) {
          setAnalysisDistribution(distRes.data.data);
        }

        // Fetch top diseases
        const diseasesRes = await axios.get(`${API_BASE_URL}/api/v1/dashboard/top-diseases`);
        if (diseasesRes.data.success) {
          setTopDiseases(diseasesRes.data.data);
        }

        // Fetch recent activity
        const activityRes = await axios.get(`${API_BASE_URL}/api/v1/dashboard/recent-activity`);
        if (activityRes.data.success) {
          setRecentActivity(activityRes.data.data);
        }

        // Fetch weekly activity
        const weeklyRes = await axios.get(`${API_BASE_URL}/api/v1/dashboard/weekly-activity`);
        if (weeklyRes.data.success) {
          setWeeklyActivity(weeklyRes.data.data);
        }

        // Fetch user overview
        const userOverRes = await axios.get(`${API_BASE_URL}/api/v1/dashboard/user-overview`);
        if (userOverRes.data.success) {
          setUserOverview(userOverRes.data.data);
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, API_BASE_URL]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block mb-6">
            <div className="w-20 h-20 border-4 border-white border-t-purple-300 rounded-full animate-spin shadow-2xl drop-shadow-lg" />
          </div>
          <p className="text-white font-bold text-xl drop-shadow-lg">Loading Dashboard...</p>
          <p className="text-white/70 text-sm mt-2">Preparing your analytics</p>
        </div>
      </div>
    );
  }

  const chartColors = ['#8B6F47', '#556B2F', '#A0522D', '#D4A574'];

  return (
    <div style={{ 
      minHeight: '100vh', 
      width: '100%',
      backgroundImage: 'linear-gradient(135deg, rgba(13, 74, 47, 0.7), rgba(139, 111, 71, 0.6)), url(/media/BGadmin.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <AdminHeader />
      
      {/* Main Scrollable Content */}
      <main style={{ overflowY: 'auto', height: 'calc(100vh - 80px)' }}>
        <div style={{ width: '100%', padding: '40px 30px' }}>
          
          {/* Hero Section with Enhanced Styling */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <h1 style={{
                fontSize: '48px',
                fontWeight: 'bold',
                background: 'linear-gradient(90deg, #D4A574, #8B6F47, #D4A574)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                margin: 0
              }}>
                Dashboard
              </h1>
            </div>
            <p style={{ fontSize: '18px', color: '#666', margin: '0 0 8px 0' }}>
              Welcome back, <span style={{ fontWeight: 'bold', color: '#D4A574' }}>{user?.name || 'Admin'}</span> 👋
            </p>
            <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>Monitor your PiperSmart analytics and insights</p>
          </div>

          {/* Top Stats Row - 3 Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            <PurpleStatCard
              title="Total Users"
              value={dashboardData?.totalUsers || 0}
              icon={<MdPeople size={48} color="white" />}
              gradient="linear-gradient(135deg, #8B6F47 0%, #A0522D 100%)"
              subtitle={`+${dashboardData?.activeUsers || 0} active`}
              percentageChange={`${Math.round((dashboardData?.activeUsers / (dashboardData?.totalUsers || 1)) * 100)}%`}
              backgroundImage="/media/Users.webp"
              overlayColor="rgba(80, 60, 40, 0.75)"
            />
            <PurpleStatCard
              title="Total Analyses"
              value={dashboardData?.totalAnalyses || 0}
              icon={<MdBarChart size={48} color="white" />}
              gradient="linear-gradient(135deg, #556B2F 0%, #6F8C3D 100%)"
              subtitle={`+${dashboardData?.analysesThisMonth || 0} this month`}
              percentageChange={`-10%`}
              backgroundImage="/media/analysisadmin.webp"
              overlayColor="rgba(40, 50, 20, 0.75)"
            />
            <PurpleStatCard
              title="Active Users Today"
              value={userOverview?.activeToday || 0}
              icon={<MdTrendingUp size={48} color="white" />}
              gradient="linear-gradient(135deg, #C19A6B 0%, #D4A574 100%)"
              subtitle={`+${userOverview?.newThisWeek || 0} new this week`}
              percentageChange={`+5%`}
              backgroundImage="/media/ATusers.jpg"
              overlayColor="rgba(100, 80, 50, 0.75)"
            />
          </div>

          {/* Main Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            {/* Large Chart - 2 columns */}
            <div style={{ gridColumn: '1 / -1' }}>
              <PurpleChartCard 
                title={<><MdBarChart style={{ marginRight: '8px', display: 'inline' }} />Visit And Analysis Statistics</>} 
                onExpand={() => setFullscreenChart({ type: 'weekly', data: weeklyActivity })}
              >
                {weeklyActivity.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weeklyActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#FFF', border: '2px solid #8B6F47', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
                        formatter={(value) => value.toLocaleString()}
                      />
                      <Legend />
                      <Bar dataKey="bunga" fill="#8B6F47" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="leaf" fill="#556B2F" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ textAlign: 'center', color: '#999', padding: '60px 20px' }}>No data available</p>
                )}
              </PurpleChartCard>
            </div>

            {/* Analysis Distribution */}
            <PurpleChartCard 
              title={<><MdBarChart style={{ marginRight: '8px', display: 'inline' }} />Analysis Distribution</>} 
              onExpand={() => setFullscreenChart({ type: 'distribution', data: analysisDistribution })}
            >
              {analysisDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analysisDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => `${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analysisDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString()} contentStyle={{ backgroundColor: '#FFF', border: '2px solid #8B6F47', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: '#999', padding: '60px 20px' }}>No data</p>
              )}
            </PurpleChartCard>

            {/* User Growth */}
            <PurpleChartCard 
              title={<><MdTrendingUp style={{ marginRight: '8px', display: 'inline' }} />User Growth</>} 
              onExpand={() => setFullscreenChart({ type: 'growth', data: userGrowth })}
            >
              {userGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '2px solid #8B6F47', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }} />
                    <Line type="monotone" dataKey="users" stroke="#D4A574" strokeWidth={4} dot={{ fill: '#D4A574', r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: '#999', padding: '60px 20px' }}>No data available</p>
              )}
            </PurpleChartCard>
          </div>

          {/* Bottom Section - User Metrics & Top Diseases */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            {/* User Metrics */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e0e0e0',
              padding: '32px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 30px rgba(124, 58, 237, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ fontSize: '28px' }}><MdPeople size={28} /></div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(90deg, #8B6F47, #D4A574)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }}>User Metrics</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <OverviewItemPurple label="Active Today" value={userOverview?.activeToday || 0} color="#556B2F" />
                <OverviewItemPurple label="New This Week" value={userOverview?.newThisWeek || 0} color="#8B6F47" />
                <OverviewItemPurple label="Verified Users" value={userOverview?.verified || 0} color="#D4A574" />
                <OverviewItemPurple label="Unverified" value={userOverview?.unverified || 0} color="#A0522D" />
                <OverviewItemPurple label="Inactive (30d)" value={userOverview?.inactive || 0} color="#5c4a3d" />
              </div>
            </div>

            {/* Top Diseases */}
            <div style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e0e0e0',
              padding: '32px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 30px rgba(239, 68, 68, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ fontSize: '28px' }}>🦠</div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(90deg, #A0522D, #8B6F47)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }}>Top Diseases</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topDiseases.slice(0, 5).map((disease, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'linear-gradient(90deg, #f5e6d3, #f0e4d0)',
                      borderRadius: '12px',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      border: '1px solid #d4c5b0'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(90deg, #e6d5bc, #dccaa5)';
                      e.currentTarget.style.border = '1px solid #8B6F47';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(90deg, #f5e6d3, #f0e4d0)';
                      e.currentTarget.style.border = '1px solid #d4c5b0';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}>
                    <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>#{disease.rank} {disease.disease}</span>
                    <span style={{ fontWeight: 'bold', color: 'white', background: '#8B6F47', padding: '6px 16px', borderRadius: '20px', fontSize: '13px' }}>{disease.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid #e0e0e0',
              padding: '32px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              marginBottom: '40px',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 30px rgba(16, 185, 129, 0.15)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ fontSize: '28px' }}><MdNotifications size={28} /></div>
                <h3 style={{ fontSize: '20px', fontWeight: 'bold', background: 'linear-gradient(90deg, #556B2F, #6F8C3D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }}>Recent Activity</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {recentActivity.map((activity, index) => {
                  const isBungaActivity = activity.title?.toLowerCase().includes('bunga') || activity.description?.toLowerCase().includes('bunga');
                  return (
                    <div 
                      key={index} 
                      style={{
                        display: 'flex',
                        gap: '16px',
                        padding: '16px',
                        background: 'linear-gradient(90deg, #f5e6d3, #f0e4d0)',
                        borderRadius: '12px',
                        border: '1px solid #d4c5b0',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(90deg, #e6d5bc, #dccaa5)';
                        e.currentTarget.style.border = '1px solid #8B6F47';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(90deg, #f5e6d3, #f0e4d0)';
                        e.currentTarget.style.border = '1px solid #d4c5b0';
                      }}>
                      {isBungaActivity ? (
                        <img src={logoImage} alt="Bunga" style={{ height: '40px', width: '40px', objectFit: 'contain', flexShrink: 0, padding: '4px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                      ) : (
                        <div style={{ fontSize: '24px', flexShrink: 0, padding: '4px', background: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>{activity.icon}</div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '14px', marginBottom: '4px' }}>{activity.title}</div>
                        <div style={{ color: '#4b5563', fontSize: '12px', marginBottom: '4px' }}>{activity.description}</div>
                        <div style={{ color: '#999', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ⏱️ {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            <PurpleAction 
              label="Refresh Dashboard" 
              icon="🔄" 
              onClick={handleRefresh} 
              gradient="linear-gradient(135deg, #8B6F47, #556B2F)"
              disabled={refreshing}
            />
            <PurpleAction 
              label="View All Users" 
              icon="👥" 
              onClick={() => navigate('/admin/profile')} 
              gradient="linear-gradient(135deg, #556B2F, #6F8C3D)"
            />
            <PurpleAction 
              label="View Reports" 
              icon="📊" 
              onClick={() => navigate('/admin/reports')} 
              gradient="linear-gradient(135deg, #A0522D, #8B6F47)"
            />
            <PurpleAction 
              label="System Health" 
              icon={<MdSettings />} 
              onClick={() => {}} 
              gradient="linear-gradient(135deg, #D4A574, #C19A6B)"
            />
          </div>
        </div>
      </main>

      {/* Fullscreen Chart Modal */}
      {fullscreenChart && (
        <FullscreenChartModal 
          chart={fullscreenChart} 
          onClose={() => setFullscreenChart(null)}
          chartColors={chartColors}
        />
      )}

      <AdminFooter />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        /* Custom scrollbar for activity feeds */
        div::-webkit-scrollbar {
          width: 8px;
        }
        
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        
        div::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #8B6F47, #556B2F);
          border-radius: 4px;
        }
        
        div::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #6d28d9, #1d4ed8);
        }
        
        /* Smooth transitions */
        * {
          transition: box-shadow 0.3s ease, transform 0.3s ease, border-color 0.3s ease;
        }
      `}</style>
    </div>
  );
};

// Enhanced Helper Components with Inline Styles
const PurpleStatCard = ({ title, value, icon, gradient, subtitle, percentageChange, backgroundImage, overlayColor = 'rgba(0,0,0,0.6)' }) => (
  <div 
    style={{
      position: 'relative',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
      padding: '24px',
      color: 'white',
      background: backgroundImage ? `url(${backgroundImage})` : gradient,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      transform: 'translateY(0)',
      zIndex: 1
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.2)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
    }}>
    <div style={{ position: 'absolute', inset: 0, background: overlayColor, zIndex: 0 }} />
    <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div style={{ fontSize: '48px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>{icon}</div>
      <div style={{ fontSize: '12px', fontWeight: 'bold', padding: '6px 12px', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', borderRadius: '20px', whiteSpace: 'nowrap' }}>{percentageChange}</div>
    </div>
    <div style={{ position: 'relative', zIndex: 10, color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>{title}</div>
    <div style={{ position: 'relative', zIndex: 10, fontSize: '36px', fontWeight: 'bold', marginBottom: '8px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
      {typeof value === 'number' && value > 999 ? (value / 1000).toFixed(1) + 'K' : value.toLocaleString()}
    </div>
    {subtitle && (
      <div style={{ position: 'relative', zIndex: 10, fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>{subtitle}</div>
    )}
  </div>
);

const PurpleChartCard = ({ title, children, onExpand }) => (
  <div style={{
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e0e0e0',
    padding: '32px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = '0 12px 35px rgba(139, 111, 71, 0.15)';
    e.currentTarget.style.borderColor = '#8B6F47';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
    e.currentTarget.style.borderColor = '#e0e0e0';
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', background: 'linear-gradient(90deg, #8B6F47, #556B2F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }}>{title}</h3>
      <button
        onClick={onExpand}
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'linear-gradient(90deg, #f5e6d3, #f0e4d0)',
          border: 'none',
          cursor: 'pointer',
          fontSize: '16px',
          transition: 'all 0.3s ease',
          opacity: 0.6
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.6';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        title="Expand"
      >
        ⛶
      </button>
    </div>
    {children}
  </div>
);

const OverviewItemPurple = ({ label, value, color }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    background: 'linear-gradient(90deg, #f5e6d3, #f0e4d0)',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    border: '1px solid #d4c5b0',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = 'linear-gradient(90deg, #e6d5bc, #dccaa5)';
    e.currentTarget.style.border = '1px solid #8B6F47';
    e.currentTarget.style.transform = 'translateX(4px)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'linear-gradient(90deg, #f5e6d3, #f0e4d0)';
    e.currentTarget.style.border = '1px solid #d4c5b0';
    e.currentTarget.style.transform = 'translateX(0)';
  }}>
    <span style={{ color: '#4a3e35', fontWeight: '500', fontSize: '14px' }}>{label}</span>
    <span style={{ fontSize: '20px', fontWeight: 'bold', padding: '8px 16px', borderRadius: '8px', color: 'white', backgroundColor: color }}>{value}</span>
  </div>
);

const PurpleAction = ({ label, icon, onClick, gradient, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      position: 'relative',
      overflow: 'hidden',
      background: 'white',
      borderRadius: '16px',
      border: '1px solid #e0e0e0',
      padding: '32px',
      textAlign: 'center',
      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }}
    onMouseEnter={(e) => {
      if (disabled) return;
      e.currentTarget.style.transform = 'translateY(-8px)';
      e.currentTarget.style.boxShadow = '0 12px 30px rgba(139, 111, 71, 0.25)';
      e.currentTarget.style.borderColor = '#8B6F47';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)';
      e.currentTarget.style.borderColor = '#e0e0e0';
    }}>
    <div style={{ position: 'absolute', inset: 0, background: `${gradient}`, opacity: 0, transition: 'opacity 0.3s ease' }} />
    <div style={{ position: 'relative', zIndex: 10 }}>
      <div style={{ fontSize: '44px', marginBottom: '12px', transition: 'transform 0.3s ease' }}>{icon}</div>
      <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '14px', background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{label}</div>
    </div>
  </button>
);

const FullscreenChartModal = ({ chart, onClose, chartColors }) => (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(10px)',
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    animation: 'fadeIn 0.3s ease-in-out'
  }} onClick={onClose}>
    <div style={{
      background: 'white',
      borderRadius: '20px',
      border: '2px solid #8B6F47',
      width: '100%',
      height: '100%',
      maxWidth: '1200px',
      maxHeight: '90vh',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }} onClick={(e) => e.stopPropagation()}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '32px',
        borderBottom: '1px solid #e0e0e0',
        background: 'linear-gradient(90deg, #f5e6d3, #f0e4d0)'
      }}>
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', background: 'linear-gradient(90deg, #8B6F47, #556B2F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: 0 }}>
            {chart.type === 'growth' && <MdTrendingUp style={{ marginRight: '8px' }} />}User Growth
            {chart.type === 'distribution' && <MdBarChart style={{ marginRight: '8px' }} />}Analysis Distribution
          {chart.type === 'weekly' && '📅 Weekly Activity'}
        </h2>
        <button 
          onClick={onClose}
          style={{
            padding: '8px',
            background: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '20px',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'rotate(90deg)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'rotate(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}>
          ✕
        </button>
      </div>
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'linear-gradient(135deg, #FFDBAC, #f5f5f5)' }}>
        {chart.type === 'growth' && (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '2px solid #8B6F47', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }} />
              <Line type="monotone" dataKey="users" stroke="#D4A574" strokeWidth={4} dot={{ fill: '#D4A574', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
        {chart.type === 'distribution' && (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percentage }) => `${percentage}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => value.toLocaleString()} contentStyle={{ backgroundColor: '#FFF', border: '2px solid #8B6F47', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
        {chart.type === 'weekly' && (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '2px solid #8B6F47', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="bunga" fill="#8B6F47" radius={[8, 8, 0, 0]} />
              <Bar dataKey="leaf" fill="#556B2F" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  </div>
);

export default AdminDashboard;
