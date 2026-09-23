import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RecoverPasswordPage from './pages/RecoverPasswordPage';
import DashboardPage from './pages/DashboardPage';
import WhatsAppButton from './components/features/WhatsAppButton';
import ChatbotWidget from './components/features/ChatbotWidget';
import ProtectedRoute from './components/auth/ProtectedRoute';

function MainLayout({ theme, toggleTheme }) {
  const location = useLocation();
  const isPanel = location.pathname.startsWith('/panel') || location.pathname.startsWith('/dashboard');

  return (
    <>
      {!isPanel && <Header theme={theme} toggleTheme={toggleTheme} />}
      <main className={isPanel ? "app-main panel-mode" : "app-main"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quienes-somos" element={<AboutPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/recover" element={<RecoverPasswordPage />} />
          <Route path="/panel" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        </Routes>
      </main>
      {!isPanel && <WhatsAppButton />}
      {!isPanel && <ChatbotWidget />}
      {!isPanel && <Footer />}
    </>
  );
}

function App() {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className={`App theme-${theme}`}>
      <Router>
        <MainLayout theme={theme} toggleTheme={toggleTheme} />
      </Router>
    </div>
  );
}

export default App;
