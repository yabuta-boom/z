import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Star,
  MapPin,
  Users,
  Gauge,
  Fuel,
  ShieldCheck,
  Calendar as CalendarIcon,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  FileText,
  CreditCard,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_CARS, MOCK_REVIEWS } from '../constants';
import type { Car } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DateRange } from 'react-day-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BookingFlowModal = lazy(() => import('@/components/BookingFlowModal').then(m => ({ default: m.BookingFlowModal })));
const CorporateBookingModal = lazy(() => import('@/components/CorporateBookingModal').then(m => ({ default: m.CorporateBookingModal })));

export const CarDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user, login, profile } = useAuth();
  const [car, setCar] = useState<Car | undefined>(MOCK_CARS.find(c => c.id === id));

  const locationState = location.state as any;

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    locationState?.startDate && locationState?.endDate
      ? { from: new Date(locationState.startDate), to: new Date(locationState.endDate) }
      : undefined
  );
  const [selectedPayment, setSelectedPayment] = useState<string | null>(
    locationState?.paymentMethod || null
  );

  const [isBooking, setIsBooking] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showBookingBar, setShowBookingBar] = useState(false);
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [showCorporateBooking, setShowCorporateBooking] = useState(false);

  const paymentMethods = [
    { id: 'telebirr', name: 'Telebirr', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZpPh0ccu4nKegTIcp3ojeOMT5CP7ax8ZqHQ&s' },
    { id: 'cbe', name: 'CBE Birr', logo: 'https://www.ethiotelecom.et/wp-content/uploads/2021/02/CBE-Birr-01.jpg' },
    { id: 'abyssinia', name: 'Abyssinia', logo: 'https://cdn-1.webcatalog.io/catalog/bank-of-abyssinia/bank-of-abyssinia-social-preview.png?v=1776645432871' },
    { id: 'oromia', name: 'Oromia Bank', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTAyfylVMwmOOg207c0Rxi2Bbg9TZRdvpLtGA&s' },
    { id: 'paypal', name: 'PayPal', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg' },
    { id: 'visa', name: 'Visa / Mastercard', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/MasterCard_Logo.svg/1280px-MasterCard_Logo.svg.png' },
  ];

  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowBookingBar(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const goNext = () => {
    setDirection(1);
    setActiveImage((prev) => (prev + 1) % car.images.length);
  };

  const goPrev = () => {
    setDirection(-1);
    setActiveImage((prev) => (prev - 1 + car.images.length) % car.images.length);
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 400 : -400, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 400 : -400, opacity: 0 }),
  };

  if (!car) return <div className="container py-20 text-center">{t('carDetails.carNotFound')}</div>;

  const handleBookingClick = () => {
    if (!user) {
      toast.info('Please login to book a car');
      login();
      return;
    }

    if (user && !profile) {
      toast.loading('Checking verification status...');
      return;
    }

    if (profile?.role === 'corporate_renter') {
      setShowCorporateBooking(true);
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the Terms & Conditions before booking');
      return;
    }

    if (!dateRange?.from || !dateRange?.to) {
      toast.error('Please select start and end dates');
      return;
    }

    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }

    setShowBookingFlow(true);
  };

  const days = dateRange?.from && dateRange?.to ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0;
  const totalAmount = days > 0 ? days * car.pricePerDay : 0;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    touchEndRef.current = null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEndRef.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (touchStartRef.current === null || touchEndRef.current === null) return;
    const distance = touchStartRef.current - touchEndRef.current;
    if (distance > 50 && car.images.length > 1) goNext();
    if (distance < -50 && car.images.length > 1) goPrev();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container pt-24 lg:pt-28">
        <Button
          variant="ghost"
          onClick={() => navigate('/vehicles', { state: { preselectedCategory: locationState?.fromCategory } })}
          className="mb-3 gap-2 hover:bg-primary/10 hover:text-primary rounded-xl font-bold"
        >
          <ArrowLeft size={20} />
          {t('carDetails.back')}
        </Button>

        {/* Vehicle Title */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight">
            {car.make} {car.model}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg">{car.year}</span>
            <Badge className="bg-primary text-white border-none px-3 py-1 text-xs font-bold uppercase tracking-wider">
              {car.type}
            </Badge>
          </div>
        </div>

        {/* Image + Booking Card Row */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-8">
          {/* Left: Image Gallery + Details */}
          <div className="min-w-0">
            <section className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-xl bg-gray-100" id="image-gallery">
              <div
                className="absolute inset-0"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.img
                    key={activeImage}
                    src={car.images[activeImage]}
                    alt={`${car.make} ${car.model} - View ${activeImage + 1}`}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    loading={activeImage === 0 ? 'eager' : 'lazy'}
                  />
                </AnimatePresence>

                {car.images.length > 1 && (
                  <>
                    <button
                      aria-label="Previous image"
                      onClick={goPrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all z-10"
                    >
                      <ArrowLeft size={18} aria-hidden="true" />
                    </button>
                    <button
                      aria-label="Next image"
                      onClick={goNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg flex items-center justify-center hover:bg-white transition-all z-10"
                    >
                      <ArrowRight size={18} aria-hidden="true" />
                    </button>
                  </>
                )}

                {car.images.length > 1 && (
                  <div className="absolute bottom-3 left-3 flex gap-2 z-10">
                    {car.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setDirection(idx > activeImage ? 1 : -1); setActiveImage(idx); }}
                        className={`w-14 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                          activeImage === idx ? 'border-blue-500 scale-110 shadow-lg' : 'border-white/70 hover:border-white'
                        }`}
                      >
                        <img src={img} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Details below image */}
            <div className="mt-6 space-y-10">
              {/* Quick Specs */}
              <section>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: <Users size={24} />, label: t('carDetails.seats'), value: `${car.seats}` },
                    { icon: <Gauge size={24} />, label: t('carDetails.transmission'), value: car.transmission },
                    { icon: <Fuel size={24} />, label: t('carDetails.fuelType'), value: car.fuelType },
                    { icon: <ShieldCheck size={24} />, label: t('carDetails.type'), value: car.type },
                  ].map((spec, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg border border-primary/10 hover:border-primary/30 transition-all">
                      <div className="text-primary mb-3">{spec.icon}</div>
                      <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{spec.label}</div>
                      <div className="text-base sm:text-lg font-bold mt-1">{spec.value}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Description */}
              <section>
                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-6">{t('carDetails.aboutThisCar')}</h2>
                <p className="text-muted-foreground leading-relaxed mb-8">{car.description}</p>

                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-6">{t('carDetails.features')}</h2>
                <div className="flex flex-wrap gap-2 mb-8">
                  {car.features.map((feature, idx) => (
                    <Badge key={idx} variant="secondary" className="px-4 py-2 text-sm font-bold uppercase tracking-wider">
                      {feature}
                    </Badge>
                  ))}
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-6">{t('carDetails.pickupLocation')}</h2>
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-primary/10 mb-8">
                  <div className="flex items-start gap-4">
                    <MapPin size={24} className="text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-lg">{car.location.address}</h3>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-6">{t('carDetails.reviews')}</h2>
                <div className="space-y-6">
                  {MOCK_REVIEWS.filter(r => r.carId === car.id).map((review, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-lg border border-primary/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {review.userName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold">{review.userName}</div>
                            <div className="text-sm text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {/* Right: Booking Card (Sticky) */}
          <div className="lg:col-span-1">
            <div className="relative">
              <Card className="sticky top-24 border-primary/10 shadow-2xl rounded-[2rem] overflow-visible">
              <div className="absolute -inset-0.5 bg-gradient-to-b from-primary/20 to-transparent rounded-[2rem] opacity-60 pointer-events-none" />
              <CardContent className="relative p-8 space-y-7 bg-card rounded-[2rem]">
                {/* Header */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 mb-3">
                    <CalendarIcon size={24} className="text-primary" />
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight">{t('carDetails.bookThisVehicle')}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{t('carDetails.selectDates')}</p>
                </div>

                <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

                  {/* Date Range Picker */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                      <CalendarIcon size={14} className="text-primary" />
                      Rental Period
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-semibold h-14 rounded-2xl border-2 hover:border-primary/50 transition-all text-base group">
                          <span className="flex items-center gap-3">
                            <CalendarIcon size={18} className="text-primary shrink-0" />
                            <span>
                              {dateRange?.from ? (
                                dateRange.to ? (
                                  <span className="font-bold">{format(dateRange.from, 'MMM d')} – {format(dateRange.to, 'MMM d, yyyy')}</span>
                                ) : (
                                  <span className="text-foreground">{format(dateRange.from, 'PPP')}</span>
                                )
                              ) : (
                                <span className="text-muted-foreground font-normal">Pick up date – Drop off date</span>
                              )}
                            </span>
                          </span>
                          {days > 0 && (
                            <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">{days} {days === 1 ? 'day' : 'days'}</span>
                          )}
                          {!dateRange?.from && <ChevronRight size={16} className="text-muted-foreground group-hover:translate-x-0.5 transition-transform" />}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3 rounded-2xl shadow-2xl" align="start">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={setDateRange}
                          disabled={(date) => date < new Date()}
                          numberOfMonths={2}
                          initialFocus
                          className="rounded-xl"
                        />
                        {dateRange?.from && (
                          <div className="flex items-center justify-between px-2 py-3 border-t mt-2">
                            <span className="text-xs text-muted-foreground">
                              {dateRange.to ? (
                                <span className="flex items-center gap-1">
                                  <CalendarIcon size={12} />
                                  {format(dateRange.from, 'MMM d')} → {format(dateRange.to, 'MMM d, yyyy')}
                                </span>
                              ) : (
                                'Select drop-off date'
                              )}
                            </span>
                            {dateRange?.from && !dateRange?.to && (
                              <span className="text-[10px] text-primary font-bold">Tap an end date</span>
                            )}
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                      <CreditCard size={14} className="text-primary" />
                      Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPayment(method.id)}
                          className={`relative flex flex-col items-center gap-2 p-4 border-2 rounded-2xl transition-all duration-200 ${
                            selectedPayment === method.id
                              ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 scale-[1.02]'
                              : 'border-border hover:border-primary/40 hover:bg-accent/30'
                          }`}
                        >
                          {selectedPayment === method.id && (
                            <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                              <CheckCircle2 size={14} className="text-white" />
                            </div>
                          )}
                          <img src={method.logo} alt={method.name} className="h-7 w-full object-contain" loading="lazy" />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${selectedPayment === method.id ? 'text-primary' : 'text-muted-foreground'}`}>
                            {method.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Summary */}
                  {days > 0 && (
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-5 rounded-2xl border border-primary/10 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">ETB {car.pricePerDay.toLocaleString()} × {days} {days === 1 ? 'day' : 'days'}</span>
                        <span className="font-semibold">ETB {(car.pricePerDay * days).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Insurance (ETB 100/day)</span>
                        <span className="font-medium">ETB {(days * 100).toLocaleString()}</span>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold">Total</span>
                        <span className="text-xl font-extrabold text-primary">ETB {totalAmount.toLocaleString()}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground text-center pt-1">
                        + ETB 10,000 security hold (refundable)
                      </p>
                    </div>
                  )}

                  {/* Terms & Conditions */}
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-accent/50 border border-border/50">
                    <Checkbox
                      id="terms"
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                      className="mt-0.5 h-5 w-5 rounded-lg data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label
                      htmlFor="terms"
                      className="text-sm leading-relaxed cursor-pointer select-none"
                    >
                      <span className="text-muted-foreground">{t('carDetails.agreeTerms')} </span>
                      <button
                        onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                        className="text-primary underline font-bold hover:text-primary/80 transition-colors"
                      >
                        {t('carDetails.termsConditions')}
                      </button>
                    </label>
                  </div>

                  {/* Book Button */}
                  <Button
                    className="w-full font-bold text-base h-14 rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 disabled:opacity-50 disabled:shadow-none"
                    onClick={handleBookingClick}
                    disabled={isBooking}
                  >
                    {isBooking ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        {t('carDetails.processing')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {t('carDetails.confirmBooking')}
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-green-500" />
                      Secure payment
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-green-500" />
                      Verified host
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck size={12} className="text-green-500" />
                      24/7 support
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Booking Bar */}
      <AnimatePresence>
        {showBookingBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/95 border-t border-primary/10 shadow-2xl lg:hidden"
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {days > 0 ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground truncate">{car.make} {car.model} · {days} {days === 1 ? 'day' : 'days'}</span>
                      <span className="text-lg font-extrabold text-primary">ETB {totalAmount.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{car.make} {car.model}</span>
                      <span className="text-sm font-bold">ETB {car.pricePerDay.toLocaleString()}<span className="text-muted-foreground font-normal">/day</span></span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleBookingClick}
                  className="h-12 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20 gap-2 shrink-0"
                >
                  {days > 0 ? t('carDetails.bookNowBtn') : 'Select Dates'}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking Flow Modal */}
      <Suspense fallback={null}>
        {showBookingFlow && dateRange?.from && dateRange?.to && selectedPayment && (
          <BookingFlowModal
            carId={car.id}
            startDate={dateRange.from}
            endDate={dateRange.to}
            totalAmount={totalAmount}
            paymentMethod={selectedPayment}
            paymentMethodName={paymentMethods.find(m => m.id === selectedPayment)?.name || selectedPayment}
            onClose={() => setShowBookingFlow(false)}
          />
        )}
      </Suspense>

      {/* Corporate Booking Modal */}
      <Suspense fallback={null}>
        {showCorporateBooking && (
          <CorporateBookingModal
            open={showCorporateBooking}
            onClose={() => setShowCorporateBooking(false)}
            car={{
              id: car.id,
              make: car.make,
              model: car.model,
              image: car.images?.[0] || undefined,
              pricePerDay: car.pricePerDay,
            }}
            startDate={dateRange?.from}
            endDate={dateRange?.to}
            totalAmount={totalAmount}
            paymentMethod={selectedPayment || undefined}
            paymentMethodName={selectedPayment ? paymentMethods.find(m => m.id === selectedPayment)?.name : undefined}
          />
        )}
      </Suspense>

      {/* Terms & Conditions Modal */}
      <Dialog open={showTermsModal} onOpenChange={setShowTermsModal}>
        <DialogContent className="max-h-[95vh] overflow-y-auto overflow-x-hidden p-8 sm:p-12 lg:p-20" style={{ maxWidth: '1600px', width: 'min(1600px, 95vw)' }}>
          <DialogHeader className="mb-8 flex flex-row items-start justify-between gap-6">
            <div>
              <DialogTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase text-primary">{t('carDetails.termsConditions')}</DialogTitle>
              <DialogDescription className="text-base sm:text-lg lg:text-xl mt-3 text-muted-foreground">
                Please read carefully before booking. By proceeding, you agree to all terms below.
              </DialogDescription>
            </div>
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                const el = document.getElementById('terms-print-content');
                if (!el) return;
                const win = window.open('', '_blank');
                if (!win) return;
                win.document.write(`
                  <html>
                    <head>
                      <title>{t('carDetails.termsConditions')}</title>
                      <style>
                        body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; color: #333; }
                        h1 { font-size: 24px; color: #593cfb; margin-bottom: 8px; }
                        h2 { font-size: 20px; color: #593cfb; margin-top: 32px; border-bottom: 2px solid #593cfb20; padding-bottom: 8px; }
                        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
                        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                        th { background: #593cfb10; font-weight: bold; }
                        .note { background: #fef9e7; padding: 16px; border-radius: 8px; border: 1px solid #f0d78c; }
                        @media print { body { padding: 20px; } }
                      </style>
                    </head>
                    <body>${el.innerHTML}</body>
                  </html>
                `);
                win.document.close();
                setTimeout(() => { win.print(); }, 500);
              }}
              className="flex-shrink-0 gap-2 text-sm font-bold uppercase tracking-wider"
            >
              <FileText size={16} />
              {t('carDetails.exportPdf')}
            </Button>
          </DialogHeader>
          <div id="terms-print-content" className="space-y-14 px-4 sm:px-2">
            {/* Introduction */}
            <div>
              <h4 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-3">1. Introduction</h4>

              <h4 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-3">2. Damage Policy &amp; Price List</h4>
              <div className="space-y-4 text-lg sm:text-xl mb-8">
                <p><strong className="text-foreground">Minor Damage:</strong> <span className="text-muted-foreground">Scratch, dent, broken mirror, small paint – ETB 5,000 – 20,000 (based on garage quote)</span></p>
                <p><strong className="text-foreground">Major Damage:</strong> <span className="text-muted-foreground">Accident, frame damage – Handled via insurance (user pays deductible ETB 5,000 – 15,000)</span></p>
                <p><strong className="text-foreground">Glass/Tires:</strong> <span className="text-muted-foreground">Not covered – User pays full replacement</span></p>
              </div>

              {/* Damage Price Table */}
              <div className="mb-8 overflow-x-auto rounded-2xl border-2 border-border">
                <table className="w-full border-collapse text-base sm:text-lg lg:text-xl">
                  <colgroup>
                    <col className="w-14 sm:w-20" />
                    <col />
                    <col />
                    <col />
                    <col />
                  </colgroup>
                  <thead>
                    <tr className="bg-primary/10">
                      <th className="text-left p-4 sm:p-5 lg:p-6 font-bold text-sm sm:text-base lg:text-lg uppercase tracking-wider">No.</th>
                      <th className="text-left p-4 sm:p-5 lg:p-6 font-bold text-sm sm:text-base lg:text-lg uppercase tracking-wider">Damage Type</th>
                      <th className="text-left p-4 sm:p-5 lg:p-6 font-bold text-sm sm:text-base lg:text-lg uppercase tracking-wider">Description</th>
                      <th className="text-left p-4 sm:p-5 lg:p-6 font-bold text-sm sm:text-base lg:text-lg uppercase tracking-wider">Fee (ETB)</th>
                      <th className="text-left p-4 sm:p-5 lg:p-6 font-bold text-sm sm:text-base lg:text-lg uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      ['1', 'Paint Scratch / Scuff', 'Small scratch on door/fender (up to 30cm)', '5,000 – 12,000', 'Professional repair'],
                      ['2', 'Small Dent / Ding', 'Parking dent, door ding (fist size or smaller)', '6,000 – 15,000', 'Paintless repair'],
                      ['3', 'Bumper Scuff / Crack', 'Rub marks or small crack on bumper', '8,000 – 18,000', 'Replace if severe'],
                      ['4', 'Interior Stain / Burn', 'Seat stain, cigarette burn, fabric tear', '3,000 – 10,000', 'Clean+repair'],
                      ['5', 'Wheel / Rim Scratch', 'Scratches on alloy wheel', '4,000 – 12,000 per wheel', 'Refinishing'],
                      ['6', 'Side Mirror Damage', 'Cracked or broken side mirror', '5,000 – 14,000', 'Per mirror'],
                      ['7', 'Headlight / Taillight', 'Cracked or broken lens', '6,000 – 15,000', 'Per light'],
                      ['8', 'Windshield Chip / Crack', 'Stone chip or crack less than 10cm', '4,000 – 10,000', 'Resin repair'],
                      ['9', 'Tyre Damage', 'Nail puncture or curb damage', '3,000 – 9,000 per tyre', 'Repair/replace'],
                      ['10', 'Missing Accessories', 'Hubcap, floor mat, charger, etc.', '1,500 – 6,000', 'Replacement'],
                      ['11', 'Heavy Soiling / Odor', 'Smoke, food smell, pet hair', '3,000 – 8,000', 'Deep cleaning'],
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-primary/5 transition-colors">
                        {row.map((cell, cellIdx) => (
                          <td key={cellIdx} className="p-4 sm:p-5 lg:p-6 text-base sm:text-lg lg:text-xl font-medium">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-6 sm:p-8 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-lg sm:text-xl font-medium text-yellow-800 leading-relaxed">
                  <strong>Important Notes:</strong> Only applies to minor damage. Major accidents handled via insurance.
                  Damage must be reported with photos. Final cost based on garage quotation.
                  Optional Zero-Damage Protection (ETB 100–400/day) reduces liability.
                </p>
              </div>
            </div>

            {/* Other Important Rules */}
            <div>
              <h4 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-3">3. Other Important Rules</h4>

              <h4 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight mb-6 text-primary border-b-2 border-primary/30 pb-3">4. Agreement &amp; Acceptance</h4>
              <p className="text-lg sm:text-xl leading-relaxed text-muted-foreground mb-6">
                By clicking "Confirm Booking", the user agrees that:
              </p>
              <div className="space-y-4">
                {[
                  'They have read and understood all terms',
                  'They accept all fees and policies',
                  'They agree to a legally binding contract',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 size={22} className="text-primary flex-shrink-0" />
                    <span className="text-lg sm:text-xl font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
