/**
 * serviceImages.ts
 * Centralized mapping of every NearWork service category and individual service
 * to a real, high-quality Unsplash photograph.
 *
 * All URLs use Unsplash's transformation params:
 *   w=600 – max width (keeps files small)
 *   q=80  – JPEG quality
 *   auto=format – serves WebP to supporting browsers
 *   fit=crop – fills the requested dimensions
 */

// ─── Category Cover Images ────────────────────────────────────────────────────

export const CATEGORY_IMAGES: Record<string, string> = {
  home_services:
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&q=80&auto=format&fit=crop',
  automotive:
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&q=80&auto=format&fit=crop',
  technology:
    'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=600&q=80&auto=format&fit=crop',
  education:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&auto=format&fit=crop',
  beauty_wellness:
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&auto=format&fit=crop',
  moving_delivery:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop',
  gardening_outdoor:
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80&auto=format&fit=crop',
  pet_services:
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80&auto=format&fit=crop',
  events_creative:
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600&q=80&auto=format&fit=crop',
  professional_services:
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=600&q=80&auto=format&fit=crop',
  construction_building:
    'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=600&q=80&auto=format&fit=crop',
  daily_wage_labour:
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&auto=format&fit=crop',
  agriculture_farming:
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80&auto=format&fit=crop',
  rural_village_services:
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&q=80&auto=format&fit=crop',
  welding_fabrication:
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80&auto=format&fit=crop',
  transport_delivery:
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&auto=format&fit=crop',
  // legacy / fallback ids
  construction:
    'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=600&q=80&auto=format&fit=crop',
  delivery:
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&auto=format&fit=crop',
  ac_repair:
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&auto=format&fit=crop',
  plumbing:
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80&auto=format&fit=crop',
  electrical:
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80&auto=format&fit=crop',
  carpentry:
    'https://images.unsplash.com/photo-1601058268499-e52658b8bb88?w=600&q=80&auto=format&fit=crop',
  painting:
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80&auto=format&fit=crop',
  cleaning:
    'https://images.unsplash.com/photo-1581578949510-fa7315c4c350?w=600&q=80&auto=format&fit=crop',
  other:
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80&auto=format&fit=crop',
};

// ─── Individual Service Images ────────────────────────────────────────────────

export const SERVICE_IMAGES: Record<string, string> = {
  // ── Home Services ──────────────────────────────────────────────────────────
  plumber:
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80&auto=format&fit=crop',
  plumbing:
    'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&q=80&auto=format&fit=crop',
  electrician:
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80&auto=format&fit=crop',
  electrical:
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600&q=80&auto=format&fit=crop',
  'ac repair':
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&auto=format&fit=crop',
  'ac service':
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&auto=format&fit=crop',
  ac_repair:
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80&auto=format&fit=crop',
  cleaning:
    'https://images.unsplash.com/photo-1581578949510-fa7315c4c350?w=600&q=80&auto=format&fit=crop',
  'home cleaning':
    'https://images.unsplash.com/photo-1581578949510-fa7315c4c350?w=600&q=80&auto=format&fit=crop',
  carpenter:
    'https://images.unsplash.com/photo-1601058268499-e52658b8bb88?w=600&q=80&auto=format&fit=crop',
  carpentry:
    'https://images.unsplash.com/photo-1601058268499-e52658b8bb88?w=600&q=80&auto=format&fit=crop',
  painter:
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80&auto=format&fit=crop',
  painting:
    'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600&q=80&auto=format&fit=crop',
  'appliance repair':
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop',
  'refrigerator repair':
    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80&auto=format&fit=crop',
  refrigerator_repair:
    'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=80&auto=format&fit=crop',
  'washing machine repair':
    'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&q=80&auto=format&fit=crop',
  washing_machine_repair:
    'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&q=80&auto=format&fit=crop',

  // ── Automotive ─────────────────────────────────────────────────────────────
  'car repair':
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80&auto=format&fit=crop',
  'bike repair':
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop',
  'motorcycle repair':
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop',
  'car wash':
    'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600&q=80&auto=format&fit=crop',
  'tyre/puncture repair':
    'https://images.unsplash.com/photo-1515091943509-89dd3bef71f4?w=600&q=80&auto=format&fit=crop',
  'tyre repair':
    'https://images.unsplash.com/photo-1515091943509-89dd3bef71f4?w=600&q=80&auto=format&fit=crop',
  'battery assistance':
    'https://images.unsplash.com/photo-1558618047-3c8c76ca3d10?w=600&q=80&auto=format&fit=crop',
  'vehicle servicing':
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&q=80&auto=format&fit=crop',

  // ── Technology ─────────────────────────────────────────────────────────────
  'laptop repair':
    'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=600&q=80&auto=format&fit=crop',
  laptop_repair:
    'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?w=600&q=80&auto=format&fit=crop',
  'mobile repair':
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80&auto=format&fit=crop',
  mobile_repair:
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80&auto=format&fit=crop',
  'mobile screen replacement':
    'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&q=80&auto=format&fit=crop',
  'mobile screen & panel fix':
    'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&q=80&auto=format&fit=crop',
  'cctv installation':
    'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&q=80&auto=format&fit=crop',
  'wi-fi/router setup':
    'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=600&q=80&auto=format&fit=crop',
  'wifi installation':
    'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=600&q=80&auto=format&fit=crop',
  'computer support':
    'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=600&q=80&auto=format&fit=crop',
  'computer services':
    'https://images.unsplash.com/photo-1504707748692-419802cf939d?w=600&q=80&auto=format&fit=crop',
  'software installation':
    'https://images.unsplash.com/photo-1607706189992-eae578626c86?w=600&q=80&auto=format&fit=crop',

  // ── Education ──────────────────────────────────────────────────────────────
  'home tutor':
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&auto=format&fit=crop',
  tutor:
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&q=80&auto=format&fit=crop',
  'online tutor':
    'https://images.unsplash.com/photo-1588072432836-e10032774350?w=600&q=80&auto=format&fit=crop',
  'exam coaching':
    'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&q=80&auto=format&fit=crop',
  'language classes':
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80&auto=format&fit=crop',
  'music teacher':
    'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80&auto=format&fit=crop',
  'coding teacher':
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80&auto=format&fit=crop',

  // ── Beauty & Wellness ──────────────────────────────────────────────────────
  'salon at home':
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80&auto=format&fit=crop',
  'makeup artist':
    'https://images.unsplash.com/photo-1487412947147-5cebf100d293?w=600&q=80&auto=format&fit=crop',
  'fitness trainer':
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80&auto=format&fit=crop',
  'yoga trainer':
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80&auto=format&fit=crop',
  'personal grooming':
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80&auto=format&fit=crop',

  // ── Moving & Delivery ──────────────────────────────────────────────────────
  'packers & movers':
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop',
  'local delivery':
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80&auto=format&fit=crop',
  'loading/unloading':
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&auto=format&fit=crop',
  'furniture moving':
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&auto=format&fit=crop',
  'courier assistance':
    'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=600&q=80&auto=format&fit=crop',

  // ── Gardening & Outdoor ────────────────────────────────────────────────────
  gardener:
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80&auto=format&fit=crop',
  gardening:
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80&auto=format&fit=crop',
  landscaping:
    'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80&auto=format&fit=crop',
  'lawn care':
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop',
  'tree trimming':
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop',
  'garden maintenance':
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80&auto=format&fit=crop',

  // ── Pet Services ───────────────────────────────────────────────────────────
  'pet grooming':
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80&auto=format&fit=crop',
  'pet walking':
    'https://images.unsplash.com/photo-1504595403659-9088ce801e29?w=600&q=80&auto=format&fit=crop',
  'pet sitting':
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=600&q=80&auto=format&fit=crop',
  'pet training':
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80&auto=format&fit=crop',

  // ── Events & Creative ──────────────────────────────────────────────────────
  photographer:
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80&auto=format&fit=crop',
  videographer:
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80&auto=format&fit=crop',
  'event decoration':
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600&q=80&auto=format&fit=crop',
  catering:
    'https://images.unsplash.com/photo-1555244162-803834f70033?w=600&q=80&auto=format&fit=crop',
  dj:
    'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&q=80&auto=format&fit=crop',
  'event planner':
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80&auto=format&fit=crop',

  // ── Professional Services ──────────────────────────────────────────────────
  accountant:
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80&auto=format&fit=crop',
  'graphic designer':
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80&auto=format&fit=crop',
  'video editor':
    'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&q=80&auto=format&fit=crop',
  'digital marketing':
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80&auto=format&fit=crop',
  'web developer':
    'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600&q=80&auto=format&fit=crop',
  'legal/documentation assistance':
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&q=80&auto=format&fit=crop',

  // ── Construction & Building ────────────────────────────────────────────────
  'masonry & brickwork':
    'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&q=80&auto=format&fit=crop',
  'tile & marble laying':
    'https://images.unsplash.com/photo-1502005229762-ee1b2b8ab00f?w=600&q=80&auto=format&fit=crop',
  'plastering & pop work':
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80&auto=format&fit=crop',
  'concrete & foundation':
    'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=600&q=80&auto=format&fit=crop',
  'building renovation':
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80&auto=format&fit=crop',
  'roofing & waterproofing':
    'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=600&q=80&auto=format&fit=crop',
  'demolition & site clearance':
    'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=600&q=80&auto=format&fit=crop',
  construction:
    'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=600&q=80&auto=format&fit=crop',

  // ── Daily Wage Labour ──────────────────────────────────────────────────────
  'general construction labour':
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80&auto=format&fit=crop',
  'loading & unloading helpers':
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&auto=format&fit=crop',
  'shifting & moving labour':
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop',
  'digging & trenching':
    'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=600&q=80&auto=format&fit=crop',
  'debris & waste clearance':
    'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&q=80&auto=format&fit=crop',
  'event setup helpers':
    'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=600&q=80&auto=format&fit=crop',
  'factory & warehouse helpers':
    'https://images.unsplash.com/photo-1586528116493-a029325540fa?w=600&q=80&auto=format&fit=crop',

  // ── Agriculture & Farming ──────────────────────────────────────────────────
  'tractor driving & ploughing':
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600&q=80&auto=format&fit=crop',
  'crop harvesting & reaping':
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80&auto=format&fit=crop',
  'irrigation & borewell setup':
    'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=600&q=80&auto=format&fit=crop',
  'pesticide & fertilizer spraying':
    'https://images.unsplash.com/photo-1589923188900-85dae523342b?w=600&q=80&auto=format&fit=crop',
  'dairy & cattle care':
    'https://images.unsplash.com/photo-1546445317-29f4545e9d53?w=600&q=80&auto=format&fit=crop',
  'soil preparation & seeding':
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&q=80&auto=format&fit=crop',
  'fencing & farm protection':
    'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=600&q=80&auto=format&fit=crop',

  // ── Rural & Village Services ───────────────────────────────────────────────
  'borewell motor & pump repair':
    'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80&auto=format&fit=crop',
  'flour mill / atta chakki fix':
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80&auto=format&fit=crop',
  'solar panel & battery setup':
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&q=80&auto=format&fit=crop',
  'biogas plant maintenance':
    'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600&q=80&auto=format&fit=crop',
  'thresher & harvester repair':
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=600&q=80&auto=format&fit=crop',
  'cycle & rickshaw repair':
    'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&q=80&auto=format&fit=crop',
  'thatched & tin shed roofing':
    'https://images.unsplash.com/photo-1632759145351-1d592919f522?w=600&q=80&auto=format&fit=crop',

  // ── Welding & Fabrication ──────────────────────────────────────────────────
  'arc & tig welding':
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80&auto=format&fit=crop',
  'metal gate & grill fabrication':
    'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&q=80&auto=format&fit=crop',
  'railing & staircase welding':
    'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=600&q=80&auto=format&fit=crop',
  'shutter & door repair':
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80&auto=format&fit=crop',
  'shed & truss fabrication':
    'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=600&q=80&auto=format&fit=crop',
  'custom metal work':
    'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=600&q=80&auto=format&fit=crop',
  'rust cutting & patch welding':
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=80&auto=format&fit=crop',

  // ── Transport & Delivery ───────────────────────────────────────────────────
  'mini-truck / tata ace goods transport':
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&auto=format&fit=crop',
  'auto / tempo load shifting':
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop',
  'two-wheeler urgent parcel delivery':
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&q=80&auto=format&fit=crop',
  'furniture & appliance transport':
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80&auto=format&fit=crop',
  'building material transport':
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&auto=format&fit=crop',
  'intercity goods logistics':
    'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&q=80&auto=format&fit=crop',
  'cold storage goods transit':
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&auto=format&fit=crop',
  delivery:
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&auto=format&fit=crop',
};

// ─── Generic Fallback ─────────────────────────────────────────────────────────

export const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80&auto=format&fit=crop';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get a category cover photo by group id.
 * Falls back to FALLBACK_IMAGE if not mapped.
 */
export function getCategoryImage(groupId: string): string {
  return CATEGORY_IMAGES[groupId] ?? FALLBACK_IMAGE;
}

/**
 * Get a service-specific photo by service name (case-insensitive).
 * Falls back to the category image, then to FALLBACK_IMAGE.
 */
export function getServiceImage(
  serviceName?: string | null,
  categoryId?: string | null
): string {
  if (serviceName) {
    const key = serviceName.trim().toLowerCase();
    // exact match
    if (SERVICE_IMAGES[key]) return SERVICE_IMAGES[key];
    // partial match — find first key that is contained in the service name
    const partialKey = Object.keys(SERVICE_IMAGES).find(
      (k) => key.includes(k) || k.includes(key)
    );
    if (partialKey) return SERVICE_IMAGES[partialKey];
  }
  if (categoryId) {
    return getCategoryImage(categoryId);
  }
  return FALLBACK_IMAGE;
}
