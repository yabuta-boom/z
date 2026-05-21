import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { SearchBar } from '../components/SearchBar';
import { SearchFilters } from '../components/SearchFilters';
import { CarCard } from '../components/CarCard';
import { MOCK_CARS } from '../constants';
import { getApprovedFleetCars, fleetToCarCard } from '../lib/fleetUtils';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';

export const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Tourism sub-filters
  const TOURISM_FILTERS = [
    { id: 'WithDriver', label: t('home.withDriver') },
    { id: 'WithoutDriver', label: t('home.withoutDriver') },
  ];

  const [activeFilter, setActiveFilter] = useState('Sedan');
  const [tourismFilter, setTourismFilter] = useState('all');
  const [searchLocation, setSearchLocation] = useState('');
  
  const ALL_MOCK_CARS = useMemo(() => [...MOCK_CARS, ...getApprovedFleetCars().map(fleetToCarCard)], []);

  const handleHeroSearch = (location: string) => {
    setSearchLocation(location);
    const resultsSection = document.getElementById('featured-cars');
    if (resultsSection) resultsSection.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredCars = useMemo(() => {
    let result = ALL_MOCK_CARS;
    
    // Apply filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'Tourism') {
        result = result.filter(car => car.type === 'WithDriver' || car.type === 'WithoutDriver');
        if (tourismFilter !== 'all') {
          result = result.filter(car => car.type === tourismFilter);
        }
      } else {
        result = result.filter(car => car.type.toLowerCase() === activeFilter.toLowerCase());
      }
    }
    
    // Apply search location
    if (searchLocation) {
      result = result.filter(car =>
        car.location.city.toLowerCase().includes(searchLocation.toLowerCase()) ||
        car.location.address.toLowerCase().includes(searchLocation.toLowerCase())
      );
    }
    
    return result.slice(0, 6);
  }, [ALL_MOCK_CARS, activeFilter, searchLocation]);

  return (
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
      <Hero />
      
      {/* Search/Filter Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-gray-50/50">
        <div className="page-container">
          <SearchBar onSearch={handleHeroSearch} />
        </div>
      </section>

      <main className="page-container flex-1 pb-16 pt-4" id="featured-cars">
        <div className="mb-12">
          <div className="flex flex-col items-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">{t('home.featuredCars')}</h2>
            <p className="text-muted-foreground mt-3 text-center max-w-2xl">
              {t('home.featuredSubtitle')}
            </p>
          </div>

          {/* Filters */}
          <div className="mb-8 space-y-4">
            <SearchFilters activeFilter={activeFilter} onFilterChange={(filter) => { setActiveFilter(filter); setTourismFilter('all'); }} />
            {activeFilter === 'Tourism' && (
              <div className="flex items-center justify-center gap-3">
                {TOURISM_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setTourismFilter(tourismFilter === filter.id ? 'all' : filter.id)}
                    className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
                      tourismFilter === filter.id
                        ? 'bg-primary text-white shadow-lg'
                        : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {searchLocation && (
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl bg-primary/5 p-4 sm:p-6 border border-primary/10">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary"><MapPin size={24} /></div>
                <div>
                  <h3 className="text-base font-bold tracking-tight uppercase">{t('home.showingResults')}</h3>
                  <p className="text-muted-foreground font-medium">{searchLocation}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSearchLocation('')}
                className="font-bold uppercase tracking-wider text-primary hover:bg-primary/10 text-xs">{t('home.clearSearch')}</Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredCars.map((car, index) => (
                <motion.div key={car.id} layout
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <CarCard car={car as any} onClick={() => navigate(`/cars/${car.id}`)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredCars.length === 0 && (
            <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
              <p className="text-base sm:text-lg font-bold uppercase tracking-tight text-muted-foreground">{t('home.noVehicles')}</p>
              <Button variant="link" onClick={() => { setActiveFilter('all'); setSearchLocation(''); }}
                className="text-primary font-bold uppercase tracking-wider hover:no-underline">
                {t('home.clearFilters')} <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-center mt-12">
          <Button size="lg"
            className="h-14 px-10 rounded-2xl text-base font-bold uppercase tracking-wider shadow-xl hover:scale-[1.02] transition-all"
            onClick={() => navigate('/vehicles')}>
            {t('home.viewFullFleet')} <ArrowRight className="ml-2" size={18} />
          </Button>
        </div>
      </main>
    </div>
  );
};
