import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Index.css';
import Header from '../shared/Header';
import Hero from '../shared/Hero';
import Footer from '../shared/Footer';
import logo from '../../../../picturesofbp/logowalangbg.png';
import mainBg from '../../../media/Main BG.jpg';

export default function Index() {
const featuresList = [
    {
      title: 'Leaf Analysis',
      description: 'Upload photos of pepper leaves for disease detection and identification',
      link: '/leaf-analysis',
      icon: <span style={{color: '#27AE60', fontSize: '2.5rem'}}></span>
    },
    {
      title: 'Bunga Analysis',
      description: 'Analyze pepper flowers and fruits for health assessment and ripeness detection',
      link: '/bunga-analysis',
      icon: <span style={{color: '#8B4513', fontSize: '2.5rem'}}></span>
    },
    {
      title: 'Weather Updates',
      description: 'Get real-time weather information for your farming area',
      link: '/weather',
      icon: <span style={{color: '#27AE60', fontSize: '2.5rem'}}></span>
    },
    {
      title: 'Community Forum',
      description: 'Connect with other farmers and share experiences',
      link: '/forum',
      icon: <span style={{color: '#27AE60', fontSize: '2.5rem'}}></span>
    },
    {
      title: 'Macromapping',
      description: 'Visualize your plantation with advanced mapping tools',
      link: '/macro-mapping',
      icon: <span style={{color: '#8B4513', fontSize: '2.5rem'}}></span>
    }
  ];

  return (
    <div className="page-wrapper">
      {/* Dark Theme Background with Image */}
      <div className="page-background">
        <img 
          src={mainBg}
          alt="Background" 
          className="background-image" 
        />
        <div className="background-overlay"></div>
      </div>

      <div className="page-floating-leaves" aria-hidden="true">
        <div className="page-leaf leaf-a">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>
        </div>
        <div className="page-leaf leaf-b">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c4-4 8-7.5 8-12 0-3.5-2.5-6-6-6s-6 2.5-6 6c0 4.5 4 8 8 12z"/></svg>
        </div>
        <div className="page-leaf leaf-c">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.33.26 2.61.74 3.77l-1.89.66c-.6-1.41-.85-2.93-.85-4.43 0-4.97 4.03-9 9-9s9 4.03 9 9c0 1.5-.25 3.02-.85 4.43l-1.89-.66c.48-1.16.74-2.44.74-3.77 0-5.52-4.48-10-10-10z"/></svg>
        </div>
        <div className="page-leaf leaf-d">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/></svg>
        </div>
        <div className="page-leaf leaf-e">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c4-4 8-7.5 8-12 0-3.5-2.5-6-6-6s-6 2.5-6 6c0 4.5 4 8 8 12z"/></svg>
        </div>
        <div className="page-leaf leaf-f">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 1.33.26 2.61.74 3.77l-1.89.66c-.6-1.41-.85-2.93-.85-4.43 0-4.97 4.03-9 9-9s9 4.03 9 9c0 1.5-.25 3.02-.85 4.43l-1.89-.66c.48-1.16.74-2.44.74-3.77 0-5.52-4.48-10-10-10z"/></svg>
        </div>
      </div>

      {/* Header */}
      <Header />

      {/* Hero Section - Bio-Tech Glassmorphism */}
      <Hero />

      {/* About Section */}
      <section className="about" id="about">
        <div className="about-content-wrapper">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="about-visual"
          >
            <img 
              src={logo}
              alt="Smart Farming"
              className="about-illustration"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="about-content"
          >
            <h3 className="text-sm font-bold tracking-widest mb-4 uppercase">
              About PiperSmart
            </h3>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Empowering <br />
              <span className="about-highlight">Farmers</span> with <span className="about-highlight">AI</span>
            </h2>
            <p className="text-lg leading-relaxed mb-6">
              PiperSmart is an innovative agricultural technology solution designed to help pepper farmers
              detect and manage diseases in their crops using advanced artificial intelligence and machine learning.
              Our platform provides early disease detection, enabling farmers to take timely action and protect their harvests.
            </p>
            <motion.a 
              href="#features" 
              className="read-more"
              whileHover={{ x: 5 }}
              transition={{ duration: 0.3 }}
            >
              Read more →
            </motion.a>
          </motion.div>
        </div>
      </section>

      {/* Explore Our Features Section */}
      <section className="explore-features">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Explore Our Features
          </motion.h2>

          <div className="features-grid">
            {featuresList.map((feature, idx) => (
              <Link key={idx} to={feature.link} className="feature-card">
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Ready to Get Started? Section */}
      <section className="cta-section">
        <div className="cta-content">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            Start analyzing your pepper plants today and protect your harvest
          </motion.p>
          <motion.div
            className="cta-buttons"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Link to="/leaf-analysis" className="cta-btn-primary">
              Try Leaf Analysis
            </Link>
            <Link to="/register" className="cta-btn-secondary">
              Create Account
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
