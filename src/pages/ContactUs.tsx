import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Phone, Mail, MapPin, Clock, Send, CheckCircle2, Loader2,
  MessageSquare, ChevronDown, ChevronUp, Globe, Camera, ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const FAQ_ITEMS = [
  {
    q: 'How do I book a car on Zoe?',
    a: 'Simply browse our fleet, select your desired vehicle, choose your rental dates, and proceed with the booking. You\'ll need to create an account and verify your identity before completing the reservation.'
  },
  {
    q: 'What documents do I need to rent a car?',
    a: 'You need a valid National ID (Fayda) or passport, a valid Ethiopian or international driving license, and a phone number for verification.'
  },
  {
    q: 'Can I cancel my booking?',
    a: 'Yes, cancellations can be made up to 24 hours before the rental start date for a full refund. Late cancellations may incur a fee.'
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept Telebirr, bank transfers, and cash payments. All major Ethiopian payment methods are supported.'
  },
  {
    q: 'How does GPS tracking work?',
    a: 'All our vehicles come with real-time GPS tracking. Renters and hosts can monitor vehicle location, speed, and route history through the dashboard.'
  },
  {
    q: 'Is insurance included with the rental?',
    a: 'Yes, all rentals include comprehensive insurance coverage. However, the renter is liable for the insurance deductible (ETB 10,000) in case of an at-fault accident.'
  }
];

const ContactUs = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success('Message sent successfully! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
  };

  const contactInfo = [
    { icon: Phone, title: t('contact.phone'), value: '+251 911 123 456', sub: 'Mon-Sat, 8AM-8PM' },
    { icon: Mail, title: t('contact.email'), value: 'hello@zoecarrental.com', sub: 'We reply within 24hrs' },
    { icon: MapPin, title: t('contact.office'), value: 'Bole, Addis Ababa', sub: 'Ethiopia' },
    { icon: Clock, title: t('contact.hours'), value: 'Mon-Sat: 8AM - 8PM', sub: 'Sun: Closed' },
  ];

  return (
    <div className="flex flex-col">
      <section className="relative h-[55vh] w-full overflow-hidden bg-gradient-to-br bg-primary text-white page-top-offset">
        <div className="absolute inset-0 z-0 opacity-15">
          <img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=2000" alt="Premium car" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        </div>
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-primary/80 to-transparent" />
        <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-md ring-1 ring-white/20">
              <MessageSquare size={36} className="text-white" aria-hidden="true" />
            </div>
            <h1 className="mb-6 text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">{t('contact.heroTitle')}</h1>
            <p className="mx-auto max-w-xl text-sm sm:text-lg font-medium text-white/80">
              {t('contact.heroDesc')}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="page-container -mt-16 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          {contactInfo.map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full border-none shadow-xl bg-white">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <item.icon size={24} />
                  </div>
                  <h3 className="mb-1 text-xs font-bold text-gray-500 uppercase tracking-wider">{item.title}</h3>
                  <p className="font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="page-container py-24">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">{t('contact.sendMessage')}</h2>
            <h3 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold tracking-tight">{t('contact.startConversation')}</h3>
            <p className="mb-6 sm:mb-8 text-sm sm:text-base text-muted-foreground leading-relaxed">
              {t('contact.formDesc')}
            </p>

            {submitted ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-2xl bg-green-50 border border-green-200 p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"><CheckCircle2 size={32} className="text-green-600" /></div>
                <h4 className="text-xl font-bold text-green-800 mb-2">{t('contact.messageSent')}</h4>
                <p className="text-green-600">{t('contact.messageSentDesc')}</p>
                <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>{t('contact.sendAnother')}</Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('contact.fullName')}</label>
                    <Input required name="name" autoComplete="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder={t('contact.namePlaceholder')} className="h-12 rounded-xl border-gray-200 bg-gray-50 px-5" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('contact.emailLabel')}</label>
                    <Input required type="email" name="email" autoComplete="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder={t('contact.emailPlaceholder')} className="h-14 rounded-2xl border-gray-200 bg-gray-50 px-6" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('contact.phoneLabel')}</label>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1.5 h-12 px-3 rounded-xl border border-gray-200 bg-gray-100 min-w-[80px]">
                        <span className="text-lg">&#x1F1EA;&#x1F1E9;</span>
                        <span className="text-sm font-bold text-gray-600">+251</span>
                      </div>
                      <Input type="tel" name="phone" autoComplete="tel" value={formData.phone.replace('+251', '')} onChange={e => setFormData({...formData, phone: '+251' + e.target.value.replace(/\D/g, '').slice(0, 9)})} placeholder="91 123 4567" className="h-12 rounded-xl border-gray-200 bg-gray-50 px-5 flex-1" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('contact.subject')}</label>
                    <Input required name="subject" autoComplete="off" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder={t('contact.subjectPlaceholder')} className="h-12 rounded-xl border-gray-200 bg-gray-50 px-5" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">{t('contact.message')}</label>
                  <textarea required name="message" autoComplete="off" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} rows={5} placeholder={t('contact.messagePlaceholder')} className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none" />
                </div>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button type="submit" disabled={isSubmitting} className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 font-bold text-sm gap-2 shadow-lg">
                    {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> {t('contact.sending')}</> : <><Send size={18} /> {t('contact.sendMessageBtn')}</>}
                  </Button>
                </motion.div>
              </form>
            )}

            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-100">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('contact.followUs')}</span>
              <div className="flex gap-3">
                {[{ icon: Globe, label: 'Website' }, { icon: Camera, label: 'Instagram' }, { icon: MessageSquare, label: 'Chat' }, { icon: ExternalLink, label: 'External' }].map(({ icon: Icon, label }, i) => (
                  <a key={i} href="#" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-primary hover:text-white transition-all"><Icon size={18} aria-hidden="true" /></a>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100 h-[400px] mb-8">
              <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.553809538312!2d38.7577!3d9.0245!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x164b8502c2c4c5c5%3A0x9c7c5f5e5e5e5e5e!2sBole%2C%20Addis%20Ababa!5e0!3m2!1sen!2set!4v1" width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Zoe Office Location" />
            </div>
            <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-8">
                <h4 className="text-lg font-bold mb-2">{t('contact.visitOffice')}</h4>
                <p className="text-muted-foreground mb-4">{t('contact.address')}</p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3"><Phone size={16} className="text-primary shrink-0" /><span>+251 911 123 456</span></div>
                  <div className="flex items-center gap-3"><Mail size={16} className="text-primary shrink-0" /><span>hello@zoecarrental.com</span></div>
                  <div className="flex items-center gap-3"><Clock size={16} className="text-primary shrink-0" /><span>Mon-Sat: 8AM - 8PM | Sun: Closed</span></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="bg-muted/30 py-24">
        <div className="page-container">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-2xl sm:text-3xl font-bold tracking-tight">{t('contact.faq')}</h2>
            <p className="text-sm text-muted-foreground">{t('contact.faqSub')}</p>
          </div>
          <div className="mx-auto max-w-3xl space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedFaq(expandedFaq === i ? null : i); } }} onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base pr-4">{item.q}</h3>
                      {expandedFaq === i ? <ChevronUp size={20} className="shrink-0 text-primary" /> : <ChevronDown size={20} className="shrink-0 text-gray-400" />}
                    </div>
                    {expandedFaq === i && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 text-muted-foreground leading-relaxed">{item.a}</motion.p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary py-20 text-white">
        <div className="page-container text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold mb-4">{t('contact.readyToStart')}</h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto">{t('contact.readyDesc')}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button onClick={() => navigate('/vehicles')} className="h-12 sm:h-14 px-6 sm:px-10 rounded-2xl bg-white text-primary hover:bg-gray-100 font-bold text-sm sm:text-base shadow-xl">{t('contact.browseCars')}</Button>
              <Button variant="outline" onClick={() => navigate('/login?role=host')} className="h-12 sm:h-14 px-6 sm:px-10 rounded-2xl border-white text-white hover:bg-white/10 font-bold text-sm sm:text-base">{t('contact.listYourCar')}</Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
