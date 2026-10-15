import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CATEGORY_GROUPS } from '@/lib/serviceCatalog';
import { supabase } from '@/integrations/supabase/client';
import { getCategoryImage, FALLBACK_IMAGE } from '@/lib/serviceImages';

interface CategoryGridProps {
  /** Show only the first N categories (with a "View all" button). */
  limit?: number;
  showViewAll?: boolean;
  title?: string;
}

export default function CategoryGrid({ limit, showViewAll = true, title = 'What service do you need?' }: CategoryGridProps) {
  const navigate = useNavigate();
  const [workerCounts, setWorkerCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('main_category')
        .eq('role', 'worker')
        .not('main_category', 'is', null);
      if (!active || !data) return;
      const counts: Record<string, number> = {};
      for (const row of data) {
        const key = (row as { main_category: string | null }).main_category;
        if (key) counts[key] = (counts[key] || 0) + 1;
      }
      setWorkerCounts(counts);
    })();
    return () => {
      active = false;
    };
  }, []);

  const groups = limit ? CATEGORY_GROUPS.slice(0, limit) : CATEGORY_GROUPS;

  return (
    <section aria-labelledby="category-heading" className="mb-6">
      <h2 id="category-heading" className="font-bold text-lg mb-1">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground mb-3">Pick a category to get matched with nearby verified workers.</p>

      <div className="grid grid-cols-2 gap-3">
        {groups.map((group, i) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="h-full flex flex-col hover:border-primary/50 transition-colors overflow-hidden">
              {/* Category photograph */}
              <div className="relative h-32 w-full overflow-hidden">
                <img
                  src={getCategoryImage(group.id)}
                  alt={group.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <h3 className="absolute bottom-2 left-3 text-sm font-bold text-white drop-shadow leading-tight">
                  {group.name}
                </h3>
              </div>

              <div className="p-4 flex flex-col gap-2 flex-1">
                <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-auto">
                  <Users className="h-3 w-3" />
                  {group.services.length} services · {workerCounts[group.id] || 0} workers
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full rounded-xl font-semibold gap-1 mt-1"
                  onClick={() => navigate(`/categories/${group.id}`)}
                >
                  Explore <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {showViewAll && limit && limit < CATEGORY_GROUPS.length && (
        <Button variant="outline" className="w-full mt-3 h-12 rounded-xl font-semibold" onClick={() => navigate('/categories')}>
          View All Categories
        </Button>
      )}
    </section>
  );
}
