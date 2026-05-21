import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, Menu, Globe, ChevronDown, Zap, Shield, Bell, Search, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { SearchBar } from './SearchBar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

const NOTIFICATIONS = [
  { icon: '✓', bg: 'bg-green-100', fg: 'text-green-600', title: 'Booking Confirmed', desc: 'Your rental request for Toyota Camry has been approved.', time: '2 hours ago' },
  { icon: 'i', bg: 'bg-blue-100', fg: 'text-blue-600', title: 'Payment Received', desc: 'Payment of ETB 18,000 for BMW X5 rental confirmed.', time: '5 hours ago' },
  { icon: '!', bg: 'bg-yellow-100', fg: 'text-yellow-600', title: 'Return Reminder', desc: 'Land Cruiser Prado rental ends tomorrow. Please prepare for return.', time: '1 day ago' },
];

export const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchPanelRef.current && !searchPanelRef.current.contains(e.target as Node)) {
        setShowSearchPanel(false);
      }
    };
    if (showSearchPanel) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSearchPanel]);

  const navItems = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.fleet'), path: '/vehicles' },
    { name: t('nav.howItWorks'), path: '/how-it-works' },
    { name: t('nav.contact'), path: '/contact' },
    { name: t('nav.about'), path: '/about' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-500 px-4 md:px-8",
        isScrolled ? "py-2" : "py-4"
      )}
    >
      <div className={cn(
        "mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between rounded-full px-4 sm:px-6 md:px-8 transition-all duration-500",
        isScrolled 
          ? "bg-white/70 backdrop-blur-2xl shadow-[0_4px_20px_rgb(59,60,251,0.15)] border border-white/40" 
          : "bg-white/50 backdrop-blur-xl shadow-[0_2px_10px_rgb(59,60,251,0.1)] border border-white/30"
      )}>
        {/* Logo Section */}
        <Link to="/" className="group flex items-center gap-3">
          <img 
            src="/images/zoelogo.png" 
            alt="Zoe Car Rental"
            className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-lg font-bold tracking-tight text-gray-800 group-hover:text-primary transition-colors duration-300">
            ZOE
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path}
                to={item.path}
                className={cn(
                  "relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-full",
                  isActive 
                    ? "text-white bg-primary shadow-lg shadow-primary/20" 
                    : "text-gray-600 hover:text-primary hover:bg-primary/10"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Search Icon (Desktop) */}
          <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setShowSearchPanel(!showSearchPanel)} className="hidden md:flex h-9 w-9 rounded-full text-gray-600 hover:text-primary hover:bg-primary/10">
            <Search size={18} aria-hidden="true" />
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button variant="ghost" size="sm" className="h-9 gap-1.5 rounded-full px-3 font-bold text-gray-600 hover:text-primary hover:bg-primary/10">
                <Globe size={16} aria-hidden="true" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{language}</span>
                <ChevronDown size={12} className="opacity-50" aria-hidden="true" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-40 rounded-2xl p-2 shadow-2xl border-gray-100">
              <DropdownMenuItem onClick={() => setLanguage('en')} className="rounded-xl font-bold text-xs uppercase tracking-wider">
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('am')} className="rounded-xl font-bold text-xs uppercase tracking-wider">
                አማርኛ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-4 w-px bg-gray-200 mx-1 hidden md:block" />

          {user ? (
            <div className="flex items-center gap-2">
              <div ref={notifRef} className="relative">
                <button type="button" aria-label="Notifications" onClick={() => setNotifOpen(!notifOpen)} className="hidden md:flex items-center justify-center h-9 w-9 rounded-full text-gray-600 hover:text-primary hover:bg-primary/10 transition-colors relative">
                  <Bell size={18} aria-hidden="true" />
                  <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-primary" />
                </button>
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white p-2 shadow-2xl border border-gray-100 z-50">
                      <p className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Notifications</p>
                      {NOTIFICATIONS.map((n, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3">
                          <div className={`h-8 w-8 rounded-full ${n.bg} flex items-center justify-center ${n.fg} shrink-0 text-xs font-bold`}>{n.icon}</div>
                          <div><p className="text-sm font-bold text-gray-800">{n.title}</p><p className="text-xs text-muted-foreground">{n.desc}</p><p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p></div>
                        </div>
                      ))}
                      <div className="my-2 h-px bg-border" />
                      <p className="px-4 py-2 text-center text-xs text-muted-foreground font-medium">No more notifications</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" className="h-10 gap-3 rounded-full pl-1 pr-3 hover:bg-primary/10 transition-all">
                    <div className="h-8 w-8 overflow-hidden rounded-full border border-gray-100 shadow-sm relative">
                      {profile?.profilePic ? (
                        <img src={profile.profilePic} alt={profile.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary">
                          <User size={16} />
                        </div>
                      )}
                      {profile?.verificationStatus === 'verified' && (
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
                      )}
                    </div>
                    <div className="hidden md:flex flex-col items-start leading-none">
                      <span className="text-xs font-bold text-gray-800">{profile?.name || 'User'}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        {profile?.role || 'Member'}
                      </span>
                    </div>
                    <ChevronDown size={12} className="hidden md:block opacity-30 text-gray-400" />
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-2xl border-gray-100">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Account</p>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="rounded-xl px-4 py-2.5 focus:bg-primary/5 focus:text-primary cursor-pointer">
                    <div className="flex w-full items-center gap-3 font-bold text-xs uppercase tracking-wider">
                      <Zap size={14} /> {t('nav.dashboard')}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="rounded-xl px-4 py-2.5 focus:bg-primary/5 focus:text-primary cursor-pointer">
                    <div className="flex w-full items-center gap-3 font-bold text-xs uppercase tracking-wider">
                      <User size={14} /> Profile Settings
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-2 opacity-50" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-xl px-4 py-2.5 text-destructive focus:bg-red-50 focus:text-red-600 font-bold text-xs uppercase tracking-wider cursor-pointer">
                    <LogOut size={14} className="mr-3" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" className="h-10 rounded-full bg-primary px-6 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-indigo-200 hover:bg-primary/90 hover:scale-[1.02] transition-all">
                {t('nav.login')}
              </Button>
            </Link>
          )}

          {/* Mobile Nav Toggle */}
          <Sheet>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" aria-label="Toggle menu" className="lg:hidden h-10 w-10 rounded-full">
                <Menu size={24} aria-hidden="true" />
              </Button>
            } />
            <SheetContent side="right" className="w-full sm:w-[400px] rounded-l-[2rem] border-none p-0 overflow-hidden">
              <div className="flex h-full flex-col bg-background">
                <div className="p-8 border-b">
                  <div className="flex items-center gap-3 mb-8">
                    <img 
                      src="/images/zoelogo.png" 
                      alt="Zoe Car Rental"
                      className="h-8 w-auto"
                    />
                    <span className="text-2xl font-bold tracking-tight">ZOE</span>
                  </div>
                  <nav className="flex flex-col gap-2">
                    {navItems.map((item) => (
                      <Link 
                        key={item.path} 
                        to={item.path}
                        className="text-xl font-bold uppercase tracking-tight hover:text-primary transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </div>
                <div className="mt-auto p-8 bg-muted/30">
                  {!user ? (
                    <Link to="/login">
                      <Button className="h-14 w-full rounded-2xl bg-primary text-base font-bold uppercase tracking-wider shadow-xl shadow-indigo-100">
                        {t('nav.login')}
                      </Button>
                    </Link>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Link to="/dashboard">
                        <Button variant="outline" className="h-14 w-full rounded-2xl text-base font-bold uppercase tracking-wider border-2">
                          Dashboard
                        </Button>
                      </Link>
                      <Button onClick={handleLogout} variant="ghost" className="h-14 w-full text-destructive text-base font-bold uppercase tracking-wider">
                        Logout
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Search Panel */}
      <AnimatePresence>
        {showSearchPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            <motion.div
              ref={searchPanelRef}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0 right-0 top-full mt-2 mx-auto max-w-4xl z-50"
            >
              <div className="rounded-2xl bg-white shadow-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Search Cars</h3>
                  <button onClick={() => setShowSearchPanel(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <X size={16} className="text-gray-400" />
                  </button>
                </div>
                <SearchBar onSearch={() => setShowSearchPanel(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
