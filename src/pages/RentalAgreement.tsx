import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Download,
  AlertCircle,
  CreditCard,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { PaymentModal } from '../components/PaymentModal';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { MOCK_CARS } from '../constants';

export const RentalAgreement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { profile, user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const sigCanvas = useRef<SignatureCanvas>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  // Get booking details from location state
  const bookingDetails = location.state as {
    carId: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    paymentMethod: string;
  } | null;

  const car = MOCK_CARS.find(c => c.id === bookingDetails?.carId);

  if (!bookingDetails || !car) {
    return (
      <div className="page-container py-20 text-center">
        <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
        <h1 className="text-2xl font-bold mb-4">Invalid Booking Session</h1>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSignAndPay = () => {
    if (!accepted) {
      toast.error('Please accept the terms and conditions to continue');
      return;
    }

    if (sigCanvas.current?.isEmpty()) {
      toast.error('Please provide your digital signature');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (transactionId: string) => {
    setShowPaymentModal(false);
    setIsProcessing(true);
    
    try {
      // 1. Generate PDF
      const pdfBlob = await generatePDF(transactionId);
      
      // 2. Create Booking in Firestore
      const bookingData = {
        carId: car.id,
        userId: user!.uid,
        hostId: car.hostId,
        startDate: bookingDetails.startDate,
        endDate: bookingDetails.endDate,
        totalAmount: bookingDetails.totalAmount,
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentRecord: {
          transactionId,
          method: bookingDetails.paymentMethod,
          amount: bookingDetails.totalAmount
        },
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      
      toast.success('Booking confirmed! Your agreement has been downloaded.');
      
      // 3. Redirect to Dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Finalizing booking error:', error);
      toast.error('Failed to finalize booking. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generatePDF = async (transactionId: string): Promise<Blob> => {
    setIsExporting(true);
    const element = agreementRef.current;
    if (!element) {
      setIsExporting(false);
      throw new Error('Agreement element not found');
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            :root {
              --background: #ffffff !important;
              --foreground: #1a1a1a !important;
              --card: #ffffff !important;
              --card-foreground: #1a1a1a !important;
              --primary: #4f46e5 !important;
              --primary-foreground: #ffffff !important;
              --muted: #f5f5f5 !important;
              --muted-foreground: #737373 !important;
              --border: #e5e5e5 !important;
              --input: #e5e5e5 !important;
              --ring: #4f46e5 !important;
              --secondary: #f3f4f6 !important;
              --secondary-foreground: #1f2937 !important;
              --accent: #f3f4f6 !important;
              --accent-foreground: #1f2937 !important;
              --destructive: #ef4444 !important;
              --destructive-foreground: #ffffff !important;
            }
            * {
              color-scheme: light !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            /* Force fallback for any oklch/oklab usage if possible */
            [class*="bg-"], [class*="text-"], [class*="border-"] {
              transition: none !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Add transaction info to PDF
      pdf.setFontSize(10);
      pdf.text(`Transaction ID: ${transactionId}`, 10, pdfHeight + 10);
      pdf.text(`Signed by: ${profile?.name}`, 10, pdfHeight + 15);
      pdf.text(`Date: ${new Date().toLocaleString()}`, 10, pdfHeight + 20);

      const pdfBlob = pdf.output('blob');
      pdf.save(`ZOE_Agreement_${car.make}_${car.model}.pdf`);
      
      setIsExporting(false);
      return pdfBlob;
    } catch (error) {
      setIsExporting(false);
      throw error;
    }
  };

  return (
    <div className="page-container py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 font-bold">
            <ChevronLeft size={20} /> Back
          </Button>
          <Badge className="bg-primary/10 text-primary font-bold px-4 py-1 rounded-full">FINAL STEP</Badge>
        </div>

        <Card className="border-none shadow-2xl rounded-[2rem] overflow-hidden mb-8">
          <CardHeader className="bg-primary text-primary-foreground p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <FileText size={32} />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold uppercase tracking-tight">Rental Agreement</CardTitle>
                <CardDescription className="text-primary-foreground/80 font-bold">Review, Sign & Pay to complete your booking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8" ref={agreementRef}>
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">ZOE</div>
                <span className="text-xl font-bold uppercase tracking-tight">Zoe Car Rental</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Booking ID</p>
                <p className="font-bold">#TEMP-{Math.floor(Math.random() * 10000)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8 p-4 sm:p-6 rounded-2xl bg-muted/30 border border-border">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Vehicle Details</h4>
                <p className="font-bold text-lg">{car.make} {car.model} ({car.year})</p>

                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Rental Period</h4>

                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Renter Information</h4>

                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Total Amount</h4>
                <p className="text-2xl font-bold text-primary">ETB {bookingDetails.totalAmount.toLocaleString()}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Paid via {bookingDetails.paymentMethod}</p>
              </div>
            </div>

            <ScrollArea className="h-[400px] rounded-2xl border-2 p-6 bg-muted/10 mb-8">
              <div className="space-y-6 text-sm leading-relaxed font-medium text-muted-foreground">
                <section>
                  <h3 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3">1. Parties to the Agreement</h3>

                  <h3 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3">2. Vehicle Use & Restrictions</h3>

                  <h3 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3">3. Insurance & Liability</h3>

                  <h3 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3">4. Fuel & Cleaning</h3>

                  <h3 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3">5. Late Returns</h3>

                  <h3 className="text-lg font-bold uppercase tracking-tight text-foreground mb-3">6. Identity Verification</h3>
                  <p>By accepting this agreement, you confirm that the identity documents provided (National ID and Driving License) are authentic and belong to you. Fraudulent activity will result in immediate account termination and legal action.</p>
                </section>

                <div className="pt-8 border-t">
                  <p className="font-bold text-foreground">Digitally signed by: {profile?.name}</p>
                  <p className="text-xs">Date: {new Date().toLocaleDateString()}</p>
                  <p className="text-xs">IP Address: 192.168.1.1 (Simulated)</p>
                </div>
              </div>
            </ScrollArea>

            <div className="space-y-8">
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-primary/5 border-2 border-primary/10">
                <Checkbox 
                  id="terms" 
                  checked={accepted} 
                  onCheckedChange={(checked) => setAccepted(checked as boolean)}
                  className="mt-1 h-6 w-6 rounded-lg data-[state=checked]:bg-primary"
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-sm font-bold uppercase tracking-tight cursor-pointer"
                  >
                    I have read and agree to the Rental Agreement
                  </Label>
                  <p className="text-xs text-muted-foreground font-bold">
                    By checking this box, you are providing a digital signature and agreeing to all terms listed above.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-primary">Digital Signature</label>
                <div className="rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 p-2">
                  <SignatureCanvas 
                    ref={sigCanvas}
                    penColor='black'
                    canvasProps={{
                      className: 'signature-canvas w-full h-40 rounded-xl cursor-crosshair'
                    }}
                  />
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearSignature} className="text-xs font-bold uppercase tracking-widest">
                    Clear Signature
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button 
            className="h-14 flex-[2] rounded-2xl font-bold uppercase tracking-wider text-base shadow-2xl shadow-primary/20 gap-2"
            onClick={handleSignAndPay}
            disabled={!accepted || isProcessing || isExporting}
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" /> Processing...
              </>
            ) : (
              <>
                <CreditCard size={20} /> Sign & Pay <ChevronRight className="ml-2" />
              </>
            )}
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal 
            methodId={bookingDetails.paymentMethod}
            methodName={bookingDetails.paymentMethod}
            amount={bookingDetails.totalAmount}
            onSuccess={handlePaymentSuccess}
            onCancel={() => setShowPaymentModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", className)}>
    {children}
  </div>
);

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
