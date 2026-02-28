import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Forum.css';
import Header from '../shared/Header';
import Chat from '../Chat/Chat';

const CATEGORIES = [
  { name: 'All', icon: '💬' },
  { name: 'Disease Identification', icon: '🍃' },
  { name: 'Best Practices', icon: '✅' },
  { name: 'Regional Tips', icon: '🌍' },
  { name: 'Equipment & Tools', icon: '🔧' },
  { name: 'Success Stories', icon: '🏆' }
];

export default function Forum() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [draftCount, setDraftCount] = useState(0);
  const [composerText, setComposerText] = useState('');
  const [composerImages, setComposerImages] = useState([]);
  const [activeTab, setActiveTab] = useState('feed');
  const [filterType, setFilterType] = useState('all');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportingThreadId, setReportingThreadId] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const observerTarget = useRef(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    setPage(1);
    fetchThreads(1, true);
    fetchDraftCount();
  }, [activeCategory, activeTab, filterType, isLoggedIn]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading]);

  useEffect(() => {
    if (page > 1) {
      fetchThreads(page, false);
    }
  }, [page]);

  const fetchThreads = async (pageNum = 1, reset = true) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/forum/threads`;
      let params = {
        page: pageNum,
        limit: 10,
        ...(activeCategory !== 'All' && { category: activeCategory })
      };

      if (activeTab === 'feed') {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/forum/feed`;
        params = { filterType };
      } else if (activeTab === 'interested') {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/forum/threads/interested/all`;
        params = { page: pageNum, limit: 10 };
      } else if (activeTab === 'uninterested') {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/forum/threads/uninterested/all`;
        params = { page: pageNum, limit: 10 };
      } else if (activeTab === 'saved') {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/v1/forum/saved-threads`;
        params = { page: pageNum, limit: 10 };
      }

      const response = await axios.get(url, {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });

      let newThreads = response.data?.data || [];
      
      if (activeTab === 'saved' || activeTab === 'interested' || activeTab === 'uninterested') {
        newThreads = newThreads.map(item => item.threadId || item).filter(Boolean);
      }

      const totalPages = response.data?.pagination?.pages || 1;

      if (reset) {
        setThreads(newThreads);
      } else {
        setThreads(prev => [...prev, ...newThreads]);
      }

      setHasMore(pageNum < totalPages);
    } catch (error) {
      console.error('Error fetching threads:', error);
      if (page === 1) setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDraftCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/forum/threads/drafts/my-drafts`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDraftCount(response.data?.count || 0);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    }
  };

  const handleLikeThread = async (threadId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/forum/threads/${threadId}/like`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchThreads(1, true);
    } catch (error) {
      console.error('Error liking thread:', error);
    }
  };

  const handleMarkInterested = async (threadId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/forum/threads/${threadId}/interested`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchThreads(1, true);
    } catch (error) {
      console.error('Error marking thread as interested:', error);
    }
  };

  const handleMarkUninterested = async (threadId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/forum/threads/${threadId}/uninterested`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchThreads(1, true);
    } catch (error) {
      console.error('Error marking thread as uninterested:', error);
    }
  };

  const handleSaveThread = async (threadId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/forum/threads/${threadId}/save`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.isSaved) {
        alert('✅ Thread saved!');
      } else {
        alert('🔖 Thread removed from saved');
      }
    } catch (error) {
      console.error('Error saving thread:', error);
      alert('Failed to save thread');
    }
  };

  const handleReportThread = async () => {
    if (!reportReason.trim()) {
      alert('Please provide a reason for the report');
      return;
    }
    
    try {
      setSubmittingReport(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/forum/threads/${reportingThreadId}/report`,
        { reason: reportReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('✅ Report submitted. Thank you for keeping our community safe!');
      setReportModalOpen(false);
      setReportReason('');
      setReportingThreadId(null);
    } catch (error) {
      console.error('Error reporting thread:', error);
      alert(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setPage(1);
  };

  const handleComposerImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setComposerImages(prev => [...prev, ...newImages]);
  };

  const removeComposerImage = (index) => {
    setComposerImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = () => {
    if (!composerText.trim() && composerImages.length === 0) {
      alert('Please add text or images');
      return;
    }
    navigate('/forum/create', { state: { initialText: composerText, initialImages: composerImages } });
  };

  if (!isLoggedIn) {
    return (
      <>
        <Header />
        <div className="forum-container fb-layout">
          <div className="fb-main-wrapper">
            <div className="fb-feed-center">
              <div className="login-required-message">
                <div className="login-icon">🔐</div>
                <h2>Login Required</h2>
                <p>Please log in to view and participate in the forum discussions.</p>
                <button 
                  className="login-btn"
                  onClick={() => navigate('/login')}
                >
                  Log In
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="forum-container fb-layout">
        <div className="fb-main-wrapper">
          <div className="fb-sidebar-left">
            <div className="filter-section">
              <label>Show:</label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All Users
                </button>
                <button
                  className={`filter-btn ${filterType === 'friends' ? 'active' : ''}`}
                  onClick={() => setFilterType('friends')}
                >
                  Friends Only
                </button>
              </div>
            </div>

            <div className="forum-tabs">
              <button
                className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
                onClick={() => setActiveTab('feed')}
              >
                📰 Feed
              </button>
              <button
                className={`tab-btn ${activeTab === 'interested' ? 'active' : ''}`}
                onClick={() => setActiveTab('interested')}
              >
                ❤️ Interested
              </button>
              <button
                className={`tab-btn ${activeTab === 'uninterested' ? 'active' : ''}`}
                onClick={() => setActiveTab('uninterested')}
              >
                👎 Not Interested
              </button>
              <button
                className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
                onClick={() => setActiveTab('saved')}
              >
                🔖 Saved
              </button>
            </div>

            <div className="categories-list">
              <h3 className="sidebar-title">Categories</h3>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.name}
                  className={`category-item ${activeCategory === cat.name ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat.name)}
                >
                  <span className="cat-icon">{cat.icon}</span>
                  <span className="cat-name">{cat.name}</span>
                </button>
              ))}
            </div>

            {draftCount > 0 && (
              <div className="drafts-section">
                <Link to="/forum/drafts" className="drafts-link">
                  📝 My Drafts ({draftCount})
                </Link>
              </div>
            )}
          </div>

          <div className="fb-feed-center">
            <button
              className="create-post-btn"
              onClick={() => navigate('/forum/create')}
            >
              ✏️ Create New Post
            </button>

            <div className="threads-feed">
              {loading && page === 1 ? (
                <div className="loading-spinner">Loading discussions...</div>
              ) : threads.length === 0 && page === 1 ? (
                <div className="no-threads-message">
                  <p>No discussions yet. Be the first to start one!</p>
                </div>
              ) : (
                threads.map((thread) => (
                  <div key={thread._id} className="thread-card fb-post">
                    <div className="post-header">
                      <div className="author-section">
                        <div className="author-avatar-fb">
                          {thread.createdBy?.firstName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="author-info">
                          <p className="author-name-fb">
                            {thread.createdBy?.firstName} {thread.createdBy?.lastName}
                          </p>
                          <div className="post-meta">
                            <span className="post-time">
                              {new Date(thread.createdAt).toLocaleDateString()}
                            </span>
                            <span className="category-badge-inline">
                              {thread.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="post-content-wrapper">
                      <Link to={`/forum/thread/${thread._id}`} className="post-title-link">
                        <h2 className="post-title">{thread.title}</h2>
                      </Link>
                      <p className="post-body">{thread.description}</p>

                      {thread.images && thread.images.length > 0 && (
                        <div className="post-images-fb">
                          {thread.images.slice(0, 4).map((image, index) => (
                            <Link
                              key={index}
                              to={`/forum/thread/${thread._id}`}
                              className="post-image-wrapper"
                            >
                              <img src={image.url} alt={`Image ${index + 1}`} />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="post-stats-fb">
                      <span>👍 {thread.likesCount}</span>
                      <span>💬 {thread.repliesCount}</span>
                      <span>👁️ {thread.views}</span>
                    </div>

                    <div className="post-actions-fb">
                      <button
                        className="post-action-link"
                        onClick={() => handleLikeThread(thread._id)}
                      >
                        👍 Like
                      </button>
                      <button
                        className="post-action-link"
                        onClick={() => handleMarkInterested(thread._id)}
                        title="Mark as interested"
                      >
                        ❤️ Interested
                      </button>
                      <button
                        className="post-action-link"
                        onClick={() => handleMarkUninterested(thread._id)}
                        title="Mark as not interested"
                      >
                        👎 Not Interested
                      </button>
                      <Link
                        to={`/forum/thread/${thread._id}`}
                        className="post-action-link"
                      >
                        💬 Reply
                      </Link>
                      <button
                        className="post-action-link"
                        onClick={() => handleSaveThread(thread._id)}
                        title="Save thread"
                      >
                        🔖 Save
                      </button>
                      <button
                        className="post-action-link"
                        onClick={() => {
                          setReportingThreadId(thread._id);
                          setReportModalOpen(true);
                        }}
                        title="Report thread"
                      >
                        🚩 Report
                      </button>
                    </div>
                  </div>
                ))
              )}

              {hasMore && threads.length > 0 && (
                <div ref={observerTarget} className="scroll-trigger">
                  {loading && page > 1 && <div className="loading-spinner">Loading more...</div>}
                </div>
              )}
            </div>
          </div>

          <div className="fb-sidebar-right"></div>
        </div>
      </div>

      {reportModalOpen && (
        <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setReportModalOpen(false)}
            >
              ✕
            </button>
            <div className="modal-header">
              <h3>🚩 Report Thread</h3>
            </div>
            <div className="modal-body">
              <p>Help us keep our community safe. Please describe why you're reporting this thread.</p>
              <textarea
                className="report-textarea"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue (e.g., inappropriate content, spam, harassment)..."
                rows={5}
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setReportModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleReportThread}
                disabled={submittingReport}
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>  );
}
