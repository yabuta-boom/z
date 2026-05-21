import React from 'react';
import { Star, Fuel, Users, Gauge, MapPin, ShieldCheck, ArrowRight, Zap, Droplets, Wind, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Car } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface CarCardProps {
  car: Car;
  onClick?: () => void;
}

export const CarCard: React.FC<CarCardProps> = ({ car, onClick }) => {
  const { t } = useLanguage();

  const getCategorySpecs = (car: Car) => {
    switch (car.type) {
      case 'Luxury':
        return [
          { icon: Zap, label: t('carDetails.seats'), value: `${car.seats}` },
          { icon: Gauge, label: t('carDetails.transmission'), value: car.transmission },
          { icon: Fuel, label: t('carDetails.fuelType'), value: car.fuelType }
        ];
      case 'Sedan':
        return [
          { icon: Droplets, label: t('carDetails.fuelType'), value: car.fuelType },
          { icon: Gauge, label: t('carDetails.transmission'), value: car.transmission },
          { icon: Users, label: t('carDetails.seats'), value: `${car.seats}` }
        ];
      case 'Trucks':
        return [
          { icon: Gauge, label: t('carDetails.transmission'), value: car.transmission },
          { icon: Fuel, label: t('carDetails.fuelType'), value: car.fuelType },
          { icon: Users, label: t('carDetails.seats'), value: `${car.seats}` }
        ];
      case 'Motorcycles':
        return [
          { icon: Zap, label: t('carDetails.year'), value: `${car.year}` },
          { icon: Fuel, label: t('carDetails.fuelType'), value: car.fuelType },
          { icon: Gauge, label: t('carDetails.transmission'), value: car.transmission }
        ];
      case 'Vans':
        return [
          { icon: Users, label: t('carDetails.seats'), value: `${car.seats} pax` },
          { icon: Gauge, label: t('carDetails.transmission'), value: car.transmission },
          { icon: Fuel, label: t('carDetails.fuelType'), value: car.fuelType }
        ];
      case 'Construction':
        return [
          { icon: Gauge, label: t('carDetails.year'), value: `${car.year}` },
          { icon: Fuel, label: t('carDetails.fuelType'), value: car.fuelType },
          { icon: Users, label: t('carDetails.seats'), value: `${car.seats}` }
        ];
      default:
        return [
          { icon: Gauge, label: t('carDetails.year'), value: `${car.year}` },
          { icon: Settings2, label: t('carDetails.transmission'), value: car.transmission },
          { icon: Fuel, label: t('carDetails.fuelType'), value: car.fuelType }
        ];
    }
  };

  const specs = getCategorySpecs(car);

  return (
    <div className="group h-full cursor-pointer" onClick={onClick}>
      <Card className="flex h-full flex-col overflow-hidden border-none bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_60px_rgba(89,60,251,0.1)] rounded-2xl transition-all duration-500 hover:-translate-y-1">
        <CardHeader className="relative p-0">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={car.images[0]}
              alt={`${car.make} ${car.model}`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          </div>
           
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Top Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge className="bg-primary text-white border-none px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-lg">
              {car.type}
            </Badge>
            {car.availability && (
              <Badge className="bg-green-500/90 text-white backdrop-blur-md border-none px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm">
                {t('dashboard.verified')}
              </Badge>
            )}
          </div>

          {/* Rating Badge */}
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold backdrop-blur-md shadow-sm">
              <Star size={14} className="fill-yellow-400 text-yellow-400" />
              <span>{car.rating || 'NEW'}</span>
            </div>
          </div>

          {/* Car Name Overlay */}
          <div className="absolute bottom-4 left-5 right-5">
            <h3 className="text-2xl font-bold tracking-tight uppercase leading-none text-white mb-1">
              {car.make} {car.model}
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/80">
              <MapPin size={12} className="text-primary" />
              <span>{car.location.city}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-6 pb-4">
          {/* Key Specs Grid */}
          <div className="grid grid-cols-3 gap-3 py-3 border-y border-gray-50 mb-3">
            {specs.map((spec, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl bg-gray-50/50 transition-colors group-hover:bg-primary/5">
                <spec.icon size={20} className="text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{spec.label}</span>
                <span className="text-sm font-bold">{spec.value}</span>
              </div>
            ))}
          </div>

          {/* Year & Details */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg">{car.year}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{car.fuelType} • {car.transmission}</span>
          </div>

          {/* Category-Specific Features */}
          <div className="flex flex-wrap gap-1.5">
            {(car.features || []).slice(0, 3).map((feature, idx) => (
              <span key={idx} className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-2 py-1 rounded-full">
                {feature}
              </span>
            ))}
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{t('carDetails.pricePerDay')}</span>
            <span className="text-2xl font-bold text-primary">ETB {car.pricePerDay.toLocaleString()}</span>
          </div>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className="rounded-xl bg-primary text-white font-bold uppercase tracking-wider text-xs px-6 h-12 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
          >
            {t('carDetails.bookNow')}
            <ArrowRight size={14} className="ml-2" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
