import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Loader2, 
  Lock,
  ArrowRight,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface PaymentModalProps {
  methodId: string;
  methodName: string;
  amount: number;
  onSuccess: (transactionId: string) => void;
  onCancel: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  methodId,
  methodName,
  amount,
  onSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const isMobileMoney = ['telebirr', 'cbe', 'abyssinia', 'oromia'].includes(methodId);

  const handlePayment = () => {
    if (isMobileMoney) {
      if (!phoneNumber || phoneNumber.length < 9) {
        toast.error('Please enter a valid phone number');
        return;
      }
    } else {
      if (!cardholderName.trim()) {
        toast.error('Please enter the cardholder name');
        return;
      }
      if (!cardNumber || cardNumber.length < 16) {
        toast.error('Please enter a valid card number');
        return;
      }
      if (!expiry || expiry.length < 5) {
        toast.error('Please enter a valid expiry date');
        return;
      }
      if (!cvv || cvv.length < 3) {
        toast.error('Please enter a valid CVV');
        return;
      }
    }

    setStep('processing');
    
    setTimeout(() => {
      const transactionId = 'ZOE-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      setStep('success');
      setTimeout(() => {
        onSuccess(transactionId);
      }, 2000);
    }, 3000);
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) {
      return digits.slice(0, 2) + ' / ' + digits.slice(2);
    }
    return digits;
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
      >
        <div className="relative p-8">
          <button 
            onClick={onCancel}
            className="absolute right-6 top-6 rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>

          <AnimatePresence mode="wait">
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    {isMobileMoney ? <Smartphone size={24} /> : <CreditCard size={24} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold uppercase tracking-tight">Secure Payment</h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{methodName}</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-muted/30 p-6 border border-primary/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Amount to Pay</span>
                    <span className="text-xl font-bold text-primary">ETB {amount.toLocaleString()}</span>
                  </div>
                </div>

                {isMobileMoney ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phone Number</label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 h-14 px-4 rounded-2xl border-2 border-gray-200 bg-gray-50 min-w-[85px]">
                          <span className="text-lg">&#x1F1EA;&#x1F1E9;</span>
                          <span className="text-sm font-bold text-gray-700">+251</span>
                        </div>
                        <Input 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                          placeholder="91 123 4567"
                          className="h-14 rounded-2xl border-2 font-bold text-lg focus-visible:ring-primary flex-1"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter the phone number linked to your {methodName} account
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cardholder Name</label>
                      <Input 
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="John Doe"
                        className="h-14 rounded-2xl border-2 font-bold text-lg focus-visible:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Card Number</label>
                      <Input 
                        value={formatCardNumber(cardNumber)}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                        placeholder="0000 0000 0000 0000"
                        className="h-14 rounded-2xl border-2 font-bold text-lg focus-visible:ring-primary tracking-wider"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Expiry Date</label>
                        <Input 
                          value={formatExpiry(expiry)}
                          onChange={(e) => setExpiry(e.target.value.replace(/[^\d/]/g, '').slice(0, 7))}
                          placeholder="MM / YY"
                          className="h-14 rounded-2xl border-2 font-bold text-lg focus-visible:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">CVV</label>
                        <Input 
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                          placeholder="123"
                          className="h-14 rounded-2xl border-2 font-bold text-lg focus-visible:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handlePayment}
                  className="w-full h-14 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl shadow-primary/20 mt-4"
                >
                  Pay Now
                  <ArrowRight className="ml-2" size={20} />
                </Button>

                <div className="flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Lock size={12} className="text-green-500" />
                  <span>256-bit SSL Encrypted Payment</span>
                </div>
              </motion.div>
            )}

            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Loader2 size={48} className="animate-spin" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-2">Processing Payment</h3>
                <p className="text-muted-foreground">Please wait while we process your payment...</p>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <CheckCircle2 size={48} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-2 text-green-600">Payment Successful</h3>
                <p className="text-muted-foreground mb-4">Your transaction has been completed</p>
                <div className="bg-muted/30 rounded-2xl p-4 w-full max-w-xs">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Transaction ID</p>
                  <p className="text-lg font-bold text-primary tracking-wider">
                    ZOE-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
