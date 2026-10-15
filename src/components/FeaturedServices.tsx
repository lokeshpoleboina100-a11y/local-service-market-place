import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Clock, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getServiceImage, FALLBACK_IMAGE } from '@/lib/serviceImages';

interface FeaturedServiceItem {
  id: string;
  name: string;
  category: string;
  serviceKey: string; // key for getServiceImage lookup
  rating: number;
  reviewsCount: number;
  typicalCost: string;
  duration: string;
  description: string;
  tag?: string;
}

const FEATURED_SERVICES: FeaturedServiceItem[] = [
  {
    id: 'fridge-repair',
    name: 'Refrigerator Repair',
    category: 'home_services',
    serviceKey: 'refrigerator repair',
    rating: 4.9,
    reviewsCount: 380,
    typicalCost: '₹450 - ₹1,800',
    duration: '1.5 - 3 hrs',
    description: 'Compressor check, cooling failure fix, gas refilling & thermostat tuning.',
    tag: 'Top Requested',
  },
  {
    id: 'ac-service',
    name: 'AC Servicing & Gas Refill',
    category: 'home_services',
    serviceKey: 'ac repair',
    rating: 4.8,
    reviewsCount: 520,
    typicalCost: '₹599 - ₹2,200',
    duration: '1 - 2 hrs',
    description: 'Jet pump foam wash, condenser cleaning, cooling coil & gas leakage repair.',
    tag: 'Summer Deal',
  },
  {
    id: 'mobile-screen',
    name: 'Mobile Screen & Panel Fix',
    category: 'technology',
    serviceKey: 'mobile screen replacement',
    rating: 4.8,
    reviewsCount: 290,
    typicalCost: '₹800 - ₹3,500',
    duration: '45 - 90 mins',
    description: 'Cracked display replacement, touch panel repair & motherboard diagnostics.',
    tag: 'Fast Turnaround',
  },
  {
    id: 'plumbing-leakage',
    name: 'Emergency Plumbing & Pipes',
    category: 'home_services',
    serviceKey: 'plumber',
    rating: 4.9,
    reviewsCount: 440,
    typicalCost: '₹350 - ₹1,200',
    duration: '45 mins',
    description: 'Faucet leakage repair, drain unblocking, pipe installation & water motor fix.',
    tag: '30 Min Arrival',
  },
];

export default function FeaturedServices() {
  const navigate = useNavigate();

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Featured Repair & Maintenance Services
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Transparent pricing, certified technicians, and instant doorstep booking
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs font-bold text-blue-600 hover:text-blue-700 gap-1 rounded-xl"
          onClick={() => navigate('/categories')}
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FEATURED_SERVICES.map((svc) => (
          <Card
            key={svc.id}
            className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col overflow-hidden group cursor-pointer"
            onClick={() =>
              navigate(
                `/customer/post-job?category=${svc.category}&service=${encodeURIComponent(svc.name)}`
              )
            }
          >
            {/* Real service photograph */}
            <div className="relative h-36 w-full overflow-hidden">
              <img
                src={getServiceImage(svc.serviceKey, svc.category)}
                alt={svc.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
              />
              {/* Tag badge */}
              {svc.tag && (
                <div className="absolute top-2 left-2">
                  <Badge className="bg-blue-600/90 text-white text-[10px] font-bold border-0 backdrop-blur-sm">
                    {svc.tag}
                  </Badge>
                </div>
              )}
              {/* Rating overlay */}
              <div className="absolute bottom-2 right-2">
                <span className="inline-flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {svc.rating} ({svc.reviewsCount})
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                {svc.name}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                {svc.description}
              </p>

              <div className="flex items-center gap-2 text-xs mt-2 text-slate-500 dark:text-slate-400">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {svc.duration}
              </div>

              <div className="pt-3 mt-auto border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Est. Price</p>
                  <p className="font-extrabold text-sm text-blue-600 dark:text-blue-400">
                    {svc.typicalCost}
                  </p>
                </div>
                <Button
                  size="sm"
                  className="h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1 shadow-xs"
                >
                  Book Now
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
