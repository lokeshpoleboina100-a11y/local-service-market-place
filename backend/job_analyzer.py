import re
import math
from typing import Dict, Any, List, Optional, Tuple

# ---------------------------------------------------------------------------
# SERVICE CATALOG  — one entry per specific appliance / service
# ---------------------------------------------------------------------------
SERVICE_CATALOG = {
    # ── Mobile / Tech ───────────────────────────────────────────────────────
    "mobile_repair": {
        "group_id": "technology",
        "group_name": "Technology",
        "service_name": "Mobile Repair",
        "keywords": ["phone", "mobile", "smartphone", "screen", "display", "touch",
                     "battery", "iphone", "samsung", "android", "charging port",
                     "camera lens", "cracked", "glass", "digitizer"],
        "price_base": (800, 2000),
        "labour_range": (300, 500),
        "parts_range": (500, 1500),
        "duration_hours": (1.0, 3.0),
        "duration_display": "1–3 working hours",
        "factors": ["Screen technology (AMOLED vs LCD)", "Touch digitizer functionality",
                    "Original vs OEM replacement parts"],
    },
    # ── Plumbing ─────────────────────────────────────────────────────────────
    "plumbing": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "Plumber",
        "keywords": ["pipe", "leak", "water", "tap", "faucet", "drain", "sink",
                     "flush", "bathroom", "shower", "seepage", "clogged", "basin",
                     "plumbing", "drainage", "overflow", "leaking tap"],
        "price_base": (350, 1500),
        "labour_range": (300, 600),
        "parts_range": (50, 900),
        "duration_hours": (1.0, 2.5),
        "duration_display": "1–2.5 working hours",
        "factors": ["Pipe accessibility (concealed vs surface)",
                    "Replacement parts required (washers, cartridge, new trap)",
                    "Extent of leakage"],
    },
    # ── Carpentry ─────────────────────────────────────────────────────────────
    "carpentry": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "Carpenter",
        "keywords": ["door", "wood", "cupboard", "wardrobe", "drawer", "table",
                     "chair", "hinge", "furniture", "latch", "lock", "cabinet",
                     "shelf", "plywood", "bed", "sofa", "upholstery"],
        "price_base": (400, 2500),
        "labour_range": (350, 999),
        "parts_range": (100, 1500),
        "duration_hours": (2.0, 5.0),
        "duration_display": "2–5 working hours",
        "factors": ["Wood material and structural framing",
                    "Hinges, locks, and alignment hardware",
                    "Polishing or surface finishing requirements"],
    },
    # ── Electrical ────────────────────────────────────────────────────────────
    "electrical": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "Electrician",
        "keywords": ["switch", "wire", "spark", "breaker", "mcb", "light",
                     "socket", "wiring", "short circuit", "fuse", "power",
                     "switchboard", "inverter", "short"],
        "price_base": (300, 1500),
        "labour_range": (250, 600),
        "parts_range": (50, 900),
        "duration_hours": (1.0, 3.0),
        "duration_display": "1–3 working hours",
        "factors": ["Concealed vs open wiring",
                    "Number of faulty switches/points",
                    "Replacement circuit breaker/MCB ratings"],
    },
    # ── Ceiling / Exhaust Fan ─────────────────────────────────────────────────
    "fan_repair": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "Fan Repair",
        "keywords": ["fan", "ceiling fan", "exhaust fan", "fan noise", "fan not working",
                     "fan slow", "fan blade", "fan capacitor"],
        "price_base": (200, 900),
        "labour_range": (150, 400),
        "parts_range": (50, 500),
        "duration_hours": (0.5, 2.0),
        "duration_display": "30 min – 2 working hours",
        "factors": ["Capacitor vs motor failure",
                    "Fan model and blade size",
                    "Regulator / speed controller check"],
    },
    # ── AC / Air Conditioner ──────────────────────────────────────────────────
    "ac_repair": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "AC Repair",
        "keywords": ["ac", "air conditioner", "split ac", "window ac",
                     "air conditioning", "aircon", "gas refill", "compressor",
                     "ac cooling", "ac not cooling", "ac service"],
        "price_base": (599, 3200),
        "labour_range": (499, 800),
        "parts_range": (500, 2400),
        "duration_hours": (1.5, 3.5),
        "duration_display": "1.5–3.5 working hours",
        "factors": ["Refrigerant gas refill type (R32 / R410A)",
                    "Outdoor unit accessibility",
                    "Compressor electrical health"],
    },
    # ── Refrigerator / Fridge ─────────────────────────────────────────────────
    "refrigerator_repair": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "Refrigerator Repair",
        "keywords": ["fridge", "refrigerator", "not cooling", "fridge not cooling",
                     "refrigerator cooling", "freezer", "defrost", "fridge compressor",
                     "cooling problem fridge", "fridge repair"],
        "price_base": (450, 2200),
        "labour_range": (399, 700),
        "parts_range": (150, 1500),
        "duration_hours": (1.5, 4.0),
        "duration_display": "1.5–4 working hours",
        "factors": ["Compressor health (single-door vs double-door)",
                    "Thermostat / PCB board condition",
                    "Gas refill requirement (R600a / R134a)"],
    },
    # ── Washing Machine ───────────────────────────────────────────────────────
    "washing_machine_repair": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "Washing Machine Repair",
        "keywords": ["washing machine", "washer", "washing", "laundry machine",
                     "spin not working", "washing machine not draining",
                     "washing machine noise", "drum not spinning", "front load", "top load"],
        "price_base": (450, 2200),
        "labour_range": (399, 700),
        "parts_range": (150, 1500),
        "duration_hours": (1.5, 4.0),
        "duration_display": "1.5–4 working hours",
        "factors": ["Motor / belt / drum bearing failure",
                    "Control PCB board condition",
                    "Drain pump and filter blockage"],
    },
    # ── Microwave / Oven ──────────────────────────────────────────────────────
    "microwave_repair": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "Microwave Repair",
        "keywords": ["microwave", "oven", "microwave not working", "microwave heating",
                     "microwave turntable", "microwave door", "convection oven"],
        "price_base": (350, 1800),
        "labour_range": (300, 600),
        "parts_range": (150, 1200),
        "duration_hours": (1.0, 3.0),
        "duration_display": "1–3 working hours",
        "factors": ["Magnetron / capacitor condition",
                    "Control panel PCB",
                    "Door latch and safety interlock"],
    },
    # ── Geyser / Water Heater ─────────────────────────────────────────────────
    "geyser_repair": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "Geyser Repair",
        "keywords": ["geyser", "water heater", "geyser not heating", "hot water",
                     "geyser leaking", "instant geyser", "storage geyser"],
        "price_base": (350, 1600),
        "labour_range": (300, 600),
        "parts_range": (100, 1000),
        "duration_hours": (1.0, 2.5),
        "duration_display": "1–2.5 working hours",
        "factors": ["Element / thermostat failure",
                    "Inner tank corrosion",
                    "Pressure relief valve condition"],
    },
    # ── Mixer / Grinder ───────────────────────────────────────────────────────
    "mixer_repair": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "Mixer / Grinder Repair",
        "keywords": ["mixer", "grinder", "mixie", "mixer not working", "mixer grinding",
                     "juicer", "blender", "food processor"],
        "price_base": (200, 900),
        "labour_range": (150, 400),
        "parts_range": (50, 500),
        "duration_hours": (0.5, 1.5),
        "duration_display": "30 min – 1.5 working hours",
        "factors": ["Motor brushes / coupler failure",
                    "Jar seal and blade sharpness",
                    "Speed switch condition"],
    },
    # ── General Appliance (fallback) ──────────────────────────────────────────
    "appliance_repair": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "Appliance Repair",
        "keywords": ["appliance", "appliance not working", "home appliance",
                     "dishwasher", "chimney", "cooler", "dryer"],
        "price_base": (450, 2200),
        "labour_range": (399, 700),
        "parts_range": (150, 1500),
        "duration_hours": (1.5, 4.0),
        "duration_display": "1.5–4 working hours",
        "factors": ["Component failure (motor, PCB board, thermostat, drum)",
                    "Brand & model spare parts availability",
                    "Warranty/seal status"],
    },
    # ── Painting ──────────────────────────────────────────────────────────────
    "painting": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "Painter",
        "keywords": ["paint", "painting", "wall", "interior paint", "exterior",
                     "dampness", "primer", "putty", "waterproofing", "peeling paint"],
        "price_base": (1500, 8000),
        "labour_range": (1000, 4000),
        "parts_range": (500, 4000),
        "duration_hours": (8.0, 24.0),
        "duration_display": "1–3 working days",
        "factors": ["Surface area in square feet",
                    "Dampness/putty preparatory coat",
                    "Paint quality (acrylic vs emulsion)"],
    },
    # ── Cleaning ──────────────────────────────────────────────────────────────
    "cleaning": {
        "group_id": "home_services",
        "group_name": "Home Services",
        "service_name": "Cleaning",
        "keywords": ["cleaning", "deep clean", "bathroom cleaning", "kitchen cleaning",
                     "sofa cleaning", "floor", "dust", "sanitization", "dirty",
                     "stains", "interior"],
        "price_base": (500, 3000),
        "labour_range": (450, 2500),
        "parts_range": (50, 500),
        "duration_hours": (2.0, 6.0),
        "duration_display": "2–6 working hours",
        "factors": ["Number of rooms & square footage",
                    "Stain intensity on tiles or upholstery",
                    "Cleaning equipment & consumables"],
    },
    # ── Vehicle ───────────────────────────────────────────────────────────────
    "vehicle_repair": {
        "group_id": "automotive",
        "group_name": "Automotive",
        "service_name": "Car / Bike Repair",
        "keywords": ["car", "bike", "motorcycle", "vehicle", "engine", "puncture",
                     "tyre", "brake", "oil change", "battery jumpstart", "automotive",
                     "dent", "scooter"],
        "price_base": (450, 4000),
        "labour_range": (400, 1200),
        "parts_range": (200, 2800),
        "duration_hours": (1.5, 5.0),
        "duration_display": "1.5–5 working hours",
        "factors": ["Vehicle make & model complexity",
                    "Spare parts (OEM vs aftermarket)",
                    "On-site breakdown vs workshop servicing"],
    },
    # ── Gardening ─────────────────────────────────────────────────────────────
    "gardening": {
        "group_id": "gardening_outdoor",
        "group_name": "Gardening & Outdoor",
        "service_name": "Gardener",
        "keywords": ["garden", "gardening", "plant", "lawn", "grass", "tree",
                     "trimming", "pruning", "pot", "fertilizer", "soil", "landscaping"],
        "price_base": (450, 2200),
        "labour_range": (400, 1400),
        "parts_range": (100, 800),
        "duration_hours": (2.0, 5.0),
        "duration_display": "2–5 working hours",
        "factors": ["Lawn size and tree heights",
                    "Pruning tools required",
                    "Fertilizer and soil replenishment"],
    },
    # ── Construction & Building ───────────────────────────────────────────────
    "construction_building": {
        "group_id": "construction_building",
        "group_name": "Construction & Building",
        "service_name": "Masonry & Brickwork",
        "keywords": ["construction", "building", "brick", "brickwork", "cement",
                     "masonry", "mason", "tile", "marble", "plaster", "plastering",
                     "foundation", "concrete", "renovation", "waterproofing", "roofing",
                     "demolition", "civil work"],
        "price_base": (800, 8000),
        "labour_range": (600, 4000),
        "parts_range": (200, 4000),
        "duration_hours": (4.0, 24.0),
        "duration_display": "4 working hours – 3 days",
        "factors": ["Surface area and material specifications",
                    "Scaffolding or height access requirements",
                    "Demolition vs fresh construction"],
    },
    # ── Daily Wage Labour ─────────────────────────────────────────────────────
    "daily_wage_labour": {
        "group_id": "daily_wage_labour",
        "group_name": "Daily Wage Labour",
        "service_name": "General Construction Labour",
        "keywords": ["labour", "labor", "helper", "helpers", "loading", "unloading",
                     "shifting", "digging", "trenching", "coolie", "mazdoor",
                     "daily wage", "debris clearance", "waste clearance", "warehouse helper"],
        "price_base": (500, 2000),
        "labour_range": (500, 1800),
        "parts_range": (0, 200),
        "duration_hours": (4.0, 8.0),
        "duration_display": "Half day to full day",
        "factors": ["Weight of goods and floor level",
                    "Hours of physical effort required",
                    "Number of helpers needed"],
    },
    # ── Agriculture & Farming ─────────────────────────────────────────────────
    "agriculture_farming": {
        "group_id": "agriculture_farming",
        "group_name": "Agriculture & Farming",
        "service_name": "Tractor Driving & Ploughing",
        "keywords": ["tractor", "farm", "farming", "crop", "harvest", "harvesting",
                     "paddy", "wheat", "irrigation", "borewell setup", "pesticide",
                     "fertilizer spray", "cattle", "dairy", "seeding", "ploughing",
                     "agri", "farm fencing"],
        "price_base": (600, 5000),
        "labour_range": (500, 3000),
        "parts_range": (100, 2000),
        "duration_hours": (3.0, 12.0),
        "duration_display": "3–12 working hours",
        "factors": ["Acreage of farmland",
                    "Tractor and fuel inclusion",
                    "Crop type and season"],
    },
    # ── Rural & Village Services ──────────────────────────────────────────────
    "rural_village_services": {
        "group_id": "rural_village_services",
        "group_name": "Rural & Village Services",
        "service_name": "Borewell Motor & Pump Repair",
        "keywords": ["borewell", "borewell motor", "submersible pump", "pump repair",
                     "flour mill", "atta chakki", "solar panel", "village",
                     "biogas", "thresher", "rickshaw", "tin shed", "rural"],
        "price_base": (450, 3500),
        "labour_range": (400, 2000),
        "parts_range": (150, 1500),
        "duration_hours": (2.0, 6.0),
        "duration_display": "2–6 working hours",
        "factors": ["Depth of borewell pump",
                    "Motor rewinding or replacement components",
                    "Rural travel distance"],
    },
    # ── Welding & Fabrication ─────────────────────────────────────────────────
    "welding_fabrication": {
        "group_id": "welding_fabrication",
        "group_name": "Welding & Fabrication",
        "service_name": "Arc & TIG Welding",
        "keywords": ["welding", "weld", "welder", "fabrication", "grill", "metal gate",
                     "iron gate", "rolling shutter", "shutter repair", "railing",
                     "staircase", "steel shed", "metal work", "tig welding", "arc welding"],
        "price_base": (500, 4500),
        "labour_range": (400, 2500),
        "parts_range": (100, 2000),
        "duration_hours": (2.0, 8.0),
        "duration_display": "2–8 working hours",
        "factors": ["Metal gauge and type (mild steel vs stainless steel)",
                    "Welding rods and equipment consumables",
                    "On-site power connection"],
    },
    # ── Transport & Delivery ──────────────────────────────────────────────────
    "transport_delivery": {
        "group_id": "transport_delivery",
        "group_name": "Transport & Delivery",
        "service_name": "Mini-Truck / Tata Ace Goods Transport",
        "keywords": ["truck", "mini-truck", "tata ace", "tempo", "transport",
                     "goods transport", "parcel", "courier", "goods delivery",
                     "cargo", "furniture transport", "load shifting", "tempo shifting"],
        "price_base": (400, 3500),
        "labour_range": (350, 2000),
        "parts_range": (50, 1500),
        "duration_hours": (1.0, 6.0),
        "duration_display": "1–6 working hours",
        "factors": ["Distance in kilometers",
                    "Vehicle capacity (Tata Ace, 407, pickup)",
                    "Loading & unloading assistance included"],
    },
}

# ---------------------------------------------------------------------------
# Priority order — more specific entries are checked before generic fallbacks.
# The list order matters: first match wins in case of ties.
# ---------------------------------------------------------------------------
_PRIORITY_ORDER = [
    # Specific appliances BEFORE generic "appliance_repair"
    "refrigerator_repair",
    "washing_machine_repair",
    "microwave_repair",
    "geyser_repair",
    "mixer_repair",
    "ac_repair",
    "fan_repair",
    # Tech
    "mobile_repair",
    # Trades & Heavy Services
    "welding_fabrication",
    "construction_building",
    "daily_wage_labour",
    "agriculture_farming",
    "rural_village_services",
    "transport_delivery",
    "plumbing",
    "carpentry",
    "electrical",
    "vehicle_repair",
    "painting",
    "cleaning",
    "gardening",
    # Generic fallback
    "appliance_repair",
]

# ---------------------------------------------------------------------------
# Keyword intent scorer
# ---------------------------------------------------------------------------
def analyze_text_intent(text: str) -> Optional[Tuple[str, float]]:
    if not text or len(text.strip()) < 3:
        return None

    lower_text = text.lower()
    scores: Dict[str, float] = {}

    for key in _PRIORITY_ORDER:
        spec = SERVICE_CATALOG[key]
        score = 0.0
        for kw in spec["keywords"]:
            if re.search(r'\b' + re.escape(kw) + r'\b', lower_text):
                score += 3.0 if len(kw) > 6 else 2.0   # longer phrase = higher weight
            elif kw in lower_text:
                score += 1.0
        if score > 0:
            scores[key] = score

    if not scores:
        return None

    best_key = max(scores, key=lambda k: scores[k])
    best_score = scores[best_key]

    if best_score < 1.5:
        return None

    confidence = min(96.0, 70.0 + best_score * 3.5)
    return best_key, confidence


# ---------------------------------------------------------------------------
# Dynamic title / description / professional builder (appliance-aware)
# ---------------------------------------------------------------------------
def _build_title_and_meta(selected_key: str, combined_text: str, cleaned_text: str) -> Dict[str, str]:
    """Returns title, problem_type, and required_professional for a matched service key."""
    lc = combined_text.lower()

    # ── Mobile ─────────────────────────────────────────────────────────────
    if selected_key == "mobile_repair":
        if "crack" in lc or "screen" in lc or "display" in lc or "glass" in lc:
            return {
                "title": "Mobile Screen Cracked — Replacement Required",
                "problem_type": "Screen crack / display failure",
                "professional": "Mobile Display Technician",
            }
        if "charg" in lc or "port" in lc:
            return {
                "title": "Mobile Charging Problem — Repair Needed",
                "problem_type": "Charging port / power IC failure",
                "professional": "Mobile Repair Technician",
            }
        if "camera" in lc:
            return {
                "title": "Mobile Camera Not Working — Repair Required",
                "problem_type": "Camera module failure",
                "professional": "Mobile Repair Technician",
            }
        if "battery" in lc:
            return {
                "title": "Mobile Battery Draining Fast — Replacement Needed",
                "problem_type": "Battery degradation",
                "professional": "Mobile Repair Technician",
            }
        return {
            "title": "Mobile Phone Diagnostics & Repair Service",
            "problem_type": "General mobile phone fault",
            "professional": "Mobile Repair Technician",
        }

    # ── Plumbing ────────────────────────────────────────────────────────────
    if selected_key == "plumbing":
        if "tap" in lc or "faucet" in lc:
            return {
                "title": "Leaking Tap Repair — Plumber Required",
                "problem_type": "Tap / faucet dripping",
                "professional": "Certified Plumber",
            }
        if "drain" in lc or "clog" in lc or "block" in lc:
            return {
                "title": "Blocked Drain Clearance — Plumber Required",
                "problem_type": "Drain / pipeline blockage",
                "professional": "Certified Plumber",
            }
        if "kitchen" in lc or "sink" in lc:
            return {
                "title": "Kitchen Sink Leak — Plumber Required",
                "problem_type": "Kitchen sink / pipe leakage",
                "professional": "Certified Plumber",
            }
        if "bathroom" in lc or "flush" in lc or "toilet" in lc:
            return {
                "title": "Bathroom Pipe or Flush Repair Required",
                "problem_type": "Bathroom plumbing fault",
                "professional": "Certified Plumber",
            }
        return {
            "title": "Leaking Water Pipe — Plumber Required",
            "problem_type": "Water pipe leakage",
            "professional": "Certified Plumber",
        }

    # ── Carpentry ───────────────────────────────────────────────────────────
    if selected_key == "carpentry":
        if "sofa" in lc or "upholstery" in lc:
            return {
                "title": "Sofa Upholstery Repair Required",
                "problem_type": "Torn / damaged upholstery",
                "professional": "Upholstery / Carpenter",
            }
        if "cupboard" in lc or "cabinet" in lc or "wardrobe" in lc:
            return {
                "title": "Wooden Cupboard Repair Required",
                "problem_type": "Cupboard hinge / structural damage",
                "professional": "Experienced Carpenter",
            }
        if "door" in lc:
            return {
                "title": "Wooden Door Repair — Carpenter Required",
                "problem_type": "Door hinge / alignment / lock fault",
                "professional": "Experienced Carpenter",
            }
        if "bed" in lc:
            return {
                "title": "Bed Frame Repair Required",
                "problem_type": "Bed frame / joint structural damage",
                "professional": "Experienced Carpenter",
            }
        return {
            "title": "Wooden Furniture Repair Required",
            "problem_type": "Wooden structure / hinge damage",
            "professional": "Experienced Carpenter",
        }

    # ── Electrical ──────────────────────────────────────────────────────────
    if selected_key == "electrical":
        if "switch" in lc or "switchboard" in lc:
            return {
                "title": "Broken Electrical Switch — Electrician Required",
                "problem_type": "Switch / socket fault",
                "professional": "Licensed Electrician",
            }
        if "short" in lc or "spark" in lc:
            return {
                "title": "Short Circuit or Sparking — Urgent Electrician Needed",
                "problem_type": "Short circuit / wiring fault",
                "professional": "Licensed Electrician",
            }
        return {
            "title": "Electrical Fault — Electrician Required",
            "problem_type": "Electrical wiring / circuit fault",
            "professional": "Licensed Electrician",
        }

    # ── Fan ─────────────────────────────────────────────────────────────────
    if selected_key == "fan_repair":
        if "noise" in lc or "sound" in lc or "vibrat" in lc:
            return {
                "title": "Fan Making Noise — Inspection and Repair Needed",
                "problem_type": "Fan bearing noise / imbalance",
                "professional": "Electrician / Appliance Technician",
            }
        if "slow" in lc or "speed" in lc:
            return {
                "title": "Ceiling Fan Running Slow — Capacitor Repair Needed",
                "problem_type": "Fan speed / capacitor issue",
                "professional": "Electrician / Appliance Technician",
            }
        return {
            "title": "Fan Not Working — Repair Required",
            "problem_type": "Fan electrical / motor fault",
            "professional": "Electrician / Appliance Technician",
        }

    # ── AC ──────────────────────────────────────────────────────────────────
    if selected_key == "ac_repair":
        if "gas" in lc or "refill" in lc:
            return {
                "title": "AC Gas Refill Required",
                "problem_type": "AC refrigerant gas shortage",
                "professional": "HVAC / AC Technician",
            }
        if "compressor" in lc:
            return {
                "title": "AC Compressor Fault — Repair Required",
                "problem_type": "AC compressor failure",
                "professional": "HVAC / AC Technician",
            }
        return {
            "title": "Air Conditioner Not Cooling — Repair Required",
            "problem_type": "AC cooling deficiency",
            "professional": "HVAC / AC Technician",
        }

    # ── Refrigerator ────────────────────────────────────────────────────────
    if selected_key == "refrigerator_repair":
        if "not cool" in lc or "not cooling" in lc or "cooling" in lc:
            return {
                "title": "Refrigerator Not Cooling — Repair Needed",
                "problem_type": "Refrigerator cooling failure",
                "professional": "Refrigerator Repair Technician",
            }
        if "freez" in lc:
            return {
                "title": "Refrigerator Freezer Problem — Repair Needed",
                "problem_type": "Freezer / defrost system failure",
                "professional": "Refrigerator Repair Technician",
            }
        if "leak" in lc or "water" in lc:
            return {
                "title": "Refrigerator Water Leak — Repair Needed",
                "problem_type": "Refrigerator water leakage / drain blockage",
                "professional": "Refrigerator Repair Technician",
            }
        return {
            "title": "Refrigerator Repair Required",
            "problem_type": "Refrigerator general fault",
            "professional": "Refrigerator Repair Technician",
        }

    # ── Washing Machine ─────────────────────────────────────────────────────
    if selected_key == "washing_machine_repair":
        if "spin" in lc or "drum" in lc:
            return {
                "title": "Washing Machine Not Spinning — Repair Needed",
                "problem_type": "Washing machine drum / spin failure",
                "professional": "Washing Machine Repair Technician",
            }
        if "drain" in lc or "water" in lc:
            return {
                "title": "Washing Machine Not Draining — Repair Needed",
                "problem_type": "Washing machine drain pump failure",
                "professional": "Washing Machine Repair Technician",
            }
        if "noise" in lc or "vibrat" in lc:
            return {
                "title": "Washing Machine Making Noise — Repair Needed",
                "problem_type": "Washing machine bearing / imbalance noise",
                "professional": "Washing Machine Repair Technician",
            }
        return {
            "title": "Washing Machine Repair Required",
            "problem_type": "Washing machine general fault",
            "professional": "Washing Machine Repair Technician",
        }

    # ── Microwave ───────────────────────────────────────────────────────────
    if selected_key == "microwave_repair":
        return {
            "title": "Microwave Not Working — Repair Required",
            "problem_type": "Microwave heating / control failure",
            "professional": "Microwave / Appliance Technician",
        }

    # ── Geyser ──────────────────────────────────────────────────────────────
    if selected_key == "geyser_repair":
        return {
            "title": "Geyser Not Heating Water — Repair Required",
            "problem_type": "Geyser element / thermostat failure",
            "professional": "Geyser / Appliance Technician",
        }

    # ── Mixer / Grinder ─────────────────────────────────────────────────────
    if selected_key == "mixer_repair":
        return {
            "title": "Mixer / Grinder Not Working — Repair Required",
            "problem_type": "Mixer motor / coupler failure",
            "professional": "Small Appliance Repair Technician",
        }

    # ── Generic appliance ───────────────────────────────────────────────────
    if selected_key == "appliance_repair":
        return {
            "title": "Home Appliance Repair Required",
            "problem_type": "Appliance general fault — diagnostic required",
            "professional": "Home Appliance Repair Specialist",
        }

    # ── Painting ────────────────────────────────────────────────────────────
    if selected_key == "painting":
        return {
            "title": "Interior Wall Painting Required",
            "problem_type": "Interior wall painting & putty coat",
            "professional": "Professional Painter",
        }

    # ── Cleaning ────────────────────────────────────────────────────────────
    if selected_key == "cleaning":
        return {
            "title": "Deep House Cleaning Service Required",
            "problem_type": "Deep interior cleaning requirement",
            "professional": "Professional Cleaning Crew",
        }

    # ── Vehicle ─────────────────────────────────────────────────────────────
    if selected_key == "vehicle_repair":
        if "car" in lc:
            return {
                "title": "Car Repair & Servicing Required",
                "problem_type": "Car mechanical / electrical fault",
                "professional": "Automotive Mechanic",
            }
        if "bike" in lc or "motorcycle" in lc or "scooter" in lc:
            return {
                "title": "Bike / Motorcycle Repair Required",
                "problem_type": "Bike engine / brake / electrical fault",
                "professional": "Motorcycle Mechanic",
            }
        if "puncture" in lc or "tyre" in lc or "tire" in lc:
            return {
                "title": "Vehicle Tyre Puncture Repair Required",
                "problem_type": "Tyre puncture / flat tyre",
                "professional": "Automotive Mechanic",
            }
        return {
            "title": "Vehicle Repair & Servicing Required",
            "problem_type": "Vehicle mechanical / electrical fault",
            "professional": "Automotive Mechanic",
        }

    # ── Gardening ───────────────────────────────────────────────────────────
    if selected_key == "gardening":
        return {
            "title": "Garden Maintenance & Plant Trimming Required",
            "problem_type": "Garden / lawn maintenance",
            "professional": "Professional Gardener",
        }

    spec = SERVICE_CATALOG[selected_key]
    return {
        "title": f"{spec['service_name']} Required",
        "problem_type": f"{spec['service_name']} — diagnostic required",
        "professional": f"{spec['service_name']} Specialist",
    }


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------
def detect_service_from_multimodal(
    product_category: Optional[str],
    damage_type: Optional[str],
    text: Optional[str]
) -> Dict[str, Any]:
    cleaned_text = (text or "").strip()
    combined_text = f"{product_category or ''} {damage_type or ''} {cleaned_text}".strip().lower()

    # Ambiguity guard
    generic_words = {"fix", "help", "broken", "repair", "please", "issue",
                     "problem", "work", "need", "do", "it"}
    words = re.findall(r'[a-zA-Z]+', cleaned_text.lower())
    non_generic = [w for w in words if w not in generic_words]

    if not product_category and (len(cleaned_text) < 6 or (len(words) <= 3 and len(non_generic) == 0)):
        return {
            "group_id": "other",
            "group_name": "Other Services",
            "service_name": "General Service",
            "is_new_category": True,
            "suggested_title": cleaned_text.title() if cleaned_text else "General Service Request",
            "suggested_description": "Please provide more details about the required repair or upload a clear photo of the item.",
            "estimated_price": {
                "min": 300, "max": 1500, "typical": 700,
                "labour_estimate": "₹300 – ₹600",
                "materials_estimate": "Subject to inspection",
                "factors": ["Awaiting customer clarification on specific work"]
            },
            "estimated_duration": {
                "min_hours": 1.0, "max_hours": 3.0,
                "display": "1–3 working hours", "type": "working_hours"
            },
            "confidence": 40.0,
            "data_source": "Preliminary estimate (clarification required)",
            "is_ambiguous": True,
            "clarification_prompt": "Unable to identify the service clearly. Please describe what needs to be fixed or upload a photo."
        }

    # 1. Text keyword search (priority-ordered)
    text_match = analyze_text_intent(combined_text)

    # 2. Vision category matching
    cat_match = None
    if product_category:
        p_lower = product_category.lower()
        if "mobile" in p_lower or "phone" in p_lower or "cellular" in p_lower:
            cat_match = "mobile_repair"
        elif "laptop" in p_lower or "screen" in p_lower:
            cat_match = "mobile_repair"
        elif "fridge" in p_lower or "refrigerator" in p_lower:
            cat_match = "refrigerator_repair"
        elif "washing" in p_lower or "washer" in p_lower:
            cat_match = "washing_machine_repair"
        elif "microwave" in p_lower or "oven" in p_lower:
            cat_match = "microwave_repair"
        elif "geyser" in p_lower or "water heater" in p_lower:
            cat_match = "geyser_repair"
        elif "mixer" in p_lower or "grinder" in p_lower:
            cat_match = "mixer_repair"
        elif "appliance" in p_lower:
            cat_match = "appliance_repair"
        elif "furniture" in p_lower or "chair" in p_lower:
            cat_match = "carpentry"
        elif "pipe" in p_lower:
            cat_match = "plumbing"
        elif "fan" in p_lower:
            cat_match = "fan_repair"

    selected_key = text_match[0] if text_match else cat_match

    # Unlisted / new category
    if not selected_key:
        extracted = [w.capitalize() for w in non_generic if len(w) > 3][:2]
        service_label = (" ".join(extracted) + " Repair / Service") if extracted else "Specialized Service"
        return {
            "group_id": "other",
            "group_name": "Other Services",
            "service_name": service_label,
            "is_new_category": True,
            "suggested_title": f"{service_label} required",
            "suggested_description": (
                f"Customer requests assistance with: {cleaned_text}.\n\n"
                "Scope of Work:\n"
                "- On-site diagnostic inspection of the item\n"
                "- Evaluation of repair feasibility and spare parts\n"
                "- Service execution upon customer approval\n\n"
                "Note: Please inspect item on-site and confirm final quotation."
            ),
            "estimated_price": {
                "min": 499, "max": 2499, "typical": 1200,
                "labour_estimate": "₹400 – ₹800",
                "materials_estimate": "Variable depending on parts/materials",
                "factors": ["Specialized equipment / parts availability",
                            "Job scope and technical complexity"]
            },
            "estimated_duration": {
                "min_hours": 1.5, "max_hours": 4.0,
                "display": "2–4 working hours", "type": "working_hours"
            },
            "confidence": 75.0,
            "data_source": "General benchmark reference data (approximate)",
            "is_ambiguous": False,
            "clarification_prompt": None
        }

    spec = SERVICE_CATALOG[selected_key]
    meta = _build_title_and_meta(selected_key, combined_text, cleaned_text)

    suggested_title = meta["title"]

    # Structured description
    desc_lines = [
        f"**Reported Problem:** {cleaned_text if len(cleaned_text) > 5 else suggested_title}.",
        f"**Service Required:** {meta['professional']} under {spec['group_name']}.",
    ]
    if damage_type:
        desc_lines.append(f"**Identified Damage from Photo:** {damage_type}.")
    desc_lines.extend([
        "**Expected Scope of Work:**",
        "- Diagnostic check of affected component",
        "- Repair or replacement of damaged components",
        "- Functional testing and verification before handover",
        "**Customer Notes:** Please provide a transparent estimate of labour vs materials before starting."
    ])
    suggested_description = "\n".join(desc_lines)

    p_min, p_max = spec["price_base"]
    p_typical = int((p_min + p_max) / 2)
    l_min, l_max = spec["labour_range"]
    m_min, m_max = spec["parts_range"]
    confidence = text_match[1] if text_match else 90.0

    return {
        "group_id": spec["group_id"],
        "group_name": spec["group_name"],
        "service_name": spec["service_name"],
        "is_new_category": False,
        "suggested_title": suggested_title,
        "suggested_description": suggested_description,
        "estimated_price": {
            "min": p_min,
            "max": p_max,
            "typical": p_typical,
            "labour_estimate": f"₹{l_min:,} – ₹{l_max:,}",
            "materials_estimate": f"₹{m_min:,} – ₹{m_max:,} (approximate — subject to inspection)",
            "factors": spec["factors"]
        },
        "estimated_duration": {
            "min_hours": spec["duration_hours"][0],
            "max_hours": spec["duration_hours"][1],
            "display": spec["duration_display"],
            "type": "working_hours" if spec["duration_hours"][1] <= 8 else "working_days"
        },
        "confidence": round(confidence, 1),
        "data_source": "Marketplace benchmark data (approximate — verify with technician)",
        "is_ambiguous": False,
        "clarification_prompt": None
    }
