import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import Header from '../shared/Header';
import Footer from '../shared/Footer';
import './Mapping.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
});

// Suitability Scoring Algorithm - Based on Black Pepper (Piper nigrum) Specifications
const calculateSuitabilityScore = (weatherData, elevation, annualRainfall, soilPH, latitude) => {
  const scores = {
    temperature: 0,
    humidity: 0,
    rainfall: 0,
    elevation: 0,
    soilPH: 0,
    latitude: 0
  };
  
  // 1. Temperature scoring (optimal: 23-32°C, ideal: 28°C)
  const temp = weatherData.temp || 26;
  if (temp < 0) scores.temperature = -50;
  else if (temp < 23) scores.temperature = -20;
  else if (temp >= 23 && temp <= 32) scores.temperature = 20;
  else if (temp > 32) scores.temperature = -15;
  
  // 2. Humidity scoring (optimal: 60-80%)
  const humidity = weatherData.humidity || 72;
  if (humidity < 60) scores.humidity = -15;
  else if (humidity >= 60 && humidity <= 80) scores.humidity = 15;
  else if (humidity > 90) scores.humidity = -10;
  else scores.humidity = 8;
  
  // 3. Annual Rainfall scoring (optimal: 1500-2500mm)
  const rainfall = annualRainfall || 2000;
  if (rainfall < 1200) scores.rainfall = -25;
  else if (rainfall < 1500) scores.rainfall = -10;
  else if (rainfall >= 1500 && rainfall <= 2500) scores.rainfall = 25;
  else if (rainfall <= 3000) scores.rainfall = 20;
  else scores.rainfall = -5;
  
  // 4. Elevation scoring (optimal: varies by latitude, max 1500m)
  const elev = elevation || 100;
  if (elev > 1500) scores.elevation = -20;
  else if (elev <= 1000) scores.elevation = 15;
  else scores.elevation = 10;
  
  // 5. Soil pH scoring (optimal: 5.5-6.5, slightly acidic)
  const pH = soilPH || 6.0;
  if (pH < 5.0) scores.soilPH = -10;
  else if (pH < 5.5) scores.soilPH = -5;
  else if (pH >= 5.5 && pH <= 6.5) scores.soilPH = 20;
  else if (pH <= 7.0) scores.soilPH = -5;
  else scores.soilPH = -20;
  
  // 6. Latitude scoring (optimal: 20°N to 20°S)
  const absLat = Math.abs(latitude || 0);
  if (absLat > 30) scores.latitude = -30;
  else if (absLat > 20) scores.latitude = -15;
  else if (absLat > 15) scores.latitude = 10;
  else if (absLat > 10) scores.latitude = 15;
  else scores.latitude = 20;
  
  // Calculate total with normalized range
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const maxPossible = 115;
  const percentage = Math.max(0, Math.min(100, (totalScore / maxPossible) * 100));
  
  return {
    overall: Math.round(percentage),
    factors: scores,
    details: {
      temperature: temp,
      humidity,
      rainfall,
      elevation: elev,
      soilPH: pH,
      latitude
    }
  };
};

const getSuitabilityRating = (score) => {
  if (score >= 85) return { rating: 'Excellent', color: '#27AE60', icon: '🟢', text: 'Ideal for cultivation' };
  if (score >= 70) return { rating: 'Good', color: '#52C41A', icon: '🟢', text: 'Well-suited' };
  if (score >= 55) return { rating: 'Fair', color: '#F39C12', icon: '🟡', text: 'Marginal - may need special care' };
  if (score >= 40) return { rating: 'Poor', color: '#E67E22', icon: '🟠', text: 'Challenging conditions' };
  return { rating: 'Unsuitable', color: '#E74C3C', icon: '🔴', text: 'Not recommended' };
};

const getDetailedRecommendations = (temp, humidity, rainfall, elevation, soilPH, latitude) => {
  const recommendations = [];
  
  if (temp < 23) {
    recommendations.push({ title: '🌡️ Temperature Too Low', message: `${temp}°C is below optimal (23-32°C). Growth will be slow. Consider microclimate management.`, type: 'warning' });
  } else if (temp > 32) {
    recommendations.push({ title: '🌡️ Temperature High', message: `${temp}°C exceeds optimal range. Ensure adequate shade and irrigation.`, type: 'warning' });
  } else {
    recommendations.push({ title: '✅ Temperature Optimal', message: `${temp}°C is in ideal range (23-32°C) for black pepper.`, type: 'success' });
  }
  
  if (humidity < 60) {
    recommendations.push({ title: '💧 Humidity Low', message: `${humidity}% is below optimal (60-80%). Requires irrigation and mulching.`, type: 'warning' });
  } else if (humidity > 90) {
    recommendations.push({ title: '💧 High Humidity Risk', message: `${humidity}% may increase disease risk. Ensure good drainage and ventilation.`, type: 'warning' });
  } else {
    recommendations.push({ title: '✅ Humidity Optimal', message: `${humidity}% is ideal for black pepper cultivation.`, type: 'success' });
  }
  
  if (rainfall < 1500) {
    recommendations.push({ title: '🌧️ Insufficient Rainfall', message: `${rainfall}mm/year is below requirement (1500-2500mm). Supplemental irrigation essential.`, type: 'danger' });
  } else if (rainfall <= 2500) {
    recommendations.push({ title: '✅ Rainfall Optimal', message: `${rainfall}mm/year is in ideal range (1500-2500mm).`, type: 'success' });
  } else if (rainfall <= 3000) {
    recommendations.push({ title: '🌧️ High Rainfall', message: `${rainfall}mm/year may cause waterlogging. Improve drainage system.`, type: 'warning' });
  }
  
  if (elevation > 1000) {
    recommendations.push({ title: '⛰️ Elevation High', message: `${elevation}m is above optimal range. Temperature will be lower. Suitable for cooler zones.`, type: 'warning' });
  } else {
    recommendations.push({ title: '✅ Elevation Suitable', message: `${elevation}m is within optimal range (0-1000m).`, type: 'success' });
  }
  
  if (soilPH < 5.5) {
    recommendations.push({ title: '🧪 Soil Too Acidic', message: `pH ${soilPH.toFixed(2)} is too acidic. Apply lime to bring pH closer to 5.5-6.5.`, type: 'warning' });
  } else if (soilPH <= 6.5) {
    recommendations.push({ title: '✅ Soil pH Optimal', message: `pH ${soilPH.toFixed(2)} is in ideal range (5.5-6.5) for black pepper.`, type: 'success' });
  } else {
    recommendations.push({ title: '🧪 Soil Too Alkaline', message: `pH ${soilPH.toFixed(2)} is too alkaline. Black pepper prefers acidic soil. Consider sulfur application.`, type: 'warning' });
  }
  
  const absLat = Math.abs(latitude);
  if (absLat <= 15) {
    recommendations.push({ title: '✅ Latitude Excellent', message: `Located at ideal tropical zone (${latitude.toFixed(2)}°). Perfect for black pepper.`, type: 'success' });
  } else if (absLat <= 20) {
    recommendations.push({ title: '✅ Latitude Good', message: `Located at ${latitude.toFixed(2)}°. Suitable for black pepper cultivation.`, type: 'success' });
  } else {
    recommendations.push({ title: '⚠️ Latitude Marginal', message: `Located at ${latitude.toFixed(2)}° - outside optimal tropical zone (20°N-20°S).`, type: 'warning' });
  }
  
  return recommendations;
};

export default function MacromappingPage() {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: 14.5994, lng: 120.9842 });
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const mapRef = useRef(null);

  const [routeMode, setRouteMode] = useState(false);
  const [routeStart, setRouteStart] = useState(null);
  const [routeEnd, setRouteEnd] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const colors = {
    primary: '#1B4D3E',
    primaryDark: '#0D2818',
    background: '#F8FAF7',
    text: '#1B4D3E',
    textLight: '#5A7A73',
    border: '#D4E5DD',
    success: '#27AE60',
    warning: '#F39C12',
    danger: '#E74C3C',
  };

  const saveAnalysisToDatabase = async (analysis) => {
    const token = getAuthToken();
    
    if (!token) {
      setSavedMessage('Please login to save analyses');
      setTimeout(() => setSavedMessage(''), 3000);
      return;
    }

    try {
      setSaving(true);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/macromap/save`,
        {
          name: analysis.name,
          displayName: analysis.displayName,
          locationDetails: analysis.locationDetails,
          latitude: analysis.latitude,
          longitude: analysis.longitude,
          weather: analysis.weather,
          elevation: analysis.elevation,
          annualRainfall: analysis.annualRainfall,
          soilPH: analysis.soilPH,
          score: analysis.score,
          scoreFactors: analysis.scoreFactors,
          rating: analysis.rating.rating,
          recommendations: analysis.recommendations
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setSavedMessage('✅ Analysis saved successfully!');
        const updatedAnalysis = { ...analysis, _id: response.data.data._id, saved: true };
        setSelectedAnalysis(updatedAnalysis);
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
      if (error.response?.status === 401) {
        setSavedMessage('Please login to save analyses');
      } else {
        setSavedMessage('Failed to save analysis');
      }
    } finally {
      setSaving(false);
      setTimeout(() => setSavedMessage(''), 3000);
    }
  };

  const loadSavedAnalyses = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/macromap/analyses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success && response.data.data.length > 0) {
        const savedAnalyses = response.data.data.map(item => ({
          id: item._id,
          _id: item._id,
          name: item.name,
          displayName: item.displayName,
          locationDetails: item.locationDetails,
          latitude: item.latitude,
          longitude: item.longitude,
          weather: item.weather,
          elevation: item.elevation,
          annualRainfall: item.annualRainfall,
          soilPH: item.soilPH,
          score: item.score,
          scoreFactors: item.scoreFactors,
          rating: getSuitabilityRating(item.score),
          recommendations: item.recommendations,
          timestamp: new Date(item.createdAt).toLocaleDateString(),
          time: new Date(item.createdAt).toLocaleTimeString(),
          saved: true
        }));
        setAnalyses(savedAnalyses);
      }
    } catch (error) {
      console.error('Error loading saved analyses:', error);
    }
  };

  const deleteSavedAnalysis = async (analysisId) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/api/v1/macromap/analyses/${analysisId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalyses(analyses.filter(a => a._id !== analysisId));
      if (selectedAnalysis?._id === analysisId) {
        setShowResults(false);
        setSelectedAnalysis(null);
      }
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };

  useEffect(() => {
    initializeMap();
    loadSavedAnalyses();
  }, []);

  const initializeMap = async () => {
    try {
      setLoading(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
            setLoading(false);
          },
          (error) => { console.warn('Geolocation error, using default:', error); setLoading(false); }
        );
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setLoading(false);
    }
  };

  const analyzeLocation = async (latitude, longitude) => {
    try {
      setAnalyzing(true);
      
      let locationName = 'Selected Location';
      let locationDetails = { street: '', village: '', town: '', city: '', county: '', state: '', country: '', postalcode: '' };
      let displayName = '';
      
      try {
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
        const geoData = await geoResponse.json();
        if (geoData.address) {
          locationDetails = {
            street: geoData.address.road || geoData.address.street || '',
            village: geoData.address.village || '',
            town: geoData.address.town || '',
            city: geoData.address.city || '',
            county: geoData.address.county || '',
            state: geoData.address.state || '',
            country: geoData.address.country || '',
            postalcode: geoData.address.postcode || ''
          };
          displayName = geoData.display_name || '';
          locationName = geoData.address.city || geoData.address.town || geoData.address.village || 'Selected Location';
        }
      } catch (geoError) {
        console.warn('Reverse geocoding failed:', geoError);
      }
      
      // Get weather data via backend proxy (avoids CORS)
      let weatherData = { temp: 26, humidity: 72, rainProbability: 65, windSpeed: 12, condition: 'Partly Cloudy' };
      
      try {
        const weatherResponse = await axios.post(
          `${API_BASE_URL}/api/v1/macromap/weather`,
          { latitude, longitude }
        );
        if (weatherResponse.data.success && weatherResponse.data.weather) {
          weatherData = weatherResponse.data.weather;
        }
      } catch (weatherError) {
        console.warn('Weather API error, using fallback:', weatherError);
      }
      
      // Get elevation data
      let elevation = 100;
      try {
        const elevResponse = await axios.get(`https://api.open-elevation.com/api/v1/lookup?locations=${latitude},${longitude}`);
        if (elevResponse.data.results && elevResponse.data.results.length > 0) {
          elevation = Math.round(elevResponse.data.results[0].elevation);
        }
      } catch (elevError) {
        console.warn('Elevation API error, using fallback:', elevError);
      }
      
      // Get annual rainfall from NASA POWER API (via backend proxy)
      let annualRainfall = 2000;
      try {
        const nasaResponse = await axios.post(
          `${API_BASE_URL}/api/v1/macromap/rainfall`,
          { longitude, latitude, start: 2020, end: 2022 }
        );
        if (nasaResponse.data.success && nasaResponse.data.annualRainfall) {
          annualRainfall = nasaResponse.data.annualRainfall;
        }
      } catch (nasaError) {
        console.warn('Rainfall API error, using fallback rainfall:', nasaError.message);
      }
      
      // Get soil pH from SoilGrids API (via backend proxy)
      let soilPH = 6.0;
      try {
        const soilResponse = await axios.post(
          `${API_BASE_URL}/api/v1/macromap/soil-ph`,
          { longitude, latitude, depth: '0-5cm' }
        );
        if (soilResponse.data.success && soilResponse.data.soilPH) {
          soilPH = soilResponse.data.soilPH;
        }
      } catch (soilError) {
        console.warn('Soil pH API error, using fallback soil pH:', soilError.message);
      }
      
      const scoreResult = calculateSuitabilityScore(weatherData, elevation, annualRainfall, soilPH, latitude);
      const rating = getSuitabilityRating(scoreResult.overall);
      const recommendations = getDetailedRecommendations(
        scoreResult.details.temperature,
        scoreResult.details.humidity,
        scoreResult.details.rainfall,
        scoreResult.details.elevation,
        parseFloat(soilPH),
        latitude
      );
      
      const analysis = {
        id: Date.now(),
        name: locationName,
        displayName,
        locationDetails,
        latitude,
        longitude,
        weather: weatherData,
        elevation,
        annualRainfall,
        soilPH: parseFloat(soilPH),
        score: scoreResult.overall,
        scoreFactors: scoreResult.factors,
        rating,
        recommendations,
        timestamp: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
      };
      
      setSelectedAnalysis(analysis);
      setAnalyses([analysis, ...analyses]);
      setShowResults(true);
      setAnalyzing(false);
      
      saveAnalysisToDatabase(analysis);
    } catch (error) {
      console.error('Error analyzing location:', error);
      setAnalyzing(false);
    }
  };

  const getRoute = async (startLat, startLng, endLat, endLng) => {
    try {
      setRouteLoading(true);
      setRouteError(null);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/macromap/route`,
        { startLat, startLng, endLat, endLng }
      );
      
      if (response.data.success && response.data.route) {
        const route = response.data.route;
        setRouteData({
          geometry: route.geometry,
          distance: route.distance,
          duration: route.duration,
          distanceKm: route.distanceKm,
          durationMinutes: route.durationMinutes,
          legs: route.legs
        });
      } else {
        setRouteError(response.data.error || 'No route found between these locations');
      }
    } catch (error) {
      console.error('Route calculation error:', error.message);
      setRouteError('Failed to calculate route. Please try again.');
    } finally {
      setRouteLoading(false);
    }
  };

  const handleMapClickForRoute = (lat, lng) => {
    if (!routeMode) return;
    
    if (!routeStart) {
      setRouteStart({ lat, lng });
    } else if (!routeEnd) {
      setRouteEnd({ lat, lng });
      getRoute(routeStart.lat, routeStart.lng, lat, lng);
    } else {
      setRouteStart({ lat, lng });
      setRouteEnd(null);
      setRouteData(null);
    }
  };

  const toggleRouteMode = () => {
    setRouteMode(!routeMode);
    if (routeMode) {
      setRouteStart(null);
      setRouteEnd(null);
      setRouteData(null);
      setRouteError(null);
    }
  };

  const clearRoute = () => {
    setRouteStart(null);
    setRouteEnd(null);
    setRouteData(null);
    setRouteError(null);
  };

  const MapClickHandler = ({ onAnalyze, routeMode, onRouteClick }) => {
    const map = useMap();
    
    useMapEvents({
      click: (e) => {
        if (routeMode) {
          onRouteClick(e.latlng.lat, e.latlng.lng);
        } else {
          onAnalyze(e.latlng.lat, e.latlng.lng);
        }
      }
    });
    
    useEffect(() => {
      setTimeout(() => map.invalidateSize(), 100);
    }, [map]);
    
    return null;
  };

  if (loading) {
    return (
      <div className="mapping-page">
        <Header />
        <div className="mapping-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading map...</p>
            <p className="loading-subtext">Getting your location</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="mapping-page">
      <Header />
      <div className="mapping-container">
        <motion.div className="info-card" style={{ backgroundColor: 'rgba(27, 77, 62, 0.95)', border: '1px solid rgba(255,255,255,0.1)' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="info-content">
            <h2 style={{ color: '#FFFFFF', marginBottom: 8 }}>🌾 Black Pepper Macromapping</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)' }}>
              {routeMode ? '🛣️ Route Mode: Click to set start and end points for your route calculation.' : '📍 Analysis Mode: Click anywhere on the map to analyze suitability for black pepper cultivation.'}
            </p>
          </div>
        </motion.div>

        <div className="macromapping-grid">
          <div className="map-section-enhanced">
            <div className="map-header-enhanced">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div>
                  <h1>{routeMode ? '🛣️ Route Calculator' : '🗺️ Suitability Heatmap'}</h1>
                  <p>{routeMode ? 'Set start and destination points' : 'Click any location to analyze'}</p>
                </div>
                <button onClick={toggleRouteMode} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: routeMode ? '#E74C3C' : 'linear-gradient(135deg, #27AE60 0%, #1B4D3E 100%)', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                  {routeMode ? '❌ Cancel Route' : '🛣️ Get Route'}
                </button>
              </div>
              {routeMode && <p style={{ color: '#F39C12', marginTop: '8px', fontSize: '13px' }}>📍 Click on map to set start point, then click again to set destination</p>}
            </div>

            <div className="map-wrapper-enhanced">
              {userLocation && (
                <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} scrollWheelZoom={true} className="map-enhanced" style={{ width: '100%', height: '100%' }}>
                  <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={L.divIcon({ html: `<div style="background-color: ${colors.primary}; border-radius: 50%; width: 20px; height: 20px; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`, className: 'user-marker', iconSize: [20, 20] })}>
                    <Popup>📍 Your Location</Popup>
                  </Marker>

                  <Circle center={[userLocation.lat, userLocation.lng]} radius={1000} pathOptions={{ color: colors.primary, fill: false, weight: 1, opacity: 0.3, dashArray: '5, 5' }} />

                  {analyses.map((analysis) => (
                    <Marker key={analysis.id} position={[analysis.latitude, analysis.longitude]} icon={L.divIcon({ html: `<div style="background-color: ${analysis.rating.color}; border-radius: 50%; width: 28px; height: 28px; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;">${analysis.score}</div>`, className: 'analysis-marker', iconSize: [28, 28] })} eventHandlers={{ click: () => { setSelectedAnalysis(analysis); setShowResults(true); }}}>
                      <Popup><div className="popup-analysis"><strong>{analysis.name}</strong><p>Score: {analysis.score}%</p><p>{analysis.rating.rating}</p></div></Popup>
                    </Marker>
                  ))}

                  {analyses.map((analysis) => (
                    <Circle key={`heat-${analysis.id}`} center={[analysis.latitude, analysis.longitude]} radius={500} pathOptions={{ fillColor: analysis.rating.color, fillOpacity: 0.15, color: analysis.rating.color, weight: 1, opacity: 0.3 }} />
                  ))}

                  {routeStart && (
                    <Marker position={[routeStart.lat, routeStart.lng]} icon={L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] })}>
                      <Popup><div><strong>🟢 Route Start</strong><br />Lat: {routeStart.lat.toFixed(4)}, Lng: {routeStart.lng.toFixed(4)}</div></Popup>
                    </Marker>
                  )}

                  {routeEnd && (
                    <Marker position={[routeEnd.lat, routeEnd.lng]} icon={L.icon({ iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png', shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] })}>
                      <Popup><div><strong>🔴 Route End</strong><br />Lat: {routeEnd.lat.toFixed(4)}, Lng: {routeEnd.lng.toFixed(4)}</div></Popup>
                    </Marker>
                  )}

                  {routeData && routeData.geometry && routeData.geometry.length > 0 && (
                    <Polyline positions={routeData.geometry.map(coord => [coord[1], coord[0]])} pathOptions={{ color: '#3498DB', weight: 4, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} />
                  )}

                  <MapClickHandler onAnalyze={analyzeLocation} routeMode={routeMode} onRouteClick={handleMapClickForRoute} />
                </MapContainer>
              )}
            </div>

            <motion.div className="map-legend-enhanced" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              <h3>Suitability Scale</h3>
              <div className="legend-grid">
                <div className="legend-item"><div style={{ backgroundColor: '#E74C3C' }} className="legend-color"></div><span>Poor (0-39%)</span></div>
                <div className="legend-item"><div style={{ backgroundColor: '#E67E22' }} className="legend-color"></div><span>Fair (40-59%)</span></div>
                <div className="legend-item"><div style={{ backgroundColor: '#F39C12' }} className="legend-color"></div><span>Good (60-79%)</span></div>
                <div className="legend-item"><div style={{ backgroundColor: '#27AE60' }} className="legend-color"></div><span>Excellent (80-100%)</span></div>
              </div>
            </motion.div>

            <div className="map-info">
              <div className="info-row">
                <div className="info-item"><div style={{ backgroundColor: colors.primary }} className="info-dot"></div><span>Your Location</span></div>
                <div className="info-item"><div style={{ backgroundColor: '#F39C12' }} className="info-dot"></div><span>Analyzed Location</span></div>
                {routeMode && (<><div className="info-item"><div style={{ backgroundColor: '#27AE60' }} className="info-dot"></div><span>Route Start</span></div><div className="info-item"><div style={{ backgroundColor: '#E74C3C' }} className="info-dot"></div><span>Route End</span></div></>)}
              </div>
            </div>

            {routeData && (
              <motion.div className="route-info-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} style={{ backgroundColor: 'rgba(52, 152, 219, 0.95)', border: '2px solid #3498DB', borderRadius: '12px', padding: '16px', marginTop: '12px', color: 'white', textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>🛣️ Route Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><p style={{ margin: '0 0 4px 0', opacity: 0.9, fontSize: '13px' }}>Distance</p><p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{routeData.distanceKm} km</p></div>
                  <div><p style={{ margin: '0 0 4px 0', opacity: 0.9, fontSize: '13px' }}>Duration</p><p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{routeData.durationMinutes} min</p></div>
                </div>
                <button onClick={clearRoute} style={{ marginTop: '12px', width: '100%', padding: '10px', background: 'rgba(255,255,255,0.2)', border: '1px solid white', borderRadius: '6px', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Clear Route</button>
              </motion.div>
            )}

            {routeLoading && (
              <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(52, 152, 219, 0.1)', border: '1px solid #3498DB', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: '#3498DB' }}>
                <div style={{ width: '16px', height: '16px', border: '2px solid #3498DB', borderRadius: '50%', borderTop: '2px solid transparent', animation: 'spin 1s linear infinite' }}></div>
                <span>Calculating route...</span>
              </div>
            )}

            {routeError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '12px', padding: '12px', backgroundColor: 'rgba(231, 76, 60, 0.1)', border: '1px solid #E74C3C', borderRadius: '8px', color: '#E74C3C', fontSize: '13px' }}>⚠️ {routeError}</motion.div>
            )}

            {analyzing && (
              <div className="analyzing-indicator"><div className="spinner-small"></div><span>Analyzing location...</span></div>
            )}
          </div>

          <AnimatePresence>
            {showResults && selectedAnalysis && (
              <motion.div className="results-panel" initial={{ opacity: 0, x: 400 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 400 }} transition={{ duration: 0.3 }}>
                <div className="results-header"><h2>{selectedAnalysis.name}</h2><button onClick={() => setShowResults(false)} className="close-btn">✕</button></div>

                <div className="score-card" style={{ backgroundColor: selectedAnalysis.rating.color }}>
                  <div className="score-content">
                    <p className="score-label">Suitability Score</p>
                    <p className="score-value">{selectedAnalysis.score}%</p>
                    <p className="score-rating">{selectedAnalysis.rating.icon} {selectedAnalysis.rating.rating}</p>
                    <p style={{ fontSize: '12px', opacity: 0.9, margin: '8px 0 0 0' }}>{selectedAnalysis.rating.text}</p>
                  </div>
                </div>

                {selectedAnalysis.scoreFactors && (
                  <div className="results-section">
                    <h3>📊 Scoring Breakdown</h3>
                    <div className="scoring-factors">
                      {Object.entries(selectedAnalysis.scoreFactors).map(([key, value]) => (
                        <div className="factor-item" key={key}>
                          <span className="factor-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                          <span className="factor-value" style={{ color: value >= 10 ? '#27AE60' : '#E74C3C' }}>{value > 0 ? '+' : ''}{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="results-section">
                  <h3>📍 Location Details</h3>
                  <div className="info-list">
                    <div className="info-item-result"><span className="label">Full Address</span><span className="value" style={{ fontSize: '11px', lineHeight: '1.3' }}>{selectedAnalysis.displayName || selectedAnalysis.name}</span></div>
                    <div className="info-item-result"><span className="label">Latitude</span><span className="value">{selectedAnalysis.latitude.toFixed(6)}</span></div>
                    <div className="info-item-result"><span className="label">Longitude</span><span className="value">{selectedAnalysis.longitude.toFixed(6)}</span></div>
                    <div className="info-item-result"><span className="label">Elevation</span><span className="value">{selectedAnalysis.elevation} m</span></div>
                    <div className="info-item-result"><span className="label">Date & Time</span><span className="value">{selectedAnalysis.timestamp} {selectedAnalysis.time}</span></div>
                  </div>
                </div>

                <div className="results-section">
                  <h3>🌤️ Weather & Environmental Data</h3>
                  <div className="weather-grid">
                    <div className="weather-card"><span className="weather-icon">🌡️</span><span className="weather-label">Temperature</span><span className="weather-value">{selectedAnalysis.weather.temp}°C</span><span className="weather-optimal">Optimal: 23-32°C</span></div>
                    <div className="weather-card"><span className="weather-icon">💧</span><span className="weather-label">Humidity</span><span className="weather-value">{selectedAnalysis.weather.humidity}%</span><span className="weather-optimal">Optimal: 60-80%</span></div>
<span className="weather-optimal">Optimal: below 20 km/h</span>
                    <div className="weather-card"><span className="weather-icon">🌧️</span><span className="weather-label">Rain Prob.</span><span className="weather-value">{selectedAnalysis.weather.rainProbability}%</span><span className="weather-optimal">Optimal: 60-80%</span></div>
                  </div>
                  <div className="info-item-result" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #D4E5DD' }}><span className="label">Condition</span><span className="value">{selectedAnalysis.weather.condition}</span></div>
                  <div className="info-item-result"><span className="label">Annual Rainfall</span><span className="value">{selectedAnalysis.annualRainfall} mm (Optimal: 1500-2500mm)</span></div>
                  <div className="info-item-result"><span className="label">Soil pH</span><span className="value">{selectedAnalysis.soilPH.toFixed(2)} (Optimal: 5.5-6.5)</span></div>
                  <div className="info-item-result"><span className="label">Elevation</span><span className="value">{selectedAnalysis.elevation} m (Optimal: 0-1000m)</span></div>
                </div>

                {selectedAnalysis.recommendations.length > 0 && (
                  <div className="results-section">
                    <h3>Recommendations</h3>
                    <div className="recommendations-list">
                      {selectedAnalysis.recommendations.map((rec, idx) => (
                        <div key={idx} className={`rec-item rec-${rec.type}`}>
                          <span className="rec-icon">{rec.type === 'success' ? '✅' : '⚠️'}</span>
                          <div className="rec-content">
                            <p className="rec-title">{rec.title}</p>
                            <p className="rec-message">{rec.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {analyses.length > 0 && (
          <motion.div className="recent-analyses" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 style={{ color: '#ffffff' }}>Recent Analyses</h2>
            <div className="analyses-grid">
              {analyses.slice(0, 4).map((analysis) => (
                <div key={analysis.id} className="analysis-item" onClick={() => { setSelectedAnalysis(analysis); setShowResults(true); }}>
                  <div className="score-circle" style={{ backgroundColor: analysis.rating.color }}>{analysis.score}%</div>
                  <h4>{analysis.name}</h4>
                  <p>{analysis.rating.rating}</p>
                  <p className="analysis-date">{analysis.timestamp}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}

