import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useLanguage } from '../contexts/LanguageContext';

interface SearchFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export const SearchFilters = ({ activeFilter, onFilterChange }: SearchFiltersProps) => {
  const { t } = useLanguage();
  const filters = [
    { id: 'all', label: t('searchFilters.allCars') },
    { id: 'Sedan', label: t('searchFilters.sedan') },
    { id: 'Luxury', label: t('searchFilters.luxury') },
    { id: 'Vans', label: t('searchFilters.vans') },
    { id: 'Motorcycles', label: t('searchFilters.motorcycles') },
    { id: 'Trucks', label: t('searchFilters.trucks') },
    { id: 'Construction', label: t('searchFilters.construction') },
    { id: 'Tourism', label: t('searchFilters.tourism') },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
      {filters.map((filter) => (
        <motion.button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "px-4 py-2 md:px-6 md:py-2.5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300",
            activeFilter === filter.id
              ? "bg-primary text-white shadow-lg shadow-primary/20"
              : "bg-white text-gray-600 border border-gray-200 hover:border-primary/30 hover:text-primary hover:bg-primary/5"
          )}
        >
          {filter.label}
        </motion.button>
      ))}
    </div>
  );
};
