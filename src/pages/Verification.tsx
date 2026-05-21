import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Smartphone, 
  User, 
  CreditCard, 
  FileText,
  Camera,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type PhoneStep = 'phone' | 'phone_otp' | 'phone_success';
type IdStep = 'national_id' | 'id_otp' | 'documents' | 'id_success';

export const Verification = () => {
  const { profile, updateVerification } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const mode = new URLSearchParams(location.search).get('mode');

  // Check if we came from a booking process
  const bookingState = location.state as {
    fromBooking: boolean;
    carId: string;
    startDate: string;
    endDate: string;
    paymentMethod: string;
    totalAmount: number;
  } | null;

  const isPhoneMode = mode === 'phone';

  // Phone verification state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>('phone');
  const [phoneNumber, setPhoneNumber] = useState((profile?.phoneNumber || '').replace('+251', ''));
  const [phoneOtp, setPhoneOtp] = useState('');

  // Identity verification state
  const [idStep, setIdStep] = useState<IdStep>('national_id');
  const [nationalId, setNationalId] = useState('');
  const [idOtp, setIdOtp] = useState('');

  // Document State
  const [docs, setDocs] = useState<{
    idFront?: string;
    idBack?: string;
    licenseFront?: string;
  }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocType, setActiveDocType] = useState<keyof typeof docs | null>(null);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }
    setPhoneStep('phone_otp');
    toast.success('Phone OTP sent to +251 ' + phoneNumber);
  };

  const handlePhoneOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneOtp === '123456') {
      await updateVerification({ phoneVerified: true, phoneNumber: '+251' + phoneNumber });
      setPhoneStep('phone_success');
      toast.success('Phone verified successfully');
    } else {
      toast.error('Invalid Phone OTP. Try 123456');
    }
  };

  const handlePhoneSuccessContinue = () => {
    navigate('/');
  };

  const handleIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalId) {
      toast.error('Please enter your National ID number');
      return;
    }
    setIdStep('id_otp');
    toast.success('National ID OTP sent to linked number');
  };

  const handleIdOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (idOtp === '654321') {
      setIdStep('documents');
      toast.success('National ID verified successfully');
    } else {
      toast.error('Invalid ID OTP. Try 654321');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeDocType) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocs({ ...docs, [activeDocType]: reader.result as string });
        setActiveDocType(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerUpload = (type: keyof typeof docs) => {
    setActiveDocType(type);
    fileInputRef.current?.click();
  };

  const submitVerification = async () => {
    if (!docs.idFront || !docs.idBack || !docs.licenseFront) {
      toast.error('Please upload all required documents');
      return;
    }

    setLoading(true);

    try {
      await updateVerification({
        verificationStatus: 'verified',
        nationalId,
        phoneNumber: profile?.phoneNumber || phoneNumber,
        verificationData: {
          idFront: docs.idFront,
          idBack: docs.idBack,
          licenseFront: docs.licenseFront,
          verifiedAt: new Date().toISOString(),
          fullName: profile?.name || '',
          idNumber: nationalId
        }
      });
      setIdStep('id_success');
      toast.success('Identity verified successfully!');
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleIdContinue = () => {
    if (bookingState?.fromBooking) {
      navigate('/rental-agreement', { 
        state: { 
          carId: bookingState.carId,
          startDate: bookingState.startDate,
          endDate: bookingState.endDate,
          paymentMethod: bookingState.paymentMethod,
          totalAmount: bookingState.totalAmount
        } 
      });
    } else {
      navigate(-1);
    }
  };

  // Phone verification flow (Path 1 - from signup)
  if (isPhoneMode) {
    return (
      <div className="page-container py-12 max-w-2xl">
        <AnimatePresence mode="wait">
          {phoneStep === 'phone' && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-primary text-primary-foreground p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <Smartphone size={32} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black uppercase tracking-tighter">Verify Your Phone</CardTitle>
                      <CardDescription className="text-primary-foreground/80 font-bold">Step 1: Enter your phone number</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handlePhoneSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 h-14 px-4 rounded-xl border-2 border-gray-200 bg-gray-50 min-w-[85px]">
                          <span className="text-lg">&#x1F1EA;&#x1F1E9;</span>
                          <span className="text-sm font-bold text-gray-700">+251</span>
                        </div>
                        <Input 
                          id="phoneNumber" 
                          autoComplete="tel"
                          inputMode="tel"
                          placeholder="91 123 4567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                          className="h-14 rounded-xl border-2 focus:border-primary transition-all font-bold flex-1"
                        />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-xl font-black uppercase tracking-widest text-lg">
                      Send OTP <ChevronRight className="ml-2" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {phoneStep === 'phone_otp' && (
            <motion.div
              key="phone_otp"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-primary text-primary-foreground p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <Smartphone size={32} />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-black uppercase tracking-tighter">Phone Verification</CardTitle>
                      <CardDescription className="text-primary-foreground/80 font-bold">Enter the code sent to your phone</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handlePhoneOtpVerify} className="space-y-6">
                    <div className="text-center mb-6">
                      <p className="text-muted-foreground font-medium">We've sent a code to</p>
                      <p className="text-xl font-black text-primary">{phoneNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phoneOtp" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Verification Code</Label>
                      <Input 
                        id="phoneOtp" 
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        placeholder="000000" 
                        maxLength={6}
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        className="h-16 text-center text-xl sm:text-2xl tracking-[0.5em] rounded-xl border-2 focus:border-primary transition-all font-black"
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => setPhoneStep('phone')} className="flex-1 h-14 rounded-xl font-black uppercase tracking-widest">
                        Back
                      </Button>
                      <Button type="submit" className="flex-[2] h-14 rounded-xl font-black uppercase tracking-widest text-lg">
                        Verify Phone
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {phoneStep === 'phone_success' && (
            <motion.div
              key="phone_success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="h-32 w-32 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/30">
                <CheckCircle2 size={64} />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-4">Phone Verified!</h2>
              <p className="text-xl text-muted-foreground font-medium mb-12 max-w-md mx-auto">
                Your phone number has been verified. You now have access to browse our fleet.
              </p>
              <Button 
                onClick={handlePhoneSuccessContinue}
                className="h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-xl shadow-xl shadow-primary/20"
              >
                Start Browsing
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Identity verification flow (Path 2 - from booking or direct)
  return (
    <div className="page-container py-12 max-w-2xl">
      <AnimatePresence mode="wait">
        {idStep === 'national_id' && (
          <motion.div
            key="national_id"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-primary text-white p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <User size={32} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter">Identity Verification</CardTitle>
                    <CardDescription className="text-white/80 font-bold">Enter your Fayda ID Number</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleIdSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nationalId" className="text-xs font-black uppercase tracking-widest text-muted-foreground">National ID (Fayda)</Label>
                    <Input 
                      id="nationalId" 
                      autoComplete="off"
                      placeholder="Enter your National ID number" 
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      className="h-14 rounded-xl border-2 focus:border-primary transition-all font-bold"
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-xl font-black uppercase tracking-widest text-lg bg-primary hover:bg-primary/90">
                    Continue <ChevronRight className="ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {idStep === 'id_otp' && (
          <motion.div
            key="id_otp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-primary text-white p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter">National ID OTP</CardTitle>
                    <CardDescription className="text-white/80 font-bold">Verify your Fayda ID</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <form onSubmit={handleIdOtpVerify} className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-muted-foreground font-medium">Verification code sent for ID</p>
                    <p className="text-xl font-black text-primary">{nationalId}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idOtp" className="text-xs font-black uppercase tracking-widest text-muted-foreground">ID OTP Code</Label>
                    <Input 
                      id="idOtp" 
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      placeholder="000000" 
                      maxLength={6}
                      value={idOtp}
                      onChange={(e) => setIdOtp(e.target.value)}
                      className="h-16 text-center text-xl sm:text-2xl tracking-[0.5em] rounded-xl border-2 focus:border-primary transition-all font-black"
                    />
                  </div>
                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setIdStep('national_id')} className="flex-1 h-14 rounded-xl font-black uppercase tracking-widest">
                      Back
                    </Button>
                    <Button type="submit" className="flex-[2] h-14 rounded-xl font-black uppercase tracking-widest text-lg bg-primary hover:bg-primary/90">
                      Verify ID
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {idStep === 'documents' && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-primary text-primary-foreground p-8">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <CreditCard size={32} />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black uppercase tracking-tighter">Document Upload</CardTitle>
                    <CardDescription className="text-primary-foreground/80 font-bold">Upload your ID & License</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">National ID (Front)</Label>
                      <div 
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerUpload('idFront'); } }}
                        onClick={() => triggerUpload('idFront')}
                        className={`aspect-[3/2] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${docs.idFront ? 'border-green-500 bg-green-50' : 'border-muted-foreground/20'}`}
                      >
                        {docs.idFront ? (
                          <img src={docs.idFront} className="h-full w-full object-cover rounded-2xl" />
                        ) : (
                          <>
                            <Camera className="mb-2 text-muted-foreground" size={32} />
                            <span className="text-xs font-bold text-muted-foreground">Click to upload</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">National ID (Back)</Label>
                      <div 
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerUpload('idBack'); } }}
                        onClick={() => triggerUpload('idBack')}
                        className={`aspect-[3/2] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${docs.idBack ? 'border-green-500 bg-green-50' : 'border-muted-foreground/20'}`}
                      >
                        {docs.idBack ? (
                          <img src={docs.idBack} className="h-full w-full object-cover rounded-2xl" />
                        ) : (
                          <>
                            <Camera className="mb-2 text-muted-foreground" size={32} />
                            <span className="text-xs font-bold text-muted-foreground">Click to upload</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Driving License (Front)</Label>
                    <div 
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerUpload('licenseFront'); } }}
                      onClick={() => triggerUpload('licenseFront')}
                      className={`aspect-[16/9] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5 ${docs.licenseFront ? 'border-green-500 bg-green-50' : 'border-muted-foreground/20'}`}
                    >
                      {docs.licenseFront ? (
                        <img src={docs.licenseFront} className="h-full w-full object-cover rounded-2xl" />
                      ) : (
                        <>
                          <Camera className="mb-2 text-muted-foreground" size={32} />
                          <span className="text-xs font-bold text-muted-foreground">Click to upload</span>
                        </>
                      )}
                    </div>
                  </div>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*"
                  />

                  <div className="flex gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIdStep('national_id')} 
                      className="flex-1 h-14 rounded-xl font-black uppercase tracking-widest"
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={submitVerification} 
                      className="flex-[2] h-14 rounded-xl font-black uppercase tracking-widest text-lg"
                      disabled={loading || !docs.idFront || !docs.idBack || !docs.licenseFront}
                    >
                      {loading ? <Loader2 className="animate-spin" /> : 'Complete Verification'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {idStep === 'id_success' && (
          <motion.div
            key="id_success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="h-32 w-32 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-500/30">
              <CheckCircle2 size={64} />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter mb-4">Verified!</h2>
            <p className="text-xl text-muted-foreground font-medium mb-12 max-w-md mx-auto">
              Your identity has been successfully verified. You can now proceed with your booking.
            </p>
            <Button 
              onClick={handleIdContinue}
              className="h-16 px-12 rounded-2xl font-black uppercase tracking-widest text-xl shadow-xl shadow-primary/20"
            >
              Continue Booking
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
