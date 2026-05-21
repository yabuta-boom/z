import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Car } from '../types';
import { format } from 'date-fns';
import { Download, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PaymentModal } from './PaymentModal';

interface BookingFormProps {
  car: Car;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  paymentMethod: string;
  paymentMethodName: string;
  paymentMethodLogo?: string;
  onComplete: (pdfBlob: Blob, paymentRecord: { transactionId: string; method: string; amount: number }) => void;
  onCancel: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ 
  car, 
  startDate, 
  endDate, 
  totalAmount, 
  paymentMethod,
  paymentMethodName,
  paymentMethodLogo,
  onComplete,
  onCancel
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRecord, setPaymentRecord] = useState<{ transactionId: string; method: string; amount: number } | null>(null);
  const sigCanvas = useRef<SignatureCanvas>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const handleSignAndPay = () => {
    if (!name || !email || !phone) {
      toast.error('Please fill in all fields');
      return;
    }

    if (sigCanvas.current?.isEmpty()) {
      toast.error('Please provide a signature');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (transactionId: string) => {
    setPaymentRecord({
      transactionId,
      method: paymentMethodName,
      amount: totalAmount
    });
    setShowPaymentModal(false);
    // Trigger PDF generation after a short delay to ensure state update
    setTimeout(() => {
      generatePDF(transactionId);
    }, 500);
  };

  const generatePDF = async (transactionId?: string) => {
    const currentTransactionId = transactionId || paymentRecord?.transactionId;
    if (!currentTransactionId) return;

    setIsExporting(true);
    const element = formRef.current;
    if (!element) {
      setIsExporting(false);
      return;
    }

    try {
      // Wait a bit for any rendering to settle
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
            }
            * {
              color-scheme: light !important;
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
      const pdfBlob = pdf.output('blob');
      
      // Download it for the user
      pdf.save(`ZOE_Rental_Agreement_${car.make}_${car.model}.pdf`);
      
      toast.success('Agreement signed and exported successfully!');
      
      // Small delay before completing to ensure download starts
      setTimeout(() => {
        onComplete(pdfBlob, {
          transactionId: currentTransactionId,
          method: paymentMethodName,
          amount: totalAmount
        });
        setIsExporting(false);
      }, 1000);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl bg-background shadow-2xl my-8 max-h-[90vh] flex flex-col overflow-hidden rounded-[2rem]">
        <CardHeader className="border-b bg-muted/30 shrink-0 p-6">
          <CardTitle className="text-2xl font-black uppercase tracking-tighter">Rental Agreement</CardTitle>
        </CardHeader>
        
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <CardContent className="p-8" ref={formRef}>
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-black">ZOE</div>
                <span className="text-xl font-black uppercase tracking-tighter">Zoe Car Rental</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date</p>
                <p className="font-bold">{format(new Date(), 'PPP')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest">Full Name</label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="John Doe"
                  className="rounded-xl border-2 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest">Email Address</label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="john@example.com"
                  className="rounded-xl border-2 focus-visible:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest">Phone Number</label>
                <div className="flex gap-2">
                  <div className="flex h-12 items-center justify-center rounded-xl border-2 bg-muted/50 px-4 text-sm font-bold text-muted-foreground">
                    +251
                  </div>
                  <Input 
                    value={phone.replace('+251', '').trim()} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPhone('+251 ' + val);
                    }} 
                    placeholder="911 ..."
                    className="rounded-xl border-2 focus-visible:ring-primary flex-1"
                    maxLength={9}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest">Pickup Location</label>
                <Input 
                  value={car.pickupLocation || 'Bole, Addis Ababa'} 
                  readOnly
                  className="rounded-xl border-2 bg-muted/50 font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest">Return Location</label>
                <Input 
                  value={car.returnLocation || 'Bole, Addis Ababa'} 
                  readOnly
                  className="rounded-xl border-2 bg-muted/50 font-bold"
                />
              </div>
            </div>

            <div className="mb-8 rounded-2xl bg-muted/30 p-6 border border-border">
              <h4 className="mb-4 text-sm font-black uppercase tracking-widest text-primary">Vehicle Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vehicle</p>
                  <p className="font-bold">{car.make} {car.model} ({car.year})</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-primary">ETB {totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Pickup Date</p>
                  <p className="font-bold">{format(startDate, 'PPP')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Return Date</p>
                  <p className="font-bold">{format(endDate, 'PPP')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Payment Method</p>
                  <div className="flex items-center gap-2 mt-1">
                    {paymentMethodLogo && (
                      <img src={paymentMethodLogo} alt={paymentMethodName} className="h-5 w-auto object-contain" referrerPolicy="no-referrer" />
                    )}
                    <p className="font-bold uppercase text-primary">{paymentMethodName}</p>
                  </div>
                </div>
              </div>
            </div>

            {paymentRecord && (
              <div className="mb-8 rounded-2xl bg-green-50/50 p-6 border border-green-100">
                <h4 className="mb-4 text-sm font-black uppercase tracking-widest text-green-700">Payment Confirmation</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-green-600/60">Transaction ID</p>
                    <p className="font-mono font-bold text-green-700">{paymentRecord.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-green-600/60">Payment Status</p>
                    <p className="font-bold text-green-700 uppercase">Verified & Paid</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-green-600/60">Amount Paid</p>
                    <p className="font-bold text-green-700">ETB {paymentRecord.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-green-600/60">Payment Date</p>
                    <p className="font-bold text-green-700">{format(new Date(), 'PPP p')}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-8">
              <h4 className="mb-4 text-sm font-black uppercase tracking-widest text-primary">Terms & Conditions</h4>
              <ul className="list-disc pl-5 text-xs space-y-2 text-muted-foreground font-medium">
                <li>The renter must possess a valid driving license.</li>
                <li>The vehicle must be returned in the same condition as received.</li>
                <li>Fuel costs are the responsibility of the renter unless otherwise specified.</li>
                <li>Insurance coverage is subject to the terms of the insurance policy.</li>
                <li>Any traffic violations incurred during the rental period are the responsibility of the renter.</li>
                <li className="text-primary font-bold">The vehicle is equipped with a GPS tracker. The owner reserves the right to remotely disable the engine in case of improper activity or violation of terms.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest">Digital Signature</label>
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
          </CardContent>
        </div>

        <div className="p-6 border-t bg-muted/30 flex gap-4 shrink-0 no-print">
          <Button variant="outline" onClick={onCancel} disabled={isExporting} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest">
            Cancel
          </Button>
          <Button onClick={handleSignAndPay} disabled={isExporting} className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 gap-2">
            {isExporting ? 'Exporting...' : (
              <>
                <CreditCard size={18} />
                Sign & Pay
              </>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showPaymentModal && (
            <PaymentModal 
              methodId={paymentMethod}
              methodName={paymentMethodName}
              amount={totalAmount}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentModal(false)}
            />
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};
