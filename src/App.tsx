import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Navbar } from './components/Navbar';
import { ChatWidget } from './components/ChatWidget';
import { Footer } from './components/Footer';

import { CarDetails } from './pages/CarDetails';
import { Dashboard } from './pages/Dashboard';
import { Host } from './pages/Host';
import { About } from './pages/About';
import { HowItWorks } from './pages/HowItWorks';
import ContactUs from './pages/ContactUs';
import { Vehicles } from './pages/Vehicles';
import { Home } from './pages/Home';
import Login from './pages/Login';
import { Profile } from './pages/Profile';
import { Verification } from './pages/Verification';
import { RentalAgreement } from './pages/RentalAgreement';

function AppLayout() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/dashboard' || location.pathname === '/host';

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
      {!hideNavbar && <Navbar />}
      <ChatWidget />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/cars/:id" element={<CarDetails />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/verification" element={<Verification />} />
        <Route path="/rental-agreement" element={<RentalAgreement />} />
        <Route path="/host" element={<Host />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/contact" element={<ContactUs />} />
      </Routes>
      {!hideNavbar && <Footer />}
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const lenis = new Lenis();
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AppLayout />
          <Toaster position="top-center" richColors />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}
