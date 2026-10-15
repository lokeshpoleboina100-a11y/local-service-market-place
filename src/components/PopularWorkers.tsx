import React from 'react';
import { Star, ShieldCheck, MapPin, CheckCircle2, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface WorkerItem {
  id: string;
  name: string;
  avatar: string;
  category: string;
  rating: number;
  reviews: number;
  completedJobs: number;
  experience: string;
  distance: string;
  isVerified: boolean;
  skills: string[];
}

const POPULAR_WORKERS: WorkerItem[] = [
  {
    id: 'w-1',
    name: 'Suresh Kumar',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    category: 'Refrigerator & AC Technician',
    rating: 4.9,
    reviews: 142,
    completedJobs: 280,
    experience: '7 yrs exp',
    distance: '1.2 km away',
    isVerified: true,
    skills: ['Inverter Fridge', 'Gas Refill', 'LG/Samsung PCB'],
  },
  {
    id: 'w-2',
    name: 'Venkatesh Rao',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    category: 'Electrician & Home Appliance',
    rating: 4.8,
    reviews: 98,
    completedJobs: 175,
    experience: '5 yrs exp',
    distance: '2.4 km away',
    isVerified: true,
    skills: ['Wiring', 'Fuse Repair', 'Washing Machine'],
  },
  {
    id: 'w-3',
    name: 'Mohammed Rizwan',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    category: 'Mobile & Electronics Specialist',
    rating: 4.9,
    reviews: 210,
    completedJobs: 410,
    experience: '6 yrs exp',
    distance: '3.1 km away',
    isVerified: true,
    skills: ['Screen Replacement', 'AMOLED Panel', 'Water Damage'],
  },
];

export default function PopularWorkers() {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Top Verified Professionals Nearby
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ranked by customer reviews, quick response time, and Aadhaar background verification
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {POPULAR_WORKERS.map((worker) => (
          <Card
            key={worker.id}
            className="p-4 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12 rounded-xl ring-2 ring-blue-600/20">
                <AvatarImage src={worker.avatar} />
                <AvatarFallback className="bg-blue-600 text-white font-bold rounded-xl">
                  {worker.name.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                    {worker.name}
                  </h3>
                  {worker.isVerified && (
                    <span title="Aadhaar Verified">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{worker.category}</p>
                <div className="flex items-center gap-2 text-xs mt-1 text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-0.5 font-bold text-amber-600">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                    {worker.rating} ({worker.reviews})
                  </span>
                  <span>•</span>
                  <span>{worker.experience}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {worker.skills.map((s, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-2 py-0.5 rounded-md"
                >
                  {s}
                </span>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-blue-600" /> {worker.distance}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">
                ✓ {worker.completedJobs} jobs done
              </span>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
