import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { Shield, Zap, Heart, Users, MapPin, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Car } from 'lucide-react';

export const About = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full overflow-hidden bg-primary text-primary-foreground page-top-offset">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&q=80&w=2000" 
            alt="Addis Ababa" 
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]"
          >
            {t('about.heroTitle')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl text-base sm:text-lg font-medium opacity-90"
          >
            {t('about.heroDesc')}
          </motion.p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="page-container py-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold tracking-tight">{t('about.mission')}</h2>
            <p className="mb-4 sm:mb-6 text-base leading-relaxed text-muted-foreground">
              {t('about.missionText1')}
            </p>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t('about.missionText2')}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-3xl bg-primary/10 p-8 flex flex-col items-center justify-center text-center">
                <Users size={40} className="mb-4 text-primary" />
                <h4 className="font-bold">10k+ {t('about.users')}</h4>
              </div>
              <div className="aspect-square overflow-hidden rounded-3xl bg-accent p-8 flex flex-col items-center justify-center text-center">
                <img src="/images/zoelogo.png" alt="Zoe Car Rental" className="h-10 w-auto mb-4" />
                <h4 className="font-bold">500+ {t('about.cars')}</h4>
              </div>
            </div>
            <div className="mt-8 space-y-4">
              <div className="aspect-square overflow-hidden rounded-3xl bg-muted p-8 flex flex-col items-center justify-center text-center">
                <MapPin size={40} className="mb-4 text-primary" />
                <h4 className="font-bold">12 {t('about.cities')}</h4>
              </div>
              <div className="aspect-square overflow-hidden rounded-3xl bg-primary/20 p-8 flex flex-col items-center justify-center text-center">
                <Award size={40} className="mb-4 text-primary" />
                <h4 className="font-bold">{t('about.topRated')}</h4>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-muted/30 py-24">
        <div className="page-container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-2xl sm:text-3xl font-bold tracking-tight">{t('about.values')}</h2>
            <p className="text-base text-muted-foreground">{t('about.valuesSub')}</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                icon: Shield,
                title: t('about.trustSafety'),
                description: t('about.trustSafetyDesc')
              },
              {
                icon: Zap,
                title: t('about.innovation'),
                description: t('about.innovationDesc')
              },
              {
                icon: Heart,
                title: t('about.community'),
                description: t('about.communityDesc')
              }
            ].map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-none shadow-lg">
                  <CardContent className="flex flex-col items-center p-10 text-center">
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <value.icon size={32} />
                    </div>
                    <h3 className="mb-4 text-xl font-bold">{value.title}</h3>
                    <p className="font-medium text-muted-foreground leading-relaxed">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
