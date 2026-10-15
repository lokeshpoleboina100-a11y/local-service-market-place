import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Wrench, Sparkles, CheckCircle2 } from 'lucide-react';
import DashboardShell from '@/components/DashboardShell';
import BottomNav from '@/components/BottomNav';
import SEO from '@/components/SEO';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CATEGORY_GROUPS, getGroup, type DbJobCategory } from '@/lib/serviceCatalog';
import { getCategoryImage, getServiceImage, FALLBACK_IMAGE } from '@/lib/serviceImages';

export default function Categories() {
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [query, setQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(categoryId || null);

  const activeGroup = useMemo(() => {
    return getGroup(selectedGroup || categoryId);
  }, [selectedGroup, categoryId]);

  const displayedGroups = useMemo(() => {
    if (activeGroup) return [activeGroup];
    const q = query.trim().toLowerCase();
    if (!q) return CATEGORY_GROUPS;
    return CATEGORY_GROUPS.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.services.some((s) => s.name.toLowerCase().includes(q))
    );
  }, [query, activeGroup]);

  const goToService = (groupId: string, service: string) => {
    navigate(`/customer/post-job?category=${groupId}&service=${encodeURIComponent(service)}`);
  };

  return (
    <DashboardShell role="customer">
      <SEO
        title={activeGroup ? `${activeGroup.name} Services Near You | NearWork` : 'All Service Categories | NearWork'}
        description={
          activeGroup
            ? `Hire verified ${activeGroup.name.toLowerCase()} professionals near you on NearWork. ${activeGroup.description}.`
            : 'Browse home, automotive, technology, education, beauty, moving, gardening, pet, event and professional services near you on NearWork.'
        }
      />

      <div className="space-y-6 pb-16 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {activeGroup ? activeGroup.name : 'All Service Categories'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeGroup
                ? activeGroup.description
                : 'Select a service to get matched with verified local professionals with realistic pricing.'}
            </p>
          </div>

          <Button
            size="sm"
            className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            onClick={() => navigate('/customer/post-job')}
          >
            Post Custom Job
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl shadow-2xs">
          <Search className="h-4 w-4 text-slate-400 ml-2 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selectedGroup) setSelectedGroup(null);
            }}
            placeholder="Search any service (e.g. Mobile Screen, AC Gas Refill, Water Leakage, Laptop Motherboard)..."
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-xs text-slate-400 hover:text-slate-600 mr-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Horizontal Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <Badge
            variant={selectedGroup === null ? 'default' : 'outline'}
            className={`cursor-pointer shrink-0 h-8 px-3 text-xs font-semibold rounded-lg transition-all ${
              selectedGroup === null
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
            onClick={() => {
              setSelectedGroup(null);
              navigate('/categories');
            }}
          >
            All Categories ({CATEGORY_GROUPS.length})
          </Badge>
          {CATEGORY_GROUPS.map((group) => {
            const isSelected = selectedGroup === group.id;
            return (
              <Badge
                key={group.id}
                variant={isSelected ? 'default' : 'outline'}
                className={`cursor-pointer shrink-0 h-8 px-3 text-xs font-semibold rounded-lg transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                onClick={() => {
                  setSelectedGroup(group.id);
                  navigate(`/categories/${group.id}`);
                }}
              >
                {group.name}
              </Badge>
            );
          })}
        </div>

        {/* No Results Fallback */}
        {displayedGroups.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No services matched “{query}”
            </p>
            <p className="text-xs text-slate-400 mt-1">
              You can post a custom job for any repair or maintenance work.
            </p>
            <Button
              className="mt-4 rounded-xl bg-blue-600 text-white text-xs font-semibold"
              onClick={() => navigate('/customer/post-job')}
            >
              Post a Custom Job
            </Button>
          </div>
        )}

        {/* Groups and Individual Photographic Service Cards */}
        <div className="space-y-8">
          {displayedGroups.map((group) => (
            <section key={group.id} className="space-y-3">
              {/* Category Photo Header Card */}
              <div className="relative rounded-2xl overflow-hidden h-36 border border-slate-200 dark:border-slate-800 shadow-xs">
                <img
                  src={getCategoryImage(group.id)}
                  alt={group.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
                <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white drop-shadow-sm flex items-center gap-2">
                      {group.name}
                    </h2>
                    <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{group.description}</p>
                  </div>
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-white/90 hover:bg-white text-slate-900 font-bold text-xs shrink-0 shadow-xs backdrop-blur-sm"
                    onClick={() => navigate(`/customer/post-job?category=${group.id}`)}
                  >
                    Post in {group.name} <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>

              {/* Grid of Individual Services with Realistic Photographs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {group.services.map((svc) => (
                  <Card
                    key={svc.slug}
                    onClick={() => goToService(group.id, svc.name)}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Realistic Service Photograph */}
                    <div className="relative h-28 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={getServiceImage(svc.name, group.id)}
                        alt={svc.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    </div>

                    {/* Service Info & Action */}
                    <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {svc.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          Doorstep certified technician
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                        <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                          Verified Pros
                        </span>
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 flex items-center gap-0.5">
                          Book <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="md:hidden">
        <BottomNav role="customer" />
      </div>
    </DashboardShell>
  );
}
