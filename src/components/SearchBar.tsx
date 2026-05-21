import React, { useState, useRef, useEffect } from 'react';
import { Search, Navigation, Globe, History, Plane, Building2, Hotel, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '@/components/ui/input';
import { useLanguage } from '../contexts/LanguageContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  onSearch?: (location: string) => void;
}

export const SearchBar = ({ onSearch }: SearchBarProps) => {
  const { t } = useLanguage();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [location, setLocation] = useState('');
  const [dateMode, setDateMode] = useState<'dates' | 'months'>('dates');
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [untilDate, setUntilDate] = useState<Date | undefined>(undefined);
  const [monthDuration, setMonthDuration] = useState(1);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const locationCategories = [
    { id: 'current', label: 'Current location', icon: Navigation },
    { id: 'anywhere', label: 'Anywhere', icon: Globe },
    { id: 'history', label: 'History', icon: History },
    { id: 'airports', label: 'Airports', icon: Plane },
    { id: 'cities', label: 'Cities', icon: Building2 },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
  ];

  const handleSearch = () => {
    if (!location) {
      toast.error('Please select a location');
      setShowLocationDropdown(true);
      return;
    }
    toast.success(`Searching for cars in ${location}...`);
    if (onSearch) onSearch(location);
  };

  const handleLocationSelect = (item: any) => {
    setLocation(item.label);
    setShowLocationDropdown(false);
  };

  const getMonthRangePreview = () => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(addMonths(start, monthDuration - 1));
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 -mt-10 relative z-20">
      <div className="relative flex flex-col md:grid md:grid-cols-[1fr_1fr_1fr_auto] items-center rounded-2xl md:rounded-full bg-white p-4 md:p-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
        {/* Where Section */}
        <div className="relative group w-full md:h-full" ref={dropdownRef}>
          <div 
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowLocationDropdown(true); }}
            className="flex w-full flex-col justify-center px-4 md:px-8 py-3 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => setShowLocationDropdown(true)}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('vehiclesPage.where')}</span>
            <Input 
              placeholder={t('vehiclesPage.allLocations')} 
              name="location"
              autoComplete="street-address"
              value={location}
              onFocus={() => setShowLocationDropdown(true)}
              onChange={(e) => setLocation(e.target.value)}
              className="h-7 border-none bg-transparent p-0 focus-visible:ring-0 text-base font-semibold placeholder:text-gray-400"
            />
          </div>

          <AnimatePresence>
            {showLocationDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute left-0 right-0 md:left-0 md:right-auto top-full z-50 mt-4 w-full md:w-[450px] overflow-hidden rounded-[24px] border border-gray-100 bg-white p-4 shadow-2xl"
              >
                <div className="grid grid-cols-2 gap-2">
                  {locationCategories.map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => handleLocationSelect(item)}
                      className="flex items-center gap-4 rounded-xl px-4 py-4 text-left transition-all hover:bg-gray-50 group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                        <item.icon size={20} aria-hidden="true" />
                      </div>
                      <span className="text-sm font-bold text-gray-700 group-hover:text-primary transition-colors">{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Date/Month Picker Section */}
        <Popover>
          <PopoverTrigger className="md:col-span-2 h-full w-full">
            <div className="grid grid-cols-2 h-full items-center">
              {/* From Section */}
              <div className="flex h-full flex-col justify-center px-4 md:px-8 py-3 rounded-full hover:bg-gray-50 transition-colors md:border-l border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('carDetails.startDate')}</span>
                <span className="text-base font-semibold text-gray-900">
                  {dateMode === 'dates' 
                    ? (fromDate ? format(fromDate, 'MMM d') : 'Add dates')
                    : format(new Date(), 'MMM d')}
                </span>
              </div>

              {/* Until Section */}
              <div className="flex h-full flex-col justify-center px-4 md:px-8 py-3 rounded-full hover:bg-gray-50 transition-colors border-l border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('carDetails.endDate')}</span>
                <span className="text-base font-semibold text-gray-900">
                  {dateMode === 'dates'
                    ? (untilDate ? format(untilDate, 'MMM d') : 'Add dates')
                    : format(addMonths(new Date(), monthDuration), 'MMM d')}
                </span>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[90vw] max-w-[750px] p-0 rounded-[24px] overflow-hidden shadow-2xl border-gray-100" align="center">
            <div className="bg-white p-6">
              <div className="mb-8 flex justify-center">
                <div className="flex rounded-full bg-gray-100 p-1">
                  <button
                    onClick={() => setDateMode('dates')}
                    className={cn(
                      "px-8 py-2 rounded-full text-sm font-bold transition-all",
                      dateMode === 'dates' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    Dates
                  </button>
                  <button
                    onClick={() => setDateMode('months')}
                    className={cn(
                      "px-8 py-2 rounded-full text-sm font-bold transition-all",
                      dateMode === 'months' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    Months
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {dateMode === 'dates' ? (
                  <motion.div
                    key="dates"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Calendar
                      mode="range"
                      selected={{ from: fromDate, to: untilDate }}
                      onSelect={(range) => {
                        setFromDate(range?.from);
                        setUntilDate(range?.to);
                      }}
                      numberOfMonths={2}
                      className="rounded-none border-none"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="months"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="w-[500px] py-10 text-center"
                  >
                    <div className="mb-8">
                      <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Select duration</span>
                      <div className="mt-6 flex items-center justify-center gap-8">
                        <button 
                          aria-label="Decrease duration"
                          onClick={() => setMonthDuration(Math.max(1, monthDuration - 1))}
                          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 hover:border-primary hover:text-primary transition-all"
                        >
                          <Minus size={20} aria-hidden="true" />
                        </button>
                        <div className="flex flex-col items-center min-w-[120px]">
                          <span className="text-5xl font-bold text-gray-900">{monthDuration}</span>
                          <span className="text-sm font-bold text-gray-500 uppercase tracking-tight">Months</span>
                        </div>
                        <button 
                          aria-label="Increase duration"
                          onClick={() => setMonthDuration(Math.min(12, monthDuration + 1))}
                          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-200 hover:border-primary hover:text-primary transition-all"
                        >
                          <Plus size={20} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-indigo-50 p-4 border border-primary/20">
                      <span className="text-sm font-bold text-primary">{getMonthRangePreview()}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </PopoverContent>
        </Popover>

        {/* Search Button */}
        <div className="md:p-1 md:border-l border-gray-100 md:mt-0 mt-3 w-full md:w-auto">
          <button 
            onClick={handleSearch}
            className="flex h-14 w-full md:w-14 items-center justify-center rounded-2xl md:rounded-full bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-105 transition-all active:scale-95 gap-2 md:gap-0 px-6 md:px-0"
          >
            <Search size={24} strokeWidth={3} aria-hidden="true" />
            <span className="md:hidden font-bold uppercase tracking-widest text-sm">{t('hero.searchButton')}</span>
            <span className="sr-only">{t('hero.searchButton')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
