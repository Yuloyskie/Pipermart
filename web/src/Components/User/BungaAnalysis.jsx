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
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes scan {
        0% { top: 0%; }
        100% { top: 100%; }
      }
      .scanning-bar {
        position: absolute;
        left: 0;
        width: 100%;
        height: 4px;
        background: rgba(39, 174, 96, 0.8);
        box-shadow: 0 0 15px 5px rgba(39, 174, 96, 0.5);
        z-index: 10;
        animation: scan 2s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }, []);

  const colors = {
    primary: '#1B4D3E',
    primaryLight: '#27AE60',
    secondary: '#ffffffbb',
    background: '#f8faf798',
    text: '#1B4D3E',
    textLight: '#3c4d49f6',
    border: '#D4E5DD',
    accent: '#D4AF37',
    danger: '#E74C3C',
  };

  const ripenessRecommendations = {
    'Ripe': {
      icon: '🟢',
      title: 'Bunga is Ripe',
      description: 'Your black pepper bunga has reached optimal ripeness for harvesting.',
      actions: ['Harvest immediately for best flavor', 'Use sharp pruning shears to avoid damage', 'Store in cool, dry place', 'Process or dry within 24 hours'],
      color: colors.primaryLight
    },
    'Unripe': {
      icon: '🟡',
      title: 'Bunga Not Yet Ripe',
      description: 'The bunga requires more time to reach full ripeness.',
      actions: ['Wait 5-7 more days before harvesting', 'Ensure adequate water and nutrients', 'Protect from birds and pests', 'Check daily for color change'],
      color: '#F39C12'
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

    try {
      const token = localStorage.getItem('token');
      if (!token) { setError('Authentication token not found. Please login again.'); setLoading(false); return; }

      const formData = new FormData();
      formData.append('image', image);

      const response = await axios.post(`${API_BASE_URL}/api/v1/predict/bunga-with-objects`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` },
        timeout: 180000
      });

      if (response.data) {
        setResult(response.data);
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
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: 'Inter, sans-serif' }}>
      <Header />
      {/* Background stays as requested */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', minHeight: '100vh', zIndex: -1,
        background: `radial-gradient(ellipse at 20% 30%, rgba(0, 40, 20, 0.85) 0%, transparent 50%), linear-gradient(180deg, rgba(10, 10, 10, 0.9) 0%, rgba(13, 26, 18, 0.85) 50%, rgba(10, 10, 10, 0.9) 100%)`,
      }} />

      <div style={{ padding: '100px 20px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Dual Card Layout - Two separate cards */}
          <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '24px' }}>
            
            {/* Card 1: Image/Input Area */}
            <div style={{ 
              background: 'white', borderRadius: '24px', 
              overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.61)'
            }}>
              {/* Top Header Bar */}
              <div style={{ padding: '20px 30px', borderBottom: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>🫒</span>
                  <h2 style={{ margin: 0, color: colors.primary, fontSize: '20px', fontWeight: '800' }}>Bunga Ripeness Analyzer</h2>
                </div>
              </div>

              <div style={{ padding: '30px' }}>
                <p style={{ color: colors.textLight, fontSize: '14px', marginBottom: '20px' }}>
                  Upload a clear image of your black pepper bunga. Our AI model will analyze ripeness, health grade, and market classification.
                </p>
                
                <div style={{ position: 'relative', width: '100%', height: result ? '500px' : '350px', backgroundColor: '#f1f5f9', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${colors.border}`, transition: 'height 0.3s ease' }}>
                  {preview ? (
                    <>
                      <img src={preview} alt="Bunga" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {loading && <div className="scanning-bar" />}
                      {loading && (
                        <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', textAlign: 'center', color: 'white', textShadow: '0 2px 4px black' }}>
                          Detecting Ripeness...<br/>Calculating Health...
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: colors.textLight }}>
                      <span style={{ fontSize: '48px' }}>📸</span>
                      <p>Waiting for image...</p>
                    </div>
                  )}
                </div>
                
                {/* Button Arrangement: Change and Camera side-by-side above Analyze */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '20px' }}>
                  <button onClick={() => fileInputRef.current?.click()} disabled={loading} style={{ padding: '12px 16px', borderRadius: '12px', border: 'none', background: '#04752a', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px' }}>📁 Change</button>
                  <button onClick={() => fileInputRef.current?.click()} disabled={loading} style={{ padding: '12px 16px', borderRadius: '12px', border: 'none', background: '#050505f5', color: 'white', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '14px' }}>📷 Camera</button>
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageSelect} style={{ display: 'none' }} />

                {error && <div style={{ background: '#FDF2F2', border: '2px solid #E74C3C', borderRadius: '12px', padding: '16px', marginTop: '20px', color: '#E74C3C', fontSize: '14px' }}>⚠️ {error}</div>}

                {!result && (
                  <button 
                    onClick={handleAnalyze} 
                    disabled={!image || loading}
                    style={{ width: '100%', marginTop: '20px', padding: '15px', borderRadius: '12px', border: 'none', background: image ? colors.primaryLight : '#B8D4C8', color: 'white', fontWeight: '700', cursor: image && !loading ? 'pointer' : 'not-allowed' }}
                  >
                    {loading ? 'Processing...' : 'Analyze Bunga'}
                  </button>
                )}
              </div>
            </div>

            {/* Card 2: Results Area */}
            {result && (
              <div style={{ 
                background: 'white', borderRadius: '24px', 
                overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
              }}>
                {/* Results Header */}
                <div style={{ padding: '20px 30px', borderBottom: `1px solid ${colors.border}` }}>
                  <h2 style={{ margin: 0, color: colors.primary, fontSize: '20px', fontWeight: '800' }}>Analysis Results</h2>
                </div>

                <div style={{ padding: '30px' }}>
                  {/* Icon/Title - Large icon at top center */}
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '10px' }}>{resultInfo?.icon || '📊'}</div>
                    <h3 style={{ margin: 0, color: resultInfo?.color || colors.primary, fontSize: '22px', fontWeight: '800' }}>{resultInfo?.title || 'Analysis Complete'}</h3>
                  </div>

                  {/* Class Box - Light grey full-width box */}
                  <div style={{ background: '#F1F5F9', padding: '16px', borderRadius: '12px', textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', color: colors.textLight, marginBottom: '5px' }}>Class</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: colors.primary }}>{result.class || 'Class A-a'}</div>
                  </div>

                  {/* Description - Centered text */}
                  <p style={{ textAlign: 'center', color: colors.textLight, fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>
                    {resultInfo?.description || 'Your bunga has been analyzed successfully.'}
                  </p>

                  {/* Recommended Actions - Inside bordered box with checkmark list */}
                  <div style={{ border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: colors.primary, fontSize: '14px', fontWeight: '700' }}>Recommended Actions</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: colors.text, fontSize: '13px' }}>
                      {resultInfo?.actions?.map((action, idx) => (
                        <li key={idx} style={{ marginBottom: '8px' }}>{action}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Market Grade Info */}
                  {marketGrade && (
                    <div style={{ border: `1px solid ${colors.border}`, borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 8px 0', color: colors.primary, fontSize: '14px', fontWeight: '700' }}>{marketGrade.title}</h4>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: colors.textLight }}>{marketGrade.description}</p>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: colors.text, fontSize: '12px' }}>
                        {marketGrade.actions?.map((action, idx) => (
                          <li key={idx} style={{ marginBottom: '5px' }}>{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Bottom Action Button - Full-width green button */}
                  <button 
                    onClick={() => {setResult(null); setPreview(null); setImage(null);}}
                    style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', background: colors.primaryLight, color: 'white', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Analyze Another Bunga
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px', color: 'white', opacity: 0.7, fontSize: '12px' }}>
            Model Accuracy: 98.5% | Bunga Classification with Health Grading
          </div>
        </div>
      </div>
    </div>
  );
};

export default BungaAnalysis;
