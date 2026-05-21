import React, { useState } from 'react';
import { Sparkles, Send, Loader2, Star } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MOCK_CARS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const AIRecommendations = () => {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on the user's request: "${query}", and the following available cars: ${JSON.stringify(MOCK_CARS)}, suggest the best 2-3 matches. Return ONLY a JSON array of car IDs.`,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const response = await model;
      const carIds = JSON.parse(response.text || '[]');
      const matches = MOCK_CARS.filter(car => carIds.includes(car.id));
      setRecommendations(matches);
      if (matches.length > 0) {
        toast.success('Found some perfect matches for you!');
      } else {
        toast.info('No exact matches found, but here are some alternatives.');
      }
    } catch (error) {
      console.error('AI error:', error);
      toast.error('AI recommendation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-[3rem] bg-card border border-primary/10 shadow-2xl">
      <div className="absolute top-0 right-0 p-12 opacity-10">
        <Sparkles size={120} className="text-primary animate-pulse" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-12 lg:p-20 flex flex-col justify-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
            <Sparkles size={28} />
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold uppercase tracking-tight mb-6 leading-none">
            AI Smart <br />
            <span className="text-primary">Recommendations</span>
          </h2>
          <p className="text-lg text-muted-foreground font-medium mb-10 max-w-md">
            Describe your perfect trip, and our advanced AI will handpick the ideal vehicle for your specific needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input 
                placeholder="e.g. A luxury SUV for a wedding..." 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="h-16 rounded-2xl text-lg shadow-inner border-2 focus-visible:ring-primary pl-6"
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              className="h-14 px-10 rounded-2xl font-bold uppercase tracking-wider shadow-xl shadow-primary/30 transition-all hover:scale-105 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
            </Button>
          </div>
        </div>

        <div className="bg-muted/30 p-12 lg:p-20 border-l border-primary/5">
          <AnimatePresence mode="wait">
            {recommendations.length > 0 ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Top Matches For You</h3>
                <div className="grid grid-cols-1 gap-6">
                  {recommendations.map((car, index) => (
                    <motion.div
                      key={car.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group cursor-pointer rounded-2xl bg-background p-4 shadow-lg transition-all hover:shadow-xl border border-transparent hover:border-primary/20"
                      onClick={() => navigate(`/cars/${car.id}`)}
                    >
                      <div className="flex gap-4">
                        <div className="h-24 w-32 overflow-hidden rounded-xl">
                          <img src={car.images[0]} alt={car.make} className="h-full w-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <h4 className="font-bold uppercase tracking-tight text-lg">{car.make} {car.model}</h4>
                          <p className="text-sm font-bold text-primary">ETB {car.pricePerDay.toLocaleString()} / day</p>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">{car.type}</Badge>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                              <Star size={10} className="fill-yellow-400 text-yellow-400" />
                              {car.rating}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex h-full flex-col items-center justify-center text-center space-y-6"
              >
                <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center border-2 border-dashed border-primary/20">
                  <Sparkles size={32} className="text-primary/40" />
                </div>
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Your matches will appear here</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
