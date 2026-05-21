import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Camera, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';

export const Profile = () => {
  const { t } = useLanguage();
  const { user, profile, loading, updateVerification } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    profilePic: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        profilePic: profile.profilePic || '',
      });
    }
  }, [user, profile, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        profilePic: formData.profilePic,
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-container py-12 max-w-4xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)} 
        className="mb-8 gap-2 rounded-xl font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={18} />
        {t('profile.back')}
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-xl overflow-hidden">
            <div className="h-32 bg-primary" />
            <CardContent className="relative pt-0 text-center">
              <div className="relative -mt-16 mb-4 inline-block">
                <div className="h-32 w-32 rounded-3xl border-4 border-background overflow-hidden shadow-2xl bg-muted">
                  {formData.profilePic ? (
                    <img src={formData.profilePic} alt={formData.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <User size={64} />
                    </div>
                  )}
                </div>
                <button className="absolute bottom-2 right-2 h-10 w-10 rounded-2xl bg-white shadow-lg flex items-center justify-center text-primary hover:bg-gray-50 transition-all">
                  <Camera size={20} />
                </button>
              </div>
              <h2 className="text-2xl font-bold">{profile?.name}</h2>
              <p className="text-sm font-medium text-muted-foreground mb-4">{profile?.role.toUpperCase()}</p>
              <div className="flex justify-center gap-2 mb-4">
                {profile?.verificationStatus === 'verified' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest border border-green-100">
                    <CheckCircle2 size={12} /> {t('profile.verified')}
                  </div>
                ) : profile?.verificationStatus === 'rejected' ? (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest border border-red-100">
                    <AlertCircle size={12} /> {t('profile.rejected')}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 text-[10px] font-bold uppercase tracking-widest border border-yellow-100">
                    <AlertCircle size={12} /> {t('profile.unverified')}
                  </div>
                )}
              </div>
              {profile?.verificationStatus !== 'verified' ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/verification')}
                  className="rounded-xl font-bold text-xs uppercase tracking-widest border-primary/20 text-primary hover:bg-primary/5"
                >
                  {t('profile.verifyIdentityNow')}
                </Button>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={async () => {
                    if (confirm('Are you sure you want to reset your verification? This is for testing purposes.')) {
                      await updateVerification({ verificationStatus: 'unverified' });
                      toast.success('Verification reset! You can now test the flow again.');
                    }
                  }}
                  className="mt-2 rounded-xl font-bold text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-500"
                >
                  {t('profile.resetVerification')}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold">{t('profile.accountSecurity')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <Shield className="text-primary" size={20} />
                <div>
                  <p className="text-xs font-bold">{t('profile.twoFactorAuth')}</p>
                  <p className="text-[10px] text-muted-foreground">{t('profile.disabled')}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full rounded-xl font-bold text-xs uppercase tracking-widest">
                {t('profile.changePassword')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Form */}
        <div className="md:col-span-2">
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">{t('profile.profileSettings')}</CardTitle>
              <CardDescription>{t('profile.settingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('profile.fullName')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="rounded-xl h-12 pl-10 font-medium"
                      placeholder={t('profile.namePlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('profile.emailAddress')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      value={formData.email}
                      disabled
                      className="rounded-xl h-12 pl-10 font-medium bg-muted/50 opacity-70"
                      placeholder={t('profile.emailPlaceholder')}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{t('profile.emailHint')}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('profile.phoneNumber')}</label>
                  <div className="relative flex gap-2">
                    <div className="flex h-12 items-center justify-center rounded-xl border-2 bg-muted/50 px-4 text-sm font-bold text-muted-foreground">
                      +251
                    </div>
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input 
                        value={formData.phoneNumber.replace('+251', '').trim()}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '');
                          setFormData({...formData, phoneNumber: '+251 ' + val});
                        }}
                        className="rounded-xl h-12 pl-10 font-medium"
                        placeholder={t('profile.phonePlaceholder')}
                        maxLength={9}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('profile.profilePicUrl')}</label>
                  <div className="relative">
                    <Camera className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      value={formData.profilePic}
                      onChange={e => setFormData({...formData, profilePic: e.target.value})}
                      className="rounded-xl h-12 pl-10 font-medium"
                      placeholder={t('profile.picPlaceholder')}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-xl text-lg font-bold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? t('profile.saving') : (
                      <span className="flex items-center gap-2">
                        <Save size={20} /> {t('profile.saveProfile')}
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
