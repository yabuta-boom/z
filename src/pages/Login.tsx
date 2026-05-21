import React, { useRef, useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight, Car, MapPin, ShieldCheck, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { useLanguage } from '../contexts/LanguageContext';

// Helper function to merge class names
const cn = (...classes: string[]) => {
  return classes.filter(Boolean).join(" ");
};

// Custom Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}

const Button = ({ 
  children, 
  variant = "default", 
  className = "", 
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantStyles = {
    default: "bg-primary text-white hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Custom Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = ({ className = "", ...props }: InputProps) => {
  return (
    <input
      className={`flex h-12 w-full rounded-xl border bg-background px-5 py-2 text-sm text-gray-800 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

import { SmartGPSRoad } from '../components/SmartGPSRoad';

const SignInCard = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [role, setRole] = useState<"renter" | "host">("renter");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading, login, signUp, signInWithEmail, demoSignIn } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (user && !loading) {
      if (profile?.role === 'renter') {
        navigate('/');
      } else {
        navigate('/host');
      }
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam === 'host') {
      setRole('host');
    }
  }, [location.search]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        // Basic phone validation for Ethiopia (+251 followed by 9 digits)
        const phoneRegex = /^\+251\d{9}$/;
        if (!phoneRegex.test(phoneNumber)) {
          toast.error("Please enter a valid Ethiopian phone number (+251XXXXXXXXX)");
          setIsSubmitting(false);
          return;
        }
        await signUp(email, password, name, phoneNumber, role);
        toast.success("Account created successfully!");
        navigate("/verification?mode=phone");
        return;
      } else {
        // Demo login: intercept the specific demo credentials
        if (email === 'yeabseramekbeb@gmail.com' && (password === '#1renter' || password === '#1Host')) {
          await demoSignIn(email, password);
        } else {
          await signInWithEmail(email, password);
        }
        toast.success("Signed in successfully!");
      }
      
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      
      if (redirect) {
        navigate(redirect);
      } else if (role === "renter") {
        navigate("/");
      } else {
        navigate("/host");
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error("Email/Password sign-in is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.");
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error("Invalid credentials. Please check email and password.");
      } else {
        toast.error(error.message || "Authentication failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith("+251")) {
      value = "+251" + value.replace(/^\+?251?/, "");
    }
    // Only allow digits after +251 and limit length
    const prefix = "+251";
    const rest = value.slice(prefix.length).replace(/\D/g, "").slice(0, 9);
    setPhoneNumber(prefix + rest);
  };

  const handleGoogleLogin = async () => {
    try {
      localStorage.setItem('pendingRole', role);
      await login();
      toast.success("Logged in successfully!");
      
      const params = new URLSearchParams(location.search);
      const redirect = params.get('redirect');
      
      if (redirect) {
        navigate(redirect);
      } else if (role === "renter") {
        navigate("/");
      } else {
        navigate("/host");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to login with Google.");
    }
  };

  return (
    <div className="flex w-full h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex bg-white shadow-xl"
      >
        {/* Left side - Animation */}
        <div className="hidden md:block w-1/2 h-[650px] relative overflow-hidden border-r border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10">
            <SmartGPSRoad />
            
            {/* Logo and text overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="mb-6"
              >
                <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                  <Car className="text-white h-8 w-8" strokeWidth={2.5} aria-hidden="true" />
                </div>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-5xl font-bold mb-2 text-center text-foreground tracking-tight uppercase leading-none"
              >
                ZOE
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-[11px] text-center text-muted-foreground font-bold uppercase tracking-wider"
              >
                {t('login.premiumCarRental')}
              </motion.p>
            </div>
          </div>
        </div>
        
        {/* Right side - Form */}
        <div className="w-full md:w-1/2 p-5 sm:p-8 md:p-12 flex flex-col justify-center bg-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Role Selection Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
              <button
                onClick={() => {
                  setRole("renter");
                }}
                className={cn(
                  "flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300",
                  role === "renter" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('login.rentACar')}
              </button>
              <button
                onClick={() => {
                  setRole("host");
                }}
                className={cn(
                  "flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300",
                  role === "host" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('login.imAHost')}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-tight mb-2 text-foreground">
              {mode === "signin" 
                ? (role === "renter" ? t('login.findNextRide') : t('login.manageFleet'))
                : t('login.createAccount')}
            </h1>
            <p className="text-muted-foreground font-medium mb-2">
              {mode === "signin" 
                ? `${t('login.signInTo')} ${role} ${t('login.account')}`
                : `${t('login.joinZoe')} ${role}`}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-yellow-600 mb-8">
              {t('login.rolePermanent')}
            </p>

            <div className="mb-8 p-4 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-3">{t('login.demoCredentials')}</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-800">{t('login.renter')}:</span>
                  <span className="text-blue-600">yeabseramekbeb@gmail.com / #1renter</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-800">{t('login.host')}:</span>
                  <span className="text-blue-600">yeabseramekbeb@gmail.com / #1Host</span>
                </div>
              </div>
            </div>
            
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-[11px] font-bold uppercase tracking-wider">
                <span className="px-4 bg-white text-muted-foreground">{t('login.orContinueEmail')}</span>
              </div>
            </div>
            
            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <>
                  <div>
                    <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      {t('login.fullName')}
                    </label>
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t('login.enterFullName')}
                      required
                      className="h-14 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-primary/20 transition-all font-bold px-6"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      {t('login.phoneNumber')}
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder={t('login.phonePlaceholder')}
                      required
                      className="h-14 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-primary/20 transition-all font-bold px-6 font-mono"
                    />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  {t('login.emailAddress')}
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')}
                  required
                  className="h-14 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-primary/20 transition-all font-bold px-6"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('login.password')}
                  </label>
                  {mode === "signin" && (
                    <a href="#" className="text-xs font-bold uppercase tracking-wider text-primary hover:underline">
                      {t('login.forgot')}
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signin" ? t('login.passwordPlaceholder') : t('login.createPasswordPlaceholder')}
                    required
                    className="h-14 rounded-2xl bg-gray-50 border-transparent focus:bg-white focus:border-primary/20 transition-all font-bold px-6 pr-12"
                  />
                  <button
                    type="button"
                    aria-label={isPasswordVisible ? t('login.hidePassword') : t('login.showPassword')}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-4"
              >
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={cn(
                    "w-full h-12 bg-primary text-white rounded-xl transition-all duration-300 font-bold uppercase tracking-wider text-xs shadow-2xl shadow-primary/20",
                    isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                  )}
                >
                  <span className="flex items-center justify-center">
                    {isSubmitting 
                      ? (mode === "signin" ? t('login.signingIn') : t('login.creatingAccount'))
                      : (mode === "signin" 
                          ? `${t('login.signInAs')} ${role}`
                          : `${t('login.signUpAs')} ${role}`)}
                    {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" strokeWidth={3} aria-hidden="true" />}
                  </span>
                </Button>
              </motion.div>
              
              <div className="text-center mt-8">
                {mode === "signin" ? (
                  <button 
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-muted-foreground hover:text-primary text-xs font-bold transition-colors uppercase tracking-wider"
                  >
                    {t('login.noAccount')}
                  </button>
                ) : (
                  <button 
                    type="button"
                    onClick={() => setMode("signin")}
                    className="text-muted-foreground hover:text-primary text-xs font-bold transition-colors uppercase tracking-wider"
                  >
                    {t('login.haveAccount')}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

const Login = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/[0.04] to-primary/10">
      <div className="flex min-h-screen items-center justify-center page-top-offset p-4">
        <SignInCard />
      </div>
    </div>
  );
};

export default Login;
