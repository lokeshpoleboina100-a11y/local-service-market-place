import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORY_GROUPS } from '@/lib/serviceCatalog';
import { getCategoryImage, FALLBACK_IMAGE } from '@/lib/serviceImages';

export default function MinimalCategoryGrid() {
  const navigate = useNavigate();

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Popular Categories
        </h3>
        <button
          type="button"
          onClick={() => navigate('/categories')}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          View all categories
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
        {CATEGORY_GROUPS.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => navigate(`/customer/post-job?category=${cat.id}`)}
            className="relative overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 hover:shadow-md transition-all text-left group shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {/* Service photograph */}
            <div className="relative h-20 w-full overflow-hidden">
              <img
                src={getCategoryImage(cat.id)}
                alt={cat.name}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                }}
              />
              {/* Dark gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </div>

            {/* Service name */}
            <div className="absolute bottom-0 left-0 right-0 p-2">
              <span className="text-[11px] font-bold text-white leading-tight line-clamp-1 drop-shadow">
                {cat.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
