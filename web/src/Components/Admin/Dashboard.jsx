import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
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
      <div className="h-screen w-full bg-gradient-to-b from-slate-900 via-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block mb-6">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-teal-600 rounded-full animate-spin" />
          </div>
          <p className="text-slate-700 font-semibold text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const chartColors = ['#E91E63', '#3B82F6', '#10B981', '#F59E0B'];

  return (
    <div className="min-h-screen w-full bg-gray-100">
      <AdminHeader />
      
      {/* Main Scrollable Content */}
      <main className="overflow-y-auto scrollbar-hide">
        <div className="w-full px-6 py-8">
          
          {/* Hero Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, <span className="text-purple-600">{user?.name || 'Admin'}</span>
            </h1>
            <p className="text-gray-600">Your PiperSmart dashboard insights at a glance</p>
          </div>

          {/* Top Stats Row - 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <PurpleStatCard
              title="Total Users"
              value={dashboardData?.totalUsers || 0}
              icon="👥"
              backgroundColor="bg-gradient-to-br from-pink-400 to-pink-600"
              subtitle={`+${dashboardData?.activeUsers || 0} active`}
              percentageChange={`${Math.round((dashboardData?.activeUsers / (dashboardData?.totalUsers || 1)) * 100)}%`}
            />
            <PurpleStatCard
              title="Total Analyses"
              value={dashboardData?.totalAnalyses || 0}
              icon="📊"
              backgroundColor="bg-gradient-to-br from-blue-400 to-blue-600"
              subtitle={`+${dashboardData?.analysesThisMonth || 0} this month`}
              percentageChange={`-10%`}
            />
            <PurpleStatCard
              title="Active Users Today"
              value={userOverview?.activeToday || 0}
              icon="🌟"
              backgroundColor="bg-gradient-to-br from-teal-400 to-teal-600"
              subtitle={`+${userOverview?.newThisWeek || 0} new this week`}
              percentageChange={`+5%`}
            />
          </div>

          {/* Main Charts Section - Visit & Sales & Traffic Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Large Chart - 2 columns */}
            <PurpleChartCard 
              title="📅 Visit And Analysis Statistics" 
              className="lg:col-span-2"
              onExpand={() => setFullscreenChart({ type: 'weekly', data: weeklyActivity })}
            >
              {weeklyActivity.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                      formatter={(value) => value.toLocaleString()}
                    />
                    <Legend />
                    <Bar dataKey="bunga" fill="#E91E63" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="leaf" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-20">No data available</p>
              )}
            </PurpleChartCard>

            {/* Traffic Sources / Analysis Distribution */}
            <PurpleChartCard 
              title="📊 Analysis Distribution" 
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
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-20">No data</p>
              )}
            </PurpleChartCard>
          </div>

          {/* User Growth Chart */}
          <div className="grid grid-cols-1 mb-8">
            <PurpleChartCard 
              title="📈 User Growth" 
              onExpand={() => setFullscreenChart({ type: 'growth', data: userGrowth })}
            >
              {userGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="users" stroke="#A855F7" strokeWidth={3} dot={{ fill: '#A855F7', r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-20">No data available</p>
              )}
            </PurpleChartCard>
          </div>

          {/* Bottom Section - User Metrics & Top Diseases */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* User Metrics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-6">👥 User Metrics</h3>
              <div className="space-y-3">
                <OverviewItemPurple label="Active Today" value={userOverview?.activeToday || 0} color="#10B981" />
                <OverviewItemPurple label="New This Week" value={userOverview?.newThisWeek || 0} color="#3B82F6" />
                <OverviewItemPurple label="Verified Users" value={userOverview?.verified || 0} color="#A855F7" />
                <OverviewItemPurple label="Unverified" value={userOverview?.unverified || 0} color="#F59E0B" />
                <OverviewItemPurple label="Inactive (30d)" value={userOverview?.inactive || 0} color="#EF4444" />
              </div>
            </div>

            {/* Top Diseases */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-6">🦠 Top Diseases</h3>
              <div className="space-y-3">
                {topDiseases.slice(0, 5).map((disease, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <span className="text-sm text-gray-700 font-medium">#{disease.rank} {disease.disease}</span>
                    <span className="font-bold text-purple-600">{disease.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">🔔 Recent Activity</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide">
                {recentActivity.map((activity, index) => {
                  const isBungaActivity = activity.title?.toLowerCase().includes('bunga') || activity.description?.toLowerCase().includes('bunga');
                  return (
                    <div key={index} className="flex gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      {isBungaActivity ? (
                        <img src={logoImage} alt="Bunga" className="h-8 w-8 object-contain flex-shrink-0" />
                      ) : (
                        <div className="text-lg flex-shrink-0">{activity.icon}</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{activity.title}</div>
                        <div className="text-gray-600 text-xs mt-1">{activity.description}</div>
                        <div className="text-gray-400 text-xs mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <PurpleAction 
              label="Refresh Dashboard" 
              icon="🔄" 
              onClick={handleRefresh} 
              color="text-purple-600"
              disabled={refreshing}
            />
            <PurpleAction 
              label="View All Users" 
              icon="👥" 
              onClick={() => navigate('/admin/profile')} 
              color="text-blue-600"
            />
            <PurpleAction 
              label="View Reports" 
              icon="📊" 
              onClick={() => navigate('/admin/reports')} 
              color="text-pink-600"
            />
            <PurpleAction 
              label="System Health" 
              icon="⚙️" 
              onClick={() => {}} 
              color="text-teal-600"
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
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

// Purple Layout Helper Components
const PurpleStatCard = ({ title, value, icon, backgroundColor, subtitle, percentageChange }) => (
  <div className={`relative group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 p-6 text-white ${backgroundColor}`}>
    <div className="flex justify-between items-start mb-4">
      <div className="text-4xl">{icon}</div>
      <div className="text-sm font-semibold">{percentageChange}</div>
    </div>
    
    <div className="text-base font-medium opacity-90 mb-2">{title}</div>
    <div className="text-3xl font-bold mb-2">
      ${typeof value === 'number' && value > 999 ? (value / 1000).toFixed(1) + 'K+' : value > 999 ? value.toLocaleString() : value}
    </div>
    {subtitle && (
      <div className="text-sm opacity-80">{subtitle}</div>
    )}
  </div>
);

const PurpleChartCard = ({ title, children, className = '', onExpand }) => (
  <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-base font-bold text-gray-900">{title}</h3>
      <button
        onClick={onExpand}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-60 hover:opacity-100"
        title="Expand"
      >
        ⛶
      </button>
    </div>
    {children}
  </div>
);

const FullscreenChartModal = ({ chart, onClose, chartColors }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div className="bg-white rounded-lg border border-gray-300 w-full h-full max-w-6xl max-h-full shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-between items-center p-8 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          {chart.type === 'growth' && '📈 User Growth (Last 7 Days)'}
          {chart.type === 'distribution' && '📊 Analysis Distribution'}
          {chart.type === 'weekly' && '📅 Weekly Activity'}
        </h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 p-8 overflow-auto">
        {chart.type === 'growth' && (
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB' }} />
              <Line type="monotone" dataKey="users" stroke="#A855F7" strokeWidth={3} dot={{ fill: '#A855F7', r: 6 }} />
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
              <Tooltip formatter={(value) => value.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        )}
        {chart.type === 'weekly' && (
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E5E7EB' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="bunga" fill="#E91E63" radius={[8, 8, 0, 0]} />
              <Bar dataKey="leaf" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  </div>
);

const OverviewItemPurple = ({ label, value, color }) => (
  <div className="flex justify-between items-center">
    <span className="text-gray-700 font-medium text-sm">{label}</span>
    <span className="text-xl font-bold" style={{ color }}>{value}</span>
  </div>
);

const PurpleAction = ({ label, icon, onClick, color, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`relative group bg-white rounded-lg border border-gray-200 p-6 text-center shadow-sm hover:shadow-md transition-all duration-300 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
  >
    <div className={`text-4xl mb-3 group-hover:scale-110 transition-transform ${color}`}>{icon}</div>
    <div className="font-semibold text-gray-900 text-sm">{label}</div>
  </button>
);

export default AdminDashboard;
