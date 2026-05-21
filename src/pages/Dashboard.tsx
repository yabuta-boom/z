import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  User, Calendar as CalendarIcon, Car as CarIcon, Plus, CreditCard,
  Settings, LogOut, Clock, CheckCircle2, XCircle, ChevronRight,
  ArrowLeft, ShieldCheck, UserCheck, Heart, History, Menu, LayoutDashboard,
  Star, MapPin, Bell, Home, Loader2, ClipboardCheck, FileText, Send,
  AlertCircle, Pencil, Save, Trash2, ExternalLink, Download, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Booking, Car } from '../types';
import { MOCK_CARS } from '../constants';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import { 
  RentalRequest, getRentalRequests, saveRentalRequests, initSampleRentalRequests,
  FleetCar, getFleet, getApprovedFleetCars
} from '../lib/fleetUtils';

interface PaymentRecord {
  id: string;
  bookingId: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending' | 'refunded';
  method: string;
}

interface FavoriteItem {
  carId: string;
  addedAt: string;
}

const SAMPLE_TRIPS: Booking[] = [
  { id: 'trip-1', carId: '9', userId: '', hostId: 'host3', startDate: '2025-05-01', endDate: '2025-05-05', totalAmount: 16000, status: 'completed', paymentStatus: 'paid', createdAt: '2025-04-25' },
  { id: 'trip-2', carId: '1', userId: '', hostId: 'host2', startDate: '2025-05-10', endDate: '2025-05-12', totalAmount: 3000, status: 'confirmed', paymentStatus: 'paid', createdAt: '2025-05-05' },
  { id: 'trip-3', carId: '33', userId: '', hostId: 'host7', startDate: '2025-06-01', endDate: '2025-06-03', totalAmount: 4000, status: 'pending', paymentStatus: 'unpaid', createdAt: '2025-05-15' },
];

const SAMPLE_PAYMENTS: PaymentRecord[] = [
  { id: 'pay-1', bookingId: 'trip-1', amount: 16000, date: '2025-04-26', status: 'paid', method: 'Telebirr' },
  { id: 'pay-2', bookingId: 'trip-2', amount: 3000, date: '2025-05-06', status: 'paid', method: 'Bank Transfer' },
  { id: 'pay-3', bookingId: 'trip-2', amount: 4000, date: '2025-05-16', status: 'pending', method: 'CBE' },
];

const SAMPLE_FAVORITES: FavoriteItem[] = [
  { carId: '9', addedAt: '2025-04-20' },
  { carId: '13', addedAt: '2025-04-22' },
  { carId: '10', addedAt: '2025-05-01' },
];

export const Dashboard = () => {
  const { user, profile, logout, loading, updateVerification } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activePage, setActivePage] = useState('overview');
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestNotes, setRequestNotes] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [autoApprovingId, setAutoApprovingId] = useState<string | null>(null);
  const [approvedReqId, setApprovedReqId] = useState<string | null>(null);
  const [hostFleet, setHostFleet] = useState<FleetCar[]>([]);
  const [sampleTrips] = useState<Booking[]>(SAMPLE_TRIPS);
  const [samplePayments] = useState<PaymentRecord[]>(SAMPLE_PAYMENTS);
  const [sampleFavorites] = useState<FavoriteItem[]>(SAMPLE_FAVORITES);
  const [showFavTooltip, setShowFavTooltip] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [previewTrip, setPreviewTrip] = useState<Booking | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Settings form state
  const [settingsName, setSettingsName] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsProfilePic, setSettingsProfilePic] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setSettingsName(profile.name || '');
      setSettingsPhone(profile.phoneNumber || '');
      setSettingsProfilePic(profile.profilePic || '');
    }
  }, [profile]);

  useEffect(() => {
    if (loading) return;
    if (!user && !profile) {
      navigate('/login');
      return;
    }
    if (profile?.role === 'host') {
      navigate('/host');
      return;
    }
    initSampleRentalRequests();
    setRentalRequests(getRentalRequests());
    setHostFleet(getApprovedFleetCars());
  }, [user, profile, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  function RentalPDFTemplate({ trip, car }: { trip: Booking; car?: Car }) {
    return (
      <div style={{
        width: '210mm', minHeight: '297mm', padding: '15mm 20mm',
        fontFamily: 'Arial, sans-serif', color: '#000', background: '#fff',
        fontSize: '11px', lineHeight: 1.5
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '3px solid #1a56db', paddingBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img src="/images/zoelogo.png" alt="ZOE" style={{ height: '55px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1a56db' }}>ZOE CAR RENTAL</h1>
              <p style={{ margin: 0, fontSize: '9px', color: '#666', letterSpacing: '2px' }}>RENTAL AGREEMENT</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: '#666' }}>AGREEMENT #</p>
            <p style={{ margin: 0, fontWeight: 700 }}>{trip.id.toUpperCase()}</p>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#1a56db', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Vehicle Information</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700, width: '40%' }}>Vehicle</td><td style={{ padding: '4px 8px' }}>{car?.make} {car?.model} ({car?.year})</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>Category</td><td style={{ padding: '4px 8px' }}>{car?.type || 'N/A'}</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>Transmission</td><td style={{ padding: '4px 8px' }}>{car?.transmission || 'N/A'}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#1a56db', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Renter Information</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700, width: '40%' }}>Full Name</td><td style={{ padding: '4px 8px' }}>{profile?.name}</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>Phone</td><td style={{ padding: '4px 8px' }}>{profile?.phoneNumber || 'N/A'}</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>Email</td><td style={{ padding: '4px 8px' }}>{profile?.email}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#1a56db', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Rental Period</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700, width: '40%' }}>Start Date</td><td style={{ padding: '4px 8px' }}>{new Date(trip.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>End Date</td><td style={{ padding: '4px 8px' }}>{new Date(trip.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#1a56db', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Terms & Agreement</h2>
          <div style={{ padding: '10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ color: '#16a34a', fontSize: '16px' }}>☑</span>
              <span style={{ fontWeight: 700, fontSize: '12px', color: '#166534' }}>AGREED TO ALL TERMS</span>
            </div>
            <p style={{ margin: 0, fontSize: '10px', color: '#166534' }}>
              The renter has reviewed and agreed to all rental terms, conditions, and policies including insurance liability, fuel policy, late return fees, and vehicle care requirements.
            </p>
          </div>
          <p style={{ fontSize: '9px', color: '#666', margin: 0 }}>
            Verified digitally on {new Date().toLocaleString()} &middot; IP verified &middot; ID documents confirmed
          </p>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#1a56db', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Payment Receipt</h2>
          <div style={{ padding: '12px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontWeight: 700 }}>Total Amount</span>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#ca8a04' }}>ETB {trip.totalAmount.toLocaleString()}</span>
            </div>
            <p style={{ margin: 0, fontSize: '10px', color: '#a16207' }}>Payment Status: <strong>{trip.paymentStatus === 'paid' ? 'Paid' : trip.paymentStatus === 'unpaid' ? 'Unpaid' : trip.paymentStatus}</strong> &middot; Transaction: {trip.id.toUpperCase()}</p>
          </div>
        </div>

        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '14px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, margin: '0 0 4px 0', color: '#333' }}>Authorized by:</p>
              <p style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>{profile?.name}</p>
              <p style={{ fontSize: '9px', color: '#666', margin: '4px 0 0 0' }}>Renter &middot; {profile?.email}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <img src="/images/sign.png" alt="Signature" style={{ height: '40px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <p style={{ fontSize: '9px', color: '#666', margin: '2px 0 0 0' }}>Digital Signature</p>
              </div>
              <img src="/images/seal.png" alt="Seal" style={{ height: '65px' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
          </div>
          <p style={{ fontSize: '8px', color: '#9ca3af', textAlign: 'center', marginTop: '16px' }}>
            Zoe Car Rental &middot; This document is electronically generated and is valid without a physical signature.
          </p>
        </div>
      </div>
    );
  }

  const handleExportPDF = async (trip: Booking) => {
    setIsExportingPdf(true);
    const car = MOCK_CARS.find(c => c.id === trip.carId);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const m = 16;
      const cw = pw - 2 * m;
      let y = m;

      const loadData = async (url: string) => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          return await new Promise<string>(resolve => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(blob);
          });
        } catch {
          return null;
        }
      };
      const getDims = (src: string) => new Promise<{ w: number; h: number }>(resolve => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = src;
      });

      const logoUrl = await loadData('/images/zoelogo.png');
      const signUrl = await loadData('/images/sign.png');
      const sealUrl = await loadData('/images/seal.png');

      let logoW = 26, logoH = 10;
      if (logoUrl) {
        try { const d = await getDims(logoUrl); logoH = (d.h / d.w) * logoW; } catch {}
      }

      const section = (title: string) => {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(26, 86, 219);
        pdf.text(title, m, y);
        y += 7;
      };
      const row = (label: string, value: string) => {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(80);
        pdf.text(label, m, y);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0);
        pdf.text(value, m + 38, y);
        y += 5.5;
      };
      const gap = (g: number) => { y += g; };

      // Header
      if (logoUrl) pdf.addImage(logoUrl, 'PNG', m, y - 2, logoW, logoH);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(26, 86, 219);
      pdf.text('ZOE CAR RENTAL', logoUrl ? m + logoW + 6 : m, y + 2);
      y += Math.max(logoH + 4, 14);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text('RENTAL AGREEMENT', m, y);
      pdf.text(trip.id.toUpperCase(), pw - m, y, { align: 'right' });
      y += 6;
      pdf.setDrawColor(26, 86, 219);
      pdf.setLineWidth(0.5);
      pdf.line(m, y, pw - m, y);
      y += 8;

      // Vehicle
      section('VEHICLE INFORMATION');
      row('Vehicle', car ? `${car.make} ${car.model} (${car.year})` : 'N/A');
      row('Category', car?.type || 'N/A');
      row('Transmission', car?.transmission || 'N/A');
      gap(4);

      // Renter
      section('RENTER INFORMATION');
      row('Full Name', profile?.name || 'N/A');
      row('Phone', profile?.phoneNumber || 'N/A');
      row('Email', profile?.email || 'N/A');
      gap(4);

      // Period
      section('RENTAL PERIOD');
      row('Start', new Date(trip.startDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
      row('End', new Date(trip.endDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
      gap(4);

      // Terms
      section('TERMS & AGREEMENT');
      y += 2;
      const termsBody = 'The renter has reviewed and agreed to all rental terms, conditions, and policies including insurance liability, fuel policy, late return fees, and vehicle care requirements.';
      const termsLines = pdf.splitTextToSize(termsBody, cw - 8);
      const termsBoxH = 8 + termsLines.length * 4;
      pdf.setFillColor(240, 253, 244);
      pdf.setDrawColor(134, 239, 172);
      pdf.roundedRect(m, y - 3, cw, termsBoxH, 2, 2, 'FD');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(22, 101, 52);
      pdf.text('\u2713 AGREED TO ALL TERMS', m + 3, y + 1);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(termsLines, m + 3, y + 6);
      y += termsBoxH + 3;
      pdf.setFontSize(7);
      pdf.setTextColor(100);
      pdf.text(`Verified on ${new Date().toLocaleString()}  \u00b7  IP verified  \u00b7  ID confirmed`, m, y);
      gap(6);

      // Payment
      section('PAYMENT RECEIPT');
      y += 2;
      pdf.setFillColor(254, 252, 232);
      pdf.setDrawColor(253, 230, 138);
      pdf.roundedRect(m, y - 3, cw, 14, 2, 2, 'FD');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0);
      pdf.text('Total Amount', m + 3, y + 1);
      pdf.setFontSize(14);
      pdf.setTextColor(202, 138, 4);
      pdf.text(`ETB ${trip.totalAmount.toLocaleString()}`, pw - m - 3, y + 1, { align: 'right' });
      pdf.setFontSize(8);
      pdf.setTextColor(161, 98, 7);
      pdf.text(`Paid  \u00b7  Ref: ${trip.id.toUpperCase()}`, m + 3, y + 6);
      y += 17;

      // Signature
      gap(8);
      pdf.setDrawColor(180);
      pdf.setLineWidth(0.4);
      pdf.line(m, y, pw - m, y);
      y += 7;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30);
      pdf.text('Authorized by:', m, y);
      y += 8;
      if (signUrl) pdf.addImage(signUrl, 'PNG', m, y - 1, 26, 11);
      if (sealUrl) pdf.addImage(sealUrl, 'PNG', m + 30, y - 4, 24, 24);
      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.text(profile?.name || 'Renter', pw - m, y + 6, { align: 'right' });
      y += 13;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(profile?.email || '', pw - m, y, { align: 'right' });

      // Footer
      pdf.setFontSize(7);
      pdf.setTextColor(150);
      pdf.text('Zoe Car Rental  \u00b7  This document is electronically generated.', pw / 2, ph - 12, { align: 'center' });

      pdf.save(`ZOE_Agreement_${car?.make || 'Car'}_${car?.model || 'Unknown'}_${trip.id}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Auto-approve rental requests after 3 seconds (testing)
  useEffect(() => {
    const pending = rentalRequests.find(r => r.status === 'pending');
    if (pending && !autoApprovingId) {
      setAutoApprovingId(pending.id);
      const timer = setTimeout(() => {
        const updated = rentalRequests.map(r =>
          r.id === pending.id ? { ...r, status: 'approved' as const } : r
        );
        saveRentalRequests(updated);
        setRentalRequests(updated);
        setAutoApprovingId(null);
        setApprovedReqId(pending.id);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [rentalRequests, autoApprovingId]);

  const sidebarItems = [
    { id: 'overview', label: t('dashboard.overview'), icon: LayoutDashboard },
    { id: 'requests', label: t('dashboard.myRequests'), icon: FileText },
    { id: 'trips', label: t('dashboard.myTrips'), icon: CalendarIcon },
    { id: 'favorites', label: t('dashboard.favorites'), icon: Heart },
    { id: 'payments', label: t('dashboard.payments'), icon: CreditCard },
    { id: 'settings', label: t('dashboard.settings'), icon: Settings },
  ];

  const renderSidebar = () => (
    <aside className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${sidebarOpen ? 'w-64 max-sm:w-full' : 'w-20 max-sm:w-0 max-sm:overflow-hidden'}`}>
      <div className="h-full bg-gradient-to-b from-[#0a1628] via-[#0f1f3d] to-[#162a4a] flex flex-col border-r border-blue-900/30">
        <div className="p-6 border-b border-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-lg shrink-0">
              <CarIcon size={22} />
            </div>
            {sidebarOpen && (
              <div>
                <h2 className="text-white font-extrabold tracking-tight">Zoe Rental</h2>
                <p className="text-blue-300 text-[10px] uppercase tracking-widest font-bold">{t('dashboard.renterDashboard')}</p>
              </div>
            )}
          </div>
        </div>
        <div className="px-4 pt-2 pb-1 border-b border-blue-900/30">
          <button onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-blue-300/70 hover:text-white hover:bg-blue-500/10 transition-all group">
            <ArrowLeft size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-sm font-bold">{t('dashboard.backToHome')}</span>}
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                activePage === item.id
                  ? 'bg-blue-500/20 text-white shadow-lg shadow-blue-500/10'
                  : 'text-blue-300/70 hover:text-white hover:bg-blue-500/10'
              }`}
            >
              <item.icon size={20} className="shrink-0" />
              {sidebarOpen && <span className="text-sm font-bold tracking-wide">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-900/30 space-y-2">
          {profile && (
            <div className={`flex items-center gap-3 px-4 py-3 mb-2 ${sidebarOpen ? '' : 'justify-center'}`}>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {profile.name?.charAt(0) || 'U'}
              </div>
              {sidebarOpen && (
                <div className="truncate">
                  <p className="text-white text-sm font-bold truncate">{profile.name}</p>
                  <p className="text-blue-300 text-[10px] uppercase tracking-widest">Renter</p>
                </div>
              )}
            </div>
          )}
          <button onClick={() => { handleLogout(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={20} className="shrink-0" />
            {sidebarOpen && <span className="text-sm font-bold">{t('dashboard.logout')}</span>}
          </button>
        </div>
      </div>
    </aside>
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a1628]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {renderSidebar()}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64 max-sm:ml-0' : 'ml-20 max-sm:ml-0'}`}>
        <header className="h-16 bg-[#0f1f3d] border-b border-blue-900/30 flex items-center justify-between px-6 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-blue-300 hover:text-white transition-colors">
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-4">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-3 py-1">
              <User size={14} className="mr-1" /> {profile?.name || 'User'}
            </Badge>
          </div>
        </header>

        <main className="p-4 md:p-6">
          {/* Overview Page */}
          {activePage === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6">
                <div className="relative h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-2xl shadow-xl border-2 border-blue-500/30 shrink-0">
                  {profile?.profilePic ? (
                    <img src={profile.profilePic} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                      <User size={20} className="text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-white break-words">{t('dashboard.welcome')}, {profile?.name}</h1>
                  <p className="text-blue-300 text-sm sm:text-base break-all">{profile?.email}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 rounded-lg">{profile?.role.toUpperCase()}</Badge>
                    <Badge className={cn(
                      "rounded-lg border font-black tracking-widest",
                      profile?.verificationStatus === 'verified' ? "bg-green-500/20 text-green-400 border-green-500/30" :
                      "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    )}>
                      {profile?.verificationStatus.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-[#0f1f3d] border-blue-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-300">{t('dashboard.totalSpent')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-2xl font-extrabold text-white">ETB 0</CardDescription>
                  </CardContent>
                </Card>
                <Card className="bg-[#0f1f3d] border-blue-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-300">{t('dashboard.trips')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-2xl font-extrabold text-white">{bookings.length}</CardDescription>
                  </CardContent>
                </Card>
                <Card className="bg-[#0f1f3d] border-blue-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-300">{t('dashboard.verification')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base font-extrabold flex items-center gap-2">
                      {profile?.verificationStatus === 'verified' ? (
                        <span className="text-green-400 flex items-center gap-1"><CheckCircle2 size={18} /> {t('dashboard.verified')}</span>
                      ) : (
                        <span className="text-yellow-400 flex items-center gap-1"><ShieldCheck size={18} /> {t('dashboard.pending')}</span>
                      )}
                    </CardDescription>
                  </CardContent>
                </Card>
                <Card className="bg-[#0f1f3d] border-blue-900/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-300">{t('dashboard.quickAction')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={() => navigate('/vehicles')}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-bold text-xs">
                      {t('dashboard.browseFleet')}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-[#0f1f3d] border-blue-900/30">
                  <CardHeader>
                    <CardTitle className="text-white font-bold">{t('dashboard.quickActions')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="ghost"
                      className="w-full justify-between rounded-xl h-12 hover:bg-blue-500/10 hover:text-blue-400 text-blue-300 group"
                      onClick={() => navigate('/vehicles')}>
                      <div className="flex items-center gap-3"><CarIcon size={20} /><span className="font-bold">{t('dashboard.browseFleet')}</span></div>
                      <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                    {profile?.verificationStatus !== 'verified' && (
                      <Button variant="ghost"
                        className="w-full justify-between rounded-xl h-12 hover:bg-blue-500/10 hover:text-blue-400 text-blue-300 group"
                        onClick={() => navigate('/verification')}>
                        <div className="flex items-center gap-3"><ShieldCheck size={20} /><span className="font-bold">{t('dashboard.verifyIdentity')}</span></div>
                        <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-[#0f1f3d] border-blue-900/30">
                  <CardHeader>
                    <CardTitle className="text-white font-bold">{t('dashboard.accountInfo')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a1628]">
                      <span className="text-sm text-blue-300">{t('dashboard.name')}</span>
                      <span className="text-sm font-bold text-white">{profile?.name}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a1628]">
                      <span className="text-sm text-blue-300">{t('dashboard.email')}</span>
                      <span className="text-sm font-bold text-white">{profile?.email}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a1628]">
                      <span className="text-sm text-blue-300">{t('dashboard.phone')}</span>
                      <span className="text-sm font-bold text-white">{profile?.phoneNumber || t('dashboard.notSet')}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a1628]">
                      <span className="text-sm text-blue-300">{t('dashboard.role')}</span>
                      <Badge className="bg-blue-500/20 text-blue-300">{profile?.role.toUpperCase()}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* My Requests Page */}
          {activePage === 'requests' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">{t('dashboard.myRequests')}</h1>
                <Button onClick={() => setShowRequestForm(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-bold gap-2 text-xs sm:text-sm whitespace-nowrap">
                  <Plus size={16} /> {t('dashboard.newRequest')}
                </Button>
              </div>
              <p className="text-sm text-blue-300">{t('dashboard.submitRequest')}</p>

              {/* Request Form Modal */}
              {showRequestForm && (
                <Card className="bg-[#0f1f3d] border-blue-900/30">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-white">{t('dashboard.submitRequestModal')}</h3>
                      <button onClick={() => setShowRequestForm(false)} className="text-blue-400 hover:text-white">
                        <XCircle size={20} />
                      </button>
                    </div>
                    <div>
                      <label className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-2 block">{t('dashboard.selectVehicle')}</label>
                      <select
                        value={selectedCarId}
                        onChange={(e) => setSelectedCarId(e.target.value)}
                        className="w-full bg-[#0a1628] border border-blue-900/30 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/50"
                      >
                        <option value="">{t('dashboard.chooseCar')}</option>
                        {hostFleet.map(car => (
                          <option key={car.id} value={car.id}>
                            {car.make} {car.model} ({car.year}) - ETB {car.pricePerDay.toLocaleString()}/day
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-2 block">{t('dashboard.notes')}</label>
                      <textarea
                        value={requestNotes}
                        onChange={(e) => setRequestNotes(e.target.value)}
                        placeholder={t('dashboard.notesPlaceholder')}
                        className="w-full bg-[#0a1628] border border-blue-900/30 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500/50 min-h-[100px] resize-none"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (!selectedCarId) { toast.error('Please select a vehicle'); return; }
                        setIsSubmittingRequest(true);
                        const car = hostFleet.find(c => c.id === selectedCarId);
                        if (!car) return;
                        const newReq: RentalRequest = {
                          id: 'req-' + Date.now(),
                          renterName: profile?.name || 'Unknown',
                          renterPhone: profile?.phoneNumber || '+251XXXXXXXXX',
                          renterEmail: profile?.email || 'unknown@email.com',
                          renterPhoto: profile?.profilePic || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
                          renterAddress: 'Addis Ababa',
                          nationalId: profile?.nationalId || 'FD-XXXX-XXXX',
                          nationalIdPhoto: profile?.verificationData?.idFront || 'https://images.unsplash.com/photo-1604220131005-05f3c0e0a6c5?auto=format&fit=crop&q=80&w=400',
                          driverLicense: profile?.verificationData?.idNumber || 'DL-ETH-XXXXX',
                          driverLicensePhoto: profile?.verificationData?.licenseFront || 'https://images.unsplash.com/photo-1604220131005-05f3c0e0a6c5?auto=format&fit=crop&q=80&w=400',
                          carId: car.id,
                          carMake: car.make,
                          carModel: car.model,
                          carPlate: car.plateNumber,
                          carImage: car.images[0] || '',
                          startDate: new Date().toISOString(),
                          endDate: new Date(Date.now() + 3*24*60*60*1000).toISOString(),
                          totalAmount: car.pricePerDay * 3,
                          notes: requestNotes,
                          status: 'pending',
                          createdAt: new Date().toISOString(),
                        };
                        const all = [...rentalRequests, newReq];
                        saveRentalRequests(all);
                        setRentalRequests(all);
                        setIsSubmittingRequest(false);
                        setShowRequestForm(false);
                        setSelectedCarId('');
                        setRequestNotes('');
                        toast.success('Request submitted! Auto-approving in 3 seconds...');
                      }}
                      disabled={isSubmittingRequest}
                      className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl gap-2"
                    >
                      {isSubmittingRequest ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      {isSubmittingRequest ? t('dashboard.submitting') : t('dashboard.submitRequestBtn')}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Requests List */}
              <div className="space-y-4">
                {rentalRequests.length === 0 ? (
                  <div className="flex h-48 flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-blue-900/30 text-center">
                    <div className="rounded-full bg-blue-500/10 p-4 text-blue-400">
                      <FileText size={40} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white">{t('dashboard.noRequests')}</p>
                      <p className="text-sm text-blue-300">{t('dashboard.noRequestsDesc')}</p>
                    </div>
                  </div>
                ) : (
                  rentalRequests.map(req => {
                    const isPending = req.status === 'pending';
                    const isApproved = req.status === 'approved';
                    const isDeclined = req.status === 'rejected';
                    const isAutoApproving = isPending && autoApprovingId === req.id;
                    const justApproved = approvedReqId === req.id;
                    return (
                      <Card key={req.id} className="bg-[#0f1f3d] border-blue-900/30 overflow-hidden">
                          <div className="flex flex-col sm:flex-row">
                          <div className="w-full sm:w-48 h-48 sm:h-36 shrink-0 bg-[#0a1628]">
                            <img src={req.carImage} alt={req.carModel} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-white font-bold text-lg">{req.carMake} {req.carModel}</h3>
                                <p className="text-blue-300 text-sm">{req.carPlate}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <span className="text-blue-400">ETB {req.totalAmount.toLocaleString()}</span>
                                  <span className="text-blue-500">|</span>
                                  <span className="text-blue-400">Requested {new Date(req.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                {isAutoApproving ? (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse">
                                    <Loader2 size={12} className="mr-1 animate-spin" /> Auto-approving...
                                  </Badge>
                                ) : isPending ? (
                                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                    <Clock size={12} className="mr-1" /> {t('dashboard.pendingApproval')}
                                  </Badge>
                                ) : isApproved ? (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    <CheckCircle2 size={12} className="mr-1" /> {t('dashboard.approved')}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                    <XCircle size={12} className="mr-1" /> {t('dashboard.declined')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {req.notes && (
                              <p className="text-blue-200 text-sm mt-2 italic">"{req.notes}"</p>
                            )}
                            <div className="flex items-center gap-3 mt-4">
                              {isApproved && (
                                <Button
                                  onClick={() => {
                                    navigate(`/rental-agreement`, {
                                      state: {
                                        carId: req.carId,
                                        carMake: req.carMake,
                                        carModel: req.carModel,
                                        carPlate: req.carPlate,
                                        startDate: req.startDate,
                                        endDate: req.endDate,
                                        totalAmount: req.totalAmount,
                                        paymentMethod: 'telebirr',
                                      }
                                    });
                                  }}
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl gap-2"
                                >
                                  <CreditCard size={16} /> {t('dashboard.proceedToPayment')}
                                </Button>
                              )}
                              {isPending && (
                                <p className="text-xs text-blue-400">{t('dashboard.awaitingReview')}</p>
                              )}
                              {isDeclined && (
                                <p className="text-xs text-red-400">{t('dashboard.requestDeclined')}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* Trips Page */}
          {activePage === 'trips' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">{t('dashboard.myTrips')}</h1>
                <Button onClick={() => navigate('/vehicles')} className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-bold gap-2 text-xs sm:text-sm whitespace-nowrap">
                  <CarIcon size={16} /> {t('dashboard.bookACar')}
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {sampleTrips.map((trip, index) => {
                    const car = MOCK_CARS.find(c => c.id === trip.carId);
                    return (
                      <motion.div key={trip.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}>
                        <Card className="bg-[#0f1f3d] border-blue-900/30 overflow-hidden group hover:border-blue-500/50 transition-all h-full">
                          <div className="h-44 overflow-hidden">
                            <img src={car?.images[0]} alt={car?.model}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          </div>
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="text-lg font-bold text-white">{car?.make} {car?.model}</h3>
                                <p className="text-xs text-blue-300">{car?.year} • {car?.type}</p>
                              </div>
                              <Badge className={cn(
                                trip.status === 'confirmed' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                trip.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                trip.status === 'cancelled' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              )}>
                                {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-blue-200 mb-2">
                              <CalendarIcon size={13} className="text-blue-400 shrink-0" />
                              <span>{format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-extrabold text-blue-400">ETB {trip.totalAmount.toLocaleString()}</span>
                              <div className="flex items-center gap-1.5">
                                {trip.status === 'confirmed' && (
                                  <>
                                    <button onClick={() => { setPreviewTrip(trip); setShowPdfPreview(true); }}
                                      className="text-indigo-400 hover:text-indigo-300 text-[10px] font-bold flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-indigo-500/10 transition-all">
                                      <FileText size={11} /> Preview
                                    </button>
                                    <button onClick={() => handleExportPDF(trip)} disabled={isExportingPdf}
                                      className="text-purple-400 hover:text-purple-300 text-[10px] font-bold flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-purple-500/10 transition-all disabled:opacity-50">
                                      {isExportingPdf ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} PDF
                                    </button>
                                  </>
                                )}
                                <Button variant="outline" size="sm"
                                  className="rounded-lg font-bold border-blue-900/30 text-blue-300 hover:bg-blue-500/10 text-[10px] h-7 px-2"
                                  onClick={() => navigate(`/cars/${trip.carId}`)}>{t('dashboard.viewCar')} <ExternalLink size={10} className="ml-0.5" /></Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Favorites Page */}
          {activePage === 'favorites' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">{t('dashboard.favoriteCars')}</h1>
                <Button onClick={() => navigate('/vehicles')} className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-bold gap-2 text-xs h-9 whitespace-nowrap">
                  <Plus size={15} /> Add More
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {sampleFavorites.map((fav, index) => {
                  const car = MOCK_CARS.find(c => c.id === fav.carId);
                  if (!car) return null;
                  return (
                    <motion.div key={fav.carId}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}>
                      <Card className="bg-[#0f1f3d] border-blue-900/30 overflow-hidden group hover:border-pink-500/40 transition-all h-full relative">
                        <div className="h-40 overflow-hidden">
                          <img src={car.images[0]} alt={car.model}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        </div>
                        <button
                          onMouseEnter={() => setShowFavTooltip(fav.carId)}
                          onMouseLeave={() => setShowFavTooltip(null)}
                          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-pink-500/20 backdrop-blur-sm flex items-center justify-center hover:bg-pink-500/40 transition-all z-10"
                        >
                          <Heart size={15} className="text-pink-400 fill-pink-400" />
                          {showFavTooltip === fav.carId && (
                            <span className="absolute -bottom-7 right-0 text-[10px] bg-black/80 text-white px-2 py-1 rounded whitespace-nowrap">Remove</span>
                          )}
                        </button>
                        <div className="p-4">
                          <h3 className="text-white font-bold">{car.make} {car.model}</h3>
                          <div className="flex items-center gap-2 text-xs text-blue-300 mt-1">
                            <MapPin size={11} className="shrink-0" />
                            <span>{car.location.city}</span>
                            <span className="text-blue-500">•</span>
                            <Star size={11} className="text-yellow-400" />
                            <span>{car.rating}</span>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-900/30">
                            <span className="text-blue-400 font-extrabold">ETB {car.pricePerDay.toLocaleString()}<span className="text-[10px] text-blue-500 font-normal">/day</span></span>
                            <Button size="sm" className="h-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 text-xs font-bold"
                              onClick={() => navigate(`/cars/${car.id}`)}>Rent Now</Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Payments Page */}
          {activePage === 'payments' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">{t('dashboard.paymentHistory')}</h1>
                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-xs font-bold whitespace-nowrap">{samplePayments.length} Transactions</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Card className="bg-[#0f1f3d] border-blue-900/30 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Total Spent</p>
                  <p className="text-2xl font-extrabold text-white">ETB {samplePayments.reduce((s, p) => s + (p.status === 'paid' ? p.amount : 0), 0).toLocaleString()}</p>
                </Card>
                <Card className="bg-[#0f1f3d] border-blue-900/30 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Completed</p>
                  <p className="text-2xl font-extrabold text-green-400">{samplePayments.filter(p => p.status === 'paid').length}</p>
                </Card>
                <Card className="bg-[#0f1f3d] border-blue-900/30 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Pending</p>
                  <p className="text-2xl font-extrabold text-yellow-400">{samplePayments.filter(p => p.status === 'pending').length}</p>
                </Card>
              </div>
              <div className="space-y-3">
                {samplePayments.map((payment, index) => {
                  const trip = sampleTrips.find(t => t.id === payment.bookingId);
                  const car = trip ? MOCK_CARS.find(c => c.id === trip.carId) : null;
                  return (
                    <motion.div key={payment.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}>
                      <Card className="bg-[#0f1f3d] border-blue-900/30 p-4 flex items-center justify-between hover:border-blue-500/40 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 flex items-center justify-center">
                            {payment.status === 'paid' ? <CheckCircle2 size={22} className="text-green-400" /> : <Clock size={22} className="text-yellow-400" />}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{car ? `${car.make} ${car.model}` : `Payment #${payment.bookingId.slice(-6)}`}</p>
                            <div className="flex items-center gap-2 text-xs text-blue-300 mt-0.5">
                              <span>{format(new Date(payment.date), 'MMM d, yyyy')}</span>
                              <span className="text-blue-500">•</span>
                              <span>{payment.method}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-blue-400">ETB {payment.amount.toLocaleString()}</p>
                          <Badge variant="outline" className={cn(
                            "text-[10px] uppercase font-bold mt-1",
                            payment.status === 'paid' ? "border-green-500/30 text-green-400" : "border-yellow-500/30 text-yellow-400"
                          )}>
                            {payment.status}
                          </Badge>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Settings Page */}
          {activePage === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">{t('dashboard.settings')}</h1>
              <Card className="bg-[#0f1f3d] border-blue-900/30 max-w-2xl">
                <CardContent className="p-4 sm:p-8 space-y-6">
                  <div>
                    <h3 className="text-white font-bold mb-4">{t('dashboard.profileInfo')}</h3>
                    <div className="space-y-5">
                      {/* Profile Picture */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="relative h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-2xl border-2 border-blue-500/30 shrink-0">
                          {settingsProfilePic ? (
                            <img src={settingsProfilePic} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                              <User size={20} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 w-full">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300 block mb-1.5">Profile Picture URL</label>
                          <Input
                            value={settingsProfilePic}
                            onChange={(e) => setSettingsProfilePic(e.target.value)}
                            placeholder="https://example.com/photo.jpg"
                            className="bg-[#0a1628] border-blue-900/30 text-white h-9 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-blue-300 block mb-1.5">{t('dashboard.name')}</label>
                        <Input
                          value={settingsName}
                          onChange={(e) => setSettingsName(e.target.value)}
                          placeholder="Your name"
                          className="bg-[#0a1628] border-blue-900/30 text-white h-10"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-blue-300 block mb-1.5">{t('dashboard.email')}</label>
                        <Input
                          value={profile?.email || ''}
                          disabled
                          className="bg-[#0a1628] border-blue-900/30 text-white/50 h-10"
                        />
                        <p className="text-[10px] text-blue-400 mt-1">Email cannot be changed</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-blue-300 block mb-1.5">{t('dashboard.phone')}</label>
                        <Input
                          value={settingsPhone}
                          onChange={(e) => setSettingsPhone(e.target.value)}
                          placeholder="+251XXXXXXXXX"
                          className="bg-[#0a1628] border-blue-900/30 text-white h-10"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                        <Button
                          onClick={async () => {
                            setIsSaving(true);
                            try {
                              await updateVerification({
                                name: settingsName,
                                phoneNumber: settingsPhone,
                                profilePic: settingsProfilePic,
                              });
                              toast.success('Settings saved successfully');
                            } catch {
                              toast.error('Failed to save settings');
                            } finally {
                              setIsSaving(false);
                            }
                          }}
                          disabled={isSaving}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-bold gap-2 h-10"
                        >
                          {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSettingsName(profile?.name || '');
                            setSettingsPhone(profile?.phoneNumber || '');
                            setSettingsProfilePic(profile?.profilePic || '');
                            toast.info('Changes reset');
                          }}
                          className="rounded-xl font-bold border-blue-900/30 text-blue-300 h-10"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </main>
      </div>

      {/* PDF Preview Modal */}
      <AnimatePresence>
        {showPdfPreview && previewTrip && (() => {
          const car = MOCK_CARS.find(c => c.id === previewTrip.carId);
          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={() => { setShowPdfPreview(false); setPreviewTrip(null); }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-100 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
                onClick={e => e.stopPropagation()}
              >
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <FileText size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Rental Agreement Preview</h2>
                      <p className="text-[11px] text-gray-500">A4 document &middot; {car?.make} {car?.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExportPDF(previewTrip)}
                      disabled={isExportingPdf}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm font-bold disabled:opacity-50"
                    >
                      {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                      {isExportingPdf ? 'Exporting...' : 'Download PDF'}
                    </button>
                    <button
                      onClick={() => { setShowPdfPreview(false); setPreviewTrip(null); }}
                      className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-center p-6">
                  <div className="shadow-[0_8px_30px_rgb(0,0,0,0.3)] bg-white" style={{ width: '210mm', transform: 'scale(0.7)', transformOrigin: 'top center' }}>
                    <RentalPDFTemplate trip={previewTrip} car={car} />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
