import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Globe, MessageSquare, Camera, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white pt-24 pb-12 border-t border-gray-100">
      <div className="page-container">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-4 flex flex-col gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src="/images/zoelogo.png" 
                alt="Zoe Car Rental"
                className="h-11 w-auto transition-transform duration-300 group-hover:scale-105"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-foreground leading-none">ZOE</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t('footer.tagline')}</span>
              </div>
            </Link>
            <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-sm">
              {t('footer.description')}
            </p>
            <div className="flex items-center gap-3">
              {[{ icon: Globe, label: 'Website' }, { icon: MessageSquare, label: 'Chat' }, { icon: Camera, label: 'Instagram' }].map(({ icon: Icon, label }, idx) => (
                <a 
                  key={idx}
                  href="#" 
                  aria-label={label}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm"
                >
                  <Icon size={18} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col gap-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">{t('footer.links')}</h4>
            <div className="flex flex-col gap-3 text-sm font-medium text-muted-foreground">
              <Link to="/vehicles" className="hover:text-primary transition-colors">{t('nav.fleet')}</Link>
              <Link to="/host" className="hover:text-primary transition-colors">{t('nav.listCar')}</Link>
              <Link to="/about" className="hover:text-primary transition-colors">{t('nav.about')}</Link>
              <Link to="/privacy" className="hover:text-primary transition-colors">{t('footer.privacyPolicy')}</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">{t('footer.termsOfService')}</Link>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col gap-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">{t('footer.contact')}</h4>
            <div className="flex flex-col gap-5 text-sm font-medium text-muted-foreground">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10"><MapPin size={16} aria-hidden="true" /></div>
                <span className="leading-relaxed">{t('footer.address')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10"><Phone size={16} aria-hidden="true" /></div>
                <span>{t('footer.phone')}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-primary/5 text-primary border border-primary/10"><Mail size={16} aria-hidden="true" /></div>
                <span>{t('footer.contactEmail')}</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col gap-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">{t('footer.newsletter')}</h4>
            <p className="text-sm font-medium text-muted-foreground">{t('footer.newsletterDesc')}</p>
            <div className="flex flex-col gap-3">
              <input 
                type="email" 
                name="email"
                autoComplete="email"
                placeholder={t('footer.emailPlaceholder')} 
                className="w-full h-12 rounded-xl border-2 border-gray-50 bg-gray-50 px-5 text-sm font-medium focus:outline-none focus:border-primary/20 focus:bg-white transition-all" 
              />
              <button className="w-full h-12 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-wider shadow-2xl shadow-indigo-200 hover:bg-primary/90 transition-all active:scale-95">
                {t('footer.subscribeNow')}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <p>{t('footer.copyright')}</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-primary transition-colors">{t('footer.instagram')}</a>
            <a href="#" className="hover:text-primary transition-colors">{t('footer.twitter')}</a>
            <a href="#" className="hover:text-primary transition-colors">{t('footer.facebook')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
