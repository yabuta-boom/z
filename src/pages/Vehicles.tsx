import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Sparkles, Search, ArrowRight, Car, Truck, Gem, Construction, Bus, Bike, UserCheck, SlidersHorizontal, X, Plane, Building2, Hotel } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { MOCK_CARS } from '../constants';
import { getApprovedFleetCars, fleetToCarCard } from '../lib/fleetUtils';
import { CarCard } from '../components/CarCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SmartGPSRoad } from '@/components/SmartGPSRoad';

  const categoryIcons: Record<string, React.ReactNode> = {
    'Sedan': <Car className="h-5 w-5" />,
    'Trucks': <Truck className="h-5 w-5" />,
    'Luxury': <Gem className="h-5 w-5" />,
    'Construction': <Construction className="h-5 w-5" />,
    'Vans': <Bus className="h-5 w-5" />,
    'Motorcycles': <Bike className="h-5 w-5" />,
    'WithDriver': <UserCheck className="h-5 w-5" />,
    'Tourism': <Plane className="h-5 w-5" />,
  };

  const categories = [
    { id: 'Sedan', title: 'Sedan', image: 'https://global-img.bitauto.com/usercenter/yhzx/20250408/769/w1200_yichecar_409321976975342.jpg.webp' },
    { id: 'Trucks', title: 'Trucks', image: 'https://cms-blog-uploads-354387082548.s3.us-west-2.amazonaws.com/uploads/2024/7/6695a6e11575e.jpg' },
    { id: 'Luxury', title: 'Luxury', image: 'https://media.drivingelectric.com/image/private/s--X-WVjvBW--/f_auto,t_content-image-full-desktop@1/v1698686429/drivingelectric/2023-10/Tesla%20Model%203%20facelift%201_awovfc.jpg' },
    { id: 'Construction', title: 'Construction', image: 'https://www.howogroup.com/data/attachment/202305/07/60ab45699da2c9a6a29f15af5a822770.jpg' },
    { id: 'Vans', title: 'Vans', image: 'https://imgcdn.zigwheels.ph/large/gallery/exterior/12/1942/hyundai-grand-starex-front-side-view-134684.jpg' },
    { id: 'Motorcycles', title: 'Motorcycles', image: 'https://imgcdn.zigwheels.ph/medium/gallery/exterior/86/1832/yamaha-mio-aerox-31196.jpg' },
    { id: 'WithDriver', title: 'With Driver', image: 'https://pdtm.mt/wp-content/uploads/2020/11/Chauffeur-Driver-Customer-Care-Course-1024x683.jpg' },
    { id: 'Tourism', title: 'Tourism', image: 'https://rwandaecocompany.com/wp-content/uploads/2021/09/safari-car.jpg' }
  ];

  const tourismFilters = [
    { id: 'WithDriver', label: 'With Driver' },
    { id: 'WithoutDriver', label: 'Without Driver' },
  ];

export const Vehicles = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const catTitles: Record<string, string> = {
    Sedan: t('vehiclesPage.sedan'),
    Trucks: t('vehiclesPage.trucks'),
    Luxury: t('vehiclesPage.luxury'),
    Construction: t('vehiclesPage.construction'),
    Vans: t('vehiclesPage.vans'),
    Motorcycles: t('vehiclesPage.motorcycles'),
    WithDriver: t('vehiclesPage.subDriver'),
    Tourism: t('vehiclesPage.tourism'),
  };
  const preselectedCategory = (location.state as any)?.preselectedCategory ?? null;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(preselectedCategory);
  const [tourismFilter, setTourismFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedFuel, setSelectedFuel] = useState('All');
  const [selectedTransmission, setSelectedTransmission] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');

  const allCars = useMemo(() => [...MOCK_CARS, ...getApprovedFleetCars().map(fleetToCarCard)], []);
  const brands = ['All', ...Array.from(new Set(allCars.map(c => c.make)))];
  const fuelTypes = ['All', ...Array.from(new Set(allCars.map(c => c.fuelType)))];
  const transmissions = ['All', ...Array.from(new Set(allCars.map(c => c.transmission)))];
  const years = ['All', ...Array.from(new Set(allCars.map(c => c.year.toString()))).sort((a, b) => Number(b) - Number(a))];

  const filteredCars = useMemo(() => {
    let cars = selectedCategory ? allCars.filter(car => {
      if (selectedCategory === 'Tourism') {
        return car.type === 'WithDriver' || car.type === 'WithoutDriver';
      }
      return car.type === selectedCategory;
    }) : [];

    // Apply tourism sub-filter
    if (selectedCategory === 'Tourism' && tourismFilter !== 'all') {
      cars = cars.filter(car => car.type === tourismFilter);
    }
    cars = cars.filter(car => car.pricePerDay >= priceRange[0] && car.pricePerDay <= priceRange[1]);
    if (selectedBrand !== 'All') cars = cars.filter(car => car.make === selectedBrand);
    if (selectedFuel !== 'All') cars = cars.filter(car => car.fuelType === selectedFuel);
    if (selectedTransmission !== 'All') cars = cars.filter(car => car.transmission === selectedTransmission);
    if (selectedYear !== 'All') cars = cars.filter(car => car.year.toString() === selectedYear);
    if (locationFilter !== 'All') {
      switch (locationFilter) {
        case 'Airport': cars = cars.filter(car => car.isAirportAvailable); break;
        case 'City Center': cars = cars.filter(car => car.isCityCenter); break;
        case 'Hotel': cars = cars.filter(car => car.isNearby); break;
      }
    }
    return cars.slice(0, 6);
  }, [selectedCategory, priceRange, selectedBrand, selectedFuel, selectedTransmission, selectedYear, locationFilter]);

  const clearAllFilters = () => {
    setPriceRange([0, 100000]);
    setSelectedBrand('All');
    setSelectedFuel('All');
    setSelectedTransmission('All');
    setSelectedYear('All');
    setLocationFilter('All');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full overflow-hidden bg-[#050520] page-top-offset">
        <div className="absolute inset-0">
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity }} className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-500/30 blur-[120px]" />
          <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity }} className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-500/30 blur-[120px]" />
        </div>
        <SmartGPSRoad className="absolute inset-0 opacity-40" />
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.h2 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-5xl sm:text-7xl md:text-9xl font-bold mb-2 text-white tracking-tight bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
            ZOE
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-xs text-primary font-bold tracking-wider uppercase">
            Premium Car Rental
          </motion.p>
          <motion.div initial={{ width: 0 }} animate={{ width: "8rem" }} transition={{ delay: 1 }} className="h-1 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mt-6" />
        </div>
      </section>

      <main className="page-container py-12">
        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <motion.div key="categories" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="mb-12 text-center">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">{t('vehiclesPage.discoverExcellence')}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase">{t('vehiclesPage.browseOurFleet')}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((cat, idx) => (
                  <motion.div key={cat.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }} onClick={() => setSelectedCategory(cat.id)} className="group cursor-pointer">
                    <div className="relative h-60 sm:h-80 overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)] transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/20 hover:-translate-y-1">
                      <div className="absolute inset-0">
                        <img src={cat.image} alt={catTitles[cat.id]} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
                      </div>
                      <div className="relative z-10 flex h-full flex-col justify-end p-6">
                        <div className="mb-4 h-12 w-12 rounded-xl bg-primary/90 backdrop-blur-sm flex items-center justify-center text-white shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform duration-300">
                          {categoryIcons[cat.id]}
                        </div>
                          <h3 className="text-xl font-bold uppercase tracking-tight text-white mb-2">{catTitles[cat.id]}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">{t('vehiclesPage.explore')}</span>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:translate-x-1">
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Tourism Sub-Filters */}
              {selectedCategory === 'Tourism' && (
                <div className="flex items-center justify-center gap-3 mb-8">
                  {tourismFilters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setTourismFilter(tourismFilter === filter.id ? 'all' : filter.id)}
                      className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
                        tourismFilter === filter.id
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/30'
                      }`}
                    >
                      {t(filter.id === 'WithDriver' ? 'vehiclesPage.subDriver' : 'vehiclesPage.subWithoutDriver')}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="cars-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Top Bar with Back Button */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
                <Button variant="outline" onClick={() => { setSelectedCategory(null); setTourismFilter('all'); }} className="group flex items-center gap-2 px-4 sm:px-6 h-10 sm:h-12 rounded-xl sm:rounded-2xl border-primary/10 bg-white text-[10px] sm:text-sm font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all duration-500">
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 rotate-180 transition-transform group-hover:-translate-x-1.5" />
                  {t('vehiclesPage.backToCategories')}
                </Button>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border-primary/10 h-9 sm:h-12 px-3 sm:px-6 font-bold uppercase tracking-widest text-[10px] sm:text-xs hover:border-primary/30">
                    <SlidersHorizontal size={14} className="sm:hidden" />
                    <SlidersHorizontal size={16} className="hidden sm:block" />
                    {t('vehiclesPage.filters')}
                    {(selectedBrand !== 'All' || selectedFuel !== 'All' || selectedTransmission !== 'All' || selectedYear !== 'All' || locationFilter !== 'All' || priceRange[0] > 0 || priceRange[1] < 100000) && (
                      <span className="ml-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </Button>
                  <div className="text-center">
                    <p className="text-[11px] font-bold text-primary uppercase tracking-wider">{t('vehiclesPage.fleetOverview')}</p>
                    <p className="text-base font-bold uppercase tracking-tight">{filteredCars.length} Vehicles</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-6 lg:gap-10">
                {/* Sidebar - Category Navigation */}
                <div className="hidden lg:block w-48 xl:w-52 flex-shrink-0">
                  <div className="sticky top-24 bg-white rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-primary/5">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-primary mb-4 px-1">{t('vehiclesPage.categories')}</h3>
                    <div className="space-y-1">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                            selectedCategory === cat.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'hover:bg-primary/5 text-muted-foreground hover:text-primary'
                          }`}
                        >
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${selectedCategory === cat.id ? 'bg-white/20' : 'bg-primary/10'}`}>
                            {categoryIcons[cat.id]}
                          </div>
                          <span className="text-[11px] font-bold uppercase tracking-wider leading-tight">{catTitles[cat.id]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                  {/* Filter Panel */}
                  <AnimatePresence>
                    {showFilters && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="bg-white p-6 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-primary/5 mb-8">
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">{t('vehiclesPage.filters')}</h3>
                            <button onClick={clearAllFilters} className="text-xs font-bold text-muted-foreground hover:text-primary flex items-center gap-1">
                              <X size={14} /> {t('vehiclesPage.clearAll')}
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('vehiclesPage.brand')}</label>
                              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                                <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs uppercase">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {brands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('vehiclesPage.fuel')}</label>
                              <Select value={selectedFuel} onValueChange={setSelectedFuel}>
                                <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs uppercase">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fuelTypes.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('vehiclesPage.transmission')}</label>
                              <Select value={selectedTransmission} onValueChange={setSelectedTransmission}>
                                <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs uppercase">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {transmissions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('vehiclesPage.year')}</label>
                              <Select value={selectedYear} onValueChange={setSelectedYear}>
                                <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs uppercase">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('vehiclesPage.where')}</label>
                              <Select value={locationFilter} onValueChange={setLocationFilter}>
                                <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs uppercase">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                  <SelectItem value="All">{t('vehiclesPage.allLocations')}</SelectItem>
                  <SelectItem value="Airport"><div className="flex items-center gap-2"><Plane size={14} /> {t('vehiclesPage.airport')}</div></SelectItem>
                  <SelectItem value="City Center"><div className="flex items-center gap-2"><Building2 size={14} /> {t('vehiclesPage.cityCenter')}</div></SelectItem>
                  <SelectItem value="Hotel"><div className="flex items-center gap-2"><Hotel size={14} /> {t('vehiclesPage.hotel')}</div></SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t('vehiclesPage.price')}</label>
                              <div className="flex items-center gap-2">
                                <Input type="number" placeholder={t('vehiclesPage.min')} value={priceRange[0] || ''} onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])} className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs" />
                                <span className="text-muted-foreground font-bold">-</span>
                                <Input type="number" placeholder={t('vehiclesPage.max')} value={priceRange[1] === 100000 ? '' : priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 100000])} className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Responsive Car Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
                    {filteredCars.map((car, idx) => (
                      <motion.div key={car.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                        <CarCard car={car} onClick={() => navigate(`/cars/${car.id}`, { state: { fromCategory: selectedCategory } })} />
                      </motion.div>
                    ))}
                  </div>

                  {filteredCars.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="mb-6 rounded-full bg-muted p-6">
                        <Search className="h-12 w-12 text-muted-foreground opacity-20" />
                      </div>
                      <h3 className="text-2xl font-bold uppercase tracking-tight">{t('vehiclesPage.noVehicles')}</h3>
                      <p className="text-muted-foreground mt-2">{t('vehiclesPage.noVehiclesDesc')}</p>
                      <Button onClick={clearAllFilters} className="mt-8 bg-primary text-white hover:bg-primary/90">
                        {t('vehiclesPage.clearFilters')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
