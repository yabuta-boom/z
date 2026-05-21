import React from 'react';
import { motion } from 'motion/react';
import {
  UserPlus, ShieldCheck, Search, SlidersHorizontal, Eye, CalendarCheck,
  CreditCard, FileCheck, LayoutDashboard, Navigation, Key, RotateCcw, Star,
  UserCheck, Car, Image as ImageIcon, DollarSign, Clock, CheckSquare,
  TrendingUp, MessageCircle, Edit3, Wallet, Users, Repeat,
  ArrowRight, ChevronRight, Smartphone, Gauge, Bell, Heart, Settings
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const Step = ({ icon: Icon, title, desc, index }: { icon: any; title: string; desc: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.05 }}
    className="flex gap-4 group"
  >
    <div className="flex flex-col items-center">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
        <Icon size={22} />
      </div>
      {index < 12 && <div className="mt-2 h-full w-0.5 bg-gradient-to-b from-primary/20 to-transparent" />}
    </div>
    <div className="pb-8">
      <h4 className="font-bold text-base mb-1">{title}</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const DashFeature = ({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
  >
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={20} /></div>
    <div><h5 className="font-bold text-sm">{title}</h5><p className="text-xs text-muted-foreground mt-0.5">{desc}</p></div>
  </motion.div>
);

const CTAButton = ({ to, label, navigate }: { to: string; label: string; navigate: (path: string) => void }) => (
  <Button onClick={() => navigate(to)} className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 font-bold text-sm gap-2 shadow-lg hover:shadow-xl transition-all">
    {label} <ArrowRight size={16} />
  </Button>
);

export const HowItWorks = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const renterSteps = [
    { icon: UserPlus, title: 'Create Account', desc: 'Sign up with your email or phone number. Choose a strong password to secure your account.' },
    { icon: ShieldCheck, title: 'Verify Identity', desc: 'Upload your National ID (Fayda) or passport and driving license for security verification.' },
    { icon: Search, title: 'Browse Cars', desc: 'Explore our extensive fleet of vehicles from economy cars to luxury SUVs.' },
    { icon: SlidersHorizontal, title: 'Filter & Search', desc: 'Use advanced filters to find the perfect car by type, price, fuel, transmission, and more.' },
    { icon: Eye, title: 'View Car Details', desc: 'Check full specs, photos, pricing, location, and host details for any vehicle.' },
    { icon: CalendarCheck, title: 'Book a Car', desc: 'Select your pickup and return dates. Review the total cost including insurance and fees.' },
    { icon: CreditCard, title: 'Make Payment', desc: 'Pay securely via Telebirr, bank transfer, or cash. Your booking is confirmed instantly.' },
    { icon: FileCheck, title: 'Receive Confirmation', desc: 'Get a digital rental agreement and booking confirmation via email and in-app notification.' },
    { icon: LayoutDashboard, title: 'Access Dashboard', desc: 'Manage all your rentals from your personal dashboard. View upcoming, active, and past bookings.' },
    { icon: Navigation, title: 'Track with GPS', desc: 'Use real-time GPS tracking to locate your rented vehicle, view trip history, and monitor speed.' },
    { icon: Key, title: 'Pickup Process', desc: 'Meet the host at the agreed location. Inspect the vehicle, sign the agreement, and drive away.' },
    { icon: RotateCcw, title: 'Return Vehicle', desc: 'Return the car on time with the agreed fuel level. The host inspects and confirms the return.' },
    { icon: Star, title: 'Leave Review', desc: 'Rate your experience and leave feedback to help the community make informed choices.' },
  ];

  const renterDashboard = [
    { icon: LayoutDashboard, title: 'Booking Management', desc: 'View all upcoming, active, and past bookings in one place. Extend or cancel with one click.' },
    { icon: Navigation, title: 'GPS Tracking', desc: 'Real-time vehicle location, speed monitoring, and trip history for your active rental.' },
    { icon: CreditCard, title: 'Payment History', desc: 'View all transactions, download receipts, and track payment status.' },
    { icon: Bell, title: 'Notifications', desc: 'Get alerts for booking confirmation, reminders, host messages, and special offers.' },
    { icon: Settings, title: 'Profile Settings', desc: 'Update personal info, change password, manage verification documents, and preferences.' },
    { icon: Heart, title: 'Saved Vehicles', desc: 'Bookmark your favorite cars for quick access. Compare vehicles side by side.' },
  ];

  const hostSteps = [
    { icon: UserCheck, title: 'Register as Host', desc: 'Create a host account during signup. Your role is permanent so you can start listing immediately.' },
    { icon: ShieldCheck, title: 'Verify Identity', desc: 'Complete identity verification to build trust with renters and unlock all host features.' },
    { icon: Car, title: 'Add Vehicle', desc: 'List your car with detailed specs including make, model, year, transmission, and fuel type.' },
    { icon: ImageIcon, title: 'Upload Car Images', desc: 'Add high-quality photos of your vehicle from multiple angles to attract more renters.' },
    { icon: DollarSign, title: 'Set Pricing', desc: 'Set your daily rate, availability calendar, and rental terms. Competitive pricing helps you book faster.' },
    { icon: Clock, title: 'Manage Availability', desc: 'Block off dates when your car is unavailable. Sync with your personal calendar if needed.' },
    { icon: CheckSquare, title: 'Accept Bookings', desc: 'Review renter profiles and approve or decline booking requests. Auto-approve trusted renters.' },
    { icon: Navigation, title: 'Track Rentals', desc: 'Monitor your rented vehicles in real-time with GPS tracking, speed alerts, and geofencing.' },
    { icon: TrendingUp, title: 'Manage Earnings', desc: 'Track your income, view payout history, and withdraw earnings to your bank or Telebirr.' },
    { icon: MessageCircle, title: 'Communicate', desc: 'Chat with renters directly through the platform. Share pickup details and answer questions.' },
    { icon: Edit3, title: 'Edit Listings', desc: 'Update pricing, photos, descriptions, and availability anytime from your host dashboard.' },
    { icon: Wallet, title: 'Withdraw Earnings', desc: 'Transfer your earnings to Telebirr, bank account, or mobile money with a single click.' },
  ];

  const hostDashboard = [
    { icon: Car, title: 'Listing Management', desc: 'Add, edit, activate or deactivate your vehicle listings. Track which cars are booked and available.' },
    { icon: CheckSquare, title: 'Booking Approvals', desc: 'Review incoming rental requests, check renter profiles, approve or decline bookings.' },
    { icon: TrendingUp, title: 'Earnings Analytics', desc: 'View daily, weekly, and monthly earnings reports. Track payout history and projected income.' },
    { icon: Clock, title: 'Availability Calendar', desc: 'Visual calendar showing booked, available, and blocked dates. Manage your schedule easily.' },
    { icon: Navigation, title: 'GPS Tracking', desc: 'Real-time location of all rented vehicles. Speed monitoring, geofence alerts, and trip history.' },
    { icon: Bell, title: 'Notifications', desc: 'Booking alerts, renter messages, payment confirmations, and system updates in real-time.' },
    { icon: Settings, title: 'Profile Management', desc: 'Update your host profile, contact info, verification status, and payment details.' },
  ];

  return (
    <div className="flex flex-col">
      <section className="relative h-[50vh] w-full overflow-hidden bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#3949ab] text-white page-top-offset">
        <div className="absolute inset-0 z-0 opacity-10">
          <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=2000" alt="Car fleet" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
              <Repeat size={36} className="text-white" />
            </div>
            <h1 className="mb-4 text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">{t('howItWorks.heroTitle')}</h1>
            <p className="mx-auto max-w-2xl text-sm sm:text-lg font-medium text-white/80">
              {t('howItWorks.heroDesc')}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="page-container py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Users size={24} /></div>
              <div><h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('howItWorks.forRenters')}</h2><p className="text-sm text-muted-foreground">{t('howItWorks.forRentersSub')}</p></div>
            </div>
            <div className="space-y-0">{renterSteps.slice(0, 7).map((s, i) => <Step key={i} {...s} index={i} />)}</div>
            <div className="mt-6 flex gap-3">
<CTAButton to="/vehicles" label={t('howItWorks.browseCars')} navigate={navigate} />
              <Button variant="outline" onClick={() => navigate('/dashboard')} className="h-12 px-8 rounded-2xl font-bold text-sm border-2">Go to Dashboard</Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Car size={24} /></div>
              <div><h2 className="text-xl sm:text-2xl font-bold tracking-tight">{t('howItWorks.forHosts')}</h2><p className="text-sm text-muted-foreground">{t('howItWorks.forHostsSub')}</p></div>
            </div>
            <div className="space-y-0">{hostSteps.slice(0, 7).map((s, i) => <Step key={i} {...s} index={i} />)}</div>
            <div className="mt-6">
              <Button onClick={() => navigate('/login?role=host')} className="h-12 px-8 rounded-2xl from-indigo-500 to-purple-600 font-bold text-sm gap-2 shadow-lg">List Your Car <ArrowRight size={16} /></Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="bg-muted/30 py-24">
        <div className="page-container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-2xl sm:text-3xl font-bold tracking-tight">Complete Step-by-Step</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">Full renter workflow from account creation to review.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {renterSteps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}>
                <Card className="h-full border-none shadow-sm hover:shadow-lg transition-all group cursor-default">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all"><s.icon size={20} /></div>
                      <span className="text-xs font-bold text-primary/40">0{i + 1}</span>
                    </div>
                    <h4 className="font-bold text-sm mb-1">{s.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-24">
        <div className="mb-16 text-center">
            <h2 className="mb-4 text-2xl sm:text-3xl font-bold tracking-tight">Renter Dashboard Features</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">Everything you need to manage your rentals in one place.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {renterDashboard.map((f, i) => <DashFeature key={i} {...f} />)}
        </div>
        <div className="mt-10 text-center flex gap-4 justify-center">
          <CTAButton to="/dashboard" label="Go to Dashboard" navigate={navigate} />
          <CTAButton to="/vehicles" label="Browse Cars" navigate={navigate} />
        </div>
      </section>

      <section className="bg-primary py-20 text-white">
        <div className="page-container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-2xl sm:text-3xl font-bold tracking-tight">Host Dashboard Features</h2>
            <p className="text-sm text-white/80 max-w-xl mx-auto">Powerful tools to manage your fleet and grow your business.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {hostDashboard.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white"><f.icon size={20} /></div>
                <div><h5 className="font-bold text-sm">{f.title}</h5><p className="text-xs text-white/70 mt-0.5">{f.desc}</p></div>
              </motion.div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button onClick={() => navigate('/login?role=host')} className="h-14 px-10 rounded-2xl bg-white text-primary hover:bg-gray-100 font-bold text-base shadow-xl">Get Started as a Host</Button>
          </div>
        </div>
      </section>

      <section className="page-container py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {renterSteps.slice(7).map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="flex gap-4 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><s.icon size={22} /></div>
              <div><h4 className="font-bold mb-1">{s.title}</h4><p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p></div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-primary py-20 text-white">
        <div className="page-container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-base text-white/80 mb-8 max-w-xl mx-auto">Join thousands of users. Rent a car or list your vehicle today.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button onClick={() => navigate('/vehicles')} className="h-12 sm:h-14 px-6 sm:px-10 rounded-2xl bg-white text-primary hover:bg-gray-100 font-bold text-sm sm:text-base shadow-xl">Browse Cars</Button>
              <Button variant="outline" onClick={() => navigate('/login?role=host')} className="h-12 sm:h-14 px-6 sm:px-10 rounded-2xl border-white text-white hover:bg-white/10 font-bold text-sm sm:text-base">List Your Car</Button>
              <Button variant="outline" onClick={() => navigate('/contact')} className="h-12 sm:h-14 px-6 sm:px-10 rounded-2xl border-white text-white hover:bg-white/10 font-bold text-sm sm:text-base">Contact Us</Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
