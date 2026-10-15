import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import LocationPicker from '@/components/LocationPicker';
import AppHeader from '@/components/AppHeader';
import AIProblemDetection from '@/components/AIProblemDetection';
import AIJobAssistant, { type AiExplanation } from '@/components/AIJobAssistant';
import AIVoiceJobPoster from '@/components/AIVoiceJobPoster';
import BiddingToggle from '@/components/BiddingToggle';
import RepairJobImageUpload from '@/components/RepairJobImageUpload';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { CATEGORY_GROUPS, getGroup, type DbJobCategory } from '@/lib/serviceCatalog';

export default function PostJob() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [isInstant, setIsInstant] = useState(false);
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [allowBidding, setAllowBidding] = useState<boolean>(() => {
    const saved = localStorage.getItem('nearwork_default_allow_bidding');
    return saved !== null ? saved === 'true' : true;
  });
  const [category, setCategory] = useState<DbJobCategory | ''>('');
  const [service, setService] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [locationName, setLocationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobLat, setJobLat] = useState<number>(13.0827);
  const [jobLng, setJobLng] = useState<number>(80.2707);
  const [aiExplanation, setAiExplanation] = useState<AiExplanation | null>(null);

  // Multimodal tracking & repair photos
  const [jobImages, setJobImages] = useState<string[]>([]);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [userEditedTitle, setUserEditedTitle] = useState(false);
  const [userEditedDesc, setUserEditedDesc] = useState(false);

  // Pre-fill from the category / service the customer picked before landing here, or from quick AI creator
  useEffect(() => {
    const group = getGroup(params.get('category'));
    if (group) {
      setCategory(group.id);
      const svc = params.get('service');
      if (svc && group.services.some((s) => s.name === svc)) {
        setService(svc);
      } else if (svc) {
        setService(svc);
      }
    }

    // Check if customer uploaded photo in quick creator on dashboard
    const pendingPhoto = sessionStorage.getItem('nearwork_pending_job_photo');
    if (pendingPhoto) {
      setUploadedPhoto(pendingPhoto);
      setJobImages((prev) => (prev.includes(pendingPhoto) ? prev : [pendingPhoto, ...prev]));
      sessionStorage.removeItem('nearwork_pending_job_photo');
    }

    const pendingTitle = sessionStorage.getItem('nearwork_pending_job_title');
    if (pendingTitle) {
      setTitle(pendingTitle);
      setUserEditedTitle(true);
      sessionStorage.removeItem('nearwork_pending_job_title');
    }

    const pendingDesc = sessionStorage.getItem('nearwork_pending_job_desc');
    if (pendingDesc) {
      setDescription(pendingDesc);
      setUserEditedDesc(true);
      sessionStorage.removeItem('nearwork_pending_job_desc');
    }
  }, [params]);

  const activeGroup = getGroup(category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category) {
      toast({ title: 'Please select a service category', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const budgetVal = parseInt(budget) || 0;
      let insertedId = '';

      // Consolidate repair images
      const allImages = [...jobImages];
      if (uploadedPhoto && !allImages.includes(uploadedPhoto)) {
        allImages.unshift(uploadedPhoto);
      }

      const jobPayload = {
        customer_id: user.id,
        category,
        title: title.trim(),
        description: [description.trim(), service ? `Service type: ${service}` : null].filter(Boolean).join('\n\n'),
        budget_min: budgetVal,
        budget_max: budgetVal,
        is_negotiable: isNegotiable,
        latitude: jobLat,
        longitude: jobLng,
        location_name: locationName || 'Customer location',
        status: isInstant ? 'open' : 'open',
        images: allImages,
      };

      let { data: inserted, error } = await supabase
        .from('jobs')
        .insert(jobPayload)
        .select()
        .single();

      // If remote Supabase database throws an enum check error, map to standard native enum
      if (error && (error.message?.includes('enum') || (error as any).code === '22P02')) {
        const fallbackEnumMap: Record<string, string> = {
          construction_building: 'construction',
          transport_delivery: 'delivery',
          daily_wage_labour: 'other',
          agriculture_farming: 'other',
          rural_village_services: 'other',
          welding_fabrication: 'other',
        };
        const mappedCat = fallbackEnumMap[category] || 'other';
        const retry = await supabase
          .from('jobs')
          .insert({
            ...jobPayload,
            category: mappedCat as any,
            service: service || activeGroup?.name || category,
          })
          .select()
          .single();
        if (retry.data) {
          inserted = retry.data;
          error = null;
        }
      }

      if (error) {
        // Fallback for Demo accounts or when Supabase RLS blocks client insert
        // Use a standard RFC4122 v4 UUID so Postgres foreign keys and UUID checks succeed
        const fallbackId = crypto.randomUUID();
        insertedId = fallbackId;
        const localJob = {
          ...jobPayload,
          id: fallbackId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          assigned_worker_id: null,
          bids_count: 0,
        };

        // Save to demo store in localStorage
        const stored = JSON.parse(localStorage.getItem('nearwork_demo_jobs') || '[]');
        stored.unshift(localJob);
        localStorage.setItem('nearwork_demo_jobs', JSON.stringify(stored));

        // Sync with backend API
        await fetch('/api/jobs/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localJob),
        }).catch(() => {});
      } else if (inserted?.id) {
        insertedId = inserted.id;
      }

      if (insertedId) {
        // 1. Save bidding setting to backend
        await fetch(`/api/jobs/${insertedId}/bidding-settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: user.id,
            allow_bidding: allowBidding,
          }),
        }).catch(() => {});

        // 2. Initialize location tracking for Rapido-style worker journey
        await fetch(`/api/jobs/${insertedId}/location/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: user.id,
            customer_lat: jobLat,
            customer_lng: jobLng,
            customer_address: locationName || 'Customer location',
          }),
        }).catch(() => {});
      }

      // Save preference as user default
      localStorage.setItem('nearwork_default_allow_bidding', String(allowBidding));

      toast({
        title: t('post_job.success_title'),
        description: t('post_job.success_desc'),
      });
      navigate('/customer');
    } catch (err: any) {
      toast({
        title: 'Error posting job',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <AppHeader title={t('post_job.title')} showBack />

      <motion.form
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-lg mx-auto px-4 py-4 space-y-5"
        onSubmit={handleSubmit}
      >
        {/* AI Voice Job Poster — speak in Telugu, Tamil, Hindi, or English */}
        <AIVoiceJobPoster
          onApply={({ title: t, description: d, category: c, service: s, budget: b }) => {
            const group = getGroup(c) || CATEGORY_GROUPS.find((g) => g.id === c);
            setCategory(group ? group.id : 'other');
            if (s) setService(s);
            if (t) { setTitle(t); setUserEditedTitle(true); }
            if (d) { setDescription(d); setUserEditedDesc(true); }
            if (b) setBudget(String(b));
          }}
        />

        {/* Category Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-bold">{t('post_job.category')}</Label>
            {category && (
              <span className="text-[11px] text-muted-foreground">
                Review or change category
              </span>
            )}
          </div>
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v as DbJobCategory);
              setService('');
            }}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder={t('post_job.select_category')} />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_GROUPS.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Specific Service / Custom Flexible Category */}
        {category && (
          <div className="space-y-2">
            <Label className="font-bold">Service needed</Label>
            {activeGroup && activeGroup.services.length > 0 ? (
              <div className="space-y-2">
                <Select value={service} onValueChange={setService}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder={`Choose a ${activeGroup.name.toLowerCase()} service`} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeGroup.services.map((svc) => (
                      <SelectItem key={svc.slug} value={svc.name}>
                        {svc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/* Flexible entry if unlisted service in this group */}
                <Input
                  placeholder="Or enter custom service name if not listed above"
                  className="h-10 rounded-xl text-xs"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                />
              </div>
            ) : (
              <Input
                placeholder="Specify service (e.g. Drone Repair, Antique Restoration)"
                className="h-12 rounded-xl"
                value={service}
                onChange={(e) => setService(e.target.value)}
              />
            )}
          </div>
        )}

        {/* Job Title */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-bold">{t('post_job.job_title')}</Label>
            {userEditedTitle && (
              <span className="text-[11px] text-indigo-600 font-medium">Custom edited</span>
            )}
          </div>
          <Input
            placeholder={t('post_job.job_title_placeholder')}
            className="h-12 rounded-xl"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setUserEditedTitle(true);
            }}
            required
          />
        </div>

        {/* Job Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="font-bold">{t('post_job.description')}</Label>
            {userEditedDesc && (
              <span className="text-[11px] text-indigo-600 font-medium">Custom edited</span>
            )}
          </div>
          <Textarea
            placeholder={t('post_job.description_placeholder')}
            className="min-h-[110px] rounded-xl text-sm"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setUserEditedDesc(true);
            }}
            required
          />
        </div>

        {/* Full AI Job Assistant & Price Estimator */}
        <AIJobAssistant
          title={title}
          description={description}
          image={uploadedPhoto}
          onApplyCategory={(c, s) => {
            const group = getGroup(c) || CATEGORY_GROUPS.find((g) => g.id === c);
            if (group) {
              setCategory(group.id);
              if (s) setService(s);
            } else {
              setCategory('other');
              if (s) setService(s);
            }
          }}
          onApplyTitle={(t) => {
            setTitle(t);
            setUserEditedTitle(true);
          }}
          onApplyDescription={(d) => {
            setDescription(d);
            setUserEditedDesc(true);
          }}
          onApplyBudget={(amount) => setBudget(String(amount))}
          onApplyAll={({ category: c, service: s, title: t, description: d, budget: b }) => {
            const group = getGroup(c) || CATEGORY_GROUPS.find((g) => g.id === c);
            setCategory(group ? group.id : 'other');
            if (s) setService(s);
            if (t) {
              setTitle(t);
              setUserEditedTitle(true);
            }
            if (d) {
              setDescription(d);
              setUserEditedDesc(true);
            }
            if (b) setBudget(String(b));
          }}
          onExplanationChange={setAiExplanation}
        />

        {/* Budget */}
        <div className="space-y-2">
          <Label className="font-bold">{t('post_job.budget')} (₹)</Label>
          <Input
            type="number"
            placeholder="500"
            className="h-12 rounded-xl"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            required
          />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Switch id="negotiable" checked={isNegotiable} onCheckedChange={setIsNegotiable} />
            <label htmlFor="negotiable">{t('post_job.negotiable')}</label>
          </div>
        </div>

        {/* Location Picker */}
        <div className="space-y-2">
          <Label className="font-bold">{t('post_job.location')}</Label>
          <LocationPicker
            latitude={jobLat}
            longitude={jobLng}
            locationName={locationName}
            onLocationChange={(lat, lng, name) => {
              setJobLat(lat);
              setJobLng(lng);
              setLocationName(name);
            }}
          />
        </div>

        {/* AI Product Damage Detection & Visualization Component */}
        <AIProblemDetection
          hint={[title, description].filter(Boolean).join(' — ')}
          onPhotoChange={setUploadedPhoto}
          onUseResult={(line, analysis) => {
            // If image is identified as mobile, plumbing, appliance, carpentry, auto-fill category & title if untouched
            if (analysis.productCategory) {
              const p = analysis.productCategory.toLowerCase();
              if (p.includes('phone') || p.includes('mobile')) {
                setCategory('technology');
                setService('Mobile Repair');
                if (!userEditedTitle) {
                  setTitle('Mobile screen replacement required');
                  setUserEditedTitle(true);
                }
              } else if (p.includes('appliance') || p.includes('washer')) {
                setCategory('home_services');
                setService('Appliance Repair');
                if (!userEditedTitle) {
                  setTitle('Home appliance repair required');
                  setUserEditedTitle(true);
                }
              } else if (p.includes('furniture') || p.includes('wood')) {
                setCategory('home_services');
                setService('Carpenter');
                if (!userEditedTitle) {
                  setTitle('Fix damaged wooden furniture');
                  setUserEditedTitle(true);
                }
              }
            }
            setDescription((prev) =>
              prev.includes(line) ? prev : [prev.trim(), line].filter(Boolean).join('\n\n')
            );
            setUserEditedDesc(true);
          }}
        />

        {/* Customer Problem & Repair Photos Upload */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <RepairJobImageUpload
            images={jobImages}
            onChange={(imgs) => {
              setJobImages(imgs);
              if (imgs.length > 0 && !uploadedPhoto) {
                setUploadedPhoto(imgs[0]);
              }
            }}
          />
        </div>

        {/* Customer-Controlled Bidding ON/OFF Toggle */}
        <BiddingToggle
          allowBidding={allowBidding}
          onToggle={(val) => {
            setAllowBidding(val);
            localStorage.setItem('nearwork_default_allow_bidding', String(val));
          }}
        />

        {/* Instant Job Toggle */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-accent/10 border border-accent/20">
          <div>
            <p className="font-bold text-sm">{t('post_job.instant_job')}</p>
            <p className="text-xs text-muted-foreground">{t('post_job.instant_desc')}</p>
          </div>
          <Switch checked={isInstant} onCheckedChange={setIsInstant} />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-14 text-base font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white"
          disabled={isSubmitting || !category}
        >
          {isSubmitting ? t('post_job.submitting') : t('post_job.submit')}
        </Button>
      </motion.form>
    </div>
  );
}
