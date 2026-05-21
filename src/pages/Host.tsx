import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Car as CarIcon, Plus, DollarSign, ShieldCheck, Clock, CheckCircle2,
  Upload, Info, MapPin, Navigation, FileText, Cpu, LayoutDashboard,
  Search, Trash2, Edit3, X, Menu, Settings, LogOut, AlertTriangle,
  Eye, EyeOff, User, Calendar, Gauge, Fuel, Users, BadgeCheck,
  Ban, Image, Loader2, Camera, ClipboardCheck, UserCheck, Building2, Home,
  Phone, MessageSquare, Download, Activity, Crosshair, Navigation2,
  ChevronUp, ChevronDown, ArrowLeft, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';


const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

import { 
  FleetCar, getFleet, saveFleet, getApprovedFleetCars, initSampleFleet,
  ActiveRental, getActiveRentals, initSampleRentals,
  RentalRequest, getRentalRequests, saveRentalRequests, initSampleRentalRequests,
  ReturnRequest, getReturnRequests, saveReturnRequests, initSampleReturnRequests
} from '../lib/fleetUtils';

const carTypes = ['Sedan', 'SUV', 'Luxury', 'Economy', '4x4', 'Trucks', 'Vans', 'Motorcycles', 'Sports', 'Electric'];

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): string {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const dist = R * c;
  if (dist < 1) return `${Math.round(dist * 1000)} m`;
  return `${dist.toFixed(1)} km`;
}

export const Host = () => {
  const { profile, logout, loading, updateVerification } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('overview');
  const [fleetCars, setFleetCars] = useState<FleetCar[]>([]);
  const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([]);
  const [trackedRental, setTrackedRental] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState<Record<string, boolean>>({});
  const [rentalLocations, setRentalLocations] = useState<Record<string, { lat: number; lng: number }>>({});
  const [engineAnimating, setEngineAnimating] = useState<string | null>(null);
  const [hostLocation, setHostLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [editingCar, setEditingCar] = useState<FleetCar | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [expandedRentalReq, setExpandedRentalReq] = useState<string | null>(null);
  const [expandedReturnReq, setExpandedReturnReq] = useState<string | null>(null);
  const [approvalTab, setApprovalTab] = useState<'returns' | 'rentals'>('rentals');
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [previewRental, setPreviewRental] = useState<ActiveRental | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [settingsName, setSettingsName] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsProfilePic, setSettingsProfilePic] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [formData, setFormData] = useState({
    make: '', model: '', year: new Date().getFullYear(), plateNumber: '', vin: '',
    transmission: 'Automatic', fuelType: 'Petrol', mileage: 0, seats: 5,
    condition: 'Excellent', insuranceStatus: 'Active', registrationStatus: 'Up to Date',
    type: 'Sedan', pricePerDay: '', location: '', description: '', gpsCode: '',
  });

  useEffect(() => {
    initSampleFleet();
    initSampleRentals();
    setFleetCars(getFleet());
    const rentals = getActiveRentals();
    setActiveRentals(rentals);
    const eng: Record<string, boolean> = {};
    const locs: Record<string, { lat: number; lng: number }> = {};
    rentals.forEach(r => { eng[r.id] = true; locs[r.id] = { lat: r.gpsLat, lng: r.gpsLng }; });
    setEngineStatus(eng);
    setRentalLocations(locs);
    if (rentals.length > 0) setTrackedRental(rentals[0].id);
    initSampleRentalRequests();
    setRentalRequests(getRentalRequests());
    initSampleReturnRequests();
    setReturnRequests(getReturnRequests());
  }, [location.search]);

  // Get host's current location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setHostLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setLocationError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => setHostLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simulate fleet location drift
  useEffect(() => {
    if (activeRentals.length === 0) return;
    const interval = setInterval(() => {
      setRentalLocations(prev => {
        const next = { ...prev };
        activeRentals.forEach(r => {
          const cur = next[r.id] || { lat: r.gpsLat, lng: r.gpsLng };
          const engineOn = engineStatus[r.id] !== false;
          if (engineOn) {
            next[r.id] = {
              lat: cur.lat + (Math.random() - 0.5) * 0.002,
              lng: cur.lng + (Math.random() - 0.5) * 0.002,
            };
          }
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeRentals.length, engineStatus]);

  useEffect(() => {
    if (profile) {
      setSettingsName(profile.name || '');
      setSettingsPhone(profile.phoneNumber || '');
      setSettingsProfilePic(profile.profilePic || '');
    }
  }, [profile]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleSubmitListing = async (e: React.FormEvent) => {
    e.preventDefault();
    const required = ['make', 'model', 'plateNumber', 'vin', 'pricePerDay', 'location', 'gpsCode'];
    const missing = required.filter(f => !(formData as any)[f]?.toString().trim());
    if (missing.length > 0) {
      toast.error(`Required fields: ${missing.join(', ')}`);
      return;
    }
    setIsSubmitting(true);
    const newCar: FleetCar = {
      id: 'car-' + Date.now(),
      make: formData.make,
      model: formData.model,
      year: formData.year,
      plateNumber: formData.plateNumber,
      vin: formData.vin,
      transmission: formData.transmission,
      fuelType: formData.fuelType,
      mileage: formData.mileage,
      seats: formData.seats,
      condition: formData.condition,
      insuranceStatus: formData.insuranceStatus,
      registrationStatus: formData.registrationStatus,
      type: formData.type,
      pricePerDay: parseInt(formData.pricePerDay),
      location: formData.location,
      description: formData.description,
      gpsCode: formData.gpsCode,
      status: 'pending_approval',
      images: ['https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800'],
      documents: { photos: [] },
      createdAt: new Date().toISOString(),
    };
    const updated = [...fleetCars, newCar];
    saveFleet(updated);
    setFleetCars(updated);
    setIsSubmitting(false);
    toast.success('Vehicle submitted for admin approval. Please wait...', { duration: 3000 });
    setFormData({ make: '', model: '', year: new Date().getFullYear(), plateNumber: '', vin: '',
      transmission: 'Automatic', fuelType: 'Petrol', mileage: 0, seats: 5,
      condition: 'Excellent', insuranceStatus: 'Active', registrationStatus: 'Up to Date',
      type: 'Sedan', pricePerDay: '', location: '', description: '', gpsCode: '' });
  };

  const handleApproveRental = (id: string) => {
    const updated = rentalRequests.map(r =>
      r.id === id ? { ...r, status: 'approved' as const } : r
    );
    saveRentalRequests(updated);
    setRentalRequests(updated);
    toast.success('Rental request approved. Renter can now proceed to payment.');
    setExpandedRentalReq(null);
  };

  const handleRejectRental = (id: string) => {
    const updated = rentalRequests.map(r =>
      r.id === id ? { ...r, status: 'rejected' as const } : r
    );
    saveRentalRequests(updated);
    setRentalRequests(updated);
    toast.success('Rental request rejected.');
    setExpandedRentalReq(null);
  };

  const handleApproveReturn = (id: string) => {
    const updated = returnRequests.map(r =>
      r.id === id ? { ...r, status: 'approved' as const } : r
    );
    saveReturnRequests(updated);
    setReturnRequests(updated);
    toast.success('Vehicle return approved. Rental marked as completed.');
    setExpandedReturnReq(null);
  };

  const handleDisputeReturn = (id: string) => {
    const updated = returnRequests.map(r =>
      r.id === id ? { ...r, status: 'disputed' as const } : r
    );
    saveReturnRequests(updated);
    setReturnRequests(updated);
    toast.error('Return disputed. Escalating for review.');
    setExpandedReturnReq(null);
  };

  const handleDeleteCar = (id: string) => {
    const updated = fleetCars.filter(c => c.id !== id);
    saveFleet(updated);
    setFleetCars(updated);
    toast.success('Car removed from fleet.');
  };

  const handleToggleStatus = (id: string) => {
    const updated = fleetCars.map(c =>
      c.id === id ? { ...c, status: (c.status === 'active' ? 'inactive' : 'active') as FleetCar['status'] } : c
    );
    saveFleet(updated);
    setFleetCars(updated);
    toast.success(`Car ${fleetCars.find(c => c.id === id)?.status === 'active' ? 'deactivated' : 'activated'}.`);
  };

  const handleEditCar = (car: FleetCar) => {
    setEditingCar({ ...car });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingCar) return;
    const updated = fleetCars.map(c => c.id === editingCar.id ? editingCar : c);
    saveFleet(updated);
    setFleetCars(updated);
    setShowEditModal(false);
    setEditingCar(null);
    toast.success('Car updated successfully.');
  };

  const activeCars = fleetCars.filter(c => c.status === 'active' || c.status === 'approved');
  const pendingCars = fleetCars.filter(c => c.status === 'pending_approval');

  const sidebarItems = [
    { id: 'overview', label: t('host.overview'), icon: LayoutDashboard },
    { id: 'rented', label: t('host.rentedFleet'), icon: Activity },
    { id: 'my-fleet', label: t('host.myFleet'), icon: CarIcon },
    { id: 'list-car', label: t('host.listNewCar'), icon: Plus },
    { id: 'approvals', label: t('host.approvals'), icon: ClipboardCheck },
    { id: 'track', label: t('host.trackMyCar'), icon: Navigation },
    { id: 'settings', label: t('host.settingsTitle'), icon: Settings },
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
                <h2 className="text-white font-extrabold tracking-tight">{t('host.hostPanel')}</h2>
                <p className="text-blue-300 text-[10px] uppercase tracking-widest font-bold">{t('host.commandCenter')}</p>
              </div>
            )}
          </div>
        </div>
        <div className="px-4 pt-2 pb-1 border-b border-blue-900/30">
          <button onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-blue-300/70 hover:text-white hover:bg-blue-500/10 transition-all group">
            <ArrowLeft size={18} className="shrink-0" />
            {sidebarOpen && <span className="text-sm font-bold">Back to Home</span>}
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
                  {sidebarOpen && (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm font-bold tracking-wide">{item.label}</span>
                      {item.id === 'rented' && activeRentals.length > 0 && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] px-1.5 py-0">{activeRentals.length}</Badge>
                      )}
                      {item.id === 'approvals' && pendingCars.length > 0 && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0">{pendingCars.length}</Badge>
                  )}
                </div>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-blue-900/30 space-y-2">
          {profile && (
            <div className={`flex items-center gap-3 px-4 py-3 mb-2 ${sidebarOpen ? '' : 'justify-center'}`}>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {profile.name?.charAt(0) || 'H'}
              </div>
              {sidebarOpen && (
                <div className="truncate">
                  <p className="text-white text-sm font-bold truncate">{profile.name}</p>
                  <p className="text-blue-300 text-[10px] uppercase tracking-widest">
                    Host
                  </p>
                </div>
              )}
            </div>
          )}
          <button onClick={handleLogout}
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

  if (!profile || profile.role !== 'host') {
    if (!profile) navigate('/login?role=host');
    else navigate('/dashboard');
    return null;
  }

  function RentalPDFTemplate({ rental }: { rental: ActiveRental }) {
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
            <p style={{ margin: 0, fontWeight: 700 }}>{rental.id.toUpperCase()}</p>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#1a56db', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Vehicle Information</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700, width: '40%' }}>Vehicle</td><td style={{ padding: '4px 8px' }}>{rental.carMake} {rental.carModel} ({rental.carYear})</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>License Plate</td><td style={{ padding: '4px 8px' }}>{rental.carPlate}</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>Category</td><td style={{ padding: '4px 8px' }}>{rental.carType}</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>Color</td><td style={{ padding: '4px 8px' }}>{rental.carColor}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#1a56db', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Renter Information</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700, width: '40%' }}>Full Name</td><td style={{ padding: '4px 8px' }}>{rental.renterName}</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>ID / Passport</td><td style={{ padding: '4px 8px' }}>{rental.nationalId}</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>Driving License</td><td style={{ padding: '4px 8px' }}>{rental.driverLicense}</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>Phone</td><td style={{ padding: '4px 8px' }}>{rental.renterPhone}</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>Email</td><td style={{ padding: '4px 8px' }}>{rental.renterEmail}</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>Address</td><td style={{ padding: '4px 8px' }}>{rental.renterAddress}</td></tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ fontSize: '12px', fontWeight: 800, color: '#1a56db', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>Rental Period</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700, width: '40%' }}>Start Date</td><td style={{ padding: '4px 8px' }}>{new Date(rental.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
              <tr><td style={{ padding: '4px 8px', background: '#f3f4f6', fontWeight: 700 }}>End Date</td><td style={{ padding: '4px 8px' }}>{new Date(rental.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td></tr>
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
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#ca8a04' }}>ETB {rental.totalAmount.toLocaleString()}</span>
            </div>
            <p style={{ margin: 0, fontSize: '10px', color: '#a16207' }}>Payment Status: <strong>Paid</strong> &middot; Transaction: {rental.id.toUpperCase()}</p>
          </div>
        </div>

        <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '14px', marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, margin: '0 0 4px 0', color: '#333' }}>Authorized by:</p>
              <p style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>{rental.renterName}</p>
              <p style={{ fontSize: '9px', color: '#666', margin: '4px 0 0 0' }}>Renter &middot; {rental.renterEmail}</p>
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

  const handleExportPDF = async (rental: ActiveRental) => {
    setIsExportingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const m = 16;
      const cw = pw - 2 * m;
      let y = m;

      // Load images independently as data URLs (self-contained, no CORS issues)
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

      // ── Header ──
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
      pdf.text(rental.id.toUpperCase(), pw - m, y, { align: 'right' });
      y += 6;
      pdf.setDrawColor(26, 86, 219);
      pdf.setLineWidth(0.5);
      pdf.line(m, y, pw - m, y);
      y += 8;

      // ── Vehicle ──
      section('VEHICLE INFORMATION');
      row('Vehicle', `${rental.carMake} ${rental.carModel} (${rental.carYear})`);
      row('Plate', rental.carPlate);
      row('Category', rental.carType || 'N/A');
      row('Color', rental.carColor || 'N/A');
      gap(4);

      // ── Renter ──
      section('RENTER INFORMATION');
      row('Full Name', rental.renterName);
      row('National ID', rental.nationalId);
      row('License', rental.driverLicense);
      row('Phone', rental.renterPhone);
      row('Email', rental.renterEmail);
      row('Address', rental.renterAddress);
      gap(4);

      // ── Period ──
      section('RENTAL PERIOD');
      row('Start', new Date(rental.startDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
      row('End', new Date(rental.endDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }));
      gap(4);

      // ── Terms ──
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

      // ── Payment ──
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
      pdf.text(`ETB ${rental.totalAmount.toLocaleString()}`, pw - m - 3, y + 1, { align: 'right' });
      pdf.setFontSize(8);
      pdf.setTextColor(161, 98, 7);
      pdf.text(`Paid  \u00b7  Ref: ${rental.id.toUpperCase()}`, m + 3, y + 6);
      y += 17;

      // ── Signature ──
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
      pdf.text(rental.renterName, pw - m, y + 6, { align: 'right' });
      y += 13;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100);
      pdf.text(rental.renterEmail, pw - m, y, { align: 'right' });

      // ── Footer ──
      pdf.setFontSize(7);
      pdf.setTextColor(150);
      pdf.text('Zoe Car Rental  \u00b7  This document is electronically generated.', pw / 2, ph - 12, { align: 'center' });

      pdf.save(`ZOE_Agreement_${rental.carMake}_${rental.carModel}_${rental.id}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {renderSidebar()}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64 max-sm:ml-0' : 'ml-20 max-sm:ml-0'}`}>
        <header className="h-16 bg-[#0f1f3d] border-b border-blue-900/30 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-blue-300 hover:text-white transition-colors">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 sm:gap-4">
            {pendingCars.length > 0 && (
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2 sm:px-3 py-1 animate-pulse text-[10px] sm:text-xs">
                <Loader2 size={10} className="mr-1 animate-spin" /> {pendingCars.length} Pending
              </Badge>
            )}
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 px-2 sm:px-3 py-1 text-[10px] sm:text-xs">
              {activeCars.length} Active
            </Badge>
          </div>
        </div>
        </header>

        <main className="p-4 md:p-6">
          {/* Overview Page */}
          {activePage === 'overview' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">{t('host.hostOverview')}</h1>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-[#0f1f3d] border-blue-900/30">
                  <CardHeader className="pb-2 p-3 sm:p-6">
                    <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-300">{t('host.totalFleet')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
                    <CardDescription className="text-lg sm:text-2xl font-extrabold text-white">{fleetCars.length}</CardDescription>
                  </CardContent>
                </Card>
                <Card className="bg-[#0f1f3d] border-blue-900/30">
                  <CardHeader className="pb-2 p-3 sm:p-6">
                    <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-300">{t('host.activeListings')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <CardDescription className="text-lg sm:text-2xl font-extrabold text-green-400">{activeCars.length}</CardDescription>
                  </CardContent>
                </Card>
                <Card className="bg-[#0f1f3d] border-blue-900/30">
                  <CardHeader className="pb-2 p-3 sm:p-6">
                    <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-blue-300">{t('host.pendingApproval')}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <CardDescription className="text-lg sm:text-2xl font-extrabold text-yellow-400">{pendingCars.length}</CardDescription>
                  </CardContent>
                </Card>
              </div>
            {/* Pending Fleet Listings */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Loader2 size={16} className="text-yellow-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Pending Fleet Listings</h2>
                  {pendingCars.length > 0 && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{pendingCars.length} pending</Badge>
                  )}
                </div>
                <div className="space-y-3">
                  {pendingCars.map(car => (
                    <Card key={car.id} className="bg-[#0f1f3d] border-yellow-500/30 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          <div className="sm:w-48 h-36 shrink-0 bg-[#0a1628]">
                            {car.images?.[0] ? (
                              <img src={car.images[0]} alt={`${car.make} ${car.model}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center">
                                <Loader2 size={24} className="text-yellow-400 animate-spin" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 p-5">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className="text-white font-bold text-lg">{car.make} {car.model} ({car.year})</h3>
                                <p className="text-blue-300 text-sm">VIN: {car.vin} &middot; Plate: {car.plateNumber}</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                                  <span className="text-blue-400"><span className="text-blue-500">Type:</span> {car.type}</span>
                                  <span className="text-blue-400"><span className="text-blue-500">Seats:</span> {car.seats}</span>
                                  <span className="text-blue-400"><span className="text-blue-500">Fuel:</span> {car.fuelType}</span>
                                  <span className="text-blue-400"><span className="text-blue-500">Trans:</span> {car.transmission}</span>
                                  <span className="text-blue-400"><span className="text-blue-500">Mileage:</span> {car.mileage.toLocaleString()} km</span>
                                  <span className="text-blue-400"><span className="text-blue-500">Condition:</span> {car.condition}</span>
                                </div>
                                <p className="text-blue-400 text-sm mt-1">{car.location} &middot; <span className="text-yellow-400 font-bold">ETB {car.pricePerDay.toLocaleString()}/day</span></p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button size="sm" onClick={() => handleDeleteCar(car.id)}
                                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-lg gap-1">
                                  <Ban size={14} /> {t('host.delete')}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {pendingCars.length === 0 && (
                    <p className="text-sm text-blue-400 py-2">No pending fleet listings.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Rented Fleet Page */}
          {activePage === 'rented' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white">{t('host.rentedFleetTitle')}</h1>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-3 py-1 whitespace-nowrap">
                  <Activity size={14} className="mr-1" /> {activeRentals.length} Active
                </Badge>
              </div>
              {activeRentals.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-900/30 text-center">
                  <div className="rounded-full bg-blue-500/10 p-3 text-blue-400">
                    <CarIcon size={28} />
                  </div>
                  <p className="text-white font-bold">No active rentals</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeRentals.map((rental, index) => (
                    <motion.div
                      key={rental.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="bg-[#0f1f3d] border-blue-900/30 overflow-hidden">
                        <div className="flex items-start gap-4 p-4">
                          <div className="h-20 w-28 sm:h-24 sm:w-36 rounded-xl overflow-hidden shrink-0">
                            <img src={rental.carImage} alt={rental.carModel} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-white font-bold text-sm truncate">{rental.carMake} {rental.carModel}</h3>
                                <p className="text-blue-300 text-xs">{rental.carPlate} &middot; {rental.carYear}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge className="bg-green-500/90 text-white border-0 text-[10px] px-2 py-0.5">
                                  <Activity size={10} className="mr-1" /> Active
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-xs">
                              <div>
                                <span className="text-blue-400 block text-[10px]">Period</span>
                                <span className="text-white font-medium">{new Date(rental.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(rental.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                              <div>
                                <span className="text-blue-400 block text-[10px]">Renter</span>
                                <span className="text-white font-medium truncate block">{rental.renterName}</span>
                              </div>
                              <div>
                                <span className="text-blue-400 block text-[10px]">Total</span>
                                <span className="text-green-400 font-bold">ETB {rental.totalAmount.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-blue-900/30">
                              <a href={`tel:${rental.renterPhone}`} className="text-green-400 hover:text-green-300 text-xs font-bold flex items-center gap-1">
                                <Phone size={11} /> {t('host.call')}
                              </a>
                              <button onClick={() => { setPreviewRental(rental); setShowPdfPreview(true); }} className="text-indigo-400 hover:text-indigo-300 text-xs font-bold flex items-center gap-1">
                                <FileText size={11} /> {t('host.preview')}
                              </button>
                              <button onClick={() => handleExportPDF(rental)} disabled={isExportingPdf} className="text-purple-400 hover:text-purple-300 text-xs font-bold flex items-center gap-1 disabled:opacity-50">
                                {isExportingPdf ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />} {t('host.pdf')}
                              </button>
                              <span className="text-blue-400/50 text-[10px] ml-auto flex items-center gap-1">
                                <Navigation size={10} /> {rental.gpsLocation}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Approvals Page */}
          {activePage === 'approvals' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">Approval Center</h1>

              {/* Stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-[#0f1f3d] border-blue-900/30 p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <ShieldCheck size={22} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xl font-extrabold text-white">{returnRequests.filter(r => r.status === 'pending').length}</p>
                      <p className="text-[10px] text-blue-300 font-bold uppercase tracking-widest">Returns</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Tab buttons */}
              <div className="flex flex-col sm:flex-row gap-2 bg-[#0a1628] p-1.5 rounded-xl border border-blue-900/30 w-full sm:w-fit">
                <button
                  onClick={() => setApprovalTab('rentals')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                    approvalTab === 'rentals'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-blue-400 hover:text-white'
                  }`}
                >
                  <UserCheck size={16} /> Rental Requests
                </button>
                <button
                  onClick={() => setApprovalTab('returns')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all whitespace-nowrap ${
                    approvalTab === 'returns'
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'text-blue-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck size={16} /> Vehicle Returns
                </button>
              </div>


              {/* ——— Section 2: Rental Requests (Pre-Payment) ——— */}
              {approvalTab === 'rentals' && (
                <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <UserCheck size={16} className="text-yellow-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Rental Requests</h2>
                  {rentalRequests.filter(r => r.status === 'pending').length > 0 && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {rentalRequests.filter(r => r.status === 'pending').length} pending
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-blue-300 mb-4">Review renter documents and approve or decline before they can proceed to payment.</p>
                <div className="space-y-4">
                  {rentalRequests.filter(r => r.status === 'pending').length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-900/30 text-center">
                      <div className="rounded-full bg-blue-500/10 p-3 text-blue-400">
                        <ClipboardCheck size={28} />
                      </div>
                      <p className="text-sm font-bold text-white">No pending rental requests</p>
                    </div>
                  ) : (
                    rentalRequests.filter(r => r.status === 'pending').map(req => {
                      const isExpanded = expandedRentalReq === req.id;
                      return (
                        <Card key={req.id} className="bg-[#0f1f3d] border-yellow-500/30 overflow-hidden">
                          <div
                            className="p-5 cursor-pointer hover:bg-blue-500/5 transition-colors flex items-center justify-between"
                            onClick={() => setExpandedRentalReq(isExpanded ? null : req.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0">
                                <img src={req.renterPhoto} alt={req.renterName} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <h3 className="text-white font-bold">{req.renterName}</h3>
                                <p className="text-blue-300 text-sm">{req.carMake} {req.carModel} &middot; {req.carPlate}</p>
                                <p className="text-blue-400 text-xs">{new Date(req.createdAt).toLocaleDateString()} &middot; ETB {req.totalAmount.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                <Loader2 size={12} className="mr-1 animate-spin" /> Pending
                              </Badge>
                              {isExpanded ? <ChevronUp size={18} className="text-blue-400" /> : <ChevronDown size={18} className="text-blue-400" />}
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="px-5 pb-5 border-t border-blue-900/30 pt-4 space-y-5">
                              {/* Renter personal info - two column grid */}
                              <div>
                                <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3 flex items-center gap-2"><User size={14} /> Personal Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Full Name</p>
                                    <p className="text-white text-sm font-bold">{req.renterName}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Age</p>
                                    <p className="text-white text-sm">{req.age}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">National ID</p>
                                    <p className="text-white text-sm font-mono">{req.nationalId}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Phone</p>
                                    <p className="text-white text-sm">{req.renterPhone}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Email</p>
                                    <p className="text-white text-sm">{req.renterEmail}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Address</p>
                                    <p className="text-white text-sm">{req.renterAddress}</p>
                                  </div>
                                </div>
                              </div>
                              {/* Emergency Contact */}
                              {req.familyNumber && (
                                <div>
                                  <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3 flex items-center gap-2"><Phone size={14} /> Emergency Contact</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-[#0a1628] rounded-xl p-3">
                                      <p className="text-[10px] text-blue-500 font-bold uppercase">Contact Number</p>
                                      <p className="text-white text-sm">{req.familyNumber}</p>
                                    </div>
                                    <div className="bg-[#0a1628] rounded-xl p-3">
                                      <p className="text-[10px] text-blue-500 font-bold uppercase">Relation</p>
                                      <p className="text-white text-sm">{req.relation}</p>
                                    </div>
                                    <div className="bg-[#0a1628] rounded-xl p-3">
                                      <p className="text-[10px] text-blue-500 font-bold uppercase">Contact Name</p>
                                      <p className="text-white text-sm">{req.familyName}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {/* Rental Purpose */}
                              {req.purpose && (
                                <div>
                                  <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3 flex items-center gap-2"><Info size={14} /> Rental Purpose</h4>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-blue-200 text-sm italic">"{req.purpose}"</p>
                                  </div>
                                </div>
                              )}
                              {/* Documents - 4 image grid with front/back */}
                              <div>
                                <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3 flex items-center gap-2"><FileText size={14} /> Uploaded Documents</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">National ID — Front</p>
                                    <div className="bg-[#0a1628] rounded-xl overflow-hidden border border-blue-900/30">
                                      <img src={req.nationalIdPhotoFront} alt="National ID Front" className="w-full h-24 object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(req.nationalIdPhotoFront, '_blank')} />
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">National ID — Back</p>
                                    <div className="bg-[#0a1628] rounded-xl overflow-hidden border border-blue-900/30">
                                      <img src={req.nationalIdPhotoBack} alt="National ID Back" className="w-full h-24 object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(req.nationalIdPhotoBack, '_blank')} />
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">License — Front</p>
                                    <div className="bg-[#0a1628] rounded-xl overflow-hidden border border-blue-900/30">
                                      <img src={req.driverLicensePhotoFront} alt="License Front" className="w-full h-24 object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(req.driverLicensePhotoFront, '_blank')} />
                                    </div>
                                    <p className="text-xs text-blue-300 mt-1">License: {req.driverLicense}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">License — Back</p>
                                    <div className="bg-[#0a1628] rounded-xl overflow-hidden border border-blue-900/30">
                                      <img src={req.driverLicensePhotoBack} alt="License Back" className="w-full h-24 object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(req.driverLicensePhotoBack, '_blank')} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Rental details */}
                              <div>
                                <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3 flex items-center gap-2"><Calendar size={14} /> Rental Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="bg-[#0a1628] rounded-xl overflow-hidden border border-blue-900/30">
                                    <img src={req.carImage} alt={req.carModel} className="w-full h-28 object-cover" />
                                    <div className="p-3">
                                      <p className="text-white font-bold text-sm">{req.carMake} {req.carModel}</p>
                                      <p className="text-blue-300 text-xs">{req.carPlate}</p>
                                    </div>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Duration</p>
                                    <p className="text-white text-sm mt-1">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Total Amount</p>
                                    <p className="text-yellow-400 font-bold text-lg mt-1">ETB {req.totalAmount.toLocaleString()}</p>
                                    <p className="text-blue-300 text-xs mt-1">via <span className="font-bold capitalize">{req.paymentMethod || 'pending'}</span></p>
                                  </div>
                                </div>
                              </div>
                              {req.notes && (
                                <div className="bg-[#0a1628] rounded-xl p-3">
                                  <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Renter Notes</p>
                                  <p className="text-blue-200 text-sm italic">"{req.notes}"</p>
                                </div>
                              )}
                              {/* Actions */}
                              <div className="flex items-center gap-3 pt-2">
                                <Button
                                  onClick={() => handleApproveRental(req.id)}
                                  className="flex-1 h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl gap-2"
                                >
                                  <CheckCircle2 size={18} /> {t('host.approveUnlockPayment')}
                                </Button>
                                <Button
                                  onClick={() => handleRejectRental(req.id)}
                                  className="flex-1 h-11 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-xl gap-2"
                                >
                                  <X size={18} /> {t('host.decline')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })
                  )}
                  {/* Approved / Declined history */}
                  {rentalRequests.filter(r => r.status !== 'pending').length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-3">History</p>
                      <div className="space-y-2">
                        {rentalRequests.filter(r => r.status !== 'pending').map(req => (
                          <div key={req.id} className="bg-[#0a1628] rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full overflow-hidden">
                                <img src={req.renterPhoto} alt="" className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <p className="text-white text-sm font-bold">{req.renterName}</p>
                                <p className="text-blue-300 text-xs">{req.carMake} {req.carModel}</p>
                              </div>
                            </div>
                            <Badge className={req.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                              {req.status === 'approved' ? 'Approved' : 'Declined'}
                            </Badge>
                          </div>
                        ))}
                      </div>
              </div>
              )}

              {/* ——— Section 3: Vehicle Return Approval ——— */}
              {approvalTab === 'returns' && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <ShieldCheck size={16} className="text-purple-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Vehicle Return Approval</h2>
                  {returnRequests.filter(r => r.status === 'pending').length > 0 && (
                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                      {returnRequests.filter(r => r.status === 'pending').length} pending
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-blue-300 mb-4">Review returned vehicle condition before confirming receipt.</p>
                <div className="space-y-4">
                  {returnRequests.filter(r => r.status === 'pending').length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-900/30 text-center">
                      <div className="rounded-full bg-blue-500/10 p-3 text-blue-400">
                        <ShieldCheck size={28} />
                      </div>
                      <p className="text-sm font-bold text-white">No pending returns</p>
                    </div>
                  ) : (
                    returnRequests.filter(r => r.status === 'pending').map(ret => {
                      const isExpanded = expandedReturnReq === ret.id;
                      return (
                        <Card key={ret.id} className="bg-[#0f1f3d] border-purple-500/30 overflow-hidden">
                          <div
                            className="p-5 cursor-pointer hover:bg-blue-500/5 transition-colors flex items-center justify-between"
                            onClick={() => setExpandedReturnReq(isExpanded ? null : ret.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0">
                                <img src={ret.carImage} alt={ret.carModel} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <h3 className="text-white font-bold">{ret.carMake} {ret.carModel}</h3>
                                <p className="text-blue-300 text-sm">{ret.carPlate}</p>
                                <p className="text-blue-400 text-xs">Returned {new Date(ret.returnTime).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                <Loader2 size={12} className="mr-1 animate-spin" /> Pending
                              </Badge>
                              {isExpanded ? <ChevronUp size={18} className="text-blue-400" /> : <ChevronDown size={18} className="text-blue-400" />}
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="px-5 pb-5 border-t border-blue-900/30 pt-4 space-y-5">
                              {/* Current vehicle photos */}
                              <div>
                                <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3">Current Vehicle Photos</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {ret.currentPhotos.map((photo, idx) => (
                                    <div key={idx} className="bg-[#0a1628] rounded-xl overflow-hidden border border-blue-900/30">
                                      <img src={photo} alt={`Return photo ${idx + 1}`} className="w-full h-28 object-cover" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {/* Condition report */}
                              <div>
                                <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3">Condition Report</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className={`h-2 w-2 rounded-full ${ret.conditionReport.exterior.includes('Minor') || ret.conditionReport.exterior.includes('Excellent') ? 'bg-green-400' : 'bg-yellow-400'}`} />
                                      <p className="text-xs font-bold text-white">Exterior</p>
                                    </div>
                                    <p className="text-blue-300 text-sm ml-4">{ret.conditionReport.exterior}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="h-2 w-2 rounded-full bg-green-400" />
                                      <p className="text-xs font-bold text-white">Interior</p>
                                    </div>
                                    <p className="text-blue-300 text-sm ml-4">{ret.conditionReport.interior}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className={`h-2 w-2 rounded-full ${ret.conditionReport.tires.includes('low') ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                      <p className="text-xs font-bold text-white">Tires</p>
                                    </div>
                                    <p className="text-blue-300 text-sm ml-4">{ret.conditionReport.tires}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="h-2 w-2 rounded-full bg-green-400" />
                                      <p className="text-xs font-bold text-white">Lights</p>
                                    </div>
                                    <p className="text-blue-300 text-sm ml-4">{ret.conditionReport.lights}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className={`h-2 w-2 rounded-full ${ret.conditionReport.wipers.includes('need') ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                      <p className="text-xs font-bold text-white">Wipers</p>
                                    </div>
                                    <p className="text-blue-300 text-sm ml-4">{ret.conditionReport.wipers}</p>
                                  </div>
                                </div>
                              </div>
                              {/* Damage assessment */}
                              <div>
                                <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3">Damage Check</h4>
                                <div className="bg-[#0a1628] rounded-xl p-4 border border-blue-900/30">
                                  {ret.damageCheck.hasDamage ? (
                                    <div className="flex items-start gap-3">
                                      <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                                        <AlertTriangle size={20} className="text-red-400" />
                                      </div>
                                      <div>
                                        <p className="text-red-400 font-bold text-sm">{ret.damageCheck.description}</p>
                                        <p className="text-yellow-400 font-bold text-lg mt-1">Est. Cost: ETB {ret.damageCheck.estimatedCost.toLocaleString()}</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle2 size={20} className="text-green-400" />
                                      </div>
                                      <div>
                                        <p className="text-green-400 font-bold">No damage detected</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Fuel & mileage */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-[#0a1628] rounded-xl p-3">
                                  <p className="text-[10px] text-blue-500 font-bold uppercase">Fuel Status</p>
                                  <p className="text-white font-bold text-base mt-1">{ret.fuelStatus}</p>
                                </div>
                                <div className="bg-[#0a1628] rounded-xl p-3">
                                  <p className="text-[10px] text-blue-500 font-bold uppercase">Mileage at Return</p>
                                  <p className="text-white font-bold text-base mt-1">{ret.mileageAtReturn.toLocaleString()} km</p>
                                </div>
                                <div className="bg-[#0a1628] rounded-xl p-3">
                                  <p className="text-[10px] text-blue-500 font-bold uppercase">Return Location</p>
                                  <p className="text-white text-sm mt-1">{ret.returnLocation}</p>
                                </div>
                              </div>
                              {/* Actions */}
                              <div className="flex items-center gap-3 pt-2">
                                <Button
                                  onClick={() => handleApproveRental(req.id)}
                                  className="flex-1 h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl gap-2"
                                >
                                  <CheckCircle2 size={18} /> {t('host.approveUnlockPayment')}
                                </Button>
                                <Button
                                  onClick={() => handleRejectRental(req.id)}
                                  className="flex-1 h-11 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-xl gap-2"
                                >
                                  <X size={18} /> {t('host.decline')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })
                  )}
                  {/* Approved / Disputed returns */}
                  {returnRequests.filter(r => r.status !== 'pending').length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-3">History</p>
                      <div className="space-y-2">
                        {returnRequests.filter(r => r.status !== 'pending').map(ret => (
                          <div key={ret.id} className="bg-[#0a1628] rounded-xl p-3 flex items-center justify-between">
                            <div>
                              <p className="text-white text-sm font-bold">{ret.carMake} {ret.carModel}</p>
                              <p className="text-blue-300 text-xs">{ret.carPlate}</p>
                            </div>
                            <Badge className={ret.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                              {ret.status === 'approved' ? 'Return Approved' : 'Disputed'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}
                </div>
                <p className="text-sm text-blue-300 mb-4">Review returned vehicle condition before confirming receipt.</p>
                <div className="space-y-4">
                  {returnRequests.filter(r => r.status === 'pending').length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-900/30 text-center">
                      <div className="rounded-full bg-blue-500/10 p-3 text-blue-400">
                        <ShieldCheck size={28} />
                      </div>
                      <p className="text-sm font-bold text-white">No pending returns</p>
                    </div>
                  ) : (
                    returnRequests.filter(r => r.status === 'pending').map(ret => {
                      const isExpanded = expandedReturnReq === ret.id;
                      return (
                        <Card key={ret.id} className="bg-[#0f1f3d] border-purple-500/30 overflow-hidden">
                          <div
                            className="p-5 cursor-pointer hover:bg-blue-500/5 transition-colors flex items-center justify-between"
                            onClick={() => setExpandedReturnReq(isExpanded ? null : ret.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0">
                                <img src={ret.carImage} alt={ret.carModel} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <h3 className="text-white font-bold">{ret.carMake} {ret.carModel}</h3>
                                <p className="text-blue-300 text-sm">{ret.carPlate}</p>
                                <p className="text-blue-400 text-xs">Returned {new Date(ret.returnTime).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                                <Loader2 size={12} className="mr-1 animate-spin" /> Pending
                              </Badge>
                              {isExpanded ? <ChevronUp size={18} className="text-blue-400" /> : <ChevronDown size={18} className="text-blue-400" />}
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="px-5 pb-5 border-t border-blue-900/30 pt-4 space-y-5">
                              {/* Current vehicle photos */}
                              <div>
                                <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3">Current Vehicle Photos</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  {ret.currentPhotos.map((photo, idx) => (
                                    <div key={idx} className="bg-[#0a1628] rounded-xl overflow-hidden border border-blue-900/30">
                                      <img src={photo} alt={`Return photo ${idx + 1}`} className="w-full h-28 object-cover" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                              {/* Condition report */}
                              <div>
                                <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3">Condition Report</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className={`h-2 w-2 rounded-full ${ret.conditionReport.exterior.includes('Minor') || ret.conditionReport.exterior.includes('Excellent') ? 'bg-green-400' : 'bg-yellow-400'}`} />
                                      <p className="text-xs font-bold text-white">Exterior</p>
                                    </div>
                                    <p className="text-blue-300 text-sm ml-4">{ret.conditionReport.exterior}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="h-2 w-2 rounded-full bg-green-400" />
                                      <p className="text-xs font-bold text-white">Interior</p>
                                    </div>
                                    <p className="text-blue-300 text-sm ml-4">{ret.conditionReport.interior}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className={`h-2 w-2 rounded-full ${ret.conditionReport.tires.includes('low') ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                      <p className="text-xs font-bold text-white">Tires</p>
                                    </div>
                                    <p className="text-blue-300 text-sm ml-4">{ret.conditionReport.tires}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="h-2 w-2 rounded-full bg-green-400" />
                                      <p className="text-xs font-bold text-white">Lights</p>
                                    </div>
                                    <p className="text-blue-300 text-sm ml-4">{ret.conditionReport.lights}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className={`h-2 w-2 rounded-full ${ret.conditionReport.wipers.includes('need') ? 'bg-yellow-400' : 'bg-green-400'}`} />
                                      <p className="text-xs font-bold text-white">Wipers</p>
                                    </div>
                                    <p className="text-blue-300 text-sm ml-4">{ret.conditionReport.wipers}</p>
                                  </div>
                                </div>
                              </div>
                              {/* Damage assessment */}
                              <div>
                                <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3">Damage Check</h4>
                                <div className="bg-[#0a1628] rounded-xl p-4 border border-blue-900/30">
                                  {ret.damageCheck.hasDamage ? (
                                    <div className="flex items-start gap-3">
                                      <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                                        <AlertTriangle size={20} className="text-red-400" />
                                      </div>
                                      <div>
                                        <p className="text-red-400 font-bold text-sm">{ret.damageCheck.description}</p>
                                        <p className="text-yellow-400 font-bold text-lg mt-1">Est. Cost: ETB {ret.damageCheck.estimatedCost.toLocaleString()}</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                                        <CheckCircle2 size={20} className="text-green-400" />
                                      </div>
                                      <div>
                                        <p className="text-green-400 font-bold">No damage detected</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Fuel & mileage */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-[#0a1628] rounded-xl p-3">
                                  <p className="text-[10px] text-blue-500 font-bold uppercase">Fuel Status</p>
                                  <p className="text-white font-bold text-base mt-1">{ret.fuelStatus}</p>
                                </div>
                                <div className="bg-[#0a1628] rounded-xl p-3">
                                  <p className="text-[10px] text-blue-500 font-bold uppercase">Mileage at Return</p>
                                  <p className="text-white font-bold text-base mt-1">{ret.mileageAtReturn.toLocaleString()} km</p>
                                </div>
                                <div className="bg-[#0a1628] rounded-xl p-3">
                                  <p className="text-[10px] text-blue-500 font-bold uppercase">Return Location</p>
                                  <p className="text-white text-sm mt-1">{ret.returnLocation}</p>
                                </div>
                              </div>
                              {/* Actions */}
                              <div className="flex items-center gap-3 pt-2">
                                <Button
                                  onClick={() => handleApproveReturn(ret.id)}
                                  className="flex-1 h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl gap-2"
                                >
                                  <CheckCircle2 size={18} /> Approve Return â€” Vehicle Received
                                </Button>
                                <Button
                                  onClick={() => handleDisputeReturn(ret.id)}
                                  className="flex-1 h-11 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-xl gap-2"
                                >
                                  <AlertTriangle size={18} /> Dispute
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })
                  )}
                  {/* Approved / Disputed returns */}
                  {returnRequests.filter(r => r.status !== 'pending').length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-3">History</p>
                      <div className="space-y-2">
                        {returnRequests.filter(r => r.status !== 'pending').map(ret => (
                          <div key={ret.id} className="bg-[#0a1628] rounded-xl p-3 flex items-center justify-between">
                            <div>
                              <p className="text-white text-sm font-bold">{ret.carMake} {ret.carModel}</p>
                              <p className="text-blue-300 text-xs">{ret.carPlate}</p>
                            </div>
                            <Badge className={ret.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                              {ret.status === 'approved' ? 'Return Approved' : 'Disputed'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}

              {/* â”€â”€â”€ Section 3: Rental Requests (Pre-Payment) â”€â”€â”€ */}
              {approvalTab === 'rentals' && (
                <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <UserCheck size={16} className="text-yellow-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Rental Requests</h2>
                  {rentalRequests.filter(r => r.status === 'pending').length > 0 && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      {rentalRequests.filter(r => r.status === 'pending').length} pending
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-blue-300 mb-4">Review renter documents and approve or decline before they can proceed to payment.</p>
                <div className="space-y-4">
                  {rentalRequests.filter(r => r.status === 'pending').length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-900/30 text-center">
                      <div className="rounded-full bg-blue-500/10 p-3 text-blue-400">
                        <ClipboardCheck size={28} />
                      </div>
                      <p className="text-sm font-bold text-white">No pending rental requests</p>
                    </div>
                  ) : (
                    rentalRequests.filter(r => r.status === 'pending').map(req => {
                      const isExpanded = expandedRentalReq === req.id;
                      return (
                        <Card key={req.id} className="bg-[#0f1f3d] border-yellow-500/30 overflow-hidden">
                          <div
                            className="p-5 cursor-pointer hover:bg-blue-500/5 transition-colors flex items-center justify-between"
                            onClick={() => setExpandedRentalReq(isExpanded ? null : req.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0">
                                <img src={req.renterPhoto} alt={req.renterName} className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <h3 className="text-white font-bold">{req.renterName}</h3>
                                <p className="text-blue-300 text-sm">{req.carMake} {req.carModel} &middot; {req.carPlate}</p>
                                <p className="text-blue-400 text-xs">{new Date(req.createdAt).toLocaleDateString()} &middot; ETB {req.totalAmount.toLocaleString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                <Loader2 size={12} className="mr-1 animate-spin" /> Pending
                              </Badge>
                              {isExpanded ? <ChevronUp size={18} className="text-blue-400" /> : <ChevronDown size={18} className="text-blue-400" />}
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="px-5 pb-5 border-t border-blue-900/30 pt-4 space-y-5">
                              {/* Renter personal info - two column grid */}
                              <div>
                                <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3 flex items-center gap-2"><User size={14} /> Personal Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Full Name</p>
                                    <p className="text-white text-sm font-bold">{req.renterName}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Age</p>
                                    <p className="text-white text-sm">{req.age}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">National ID</p>
                                    <p className="text-white text-sm font-mono">{req.nationalId}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Phone</p>
                                    <p className="text-white text-sm">{req.renterPhone}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Email</p>
                                    <p className="text-white text-sm">{req.renterEmail}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Address</p>
                                    <p className="text-white text-sm">{req.renterAddress}</p>
                                  </div>
                                </div>
                              </div>
                              {/* Emergency Contact */}
                              {req.familyNumber && (
                                <div>
                                  <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3 flex items-center gap-2"><Phone size={14} /> Emergency Contact</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-[#0a1628] rounded-xl p-3">
                                      <p className="text-[10px] text-blue-500 font-bold uppercase">Contact Number</p>
                                      <p className="text-white text-sm">{req.familyNumber}</p>
                                    </div>
                                    <div className="bg-[#0a1628] rounded-xl p-3">
                                      <p className="text-[10px] text-blue-500 font-bold uppercase">Relation</p>
                                      <p className="text-white text-sm">{req.relation}</p>
                                    </div>
                                    <div className="bg-[#0a1628] rounded-xl p-3">
                                      <p className="text-[10px] text-blue-500 font-bold uppercase">Contact Name</p>
                                      <p className="text-white text-sm">{req.familyName}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {/* Rental Purpose */}
                              {req.purpose && (
                                <div>
                                  <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3 flex items-center gap-2"><Info size={14} /> Rental Purpose</h4>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-blue-200 text-sm italic">"{req.purpose}"</p>
                                  </div>
                                </div>
                              )}
                              {/* Documents - 4 image grid with front/back */}
                              <div>
                                <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3 flex items-center gap-2"><FileText size={14} /> Uploaded Documents</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">National ID — Front</p>
                                    <div className="bg-[#0a1628] rounded-xl overflow-hidden border border-blue-900/30">
                                      <img src={req.nationalIdPhotoFront} alt="National ID Front" className="w-full h-24 object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(req.nationalIdPhotoFront, '_blank')} />
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">National ID — Back</p>
                                    <div className="bg-[#0a1628] rounded-xl overflow-hidden border border-blue-900/30">
                                      <img src={req.nationalIdPhotoBack} alt="National ID Back" className="w-full h-24 object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(req.nationalIdPhotoBack, '_blank')} />
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">License — Front</p>
                                    <div className="bg-[#0a1628] rounded-xl overflow-hidden border border-blue-900/30">
                                      <img src={req.driverLicensePhotoFront} alt="License Front" className="w-full h-24 object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(req.driverLicensePhotoFront, '_blank')} />
                                    </div>
                                    <p className="text-xs text-blue-300 mt-1">License: {req.driverLicense}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">License — Back</p>
                                    <div className="bg-[#0a1628] rounded-xl overflow-hidden border border-blue-900/30">
                                      <img src={req.driverLicensePhotoBack} alt="License Back" className="w-full h-24 object-cover hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(req.driverLicensePhotoBack, '_blank')} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {/* Rental details */}
                              <div>
                                <h4 className="text-xs uppercase tracking-widest text-blue-400 font-bold mb-3 flex items-center gap-2"><Calendar size={14} /> Rental Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="bg-[#0a1628] rounded-xl overflow-hidden border border-blue-900/30">
                                    <img src={req.carImage} alt={req.carModel} className="w-full h-28 object-cover" />
                                    <div className="p-3">
                                      <p className="text-white font-bold text-sm">{req.carMake} {req.carModel}</p>
                                      <p className="text-blue-300 text-xs">{req.carPlate}</p>
                                    </div>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Duration</p>
                                    <p className="text-white text-sm mt-1">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                                  </div>
                                  <div className="bg-[#0a1628] rounded-xl p-3">
                                    <p className="text-[10px] text-blue-500 font-bold uppercase">Total Amount</p>
                                    <p className="text-yellow-400 font-bold text-lg mt-1">ETB {req.totalAmount.toLocaleString()}</p>
                                    <p className="text-blue-300 text-xs mt-1">via <span className="font-bold capitalize">{req.paymentMethod || 'pending'}</span></p>
                                  </div>
                                </div>
                              </div>
                              {req.notes && (
                                <div className="bg-[#0a1628] rounded-xl p-3">
                                  <p className="text-[10px] text-blue-500 font-bold uppercase mb-1">Renter Notes</p>
                                  <p className="text-blue-200 text-sm italic">"{req.notes}"</p>
                                </div>
                              )}
                              {/* Actions */}
                              <div className="flex items-center gap-3 pt-2">
                                <Button
                                  onClick={() => handleApproveRental(req.id)}
                                  className="flex-1 h-11 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl gap-2"
                                >
                                  <CheckCircle2 size={18} /> {t('host.approveUnlockPayment')}
                                </Button>
                                <Button
                                  onClick={() => handleRejectRental(req.id)}
                                  className="flex-1 h-11 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 rounded-xl gap-2"
                                >
                                  <X size={18} /> {t('host.decline')}
                                </Button>
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })
                  )}
                  {/* Approved / Declined history */}
                  {rentalRequests.filter(r => r.status !== 'pending').length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-3">History</p>
                      <div className="space-y-2">
                        {rentalRequests.filter(r => r.status !== 'pending').map(req => (
                          <div key={req.id} className="bg-[#0a1628] rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full overflow-hidden">
                                <img src={req.renterPhoto} alt="" className="h-full w-full object-cover" />
                              </div>
                              <div>
                                <p className="text-white text-sm font-bold">{req.renterName}</p>
                                <p className="text-blue-300 text-xs">{req.carMake} {req.carModel}</p>
                              </div>
                            </div>
                            <Badge className={req.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                              {req.status === 'approved' ? 'Approved' : 'Declined'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}
            </motion.div>
          )}

          {/* My Fleet Page */}
          {activePage === 'my-fleet' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">{t('host.myFleetTitle')}</h1>
                <Button onClick={() => setActivePage('list-car')} className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-bold gap-2 text-xs sm:text-sm whitespace-nowrap">
                  <Plus size={16} /> Add Car
                </Button>
              </div>
              {fleetCars.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-blue-900/30 text-center">
                  <div className="rounded-full bg-blue-500/10 p-4 text-blue-400">
                    <CarIcon size={40} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">No cars in fleet</p>
                    <p className="text-sm text-blue-300">Start earning by listing your first vehicle.</p>
                  </div>
                  <Button onClick={() => setActivePage('list-car')} className="rounded-xl font-bold">List Your Car</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {fleetCars.map(car => (
                    <motion.div
                      key={car.id} layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#0f1f3d] rounded-2xl border border-blue-900/30 overflow-hidden group hover:border-blue-500/50 transition-all"
                    >
                      <div className="h-40 overflow-hidden relative">
                        <img src={car.images?.[0] || 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=800'} alt={car.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-3 right-3">
                          <Badge className={cn(
                            'text-[10px] uppercase tracking-widest font-bold px-3 py-1',
                            car.status === 'active' || car.status === 'approved' ? 'bg-green-500/90 text-white' :
                            car.status === 'pending_approval' ? 'bg-yellow-500/90 text-white' :
                            car.status === 'rejected' ? 'bg-red-500/90 text-white' :
                            'bg-gray-500/90 text-white'
                          )}>
                            {car.status === 'pending_approval' ? 'Pending' : car.status.charAt(0).toUpperCase() + car.status.slice(1)}
                          </Badge>
                        </div>
                        {car.status === 'pending_approval' && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                            <div className="text-center">
                              <Loader2 size={32} className="text-yellow-400 animate-spin mx-auto mb-2" />
                              <p className="text-white text-sm font-bold">Admin Review</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-white">{car.make} {car.model}</h3>
                            <p className="text-sm text-blue-300">{car.year} &middot; {car.type}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                          <div className="flex items-center gap-1 text-blue-300"><Gauge size={14} /> {car.mileage} km</div>
                          <div className="flex items-center gap-1 text-blue-300"><Fuel size={14} /> {car.fuelType}</div>
                          <div className="flex items-center gap-1 text-blue-300"><Cpu size={14} /> {car.transmission}</div>
                          <div className="flex items-center gap-1 text-blue-300"><Users size={14} /> {car.seats} seats</div>
                        </div>
                        <div className="text-xs text-blue-400 font-mono mb-2">VIN: {car.vin} &middot; Plate: {car.plateNumber}</div>
                        <div className="flex items-center gap-2 text-sm text-blue-300 mb-4">
                          <MapPin size={14} />
                          <span>{car.location}</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-blue-900/30">
                          <p className="text-lg font-extrabold text-white">ETB {car.pricePerDay.toLocaleString()}<span className="text-xs font-normal text-blue-300">/day</span></p>
                          <div className="flex gap-1">
                            <button onClick={() => handleEditCar(car)}
                              className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-300 hover:text-blue-400 transition-all"
                              title="Edit"><Edit3 size={16} /></button>
                            {(car.status === 'active' || car.status === 'approved') && (
                              <button onClick={() => handleToggleStatus(car.id)}
                                className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-300 hover:text-blue-400 transition-all"
                                title="Deactivate"><EyeOff size={16} /></button>
                            )}
                            {car.status === 'inactive' && (
                              <button onClick={() => handleToggleStatus(car.id)}
                                className="p-2 rounded-lg hover:bg-green-500/10 text-green-400 transition-all"
                                title="Activate"><Eye size={16} /></button>
                            )}
                            <button onClick={() => handleDeleteCar(car.id)}
                              className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all"
                              title={t('host.delete')}><Trash2 size={16} /></button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                }
              </div>
              )}
            </motion.div>
          )}

          {/* List New Car Page */}
          {activePage === 'list-car' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white mb-4 sm:mb-6">{t('host.listNewVehicle')}</h1>
              {(
                <form onSubmit={handleSubmitListing} className="max-w-4xl space-y-6">
                  <Card className="bg-[#0f1f3d] border-blue-900/30">
                    <CardHeader>
                      <CardTitle className="text-white font-bold flex items-center gap-2"><CarIcon size={20} /> {t('host.vehicleInfo')}</CardTitle>
                      <CardDescription className="text-blue-300">Enter the complete details of your vehicle.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">{t('host.brand')}</label>
                          <Input placeholder="Toyota" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})}
                            className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white placeholder:text-blue-400/40" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">{t('host.model')}</label>
                          <Input placeholder="Camry" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})}
                            className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white placeholder:text-blue-400/40" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Year</label>
                          <Input type="number" placeholder="2023" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                            className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Plate Number *</label>
                          <Input placeholder="AA-12345" value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value})}
                            className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white placeholder:text-blue-400/40" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">VIN / Chassis Number *</label>
                          <Input placeholder="1HGCM82633A004352" value={formData.vin} onChange={e => setFormData({...formData, vin: e.target.value})}
                            className="rounded-xl h-12 font-mono bg-[#0a1628] border-blue-900/30 text-white placeholder:text-blue-400/40" />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Transmission</label>
                          <select value={formData.transmission} onChange={e => setFormData({...formData, transmission: e.target.value})}
                            className="flex h-12 w-full rounded-xl bg-[#0a1628] border border-blue-900/30 px-3 py-2 text-sm text-white">
                            <option value="Automatic">Automatic</option>
                            <option value="Manual">Manual</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Fuel Type</label>
                          <select value={formData.fuelType} onChange={e => setFormData({...formData, fuelType: e.target.value})}
                            className="flex h-12 w-full rounded-xl bg-[#0a1628] border border-blue-900/30 px-3 py-2 text-sm text-white">
                            <option value="Petrol">Petrol</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Electric">Electric</option>
                            <option value="Hybrid">Hybrid</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Vehicle Type</label>
                          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                            className="flex h-12 w-full rounded-xl bg-[#0a1628] border border-blue-900/30 px-3 py-2 text-sm text-white">
                            {carTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Mileage (km)</label>
                          <Input type="number" placeholder="0" value={formData.mileage} onChange={e => setFormData({...formData, mileage: parseInt(e.target.value)})}
                            className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Seating Capacity</label>
                          <Input type="number" placeholder="5" value={formData.seats} onChange={e => setFormData({...formData, seats: parseInt(e.target.value)})}
                            className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Condition</label>
                          <select value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}
                            className="flex h-12 w-full rounded-xl bg-[#0a1628] border border-blue-900/30 px-3 py-2 text-sm text-white">
                            <option value="Excellent">Excellent</option>
                            <option value="Good">Good</option>
                            <option value="Fair">Fair</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0f1f3d] border-blue-900/30">
                    <CardHeader>
                      <CardTitle className="text-white font-bold flex items-center gap-2"><ShieldCheck size={20} /> Status & Pricing</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Insurance Status</label>
                          <select value={formData.insuranceStatus} onChange={e => setFormData({...formData, insuranceStatus: e.target.value})}
                            className="flex h-12 w-full rounded-xl bg-[#0a1628] border border-blue-900/30 px-3 py-2 text-sm text-white">
                            <option value="Active">Active</option>
                            <option value="Expired">Expired</option>
                            <option value="Pending">Pending</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Registration Status</label>
                          <select value={formData.registrationStatus} onChange={e => setFormData({...formData, registrationStatus: e.target.value})}
                            className="flex h-12 w-full rounded-xl bg-[#0a1628] border border-blue-900/30 px-3 py-2 text-sm text-white">
                            <option value="Up to Date">Up to Date</option>
                            <option value="Expiring">Expiring</option>
                            <option value="Expired">Expired</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Rental Price (ETB/day) *</label>
                          <Input type="number" placeholder="5000" value={formData.pricePerDay} onChange={e => setFormData({...formData, pricePerDay: e.target.value})}
                            className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Location *</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                            <Input placeholder="Bole, Addis Ababa" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                              className="rounded-xl h-12 pl-10 bg-[#0a1628] border-blue-900/30 text-white placeholder:text-blue-400/40" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-blue-300">Description</label>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                          className="w-full rounded-xl bg-[#0a1628] border border-blue-900/30 px-3 py-2 text-sm text-white min-h-[80px]"
                          placeholder="Describe your vehicle's features, condition, and any special notes..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-blue-300 flex items-center gap-2">
                          <Cpu size={14} className="text-blue-400" /> GPS Tracking Code *
                        </label>
                        <Input placeholder="Hardware tracking ID" value={formData.gpsCode} onChange={e => setFormData({...formData, gpsCode: e.target.value})}
                          className="rounded-xl h-12 font-mono bg-[#0a1628] border-blue-900/30 text-white placeholder:text-blue-400/40" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0f1f3d] border-blue-900/30">
                    <CardHeader>
                      <CardTitle className="text-white font-bold flex items-center gap-2"><Camera size={20} /> Vehicle Photos</CardTitle>
                      <CardDescription className="text-blue-300">Upload photos of your vehicle (front, back, interior, sides).</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="rounded-2xl border-2 border-dashed border-blue-900/30 bg-[#0a1628] p-8 text-center"
                      >
                        <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                          <Image className="text-blue-400" size={32} />
                        </div>
                        <p className="text-sm font-bold text-white">Vehicle photos will use a default image</p>
                        <p className="text-xs text-blue-400 mt-1">You can add photos after listing</p>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="text-xs text-blue-400 mb-2">* Required fields</div>
                  <Button type="submit" disabled={isSubmitting}
                    className="w-full h-14 rounded-xl text-lg font-bold shadow-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    {isSubmitting ? (
                      <span className="flex items-center gap-2"><Loader2 size={20} className="animate-spin" /> Submitting...</span>
                    ) : t('host.submitForApproval')}
                  </Button>
                </form>
              )}
            </motion.div>
          )}

          {/* Track My Car Page */}
          {activePage === 'track' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">{t('host.liveGpsTracking')}</h1>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 whitespace-nowrap">
                  <Activity size={14} className="mr-1" /> {activeRentals.length} {t('host.tracked')}
                </Badge>
              </div>
              {activeRentals.length === 0 ? (
                <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-blue-900/30 text-center">
                  <div className="rounded-full bg-blue-500/10 p-4 text-blue-400">
                    <Navigation size={40} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">No active rentals to track</p>
                    <p className="text-sm text-blue-300">Rented vehicles with GPS trackers will appear here.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Vehicle List */}
                  <div className="lg:col-span-1 space-y-4">
                    <Card className="bg-[#0f1f3d] border-blue-900/30">
                      <CardHeader>
                        <CardTitle className="text-white font-bold">Active Vehicles</CardTitle>
                        <CardDescription className="text-blue-300">Click to track live location</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {activeRentals.map(rental => {
                          const loc = rentalLocations[rental.id] || { lat: rental.gpsLat, lng: rental.gpsLng };
                          const engineOn = engineStatus[rental.id] !== false;
                          return (
                            <button
                              key={rental.id}
                              onClick={() => setTrackedRental(rental.id)}
                              className={`w-full text-left p-4 rounded-xl border transition-all ${
                                trackedRental === rental.id
                                  ? 'bg-blue-500/20 border-blue-500/50'
                                  : 'bg-[#0a1628] border-blue-900/30 hover:border-blue-500/30'
                              }`}
                            >
                              <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0">
                                  <img src={rental.carImage} alt={rental.carModel} className="h-full w-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-white truncate">{rental.carMake} {rental.carModel}</p>
                                  <p className="text-[10px] text-blue-400 font-mono">{rental.carPlate}</p>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-300">Engine:</span>
                                <span className={`font-bold flex items-center gap-1 ${engineOn ? 'text-green-400' : 'text-red-400'}`}>
                                  <span className={`h-2 w-2 rounded-full ${engineOn ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                                  {engineOn ? 'ON' : 'OFF'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs mt-1">
                                <span className="text-blue-300">Speed:</span>
                                <span className="text-white font-bold">{engineOn ? `${rental.gpsSpeed} km/h` : '0 km/h'}</span>
                              </div>
                              {hostLocation && (
                                <div className="flex items-center justify-between text-xs mt-1">
                                  <span className="text-blue-300">Distance:</span>
                                  <span className="text-blue-400 font-bold">{getDistance(hostLocation.lat, hostLocation.lng, loc.lat, loc.lng)}</span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Map + Controls */}
                  <div className="lg:col-span-2 space-y-4">
                    {trackedRental && (() => {
                      const rental = activeRentals.find(r => r.id === trackedRental);
                      if (!rental) return null;
                      const loc = rentalLocations[rental.id] || { lat: rental.gpsLat, lng: rental.gpsLng };
                      const engineOn = engineStatus[rental.id] !== false;
                      return (
                        <>
                          {/* Live Map */}
                          <Card className="bg-[#0f1f3d] border-blue-900/30 h-[450px] overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628] to-[#0f1f3d]">
                              {/* Grid overlay */}
                              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '25px 25px' }} />
                              {/* Road lines */}
                              <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-900/30 -translate-y-1/2 rotate-[25deg]" />
                              <div className="absolute top-1/3 left-0 w-full h-1 bg-blue-900/30 -translate-y-1/2 -rotate-[15deg]" />
                              <div className="absolute top-2/3 left-0 w-full h-1 bg-blue-900/30 -translate-y-1/2 rotate-[10deg]" />
                              <div className="absolute top-0 left-1/2 w-1 h-full bg-blue-900/30 -translate-x-1/2 rotate-[20deg]" />
                              {/* Car marker with pulse */}
                              <motion.div
                                key={`${loc.lat}-${loc.lng}`}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute z-10"
                                style={{
                                  left: `${((loc.lng - 38.74) / 0.08) * 100}%`,
                                  top: `${((loc.lat - 8.97) / 0.07) * 100}%`,
                                }}
                              >
                                <div className="relative">
                                  <div className={`absolute -inset-6 rounded-full animate-ping ${engineOn ? 'bg-green-500/30' : 'bg-red-500/30'}`} />
                                  <div className={`h-12 w-12 rounded-xl shadow-2xl flex items-center justify-center border-2 border-white ${
                                    engineOn ? 'bg-green-500' : 'bg-red-500'
                                  }`}>
                                    <Navigation size={22} className="text-white" />
                                  </div>
                                  <div className="absolute top-14 left-1/2 -translate-x-1/2 bg-[#0f1f3d] px-4 py-2 rounded-xl border border-blue-900/30 shadow-xl whitespace-nowrap">
                                    <p className="text-xs font-bold text-white">{rental.carMake} {rental.carModel}</p>
                                    <p className="text-[10px] text-blue-300">{rental.gpsLocation}</p>
                                  </div>
                                </div>
                              </motion.div>
                              {/* Host marker with connecting line */}
                              {hostLocation && (
                                <>
                                  {/* Dashed connecting line */}
                                  <svg className="absolute inset-0 z-[5] pointer-events-none" style={{ width: '100%', height: '100%' }}>
                                    <line
                                      x1={`${((hostLocation.lng - 38.74) / 0.08) * 100}%`}
                                      y1={`${((hostLocation.lat - 8.97) / 0.07) * 100}%`}
                                      x2={`${((loc.lng - 38.74) / 0.08) * 100}%`}
                                      y2={`${((loc.lat - 8.97) / 0.07) * 100}%`}
                                      stroke="#60a5fa"
                                      strokeWidth="2"
                                      strokeDasharray="6 4"
                                      opacity="0.6"
                                    />
                                    {/* Distance label */}
                                    <text
                                      x={`${(((hostLocation.lng + loc.lng) / 2 - 38.74) / 0.08) * 100}%`}
                                      y={`${(((hostLocation.lat + loc.lat) / 2 - 8.97) / 0.07) * 100}%`}
                                      fill="#60a5fa"
                                      fontSize="11"
                                      textAnchor="middle"
                                      dy="-8"
                                      className="font-bold"
                                    >
                                      {getDistance(hostLocation.lat, hostLocation.lng, loc.lat, loc.lng)}
                                    </text>
                                  </svg>
                                  {/* Host marker */}
                                  <div
                                    className="absolute z-10"
                                    style={{
                                      left: `${((hostLocation.lng - 38.74) / 0.08) * 100}%`,
                                      top: `${((hostLocation.lat - 8.97) / 0.07) * 100}%`,
                                    }}
                                  >
                                    <div className="relative">
                                      <div className="absolute -inset-4 rounded-full animate-ping bg-blue-400/30" />
                                      <div className="h-10 w-10 rounded-full bg-blue-500 border-2 border-white shadow-2xl flex items-center justify-center">
                                        <Crosshair size={18} className="text-white" />
                                      </div>
                                      <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-[#0f1f3d]/90 backdrop-blur px-3 py-1.5 rounded-xl border border-blue-900/30 shadow-xl whitespace-nowrap">
                                        <p className="text-[10px] font-bold text-blue-300">My Location</p>
                                      </div>
                                    </div>
                                  </div>
                                </>
                              )}
                              {/* Map controls */}
                              <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                                <a href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`} target="_blank" rel="noopener noreferrer"
                                  className="h-10 w-10 rounded-lg bg-[#0f1f3d] border border-blue-900/30 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-all"
                                  title="Open in Google Maps">
                                  <MapPin size={18} />
                                </a>
                              </div>
                              {/* Top-left info */}
                              <div className="absolute top-4 left-4 bg-[#0f1f3d]/90 backdrop-blur p-4 rounded-xl border border-blue-900/30 max-w-xs">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className={`h-3 w-3 rounded-full ${engineOn ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                                  <span className="text-xs font-bold text-white">Signal: Strong</span>
                                </div>
                                <div className="text-[10px] text-blue-300 space-y-1">
                                  <p>GPS: {rental.gpsCode}</p>
                                  <p>Battery: {rental.gpsBattery}%</p>
                                  <p>Speed: {engineOn ? `${rental.gpsSpeed} km/h` : '0 km/h'}</p>
                                </div>
                              </div>
                            </div>
                          </Card>

                          {/* Controls */}
                          <div className="grid grid-cols-2 gap-4">
                            <a href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`} target="_blank" rel="noopener noreferrer"
                              className="flex items-center justify-center gap-3 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold transition-all">
                              <MapPin size={20} /> Track in Google Maps
                            </a>
                            <button
                              onClick={() => {
                                if (engineAnimating) return;
                                setEngineAnimating(rental.id);
                                const targetState = !engineOn;
                                setTimeout(() => {
                                  setEngineStatus(prev => ({ ...prev, [rental.id]: targetState }));
                                  setEngineAnimating(null);
                                  toast.success(`Engine turned ${targetState ? 'ON' : 'OFF'} for ${rental.carMake} ${rental.carModel}`);
                                }, 2000);
                              }}
                              disabled={engineAnimating === rental.id}
                              className={`flex items-center justify-center gap-3 h-14 rounded-xl font-bold transition-all ${
                                engineAnimating === rental.id
                                  ? 'bg-yellow-500/20 text-yellow-400 cursor-wait'
                                  : engineOn
                                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              }`}
                            >
                              {engineAnimating === rental.id ? (
                                <><Loader2 size={20} className="animate-spin" /> Processing...</>
                              ) : engineOn ? (
                                <><Cpu size={20} /> Turn Off Engine</>
                              ) : (
                                <><Cpu size={20} /> Turn On Engine</>
                              )}
                            </button>
                          </div>

                          {/* Vehicle Info panel */}
                          <Card className="bg-[#0f1f3d] border-blue-900/30">
                            <CardContent className="p-5">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Status</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className={`h-2 w-2 rounded-full ${engineOn ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                                    <span className="text-white font-bold text-sm">{engineOn ? 'Running' : 'Stopped'}</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Speed</p>
                                  <p className="text-white font-bold text-sm mt-1">{engineOn ? `${rental.gpsSpeed} km/h` : '0 km/h'}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Battery</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="w-16 h-2 bg-[#0a1628] rounded-full overflow-hidden border border-blue-900/30">
                                      <div className={`h-full rounded-full ${rental.gpsBattery > 50 ? 'bg-green-500' : rental.gpsBattery > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${rental.gpsBattery}%` }} />
                                    </div>
                                    <span className="text-white font-bold text-sm">{rental.gpsBattery}%</span>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">Last Ping</p>
                                  <p className="text-white font-bold text-sm mt-1">{rental.gpsLastPing}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Settings Page */}
          {activePage === 'settings' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">Settings</h1>
              <Card className="bg-[#0f1f3d] border-blue-900/30 max-w-2xl">
                <CardContent className="p-8 space-y-6">
                  <div>
                    <h3 className="text-white font-bold mb-4">Profile Information</h3>
                    <div className="space-y-5">
                      {/* Profile Picture */}
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-blue-500/30 shrink-0">
                          {settingsProfilePic ? (
                            <img src={settingsProfilePic} alt="Profile" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                              <User size={24} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
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
                        <label className="text-xs font-bold uppercase tracking-widest text-blue-300 block mb-1.5">Name</label>
                        <Input
                          value={settingsName}
                          onChange={(e) => setSettingsName(e.target.value)}
                          placeholder="Your name"
                          className="bg-[#0a1628] border-blue-900/30 text-white h-10"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-blue-300 block mb-1.5">Email</label>
                        <Input
                          value={profile?.email || ''}
                          disabled
                          className="bg-[#0a1628] border-blue-900/30 text-white/50 h-10"
                        />
                        <p className="text-[10px] text-blue-400 mt-1">Email cannot be changed</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold uppercase tracking-widest text-blue-300 block mb-1.5">Phone</label>
                        <Input
                          value={settingsPhone}
                          onChange={(e) => setSettingsPhone(e.target.value)}
                          placeholder="+251XXXXXXXXX"
                          className="bg-[#0a1628] border-blue-900/30 text-white h-10"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          onClick={async () => {
                            setIsSavingSettings(true);
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
                              setIsSavingSettings(false);
                            }
                          }}
                          disabled={isSavingSettings}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl font-bold gap-2 h-10"
                        >
                          {isSavingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          {isSavingSettings ? 'Saving...' : 'Save Changes'}
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

      {/* Edit Car Modal */}
      {showEditModal && editingCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f1f3d] rounded-2xl border border-blue-900/30 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-blue-900/30">
              <h2 className="text-lg font-extrabold text-white">Edit Car</h2>
              <button onClick={() => { setShowEditModal(false); setEditingCar(null); }} className="text-blue-300 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-300 uppercase tracking-widest">Brand</label>
                  <Input value={editingCar.make} onChange={e => setEditingCar({...editingCar, make: e.target.value})}
                    className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-300 uppercase tracking-widest">Model</label>
                  <Input value={editingCar.model} onChange={e => setEditingCar({...editingCar, model: e.target.value})}
                    className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-300 uppercase tracking-widest">Year</label>
                  <Input type="number" value={editingCar.year} onChange={e => setEditingCar({...editingCar, year: parseInt(e.target.value)})}
                    className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-300 uppercase tracking-widest">Plate #</label>
                  <Input value={editingCar.plateNumber} onChange={e => setEditingCar({...editingCar, plateNumber: e.target.value})}
                    className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-300 uppercase tracking-widest">Price/Day</label>
                  <Input type="number" value={editingCar.pricePerDay} onChange={e => setEditingCar({...editingCar, pricePerDay: parseInt(e.target.value)})}
                    className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-300 uppercase tracking-widest">Mileage</label>
                  <Input type="number" value={editingCar.mileage} onChange={e => setEditingCar({...editingCar, mileage: parseInt(e.target.value)})}
                    className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-300 uppercase tracking-widest">Location</label>
                <Input value={editingCar.location} onChange={e => setEditingCar({...editingCar, location: e.target.value})}
                  className="rounded-xl h-12 bg-[#0a1628] border-blue-900/30 text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-blue-300 uppercase tracking-widest">Description</label>
                <textarea value={editingCar.description} onChange={e => setEditingCar({...editingCar, description: e.target.value})}
                  className="w-full rounded-xl bg-[#0a1628] border border-blue-900/30 px-3 py-2 text-sm text-white min-h-[80px]" />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a1628] border border-blue-900/30">
                <span className="text-sm font-bold text-white">Status: {
                  editingCar.status === 'active' ? 'Active' :
                  editingCar.status === 'inactive' ? 'Inactive' :
                  editingCar.status === 'pending_approval' ? t('host.pendingApproval') : editingCar.status
                }</span>
                <button onClick={() => setEditingCar({
                  ...editingCar,
                  status: editingCar.status === 'active' ? 'inactive' : 'active'
                })}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                    editingCar.status === 'active' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                  }`}>
                  {editingCar.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
            <div className="flex gap-3 p-4 sm:p-6 border-t border-blue-900/30">
              <Button onClick={() => { setShowEditModal(false); setEditingCar(null); }} variant="outline"
                className="flex-1 h-12 rounded-xl border-blue-900/30 text-blue-300 hover:bg-blue-500/10 text-xs sm:text-sm">{t('host.cancel')}</Button>
              <Button onClick={handleSaveEdit}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-bold text-xs sm:text-sm">{t('host.saveChanges')}</Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Preview Modal */}
      <AnimatePresence>
        {showPdfPreview && previewRental && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => { setShowPdfPreview(false); setPreviewRental(null); }}
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
                    <p className="text-[11px] text-gray-500">A4 document &middot; {previewRental.carMake} {previewRental.carModel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportPDF(previewRental)}
                    disabled={isExportingPdf}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm font-bold disabled:opacity-50"
                  >
                    {isExportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {isExportingPdf ? 'Exporting...' : 'Download PDF'}
                  </button>
                  <button
                    onClick={() => { setShowPdfPreview(false); setPreviewRental(null); }}
                    className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex justify-center p-6">
                <div className="shadow-[0_8px_30px_rgb(0,0,0,0.3)] bg-white" style={{ width: '210mm', transform: 'scale(0.7)', transformOrigin: 'top center' }}>
                  <RentalPDFTemplate rental={previewRental} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

