import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '@/components/ui/button';

export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen w-full bg-background overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/30 blur-[300px]"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[5%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[250px]"
        />
      </div>

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: [
            'linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
            'linear-gradient(0deg, rgba(59,130,246,0.3) 1px, transparent 1px)'
          ].join(', '),
          backgroundSize: '90px 90px'
        }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: `${60 + Math.random() * 35}%`, y: `${Math.random() * 100}%`, opacity: 0, scale: Math.random() * 0.5 + 0.3 }}
            animate={{ y: [`${Math.random() * 100}%`, `${-10 + Math.random() * -20}%`], opacity: [0, 0.4, 0.6, 0.4, 0], x: [`${60 + Math.random() * 35}%`, `${55 + Math.random() * 40}%`] }}
            transition={{ duration: 12 + Math.random() * 18, repeat: Infinity, delay: Math.random() * 15, ease: "linear" }}
            className="absolute rounded-full bg-blue-400"
            style={{ width: `${2 + Math.random() * 4}px`, height: `${2 + Math.random() * 4}px`, filter: 'blur(0.5px)' }}
          />
        ))}
      </div>

      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center pt-24 pb-16 w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-center lg:gap-12 w-full max-w-[90rem] mx-auto">
          {/* Left Column - Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="pt-20 lg:pt-0"
          >
            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 mb-6"
            >
              <div className="h-[1px] w-10 bg-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary font-body-sans">
                {t('hero.subtitle')}
              </span>
            </motion.div>

            {/* Main Heading */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="font-heading-serif text-foreground leading-[0.88] mb-5">
                <span className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6rem] font-black block tracking-[-0.04em]">
                  ZOE
                </span>
                <span className="text-2xl sm:text-3xl md:text-4xl lg:text-[3rem] xl:text-[3.5rem] font-bold block tracking-[-0.02em] text-primary mt-1.5">
                  CAR RENTAL
                </span>
              </h1>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed max-w-md mb-8 font-body-sans"
            >
              {t('hero.description')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-3 mb-10"
            >
              <Button
                size="lg"
                className="group h-12 px-8 rounded-none bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-500 ease-out font-body-sans"
                onClick={() => navigate('/vehicles')}
              >
                <span className="flex items-center">
                  {t('home.exploreFleet')}
                  <ArrowRight size={15} className="ml-2 transition-transform duration-500 group-hover:translate-x-1" />
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 rounded-none border border-primary/30 text-primary hover:bg-primary/10 text-[11px] font-bold uppercase tracking-[0.18em] transition-all duration-500 font-body-sans"
                onClick={() => navigate('/host')}
              >
                {t('nav.listCar')}
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="border-t border-primary/15 pt-5">
                <div className="grid grid-cols-3 gap-4 sm:gap-8">
                  {[
                    { label: t('home.premiumFleet'), value: '500+' },
                    { label: t('home.verifiedHosts'), value: '200+' },
                    { label: t('home.support'), value: '24/7' },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.65 + i * 0.1, duration: 0.5 }}
                    >
                      <div className="flex flex-col">
                        <span className="text-2xl sm:text-3xl font-bold text-primary font-heading-serif tracking-tight">
                          {stat.value}
                        </span>
                        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 mt-0.5 font-body-sans">
                          {stat.label}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Car Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden lg:flex items-center justify-center pl-4"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full"
            >
              {/* Glow behind car */}
              <div className="absolute -inset-16 rounded-[3rem] bg-gradient-to-br from-primary/10 via-transparent to-transparent blur-[80px]" />

              {/* Image wrapper */}
              <div className="relative rounded-[2rem] overflow-hidden border border-primary/15 shadow-[0_0_80px_rgba(59,130,246,0.08)]">
                <img
                  src="https://i.pinimg.com/736x/0f/65/46/0f6546920e3699e29426dd4689ee3c38.jpg"
                  alt="Dodge Challenger Hellcat"
                  className="w-full h-[520px] object-cover scale-[1.02] transition-transform duration-[2s] hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background/30" />
                <div className="absolute top-6 left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              </div>

              {/* Bottom glow line */}
              <motion.div
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-3 left-16 right-16 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
              />

              {/* Corner accents */}
              <div className="absolute -top-2.5 -left-2.5 w-12 h-12 border-t-2 border-l-2 border-primary/40 rounded-tl-lg" />
              <div className="absolute -bottom-2.5 -right-2.5 w-12 h-12 border-b-2 border-r-2 border-primary/40 rounded-br-lg" />
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 1.2, type: "spring", stiffness: 180, damping: 14, mass: 0.8 }}
              className="absolute -top-2 -right-2 z-20"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-primary/30 blur-xl animate-pulse" />
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary via-blue-500 to-blue-700 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)]">
                  <div className="flex flex-col items-center">
                    <span className="text-[18px] font-black leading-none text-primary-foreground font-heading-serif">2023</span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-primary-foreground/70 mt-1 font-body-sans">Hellcat</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
