import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Smartphone,
  Phone,
  CheckCircle2,
  Loader2,
  Clock,
  CreditCard,
  FileText,
  ChevronRight,
  ArrowRight,
  Mail,
  Calendar,
  Car,
  User,
  MessageCircle,
  PhoneCall,
  Upload,
  FileUp,
  IdCard,
  ScrollText,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { MOCK_CARS } from '@/constants';
import { Car as CarType } from '@/types';
import { PaymentModal } from './PaymentModal';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase';
import { saveRentalRequests, getRentalRequests, RentalRequest } from '../lib/fleetUtils';

type FlowStep = 'form' | 'phone' | 'national-id' | 'upload' | 'waiting' | 'signpay' | 'contact';

interface BookingFlowModalProps {
  carId: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  paymentMethod: string;
  paymentMethodName: string;
  onClose: () => void;
}

interface FormData {
  name: string;
  age: string;
  familyNumber: string;
  relation: string;
  familyName: string;
  address: string;
  purpose: string;
}

const COUNTRY_CODE = '+251';

const allSteps: FlowStep[] = ['form', 'phone', 'national-id', 'upload', 'waiting', 'signpay', 'contact'];
const stepLabels: Record<FlowStep, string> = {
  form: 'Personal Information',
  phone: 'Phone Verification',
  'national-id': 'National ID Verification',
  upload: 'Document Upload',
  waiting: 'Waiting for Acceptance',
  signpay: 'Sign & Pay',
  contact: 'Host Contact'
};
const stepIcons: Record<FlowStep, React.ReactNode> = {
  form: <User size={20} />,
  phone: <Smartphone size={20} />,
  'national-id': <IdCard size={20} />,
  upload: <Upload size={20} />,
  waiting: <Clock size={20} />,
  signpay: <FileText size={20} />,
  contact: <MessageCircle size={20} />,
};

export const BookingFlowModal: React.FC<BookingFlowModalProps> = ({
  carId,
  startDate,
  endDate,
  totalAmount,
  paymentMethod,
  paymentMethodName,
  onClose,
}) => {
  const navigate = useNavigate();
  const { user, profile, updateVerification } = useAuth();
  const car = MOCK_CARS.find(c => c.id === carId) as CarType | undefined;
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const [step, setStep] = useState<FlowStep>('form');
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [showPayment, setShowPayment] = useState(false);

  const sigCanvas = useRef<SignatureCanvas>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  // Step 1: Form data
  const [formData, setFormData] = useState<FormData>({
    name: profile?.name || '',
    age: '',
    familyNumber: '',
    relation: '',
    familyName: '',
    address: '',
    purpose: '',
  });

  // Step 2: Phone OTP
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Step 3: National ID OTP
  const [nationalId, setNationalId] = useState('');
  const [nationalIdOtp, setNationalIdOtp] = useState('');
  const [nationalIdOtpLoading, setNationalIdOtpLoading] = useState(false);
  const [nationalIdOtpTimer, setNationalIdOtpTimer] = useState(0);
  const [nationalIdVerified, setNationalIdVerified] = useState(false);

  // Step 4: File uploads
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [license, setLicense] = useState<File | null>(null);
  const [prevRecord, setPrevRecord] = useState<File | null>(null);

  // Step 6: Signature
  const [accepted, setAccepted] = useState(true);

  // Timers
  useEffect(() => {
    if (phoneOtpTimer > 0) { const t = setTimeout(() => setPhoneOtpTimer(p => p - 1), 1000); return () => clearTimeout(t); }
  }, [phoneOtpTimer]);
  useEffect(() => {
    if (nationalIdOtpTimer > 0) { const t = setTimeout(() => setNationalIdOtpTimer(p => p - 1), 1000); return () => clearTimeout(t); }
  }, [nationalIdOtpTimer]);

  // Waiting progress
  useEffect(() => {
    if (step === 'waiting') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep('signpay'), 600);
            return 100;
          }
          return prev + 2;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleFormSubmit = () => {
    if (!formData.name.trim()) { toast.error('Please enter your full name'); return; }
    if (!formData.age.trim()) { toast.error('Please enter your age'); return; }
    if (!formData.familyNumber.trim()) { toast.error('Please enter an emergency contact number'); return; }
    if (!formData.address.trim()) { toast.error('Please enter your address'); return; }
    if (!formData.purpose.trim()) { toast.error('Please state the purpose of renting'); return; }
    setStep('phone');
  };

  const handleSendPhoneOtp = () => {
    if (phoneNumber.replace(/\D/g, '').length < 6) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setPhoneOtpLoading(true);
    setTimeout(() => {
      setPhoneOtpLoading(false);
      setPhoneOtpTimer(60);
      const fullNumber = `${COUNTRY_CODE}${phoneNumber.replace(/\D/g, '')}`;
      toast.success(`OTP sent to ${fullNumber}`);
    }, 1500);
  };

  const handleVerifyPhoneOtp = async () => {
    if (phoneOtp !== '123456') { toast.error('Invalid OTP. Try 123456'); return; }
    const fullNumber = `${COUNTRY_CODE}${phoneNumber.replace(/\D/g, '')}`;
    await updateVerification({ phoneNumber: fullNumber, phoneVerified: true });
    setPhoneVerified(true);
    toast.success('Phone verified!');
    setStep('national-id');
  };

  const handleSendNationalIdOtp = () => {
    if (!nationalId.trim()) { toast.error('Please enter your National ID (Fayda) number'); return; }
    setNationalIdOtpLoading(true);
    setTimeout(() => {
      setNationalIdOtpLoading(false);
      setNationalIdOtpTimer(60);
      toast.success('OTP sent for National ID verification');
    }, 1500);
  };

  const handleVerifyNationalIdOtp = () => {
    if (nationalIdOtp !== '654321') { toast.error('Invalid OTP. Try 654321'); return; }
    setNationalIdVerified(true);
    toast.success('National ID verified!');
    setStep('upload');
  };

  const handleUploadSubmit = () => {
    if (!idFront) { toast.error('Please upload the front of your National ID'); return; }
    if (!idBack) { toast.error('Please upload the back of your National ID'); return; }
    if (!license) { toast.error('Please upload your Driving License'); return; }
    setStep('waiting');
  };

  const handleSignAndPay = () => {
    if (!accepted) { toast.error('Please accept the terms'); return; }
    if (sigCanvas.current?.isEmpty()) { toast.error('Please provide your digital signature'); return; }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    setShowPayment(false);
    setIsProcessing(true);
    const id = 'ZOE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    setBookingId(id);
    try {
      await addDoc(collection(db, 'bookings'), {
        carId, userId: user!.uid, hostId: car?.hostId || '',
        startDate: startDate.toISOString(), endDate: endDate.toISOString(),
        totalAmount, status: 'confirmed', paymentStatus: 'paid',
        paymentMethod, transactionId, formData,
        phoneVerified, nationalIdVerified,
        createdAt: new Date().toISOString(),
      });
    } catch { console.warn('Firestore save unavailable, booking saved locally'); }
    try {
      const el = agreementRef.current;
      if (el) {
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' });
        const pdf = new jsPDF('p', 'mm', 'a4');
        const w = pdf.internal.pageSize.getWidth();
        const h = (canvas.height * w) / canvas.width;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
        pdf.setFontSize(10);
        pdf.text(`Transaction: ${transactionId}`, 10, h + 10);
        pdf.text(`Booking: ${id}`, 10, h + 15);
        pdf.text(`Signed by: ${formData.name || profile?.name}`, 10, h + 20);
        pdf.save(`ZOE_Agreement_${car?.make}_${car?.model}.pdf`);
      }
    } catch { /* fall through */ }
    try {
      const requests = getRentalRequests();
      const newRequest: RentalRequest = {
        id: 'req-' + Date.now(),
        renterName: formData.name || profile?.name || '',
        renterPhone: `${COUNTRY_CODE}${phoneNumber.replace(/\D/g, '')}`,
        renterEmail: profile?.email || '',
        renterPhoto: profile?.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
        renterAddress: formData.address,
        age: formData.age,
        familyNumber: formData.familyNumber,
        relation: formData.relation,
        familyName: formData.familyName,
        purpose: formData.purpose,
        nationalId: nationalId,
        nationalIdPhotoFront: '',
        nationalIdPhotoBack: '',
        driverLicense: '',
        driverLicensePhotoFront: '',
        driverLicensePhotoBack: '',
        carId: carId,
        carMake: car?.make || '',
        carModel: car?.model || '',
        carPlate: 'N/A',
        carImage: car?.images?.[0] || '',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        notes: '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      saveRentalRequests([...requests, newRequest]);
    } catch (e) {
      console.warn('Failed to save local rental request', e);
    }
    setStep('contact');
    setIsProcessing(false);
    toast.success('Booking completed successfully!');
  };

  const fileInfo = (file: File | null) => file ? `${file.name} (${(file.size / 1024).toFixed(0)} KB)` : '';

  const currentStepIdx = allSteps.indexOf(step);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        className="w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-8 pt-8 pb-0">
          <div className="flex items-center gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              step === 'form' || step === 'phone' || step === 'national-id' || step === 'upload' || step === 'signpay'
                ? 'bg-primary/10 text-primary'
                : step === 'waiting' ? 'bg-amber-100 text-amber-600'
                : 'bg-green-100 text-green-600'
            }`}>
              {stepIcons[step]}
            </div>
            <span className="text-lg font-bold uppercase tracking-tight">{stepLabels[step]}</span>
          </div>
          {step !== 'contact' && (
            <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Step indicator */}
        <div className="px-8 pt-5 pb-1 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {allSteps.map((s, i) => {
              const stepIdx = allSteps.indexOf(s);
              const isActive = stepIdx <= currentStepIdx;
              const isCurrent = s === step;
              return (
                <React.Fragment key={s}>
                  {i > 0 && (
                    <div className={`w-6 sm:w-10 h-0.5 rounded-full ${isActive ? 'bg-primary' : 'bg-gray-200'}`} />
                  )}
                  <div className={`flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0 ${
                    isCurrent ? 'bg-primary text-white scale-110' :
                    isActive ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isActive && !isCurrent ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* STEP 1: Personal Information Form */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-5">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Personal Information</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Fill in your details to begin the booking process</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name *</label>
                    <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Dawit Hailemariam" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Age *</label>
                    <Input value={formData.age} onChange={e => setFormData(p => ({ ...p, age: e.target.value.replace(/\D/g, '').slice(0, 3) }))} placeholder="e.g. 28" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Emergency Contact Number *</label>
                    <Input value={formData.familyNumber} onChange={e => setFormData(p => ({ ...p, familyNumber: e.target.value }))} placeholder="e.g. +251 91 234 5678" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Relation with Contact</label>
                    <Input value={formData.relation} onChange={e => setFormData(p => ({ ...p, relation: e.target.value }))} placeholder="e.g. Spouse, Parent, Sibling" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact's Full Name</label>
                    <Input value={formData.familyName} onChange={e => setFormData(p => ({ ...p, familyName: e.target.value }))} placeholder="e.g. Senait Hailemariam" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Address *</label>
                    <Input value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} placeholder="e.g. Bole, Addis Ababa" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Purpose of Renting *</label>
                  <Textarea value={formData.purpose} onChange={e => setFormData(p => ({ ...p, purpose: e.target.value }))} placeholder="e.g. Family road trip to Hawassa for the weekend" className="rounded-xl border-2 font-bold min-h-[80px]" />
                </div>

                <Button onClick={handleFormSubmit} className="w-full h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                  Continue <ChevronRight className="ml-2" size={20} />
                </Button>
              </motion.div>
            )}

            {/* STEP 2: Phone OTP with Country Selector */}
            {step === 'phone' && (
              <motion.div key="phone" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                <div className="text-center mb-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Phone size={32} />
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Phone Verification</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Verify your phone number with a one-time code</p>
                </div>

                {!phoneVerified ? (
                  <>
                    {!phoneOtpTimer ? (
                      <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1.5 h-14 px-4 rounded-2xl border-2 border-gray-200 bg-gray-50 min-w-[90px]">
                            <span className="text-lg">&#x1F1EA;&#x1F1E9;</span>
                            <span className="text-sm font-bold text-gray-700">+251</span>
                          </div>
                          <div className="flex-1">
                            <Input
                              value={phoneNumber}
                              onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                              placeholder="91 123 4567"
                              className="h-14 rounded-2xl border-2 font-bold text-lg tracking-wider focus-visible:ring-primary"
                            />
                          </div>
                        </div>
                        <Button onClick={handleSendPhoneOtp} disabled={phoneOtpLoading} className="w-full h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                          {phoneOtpLoading ? <><Loader2 className="mr-2 animate-spin" size={20} /> Sending...</> : <><Smartphone className="mr-2" size={20} /> Send Verification Code</>}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Code sent to <strong className="text-foreground">+251 {phoneNumber}</strong></p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">OTP Code</label>
                          <Input value={phoneOtp} onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="h-14 rounded-2xl border-2 font-bold text-2xl text-center tracking-[0.5em] focus-visible:ring-primary" maxLength={6} />
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1">
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Sample OTP Codes</p>
                          <div className="flex gap-4 text-sm">
                            <span className="text-amber-600 text-[10px] font-bold uppercase">Phone: <code className="bg-white px-2 py-0.5 rounded font-bold text-amber-800 border border-amber-200">123456</code></span>
                            <span className="text-amber-600 text-[10px] font-bold uppercase">National ID: <code className="bg-white px-2 py-0.5 rounded font-bold text-amber-800 border border-amber-200">654321</code></span>
                          </div>
                        </div>
                        <Button onClick={handleVerifyPhoneOtp} disabled={phoneOtp.length < 6} className="w-full h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                          <CheckCircle2 className="mr-2" size={20} /> Verify & Continue
                        </Button>
                        <div className="text-center">
                          {phoneOtpTimer > 0 ? <p className="text-sm text-muted-foreground">Resend in <strong className="text-primary">{phoneOtpTimer}s</strong></p> :
                            <button onClick={handleSendPhoneOtp} className="text-sm font-bold text-primary underline">Resend OTP</button>}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center py-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4"><CheckCircle2 size={32} /></div>
                    <p className="font-bold text-lg text-green-700">Phone Verified!</p>
                    <p className="text-sm text-muted-foreground">+251 {phoneNumber}</p>
                    <Button onClick={() => setStep('national-id')} className="mt-6 h-12 rounded-2xl font-bold uppercase tracking-wider">Continue <ChevronRight className="ml-2" size={18} /></Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: National ID OTP */}
            {step === 'national-id' && (
              <motion.div key="national-id" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                <div className="text-center mb-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><IdCard size={32} /></div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">National ID Verification</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Verify your National ID (Fayda) number</p>
                </div>
                {!nationalIdVerified ? (
                  <>
                    {!nationalIdOtpTimer ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">National ID (Fayda) Number</label>
                          <Input value={nationalId} onChange={e => setNationalId(e.target.value)} placeholder="e.g. 1234567890" className="h-14 rounded-2xl border-2 font-bold text-lg focus-visible:ring-primary" />
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Sample Codes</p>
                          <div className="flex gap-4 text-sm mt-1">
                            <span className="text-amber-600 text-[10px] font-bold uppercase">Phone: <code className="bg-white px-2 py-0.5 rounded font-bold text-amber-800 border border-amber-200">123456</code></span>
                            <span className="text-amber-600 text-[10px] font-bold uppercase">National ID: <code className="bg-white px-2 py-0.5 rounded font-bold text-amber-800 border border-amber-200">654321</code></span>
                          </div>
                        </div>
                        <Button onClick={handleSendNationalIdOtp} disabled={nationalIdOtpLoading || !nationalId.trim()} className="w-full h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                          {nationalIdOtpLoading ? <><Loader2 className="mr-2 animate-spin" size={20} /> Sending...</> : <><ShieldCheck className="mr-2" size={20} /> Send OTP to National ID</>}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">OTP sent for National ID <strong className="text-foreground">{nationalId}</strong></p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">OTP Code</label>
                          <Input value={nationalIdOtp} onChange={e => setNationalIdOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="654321" className="h-14 rounded-2xl border-2 font-bold text-2xl text-center tracking-[0.5em] focus-visible:ring-primary" maxLength={6} />
                        </div>
                        <Button onClick={handleVerifyNationalIdOtp} disabled={nationalIdOtp.length < 6} className="w-full h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                          <CheckCircle2 className="mr-2" size={20} /> Verify & Continue
                        </Button>
                        <div className="text-center">
                          {nationalIdOtpTimer > 0 ? <p className="text-sm text-muted-foreground">Resend in <strong className="text-primary">{nationalIdOtpTimer}s</strong></p> :
                            <button onClick={handleSendNationalIdOtp} className="text-sm font-bold text-primary underline">Resend OTP</button>}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center py-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4"><CheckCircle2 size={32} /></div>
                    <p className="font-bold text-lg text-green-700">National ID Verified!</p>
                    <p className="text-sm text-muted-foreground">{nationalId}</p>
                    <Button onClick={() => setStep('upload')} className="mt-6 h-12 rounded-2xl font-bold uppercase tracking-wider">Continue <ChevronRight className="ml-2" size={18} /></Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: File Uploads */}
            {step === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-5">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Document Upload</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Upload your identification documents</p>
                </div>

                {([
                  { key: 'idFront' as const, label: 'National ID – Front Side', icon: <IdCard size={16} />, file: idFront, setter: setIdFront, required: true },
                  { key: 'idBack' as const, label: 'National ID – Back Side', icon: <IdCard size={16} />, file: idBack, setter: setIdBack, required: true },
                  { key: 'license' as const, label: 'Driving License', icon: <ScrollText size={16} />, file: license, setter: setLicense, required: true },
                  { key: 'prevRecord' as const, label: 'Previous Rental Record (if any)', icon: <FileText size={16} />, file: prevRecord, setter: setPrevRecord, required: false },
                ]).map(({ key, label, icon, file, setter, required }) => (
                  <div key={key} className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      {icon} {label} {required && <span className="text-red-400">*</span>}
                      {!required && <span className="text-[10px] font-normal text-muted-foreground">(optional)</span>}
                    </label>
                    <input
                      id={`file-${key}`}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg,application/pdf,image/gif,image/webp,image/heic,image/heif"
                      onChange={e => {
                        const f = e.target.files?.[0] || null;
                        setter(f);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor={`file-${key}`}
                      className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <FileUp size={20} className="text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate flex-1">
                        {file ? file.name : (file ? 'Selected' : 'Tap to upload — JPG, PNG, PDF accepted')}
                      </span>
                      {file && <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />}
                      {file && <span className="text-[11px] text-muted-foreground flex-shrink-0">{(file.size / 1024).toFixed(0)} KB</span>}
                    </label>
                  </div>
                ))}

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <p className="text-xs text-blue-700 font-medium">
                    <strong>Accepted formats:</strong> JPG, PNG, PDF, GIF, WEBP, HEIC. Maximum file size is determined by your browser.
                  </p>
                </div>

                <Button onClick={handleUploadSubmit} className="w-full h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                  Submit Documents <ChevronRight className="ml-2" size={20} />
                </Button>
              </motion.div>
            )}

            {/* STEP 5: Waiting for Acceptance */}
            {step === 'waiting' && (
              <motion.div key="waiting" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6 text-center">
                <div className="relative mb-8">
                  <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-amber-50 border-4 border-amber-200"><Loader2 size={48} className="text-amber-500 animate-spin" /></div>
                </div>
                <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">Waiting for Host Acceptance</h2>
                <p className="text-muted-foreground mb-6 max-w-sm">Your booking request and documents have been submitted. The host is reviewing your information...</p>
                {car && (
                  <div className="w-full bg-muted/30 rounded-2xl p-5 border border-primary/10 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0"><Car size={28} /></div>
                      <div className="text-left">
                        <p className="font-bold text-lg">{car.make} {car.model}</p>
                        <p className="text-sm text-muted-foreground">{format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')} &middot; {days} days</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="w-full max-w-xs mb-4">
                  <div className="flex justify-between text-xs font-bold text-muted-foreground mb-2">
                    <span>Submitted</span>
                    <span>Reviewing</span>
                    <span>Accepted</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-amber-400 to-primary rounded-full" initial={{ width: '0%' }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {progress < 40 ? 'Documents being verified...' : progress < 75 ? 'Host is reviewing your request...' : progress < 100 ? 'Acceptance in progress...' : ''}
                  </p>
                </div>
                {progress >= 100 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-green-600 font-bold">
                    <CheckCircle2 size={20} /> <span>Accepted! Preparing agreement...</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 6: Signature + Payment */}
            {step === 'signpay' && (
              <motion.div key="signpay" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-2xl p-5 border border-primary/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Car</h4>
                    <p className="font-bold">{car?.make} {car?.model} ({car?.year})</p>
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-5 border border-primary/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Period</h4>
                    <p className="font-bold">{format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}</p>
                    <p className="text-xs text-muted-foreground">{days} days</p>
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-5 border border-primary/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Payment</h4>
                    <p className="font-bold capitalize">{paymentMethodName}</p>
                  </div>
                  <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Total</h4>
                    <p className="text-2xl font-bold text-primary">ETB {totalAmount.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-primary">Digital Signature</label>
                  <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-2">
                    <SignatureCanvas ref={sigCanvas} penColor="black" canvasProps={{ className: 'signature-canvas w-full h-28 rounded-xl cursor-crosshair' }} />
                  </div>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => sigCanvas.current?.clear()} className="text-xs font-bold uppercase tracking-widest">Clear</Button>
                  </div>
                </div>

                <div ref={agreementRef} className="hidden">
                  <div className="p-8 bg-white">
                    <h1 className="text-2xl font-bold mb-4">ZOE CAR RENTAL - RENTAL AGREEMENT</h1>
                    <p className="mb-4">Booking ID: ZOE-{Date.now().toString(36).toUpperCase()}</p>
                    <p><strong>Renter:</strong> {formData.name || profile?.name}</p>
                    <p><strong>Phone:</strong> +251 {phoneNumber}</p>
                    <p><strong>Address:</strong> {formData.address}</p>
                    <p><strong>Purpose:</strong> {formData.purpose}</p>
                    <p><strong>Vehicle:</strong> {car?.make} {car?.model} ({car?.year})</p>
                    <p><strong>Period:</strong> {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}</p>
                    <p><strong>Total:</strong> ETB {totalAmount.toLocaleString()}</p>
                    <p><strong>Payment:</strong> {paymentMethodName}</p>
                    <div className="border-t pt-4 mt-4">
                      <p>Signed by: {formData.name || profile?.name}</p>
                      <p>Date: {new Date().toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <Checkbox id="sig-terms" checked={accepted} onCheckedChange={(c) => setAccepted(c as boolean)} className="mt-0.5 h-5 w-5 rounded-lg data-[state=checked]:bg-primary" />
                  <Label htmlFor="sig-terms" className="text-sm font-medium cursor-pointer leading-snug">I confirm all details are correct and agree to the rental terms</Label>
                </div>

                <Button onClick={handleSignAndPay} disabled={!accepted || isProcessing} className="w-full h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20 gap-2">
                  {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : <><CreditCard size={20} /> Pay ETB {totalAmount.toLocaleString()} <ChevronRight size={20} /></>}
                </Button>
              </motion.div>
            )}

            {/* STEP 7: Receipt + Host Contact + Done */}
            {step === 'contact' && (
              <motion.div key="contact" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col py-2">
                {/* Success Icon */}
                <div className="flex flex-col items-center mb-5">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-3">
                    <CheckCircle2 size={40} className="text-green-600" />
                  </motion.div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-green-700">Payment Successful!</h2>
                </div>

                {/* Receipt Card */}
                <div className="w-full bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-5 border-2 border-primary/20 mb-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">ZOE</div>
                      <span className="text-sm font-bold uppercase tracking-tight">Rental Receipt</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-white px-2 py-1 rounded-lg border">PAID</span>
                  </div>
                  <div className="space-y-2 text-sm border-t border-primary/10 pt-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle</span>
                      <span className="font-bold">{car?.make} {car?.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rental Period</span>
                      <span className="font-bold">{days} {days === 1 ? 'day' : 'days'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="font-bold text-lg text-primary">ETB {totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-bold capitalize">{paymentMethodName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking ID</span>
                      <span className="font-bold text-primary">{bookingId}</span>
                    </div>
                  </div>
                </div>

                {/* Host Contact */}
                <div className="w-full bg-muted/20 rounded-2xl p-5 border border-primary/10 mb-5 text-left">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                      {(car?.host?.name || 'Host').charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold">{car?.host?.name || 'Abebe Kebede'}</p>
                      <p className="text-xs text-muted-foreground">Your Vehicle Host</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <a href="tel:+251911223344" className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-green-50 transition-colors group">
                      <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0"><PhoneCall size={16} /></div>
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-green-700">Call Host</p>
                        <p className="font-bold text-sm">+251 91 122 3344</p>
                      </div>
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider group-hover:underline">Call</span>
                    </a>
                    <a href="https://wa.me/251911223344" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-green-50 transition-colors group">
                      <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0"><MessageCircle size={16} /></div>
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-green-700">Send Message</p>
                        <p className="font-bold text-sm">WhatsApp / Telegram</p>
                      </div>
                      <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider group-hover:underline">Chat</span>
                    </a>
                    <a href="mailto:abebe@zoecarrental.com" className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-blue-50 transition-colors group">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"><Mail size={16} /></div>
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-blue-700">Send Email</p>
                        <p className="font-bold text-sm">abebe@zoecarrental.com</p>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider group-hover:underline">Email</span>
                    </a>
                  </div>
                </div>

                <Button onClick={() => navigate('/dashboard')} className="w-full h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20 gap-2">
                  <CheckCircle2 size={20} /> Done – Booking Complete <ArrowRight className="ml-2" size={20} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPayment && (
          <PaymentModal methodId={paymentMethod} methodName={paymentMethodName} amount={totalAmount} onSuccess={handlePaymentSuccess} onCancel={() => setShowPayment(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};
