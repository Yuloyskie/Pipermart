import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../shared/Header';

const BungaAnalysis = () => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const colors = {
    primary: '#1B4D3E',
    primaryDark: '#0D2818',
    primaryLight: '#27AE60',
    secondary: '#FFFFFF',
    background: '#F8FAF7',
    text: '#1B4D3E',
    textLight: '#5A7A73',
    border: '#D4E5DD',
    accent: '#D4AF37',
    warning: '#F39C12',
    danger: '#E74C3C',
    success: '#27AE60',
  };

  const ripenessRecommendations = {
    'Ripe': {
      icon: '🟢',
      title: 'Bunga is Ripe',
      description: 'Your black pepper bunga has reached optimal ripeness for harvesting.',
      actions: ['Harvest immediately for best flavor', 'Use sharp pruning shears to avoid damage', 'Store in cool, dry place', 'Process or dry within 24 hours'],
      color: colors.success
    },
    'Unripe': {
      icon: '🟡',
      title: 'Bunga Not Yet Ripe',
      description: 'The bunga requires more time to reach full ripeness.',
      actions: ['Wait 5-7 more days before harvesting', 'Ensure adequate water and nutrients', 'Protect from birds and pests', 'Check daily for color change'],
      color: colors.warning
    },
    'Rotten': {
      icon: '🔴',
      title: 'Bunga is Rotten',
      description: 'The bunga has deteriorated and is no longer usable.',
      actions: ['Remove immediately to prevent disease spread', 'Do not attempt to process or dry', 'Inspect nearby bunches for signs of rot', 'Improve ventilation to prevent future rot'],
      color: colors.danger
    }
  };

  const getMarketGrade = (classStr) => {
    if (!classStr) return null;
    if (classStr.toLowerCase() === 'rotten') {
      return { grade: 'Reject', icon: '❌', color: '#E74C3C', title: 'Reject Grade', description: 'This bunga is rotten and should not be processed or sold.', actions: ['Remove from harvest immediately', 'Do not process or dry', 'Prevent spread to other bunches'] };
    }
    const match = classStr.match(/Class\s*([A-D])-([a-d])/);
    if (!match) return null;
    const ripenessLetter = match[1];
    const healthLetter = match[2];
    if ((ripenessLetter === 'C' && healthLetter === 'd') || (ripenessLetter === 'D' && healthLetter === 'd')) {
      return { grade: 'Reject', icon: '❌', color: '#E74C3C', title: 'Reject Grade', description: 'This bunga is not suitable for processing.', actions: ['Do not harvest or process', 'Wait for better development'] };
    }
    if (ripenessLetter === 'A' && healthLetter === 'a') {
      return { grade: 'Premium', icon: '⭐', color: '#D4AF37', title: 'Premium Grade', description: 'Excellent quality bunga suitable for export.', actions: ['Harvest and dry immediately', 'Use specialized drying equipment', 'Store in airtight containers'] };
    }
    if ((ripenessLetter === 'A' && healthLetter === 'b') || (ripenessLetter === 'B' && (healthLetter === 'a' || healthLetter === 'b'))) {
      return { grade: 'Standard', icon: '✅', color: '#27AE60', title: 'Standard Grade', description: 'Good quality bunga for domestic markets.', actions: ['Harvest and dry using standard methods', 'Store in cool, dry conditions'] };
    }
    return { grade: 'Commercial', icon: '📦', color: '#F39C12', title: 'Commercial Grade', description: 'Acceptable for commercial use.', actions: ['Harvest and dry with care', 'Sort and remove defective portions'] };
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) { setError('Please select a valid image file'); return; }
      if (file.size > 10 * 1024 * 1024) { setError('Image size must be less than 10MB'); return; }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => { setPreview(reader.result); };
      reader.readAsDataURL(file);
      setError(null);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image) { setError('Please select an image first'); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    const startTime = Date.now();

    try {
      const token = localStorage.getItem('token');
      if (!token) { setError('Authentication token not found. Please login again.'); setLoading(false); return; }

      const formData = new FormData();
      formData.append('image', image);

      const response = await axios.post(`${API_BASE_URL}/api/v1/predict/bunga-with-objects`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` },
        timeout: 180000
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.data) {
        setResult({ ...response.data, processingTime: duration });
        setProcessingTime(duration);
      } else {
        setError('No result received from server');
      }
    } catch (err) {
      console.error('Prediction error:', err);
      let errorMsg = 'Failed to analyze image. Please try again.';
      if (err.response?.data?.error) errorMsg = err.response.data.error;
      else if (err.message === 'Network Error') errorMsg = 'Network error. Make sure backend is running.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resultInfo = result && result.ripeness ? ripenessRecommendations[result.ripeness] : null;
  const marketGrade = result && result.class ? getMarketGrade(result.class) : null;

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <Header />
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        minHeight: '100vh',
        zIndex: -1,
        background: `
          radial-gradient(ellipse at 20% 30%, rgba(0, 40, 20, 0.85) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(10, 30, 15, 0.75) 0%, transparent 50%),
          linear-gradient(180deg, rgba(10, 10, 10, 0.9) 0%, rgba(13, 26, 18, 0.85) 50%, rgba(10, 10, 10, 0.9) 100%),
          url('../../../paminta.webp')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }} />
      <div style={{ minHeight: '100vh', padding: '80px 20px 20px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '24px' }}>
          {/* Upload Section */}
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '40px', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)' }}>
            <h2 style={{ color: colors.text, fontSize: '24px', fontWeight: '800', margin: '0 0 24px 0' }}>🫒 Bunga Ripeness Analyzer</h2>
            <p style={{ color: colors.textLight, fontSize: '14px', margin: '0 0 24px 0' }}>Upload a clear image of your black pepper bunga. Our AI model will analyze ripeness, health grade, and market classification.</p>

            {preview ? (
              <div style={{ marginBottom: '24px', position: 'relative' }}>
                <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto', borderRadius: '12px', border: `2px solid ${colors.border}`, maxHeight: '300px', objectFit: 'cover' }} />
                <button onClick={() => { setImage(null); setPreview(null); setResult(null); setError(null); }} style={{ position: 'absolute', top: '8px', right: '8px', background: colors.danger, color: colors.secondary, border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px' }}>✕</button>
              </div>
            ) : (
              <div style={{ border: `2px dashed ${colors.border}`, borderRadius: '12px', padding: '40px', textAlign: 'center', marginBottom: '24px', backgroundColor: colors.background }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🫒</div>
                <div style={{ color: colors.text, fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No image selected</div>
                <div style={{ color: colors.textLight, fontSize: '13px' }}>Upload a bunga image to analyze</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} style={{ padding: '12px 16px', background: colors.primary, color: colors.secondary, border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px' }}>📁 {preview ? 'Change' : 'Upload'}</button>
              <button onClick={() => fileInputRef.current?.click()} disabled={loading} style={{ padding: '12px 16px', background: colors.primaryLight, color: colors.secondary, border: 'none', borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px' }}>📷 Camera</button>
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} style={{ display: 'none' }} />

            {error && <div style={{ background: '#FDF2F2', border: '2px solid #E74C3C', borderRadius: '12px', padding: '16px', marginBottom: '24px', color: '#E74C3C', fontSize: '14px' }}>⚠️ {error}</div>}

            <button onClick={handleAnalyze} disabled={!image || loading} style={{ width: '100%', padding: '16px', background: image ? colors.primary : '#B8D4C8', color: colors.secondary, border: 'none', borderRadius: '12px', cursor: image && !loading ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '16px' }}>{loading ? '🔄 Analyzing...' : '🔍 Analyze Bunga'}</button>
          </div>

          {/* Results Section */}
          {result && resultInfo && (
            <div style={{ background: colors.secondary, borderRadius: '16px', padding: '40px', boxShadow: `0 20px 60px rgba(27, 77, 62, 0.15)`, borderLeft: `4px solid ${resultInfo.color}` }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>{resultInfo.icon}</div>
                <h2 style={{ color: resultInfo.color, fontSize: '24px', fontWeight: '800', margin: '0 0 12px 0' }}>{resultInfo.title}</h2>
                <div style={{ fontSize: '18px', fontWeight: '700', color: colors.primary }}>{result.ripeness || 'Unknown'}</div>
              </div>

              {result.class && (
                <div style={{ background: colors.background, borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textLight, marginBottom: '8px' }}>Class</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: colors.primary }}>{result.class}</div>
                </div>
              )}

              <p style={{ color: colors.textLight, fontSize: '14px', lineHeight: '1.6', marginBottom: '24px', textAlign: 'center' }}>{resultInfo.description}</p>

              <div style={{ background: colors.background, borderRadius: '12px', padding: '20px', borderLeft: `4px solid ${resultInfo.color}` }}>
                <h4 style={{ color: colors.text, fontSize: '14px', fontWeight: '700', margin: '0 0 16px 0' }}>📋 Recommended Actions</h4>
                <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none' }}>
                  {resultInfo.actions.map((action, idx) => (
                    <li key={idx} style={{ color: colors.text, fontSize: '13px', marginBottom: '12px', paddingLeft: '28px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0', color: resultInfo.color }}>✓</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              <button onClick={() => { setImage(null); setPreview(null); setResult(null); setError(null); }} style={{ width: '100%', padding: '14px', marginTop: '24px', background: colors.primaryLight, color: colors.secondary, border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>🔄 Analyze Another Bunga</button>
            </div>
          )}
        </div>

        <div style={{ maxWidth: '1000px', margin: '40px auto 0', textAlign: 'center', color: colors.secondary, opacity: '0.8' }}>
          <p style={{ fontSize: '12px', margin: '0' }}>Model Accuracy: 98.5% | Bunga Classification with Health Grading</p>
        </div>
      </div>
    </div>
  );
};

export default BungaAnalysis;
