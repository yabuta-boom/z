import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { getCorporateProfileByUserId, getCorporateBookingRequestById, updateCorporateBookingRequest, isCorporateBookingExpired, addCorporateBookingRequest } from '../lib/fleetUtils';
import { CorporateBookingRequest, CorporateDocument } from '../types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { PaymentModal } from './PaymentModal';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import {
  Building2, User, Phone, ShieldCheck, FileText, Camera, Lock,
  CheckCircle2,   ChevronLeft, ChevronRight, X, Upload, Loader2, Scan, IdCard,
  Clock, MessageCircle, PhoneCall, Mail, CreditCard, Car, ArrowRight
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  car: {
    id: string;
    make: string;
    model: string;
    plate?: string;
    image?: string;
    pricePerDay: number;
  };
  startDate?: Date;
  endDate?: Date;
  totalAmount?: number;
  paymentMethod?: string;
  paymentMethodName?: string;
}

const STEPS = [
  { label: 'Company Info', icon: Building2 },
  { label: 'Phone OTP', icon: Phone },
  { label: 'National ID', icon: ShieldCheck },
  { label: 'Legal Docs', icon: FileText },
  { label: 'Driver Credentials', icon: User },
  { label: 'Face Scan', icon: Camera },
  { label: 'Review & Submit', icon: FileText },
  { label: 'Waiting', icon: Clock },
  { label: 'Sign', icon: FileText },
  { label: 'Bank Hold', icon: Lock },
  { label: 'Payment', icon: CreditCard },
  { label: 'Host Contact', icon: MessageCircle },
];

export function CorporateBookingModal({ open, onClose, car, startDate, endDate, totalAmount, paymentMethod, paymentMethodName }: Props) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [bookingDepartment, setBookingDepartment] = useState('Logistics');
  const [registrantPosition, setRegistrantPosition] = useState('');
  const [renterName, setRenterName] = useState('');
  const [renterAge, setRenterAge] = useState('');
  const [renterAddr, setRenterAddr] = useState('');
  const [rentalPurpose, setRentalPurpose] = useState('');
  const [operatingArea, setOperatingArea] = useState('');

  // Step 2
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // Step 3
  const [nationalId, setNationalId] = useState('');
  const [nationalIdOtp, setNationalIdOtp] = useState('');
  const [nationalIdOtpSent, setNationalIdOtpSent] = useState(false);
  const [nationalIdOtpLoading, setNationalIdOtpLoading] = useState(false);
  const [nationalIdOtpTimer, setNationalIdOtpTimer] = useState(0);
  const [nationalIdVerified, setNationalIdVerified] = useState(false);

  // Step 4
  const [corporateDocs, setCorporateDocs] = useState<CorporateDocument[]>([]);

  // Step 5
  const [nidFront, setNidFront] = useState('');
  const [nidBack, setNidBack] = useState('');
  const [licenseFront, setLicenseFront] = useState('');
  const [licenseBack, setLicenseBack] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [faceScanComplete, setFaceScanComplete] = useState(false);
  const [scanPhase, setScanPhase] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [scanAngle, setScanAngle] = useState(0);
  const [scanCountdown, setScanCountdown] = useState(9);

  // Step 6
  const [bankHoldConfirmed, setBankHoldConfirmed] = useState(false);

  // Booking request tracking
  const [bookingReqId, setBookingReqId] = useState<string | null>(null);
  const [hostAccepted, setHostAccepted] = useState(false);
  const [timeoutRemaining, setTimeoutRemaining] = useState(15 * 60);

  // Signature
  const [accepted, setAccepted] = useState(true);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  // Bank hold
  const [bankHoldLoading, setBankHoldLoading] = useState(false);
  const [bankHoldDone, setBankHoldDone] = useState(false);

  // Payment
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const days = startDate && endDate
    ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;
  const insuranceAmount = days * 100;
  const finalTotal = (totalAmount || 0) + insuranceAmount;

  useEffect(() => {
    if (profile?.role === 'corporate_renter' && user) {
      const cp = getCorporateProfileByUserId(user.uid);
      if (cp) {
        setCompanyName(cp.companyName);
        setCompanyAddress(cp.companyAddress);
        setRegistrantPosition(cp.registrantPosition);
        setRenterName(cp.renterFullName);
      }
    }
  }, [profile, user]);

  const handleFileUpload = (type: CorporateDocument['type']) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCorporateDocs(prev => [...prev, {
        id: 'doc-' + Date.now(),
        type,
        fileName: file.name,
        fileData: reader.result as string,
        uploadedAt: new Date().toISOString(),
      }]);
    };
    reader.readAsDataURL(file);
  };

  const removeDoc = (id: string) => setCorporateDocs(prev => prev.filter(d => d.id !== id));

  const handleImageUpload = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      toast.error('Camera access denied. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const playCapture = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.max(0, 1 - i / (bufferSize * 0.3));
        data[i] = (Math.random() * 2 - 1) * env * 0.25;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start(ctx.currentTime);
      const osc = ctx.createOscillator();
      const g2 = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1200;
      g2.gain.setValueAtTime(0.15, ctx.currentTime);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(g2);
      g2.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  };

  const handleStartScan = () => {
    setScanCountdown(9);
    setScanAngle(0);
    setScanPhase('scanning');
  };

  // Auto-start camera + reset scan when face step mounts
  useEffect(() => {
    if (step === 5) {
      setScanPhase('idle');
      setScanAngle(0);
      setScanCountdown(9);
      setFaceScanComplete(false);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [step]);

  // Scan countdown + angle rotation
  useEffect(() => {
    if (scanPhase !== 'scanning') return;
    if (scanCountdown <= 0) {
      setFaceScanComplete(true);
      setScanPhase('complete');
      stopCamera();
      playCapture();
      toast.success('Face scan complete!');
      return;
    }
    const timer = setTimeout(() => {
      const newCount = scanCountdown - 1;
      setScanCountdown(newCount);
      let newAngle = scanAngle;
      if (newCount >= 7) newAngle = 0;
      else if (newCount >= 4) newAngle = 1;
      else newAngle = 2;
      if (newAngle !== scanAngle) playCapture();
      setScanAngle(newAngle);
    }, 1000);
    return () => clearTimeout(timer);
  }, [scanPhase, scanCountdown, scanAngle]);

  // Poll for host acceptance + auto-accept after 5s
  useEffect(() => {
    if (step !== 7 || !bookingReqId) return;
    let cancelled = false;

    const poll = setInterval(async () => {
      if (cancelled) return;
      const req = await getCorporateBookingRequestById(bookingReqId);
      if (!req) return;

      if (req.status === 'host_accepted') {
        setHostAccepted(true);
        clearInterval(poll);
      }
    }, 2000);

    const autoTimer = setTimeout(async () => {
      if (cancelled) return;
      const req = await getCorporateBookingRequestById(bookingReqId);
      if (!req || req.status !== 'pending_approval') return;
      await updateCorporateBookingRequest(bookingReqId, {
        status: 'host_accepted',
        hostAcceptedAt: new Date().toISOString(),
      });
      setHostAccepted(true);
      clearInterval(poll);
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearTimeout(autoTimer);
    };
  }, [step, bookingReqId]);

  // 15-min timeout countdown from host acceptance
  useEffect(() => {
    if (!hostAccepted || step === 11) return;
    if (!bookingReqId) return;
    const tick = setInterval(async () => {
      const req = await getCorporateBookingRequestById(bookingReqId);
      if (!req) { clearInterval(tick); return; }
      if (isCorporateBookingExpired(req)) {
        await updateCorporateBookingRequest(bookingReqId, { status: 'expired' });
        clearInterval(tick);
        toast.error('Booking expired. The 15-minute window has passed.');
        setTimeout(() => onCloseRef.current(), 2000);
        return;
      }
      if (req.hostAcceptedAt) {
        const elapsed = Math.floor((Date.now() - new Date(req.hostAcceptedAt).getTime()) / 1000);
        const remaining = Math.max(0, 15 * 60 - elapsed);
        setTimeoutRemaining(remaining);
        if (remaining <= 0) {
          await updateCorporateBookingRequest(bookingReqId, { status: 'expired' });
          toast.error('Booking expired.');
          setTimeout(() => onCloseRef.current(), 2000);
        }
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [hostAccepted, step, bookingReqId]);

  // National ID OTP timer
  useEffect(() => {
    if (nationalIdOtpTimer > 0) {
      const t = setTimeout(() => setNationalIdOtpTimer(p => p - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [nationalIdOtpTimer]);

  const canProceed = () => {
    switch (step) {
      case 0: return companyName && companyAddress && bookingDepartment && registrantPosition && renterName && renterAge && renterAddr && rentalPurpose && operatingArea;
      case 1: return otpVerified;
      case 2: return nationalIdVerified;
      case 3: return corporateDocs.length >= 2;
      case 4: return nidFront && nidBack && licenseFront && licenseBack;
      case 5: return faceScanComplete;
      case 6: return bankHoldConfirmed;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (!otpSent) {
        if (phoneNumber.replace(/\D/g, '').length < 6) {
          toast.error('Please enter a valid phone number');
          return;
        }
        setOtpSent(true);
        const fullNumber = `+251${phoneNumber.replace(/\D/g, '')}`;
        toast.success(`OTP sent to ${fullNumber}`);
        setTimeout(() => {
          setOtpValue('123456');
          toast.success('Demo OTP: 123456');
        }, 1500);
        return;
      }
      if (!otpValue) return;
      if (otpValue === '123456') {
        setOtpVerified(true);
        toast.success('Phone verified!');
        setStep(2);
      } else {
        toast.error('Invalid OTP');
      }
    } else if (step === 2) {
      if (!nationalIdOtpSent) {
        if (!nationalId.trim()) {
          toast.error('Please enter your National ID (Fayda) number');
          return;
        }
        setNationalIdOtpLoading(true);
        setTimeout(() => {
          setNationalIdOtpLoading(false);
          setNationalIdOtpSent(true);
          setNationalIdOtpTimer(60);
          setNationalIdOtp('654321');
          toast.success('OTP sent for National ID verification');
        }, 1500);
        return;
      }
      if (nationalIdOtp === '654321') {
        setNationalIdVerified(true);
        toast.success('Fayda National ID verified successfully!');
        setStep(3);
      } else {
        toast.error('Invalid OTP. Try 654321');
      }
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 5) {
      if (scanPhase === 'idle') {
        handleStartScan();
        return;
      }
      if (scanPhase === 'complete') {
        setStep(6);
        return;
      }
    } else if (step === 6) {
      // Submit booking then go to waiting
      if (!user || !profile) return;
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    setSubmitting(true);
    try {
      const corpProfile = getCorporateProfileByUserId(user.uid);
      const newReq: CorporateBookingRequest = {
        id: 'corp-booking-' + Date.now(),
        userId: user.uid,
        corporateProfileId: corpProfile?.id || 'corp-unknown',
        carId: car.id,
        carMake: car.make,
        carModel: car.model,
        carPlate: car.plate || 'N/A',
        carImage: car.image || '',
        companyName,
        bookingDepartment,
        registrantPosition,
        renterFullName: renterName,
        renterAge,
        renterAddress: renterAddr,
        companyEmail: profile.email || '',
        companyPhone: profile.phoneNumber || '',
        renterPhone: `+251${phoneNumber.replace(/\D/g, '')}`,
        rentalPurpose,
        operatingArea,
        phoneVerified: otpVerified,
        nationalIdVerified,
        nationalIdFront: nidFront,
        nationalIdBack: nidBack,
        driverLicenseFront: licenseFront,
        driverLicenseBack: licenseBack,
        livenessPhoto: '',
        documents: corporateDocs,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
      };
      await addCorporateBookingRequest(newReq);
      setBookingReqId(newReq.id);
      toast.success('Corporate booking submitted! Awaiting host approval.');
      setStep(7);
    } catch (e) {
      console.error('Corporate booking submit error:', e);
      const msg = e instanceof DOMException && e.name === 'QuotaExceededError'
        ? 'File data too large. Please use smaller file sizes.'
        : 'Failed to submit booking';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignAndPay = () => {
    if (!accepted) { toast.error('Please accept the terms'); return; }
    if (sigCanvas.current?.isEmpty()) { toast.error('Please provide your digital signature'); return; }
    setStep(9);
  };

  const handleBankHold = async () => {
    setBankHoldLoading(true);
    try {
      const { simulateBankHold } = await import('../lib/fleetUtils');
      const result = await simulateBankHold(30000);
      if (result.status === 'HOLD_SUCCESS') {
        if (bookingReqId) {
          await updateCorporateBookingRequest(bookingReqId, {
            status: 'bank_hold_active',
            bankHoldApprovedAt: new Date().toISOString(),
            insuranceAmount,
          });
        }
        setBankHoldDone(true);
        toast.success('30,000 ETB security hold approved!');
      } else {
        toast.error('Bank hold failed. Please try again.');
      }
    } catch {
      toast.error('Bank hold failed. Please try again.');
    } finally {
      setBankHoldLoading(false);
    }
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    setShowPayment(false);
    setIsProcessing(true);
    const id = 'ZOE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    setBookingId(id);
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
        pdf.text(`Signed by: ${renterName || companyName}`, 10, h + 20);
        pdf.save(`ZOE_Agreement_${car.make}_${car.model}.pdf`);
      }
    } catch { /* fall through */ }
    if (bookingReqId) {
      await updateCorporateBookingRequest(bookingReqId, {
        status: 'payment_completed',
        paymentCompletedAt: new Date().toISOString(),
      });
    }
    setStep(11);
    setIsProcessing(false);
    toast.success('Booking completed successfully!');
  };

  if (!open) return null;

  const currentStepIdx = step;

  const goBack = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        className="w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-0">
          <div className="flex items-center gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              step === 7 ? 'bg-amber-100 text-amber-600' :
              step >= 11 ? 'bg-green-100 text-green-600' :
              'bg-primary/10 text-primary'
            }`}>
              {React.createElement(STEPS[step]?.icon || Building2, { size: 20 })}
            </div>
            <span className="text-lg font-bold uppercase tracking-tight">{STEPS[step]?.label}</span>
          </div>
          {step < 11 && (
            <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Modern step indicator */}
        <div className="px-8 pt-3 pb-2">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-center gap-1.5">
            {STEPS.map((s, i) => {
              const isActive = i <= step;
              const isCurrent = i === step;
              return (
                <React.Fragment key={s.label}>
                  <motion.div
                    layout
                    className={`rounded-full transition-all duration-300 ${
                      isCurrent ? 'h-2.5 w-2.5 bg-primary shadow-sm shadow-primary/40' :
                      isActive ? 'h-1.5 w-1.5 bg-primary/60' : 'h-1.5 w-1.5 bg-gray-200'
                    }`}
                  />
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 max-w-8 ${isActive ? 'bg-primary/30' : 'bg-gray-100'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
          <p className="text-[10px] text-center text-muted-foreground/70 mt-2 font-medium tracking-wide">
            Step {step + 1} of {STEPS.length} &mdash; {STEPS[step]?.label}
          </p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto"><div className="p-8 pb-20">
          <AnimatePresence mode="wait">
            {/* STEP 0: Company Info */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-5">
                <div className="text-center mb-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Building2 size={32} />
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Corporate Information</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Enter your company and designated driver details</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Company Full Name *</label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="ABC Logistics PLC" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Booking Department</label>
                    <select value={bookingDepartment} onChange={e => setBookingDepartment(e.target.value)} className="w-full h-12 rounded-xl border-2 font-bold bg-white text-foreground px-4 text-sm">
                      <option>Logistics</option><option>Sales</option><option>Executive</option><option>HR</option><option>Operations</option><option>Marketing</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Registrant's Position *</label>
                    <Input value={registrantPosition} onChange={e => setRegistrantPosition(e.target.value)} placeholder="Fleet Manager" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Official Registered Address *</label>
                    <Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Bole, Addis Ababa" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Designated Driver Full Name *</label>
                    <Input value={renterName} onChange={e => setRenterName(e.target.value)} placeholder="John Doe" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Driver Age *</label>
                    <Input type="number" value={renterAge} onChange={e => setRenterAge(e.target.value)} placeholder="30" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Driver Physical Address *</label>
                    <Input value={renterAddr} onChange={e => setRenterAddr(e.target.value)} placeholder="Kazanchis, Addis Ababa" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Purpose of Rental *</label>
                    <Textarea value={rentalPurpose} onChange={e => setRentalPurpose(e.target.value)} placeholder="e.g. Business trip to Hawassa for client meetings" className="min-h-[80px] rounded-xl border-2 font-bold text-sm resize-none" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Operating Area *</label>
                    <Input value={operatingArea} onChange={e => setOperatingArea(e.target.value)} placeholder="e.g. Addis Ababa, Bishoftu, Hawassa" className="h-12 rounded-xl border-2 font-bold" />
                  </div>
                </div>
                <Button onClick={handleNext} disabled={!canProceed()} className="w-full h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                  Continue <ChevronRight className="ml-2" size={20} />
                </Button>
              </motion.div>
            )}

            {/* STEP 1: Phone OTP */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                <div className="text-center mb-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Phone size={32} />
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Phone Verification</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Verify your registered phone number with a one-time code</p>
                </div>
                {!otpVerified ? (
                  <>
                    {!otpSent && (
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
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                            <ChevronLeft size={20} />
                          </Button>
                          <Button onClick={handleNext} className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                            <Phone className="mr-2" size={20} /> Send Verification Code
                          </Button>
                        </div>
                      </div>
                    )}
                    {otpSent && !otpVerified && (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Code sent to <strong className="text-foreground">+251 {phoneNumber}</strong></p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">OTP Code</label>
                          <Input value={otpValue} onChange={e => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" className="h-14 rounded-2xl border-2 font-bold text-2xl text-center tracking-[0.5em]" maxLength={6} />
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Demo Mode</p>
                          <p className="text-amber-600 text-sm mt-1">OTP will auto-fill: <code className="bg-white px-2 py-0.5 rounded font-bold text-amber-800 border border-amber-200">123456</code></p>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                            <ChevronLeft size={20} />
                          </Button>
                          <Button onClick={handleNext} disabled={!otpValue} className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                            <CheckCircle2 className="mr-2" size={20} /> Verify & Continue
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center py-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4"><CheckCircle2 size={32} /></div>
                    <p className="font-bold text-lg text-green-700">Phone Verified!</p>
                    <p className="text-sm text-muted-foreground">+251 {phoneNumber}</p>
                    <div className="flex gap-3 mt-6">
                      <Button variant="outline" onClick={goBack} className="h-12 rounded-2xl font-bold uppercase tracking-wider px-4">
                        <ChevronLeft size={18} />
                      </Button>
                      <Button onClick={() => setStep(2)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-wider">Continue <ChevronRight className="ml-2" size={18} /></Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: National ID OTP */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
                <div className="text-center mb-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <IdCard size={32} />
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">National ID Verification</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Verify through the Fayda National Digital ID system</p>
                </div>
                {!nationalIdVerified ? (
                  <>
                    {!nationalIdOtpSent ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fayda ID Number</label>
                          <Input value={nationalId} onChange={e => setNationalId(e.target.value)} placeholder="FD-XXXX-XXXX" className="h-14 rounded-2xl border-2 font-bold text-lg" />
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Demo Codes</p>
                          <div className="flex gap-4 text-sm mt-1">
                            <span className="text-amber-600 text-[10px] font-bold uppercase">Phone: <code className="bg-white px-2 py-0.5 rounded font-bold text-amber-800 border border-amber-200">123456</code></span>
                            <span className="text-amber-600 text-[10px] font-bold uppercase">National ID: <code className="bg-white px-2 py-0.5 rounded font-bold text-amber-800 border border-amber-200">654321</code></span>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                            <ChevronLeft size={20} />
                          </Button>
                          <Button onClick={handleNext} disabled={nationalIdOtpLoading || !nationalId.trim()} className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                            {nationalIdOtpLoading ? <><Loader2 className="mr-2 animate-spin" size={20} /> Sending...</> : <><ShieldCheck className="mr-2" size={20} /> Send OTP</>}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">OTP sent for <strong className="text-foreground">{nationalId}</strong></p>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">OTP Code</label>
                          <Input value={nationalIdOtp} onChange={e => setNationalIdOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="654321" className="h-14 rounded-2xl border-2 font-bold text-2xl text-center tracking-[0.5em]" maxLength={6} />
                        </div>
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                          <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Demo Mode</p>
                          <p className="text-amber-600 text-sm mt-1">OTP will auto-fill: <code className="bg-white px-2 py-0.5 rounded font-bold text-amber-800 border border-amber-200">654321</code></p>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                            <ChevronLeft size={20} />
                          </Button>
                          <Button onClick={handleNext} disabled={nationalIdOtp.length < 6} className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                            <CheckCircle2 className="mr-2" size={20} /> Verify & Continue
                          </Button>
                        </div>
                        <div className="text-center">
                          {nationalIdOtpTimer > 0 ? (
                            <p className="text-sm text-muted-foreground">Resend in <strong className="text-primary">{nationalIdOtpTimer}s</strong></p>
                          ) : (
                            <button onClick={() => { setNationalIdOtpSent(false); setNationalIdOtp(''); }} className="text-sm font-bold text-primary underline">Resend OTP</button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center py-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4"><CheckCircle2 size={32} /></div>
                    <p className="font-bold text-lg text-green-700">National ID Verified!</p>
                    <p className="text-sm text-muted-foreground">{nationalId}</p>
                    <div className="flex gap-3 mt-6">
                      <Button variant="outline" onClick={goBack} className="h-12 rounded-2xl font-bold uppercase tracking-wider px-4">
                        <ChevronLeft size={18} />
                      </Button>
                      <Button onClick={() => setStep(3)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-wider">Continue <ChevronRight className="ml-2" size={18} /></Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: Legal Docs */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-5">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Legal Documents</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Upload official corporate documents (PDF or images accepted)</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { type: 'legal_papers' as const, label: 'Legal Papers / MOA' },
                    { type: 'trade_license' as const, label: 'Commercial Trade License' },
                    { type: 'tin_certificate' as const, label: 'TIN Certification' },
                    { type: 'qualification_doc' as const, label: 'Qualification Documents' },
                  ].map(item => (
                    <div key={item.type} className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.label}</label>
                      {corporateDocs.find(d => d.type === item.type) ? (
                        <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-green-200 bg-green-50">
                          <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                          <span className="text-sm font-medium truncate flex-1">{corporateDocs.find(d => d.type === item.type)?.fileName}</span>
                          <button onClick={() => removeDoc(corporateDocs.find(d => d.type === item.type)!.id)} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all">
                          <Upload size={20} className="text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">Tap to upload</span>
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload(item.type)} className="hidden" />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                    <ChevronLeft size={20} />
                  </Button>
                  <Button onClick={handleNext} disabled={!canProceed()} className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                    Continue <ChevronRight className="ml-2" size={20} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Driver Credentials */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-5">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Driver Credentials</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Upload the designated driver's identification documents</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'National ID — Front', value: nidFront, setter: setNidFront },
                    { label: 'National ID — Back', value: nidBack, setter: setNidBack },
                    { label: 'Driver License — Front', value: licenseFront, setter: setLicenseFront },
                    { label: 'Driver License — Back', value: licenseBack, setter: setLicenseBack },
                  ].map(item => (
                    <div key={item.label} className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.label}</label>
                      {item.value ? (
                        <div className="relative rounded-2xl overflow-hidden border-2 border-green-200">
                          <img src={item.value} alt={item.label} className="w-full h-28 object-cover" />
                          <button onClick={() => item.setter('')} className="absolute top-1 right-1 bg-red-500/80 p-1 rounded-full hover:bg-red-600"><X size={14} className="text-white" /></button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all min-h-[4rem]">
                          <Camera size={20} className="text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">Tap to upload</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload(item.setter)} className="hidden" />
                        </label>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                    <ChevronLeft size={20} />
                  </Button>
                  <Button onClick={handleNext} disabled={!canProceed()} className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                    Continue <ChevronRight className="ml-2" size={20} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Face Scan */}
            {step === 5 && (
              <motion.div key="step5" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-5">
                <div className="text-center">
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Face Scan</h2>
                  <p className="text-muted-foreground text-sm mt-1">Live 3-angle face scan for secure identity verification</p>
                </div>

                <div className="relative mx-auto w-64 h-64 rounded-3xl overflow-hidden bg-black border-4 shadow-2xl">
                  <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
                  {scanPhase === 'scanning' && (
                    <>
                      <div className="absolute inset-0 border-[3px] border-primary/60 rounded-[1.3rem] animate-pulse" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 bg-black/50 backdrop-blur-sm rounded-full py-1.5 px-3">
                        {['Center', 'Left', 'Right'].map((label, i) => (
                          <span key={i} className={`text-[10px] font-bold uppercase tracking-wider transition-all ${
                            scanAngle === i ? 'text-primary scale-110' : 'text-white/40'
                          }`}>{label}</span>
                        ))}
                      </div>
                      <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{scanCountdown}</span>
                      </div>
                    </>
                  )}
                  {scanPhase === 'idle' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm gap-3">
                      <Scan size={40} className="text-white/80" />
                      <p className="text-white font-bold text-sm">Ready to scan</p>
                    </div>
                  )}
                  {scanPhase === 'complete' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500/20 backdrop-blur-sm gap-2">
                      <CheckCircle2 size={48} className="text-green-400" />
                      <p className="text-white font-bold text-sm">Scan complete</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-6 text-sm">
                    {[
                      { label: 'Center', time: '3s', done: scanCountdown < 7 },
                      { label: 'Left', time: '3s', done: scanCountdown < 4 },
                      { label: 'Right', time: '3s', done: scanCountdown <= 0 },
                    ].map((angle, i) => (
                      <div key={i} className={`flex flex-col items-center gap-1 transition-all ${
                        angle.done ? 'text-green-500' : scanAngle === i && scanPhase === 'scanning' ? 'text-primary scale-110' : 'text-muted-foreground/50'
                      }`}>
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          angle.done ? 'bg-green-100' : scanAngle === i && scanPhase === 'scanning' ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          {angle.done ? <CheckCircle2 size={16} /> : i + 1}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{angle.label}</span>
                        <span className="text-[9px]">{angle.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {scanPhase === 'idle' && (
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                      <ChevronLeft size={20} />
                    </Button>
                    <Button onClick={handleStartScan} className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20 gap-2">
                      <Camera size={20} /> Start Face Scan
                    </Button>
                  </div>
                )}
                {scanPhase === 'scanning' && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 size={16} className="animate-spin" />
                    Scanning... keep your face in the frame
                  </div>
                )}
                {scanPhase === 'complete' && (
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                      <ChevronLeft size={20} />
                    </Button>
                    <Button onClick={handleNext} className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                      Continue to Review <ChevronRight className="ml-2" size={20} />
                    </Button>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-xs text-amber-700 font-medium flex items-start gap-2">
                    <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                    Your face scan data is processed live and not permanently stored. After acceptance, it is discarded.
                  </p>
                </div>
              </motion.div>
            )}

            {/* STEP 6: Review & Submit */}
            {step === 6 && (
              <motion.div key="step6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Review & Submit</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Review your booking details before submitting</p>
                </div>
                <div className="bg-muted/30 rounded-2xl p-5 border border-primary/10 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-20 rounded-xl overflow-hidden shrink-0 bg-muted">
                      {car.image && <img src={car.image} alt={car.model} className="h-full w-full object-cover" />}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{car.make} {car.model}</p>
                      <p className="text-sm text-muted-foreground">ETB {car.pricePerDay.toLocaleString()} / day</p>
                      {startDate && endDate && (
                        <p className="text-xs text-muted-foreground mt-1">{format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')} &middot; {days} days</p>
                      )}
                    </div>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white rounded-xl p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Company</p>
                      <p className="font-bold mt-0.5">{companyName}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Driver</p>
                      <p className="font-bold mt-0.5">{renterName}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Phone</p>
                      <p className="text-green-600 font-bold mt-0.5">{otpVerified ? '+251 ' + phoneNumber : 'Pending'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">National ID</p>
                      <p className="text-green-600 font-bold mt-0.5">{nationalIdVerified ? 'Verified' : 'Pending'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Purpose</p>
                      <p className="font-bold mt-0.5 text-xs truncate">{rentalPurpose}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-border">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">Operating Area</p>
                      <p className="font-bold mt-0.5 text-xs truncate">{operatingArea}</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
                    <Lock size={16} className="text-blue-500 shrink-0" />
                    <p className="text-blue-800 text-sm font-bold">30,000 ETB security hold required after host acceptance</p>
                  </div>
                  {totalAmount && totalAmount > 0 && (
                    <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">Total Rental</p>
                      <p className="text-xl font-bold text-primary">ETB {totalAmount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <label className="flex items-start gap-3 p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bankHoldConfirmed}
                    onChange={e => setBankHoldConfirmed(e.target.checked)}
                    className="mt-0.5 h-5 w-5 rounded border-gray-300 accent-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    I confirm all information is correct and agree to the <strong className="text-foreground">30,000 ETB</strong> refundable security hold and rental terms.
                  </span>
                </label>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                    <ChevronLeft size={20} />
                  </Button>
                  <Button onClick={handleNext} disabled={!canProceed() || submitting} className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                    {submitting ? <><Loader2 size={20} className="mr-2 animate-spin" /> Submitting...</> : 'Submit for Host Approval'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 7: Waiting for Host Acceptance */}
            {step === 7 && (
              <motion.div key="step7" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-6 text-center">
                {!hostAccepted ? (
                  <>
                    <div className="relative mb-8">
                      <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
                      <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-amber-50 border-4 border-amber-200"><Loader2 size={48} className="text-amber-500 animate-spin" /></div>
                    </div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight mb-2">Waiting for Host Acceptance</h2>
                    <p className="text-muted-foreground mb-6 max-w-sm">Your corporate booking request and documents have been submitted. The host is reviewing your information...</p>
                    {car.image && (
                      <div className="w-full bg-muted/30 rounded-2xl p-5 border border-primary/10 mb-6">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0"><Car size={28} /></div>
                          <div className="text-left">
                            <p className="font-bold text-lg">{car.make} {car.model}</p>
                            {startDate && endDate && (
                              <p className="text-sm text-muted-foreground">{format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')} &middot; {days} days</p>
                            )}
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
                        <motion.div className="h-full bg-gradient-to-r from-amber-400 to-primary rounded-full" initial={{ width: '0%' }} animate={{ width: '0%' }} transition={{ duration: 0.3 }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Host is reviewing your request...</p>
                    </div>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">
                    <div className="flex flex-col items-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-4">
                        <CheckCircle2 size={48} className="text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold uppercase tracking-tight text-green-700">Host Accepted!</h2>
                      <p className="text-muted-foreground mt-1">The host has reviewed and accepted your corporate booking request.</p>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                      <Clock size={20} className="text-amber-600 shrink-0" />
                      <div className="text-left text-sm">
                        <p className="font-bold text-amber-800">Complete within 15 minutes</p>
                        <p className="text-amber-700">
                          {Math.floor(timeoutRemaining / 60)}:{String(timeoutRemaining % 60).padStart(2, '0')} remaining
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                        <ChevronLeft size={20} />
                      </Button>
                      <Button onClick={() => setStep(8)} className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20">
                        Continue to Sign Agreement <ChevronRight className="ml-2" size={20} />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STEP 8: Digital Signature */}
            {step === 8 && (
              <motion.div key="step8" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="text-center mb-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <FileText size={32} />
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Digital Signature</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Sign the rental agreement digitally</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-2xl p-5 border border-primary/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Company</h4>
                    <p className="font-bold">{companyName}</p>
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-5 border border-primary/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Driver</h4>
                    <p className="font-bold">{renterName}</p>
                  </div>
                  {startDate && endDate && (
                    <div className="bg-muted/30 rounded-2xl p-5 border border-primary/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Period</h4>
                      <p className="font-bold">{format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{days} days</p>
                    </div>
                  )}
                  <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Total</h4>
                    <p className="text-2xl font-bold text-primary">ETB {(totalAmount || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-primary">Sign here</label>
                  <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 p-2">
                    <SignatureCanvas ref={sigCanvas} penColor="black" canvasProps={{ className: 'signature-canvas w-full h-28 rounded-xl cursor-crosshair' }} />
                  </div>
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => sigCanvas.current?.clear()} className="text-xs font-bold uppercase tracking-widest">Clear</Button>
                  </div>
                </div>

                <div ref={agreementRef} style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px' }}>
                  <div className="p-8 bg-white">
                    <h1 className="text-2xl font-bold mb-4">ZOE CAR RENTAL - CORPORATE RENTAL AGREEMENT</h1>
                    <p className="mb-4">Booking ID: corp-{Date.now().toString(36).toUpperCase()}</p>
                    <p><strong>Company:</strong> {companyName}</p>
                    <p><strong>Driver:</strong> {renterName}</p>
                    <p><strong>Phone:</strong> +251 {phoneNumber}</p>
                    <p><strong>Address:</strong> {companyAddress}</p>
                    <p><strong>Purpose:</strong> {rentalPurpose}</p>
                    <p><strong>Vehicle:</strong> {car.make} {car.model}</p>
                    {startDate && endDate && (
                      <p><strong>Period:</strong> {format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}</p>
                    )}
                    <p><strong>Rental Fee:</strong> ETB {(totalAmount || 0).toLocaleString()}</p>
                    {insuranceAmount > 0 && <p><strong>Insurance ({days} day{days > 1 ? 's' : ''}):</strong> ETB {insuranceAmount.toLocaleString()}</p>}
                    <p><strong>Security Hold:</strong> 30,000 ETB (refundable deposit)</p>
                    <div className="border-t pt-4 mt-4">
                      <p>Signed by: {renterName || companyName}</p>
                      <p>Date: {new Date().toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <Checkbox id="sig-terms" checked={accepted} onCheckedChange={(c) => setAccepted(c as boolean)} className="mt-0.5 h-5 w-5 rounded-lg data-[state=checked]:bg-primary" />
                  <Label htmlFor="sig-terms" className="text-sm font-medium cursor-pointer leading-snug">I confirm all details are correct and agree to the rental terms including the <strong>30,000 ETB refundable security hold (money frozen)</strong> as a bank pre-authorization freeze</Label>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                    <ChevronLeft size={20} />
                  </Button>
                  <Button onClick={handleSignAndPay} disabled={!accepted} className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20 gap-2">
                    Continue to Bank Hold <ChevronRight size={20} />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 9: Bank Hold */}
            {step === 9 && (
              <motion.div key="step9" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="text-center mb-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck size={32} />
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Security Hold</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Approve a temporary bank freeze to secure your booking</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <Lock size={22} />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">30,000 ETB Security Deposit Hold</p>
                      <p className="text-sm text-blue-700">Pre-authorization freeze on your account</p>
                    </div>
                  </div>
                  <div className="border-t border-blue-200 pt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-blue-900">No money leaves your bank</p>
                        <p className="text-xs text-blue-700">The 30,000 ETB is temporarily frozen — it stays in your account but cannot be spent.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-blue-900">Fully refundable</p>
                        <p className="text-xs text-blue-700">The hold is released within 3-5 business days after safe return of the vehicle.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-sm text-blue-900">Behavioral safety deposit</p>
                        <p className="text-xs text-blue-700">Deductions only apply for damages or violations as per the rental agreement.</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-amber-600 shrink-0" />
                      <div className="text-left text-sm">
                        <p className="font-bold text-amber-800">
                          {Math.floor(timeoutRemaining / 60)}:{String(timeoutRemaining % 60).padStart(2, '0')} remaining
                        </p>
                        <p className="text-xs text-amber-700">You must complete this step before time runs out</p>
                      </div>
                    </div>
                  </div>
                </div>

                {bankHoldDone ? (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-4 bg-green-50 border border-green-200 rounded-2xl p-6">
                    <CheckCircle2 size={40} className="text-green-500 mb-2" />
                    <p className="font-bold text-green-800 text-lg">Hold Approved!</p>
                    <p className="text-sm text-green-700">30,000 ETB security freeze is active on your account.</p>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" onClick={goBack} className="h-12 rounded-2xl font-bold uppercase tracking-wider px-4">
                      <ChevronLeft size={18} />
                    </Button>
                    <Button onClick={() => setStep(10)} className="flex-1 h-12 rounded-2xl font-bold uppercase tracking-wider">
                      Proceed to Payment <ChevronRight className="ml-2" size={18} />
                    </Button>
                  </div>
                  </motion.div>
                ) : (
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                      <ChevronLeft size={20} />
                    </Button>
                    <Button
                      onClick={handleBankHold}
                      disabled={bankHoldLoading}
                      className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20"
                    >
                      {bankHoldLoading ? (
                        <><Loader2 className="mr-2 animate-spin" size={20} /> Processing Hold...</>
                      ) : (
                        <><Lock className="mr-2" size={20} /> Approve 30,000 ETB Security Hold</>
                      )}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 10: Payment */}
            {step === 10 && (
              <motion.div key="step10" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="text-center mb-4">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <CreditCard size={32} />
                  </div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight">Payment</h2>
                  <p className="text-muted-foreground mt-1 text-sm">Complete payment to finalize your booking</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-2xl p-5 border border-primary/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Car</h4>
                    <p className="font-bold">{car.make} {car.model}</p>
                  </div>
                  {startDate && endDate && (
                    <div className="bg-muted/30 rounded-2xl p-5 border border-primary/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Period</h4>
                      <p className="font-bold">{format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{days} days</p>
                    </div>
                  )}
                  <div className="bg-muted/30 rounded-2xl p-5 border border-primary/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Payment</h4>
                    <p className="font-bold capitalize">{paymentMethodName || paymentMethod || 'Corporate Account'}</p>
                  </div>
                  <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Final Total</h4>
                    <p className="text-2xl font-bold text-primary">ETB {finalTotal.toLocaleString()}</p>
                    <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
                      <p>Rental: ETB {(totalAmount || 0).toLocaleString()}</p>
                      {insuranceAmount > 0 && <p>Insurance ({days} day{days > 1 ? 's' : ''} × 100): ETB {insuranceAmount.toLocaleString()}</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <Clock size={18} className="text-amber-600 shrink-0" />
                    <div className="text-left text-sm">
                      <p className="font-bold text-amber-800">
                        {Math.floor(timeoutRemaining / 60)}:{String(timeoutRemaining % 60).padStart(2, '0')} remaining
                      </p>
                      <p className="text-xs text-amber-700">You must complete payment before time runs out</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={goBack} className="h-14 rounded-2xl text-base font-bold uppercase tracking-wider px-5">
                    <ChevronLeft size={20} />
                  </Button>
                  <Button
                    onClick={() => setShowPayment(true)}
                    disabled={isProcessing}
                    className="flex-1 h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20 gap-2"
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" size={20} /> Processing...</> : <><CreditCard size={20} /> Pay ETB {finalTotal.toLocaleString()} <ChevronRight size={20} /></>}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 11: Host Contact + Done */}
            {step === 11 && (
              <motion.div key="step11" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col py-2">
                <div className="flex flex-col items-center mb-5">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }} className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-3">
                    <CheckCircle2 size={40} className="text-green-600" />
                  </motion.div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-green-700">Booking Complete!</h2>
                  <p className="text-muted-foreground mt-1">Your corporate rental has been confirmed.</p>
                </div>

                {/* Receipt */}
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
                      <span className="text-muted-foreground">Company</span>
                      <span className="font-bold">{companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Driver</span>
                      <span className="font-bold">{renterName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle</span>
                      <span className="font-bold">{car.make} {car.model}</span>
                    </div>
                    {startDate && endDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rental Period</span>
                        <span className="font-bold">{days} {days === 1 ? 'day' : 'days'}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="font-bold text-lg text-primary">ETB {finalTotal.toLocaleString()}</span>
                    </div>
                    {insuranceAmount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Rental + Insurance</span>
                        <span className="font-bold">ETB {(totalAmount || 0).toLocaleString()} + ETB {insuranceAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-bold capitalize">{paymentMethodName || paymentMethod || 'Corporate Account'}</span>
                    </div>
                    {bookingId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Booking ID</span>
                        <span className="font-bold text-primary">{bookingId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Host Contact */}
                <div className="w-full bg-muted/20 rounded-2xl p-5 border border-primary/10 mb-5 text-left">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                      H
                    </div>
                    <div>
                      <p className="font-bold">Host / Fleet Manager</p>
                      <p className="text-xs text-muted-foreground">Your vehicle host</p>
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
                    <a href="mailto:host@zoecarrental.com" className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-blue-50 transition-colors group">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"><Mail size={16} /></div>
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-blue-700">Send Email</p>
                        <p className="font-bold text-sm">host@zoecarrental.com</p>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider group-hover:underline">Email</span>
                    </a>
                  </div>
                </div>

                <Button onClick={() => { onClose(); navigate('/dashboard'); }} className="w-full h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20 gap-2">
                  <CheckCircle2 size={20} /> Done – Go to Dashboard <ArrowRight className="ml-2" size={20} />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div></div>
      </motion.div>

      <AnimatePresence>
        {showPayment && (
          <PaymentModal
            methodId={paymentMethod || 'corporate'}
            methodName={paymentMethodName || 'Corporate Account'}
            amount={finalTotal}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowPayment(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}