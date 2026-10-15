import re
from typing import Dict, Any, Optional, Tuple
from job_analyzer import SERVICE_CATALOG, detect_service_from_multimodal

# ---------------------------------------------------------------------------
# Language registry
# ---------------------------------------------------------------------------
LANGUAGES = {
    "te": {"code": "te", "name": "Telugu",  "native": "తెలుగు",    "bcp47": "te-IN"},
    "ta": {"code": "ta", "name": "Tamil",   "native": "தமிழ்",     "bcp47": "ta-IN"},
    "hi": {"code": "hi", "name": "Hindi",   "native": "हिन्दी",    "bcp47": "hi-IN"},
    "en": {"code": "en", "name": "English", "native": "English",   "bcp47": "en-IN"},
}

# ---------------------------------------------------------------------------
# Multilingual intent dictionary — ONE entry per specific appliance/service.
#
# ORDER MATTERS: more specific intents listed BEFORE generic ones.
# The matcher stops at the first intent whose patterns match the transcript.
# ---------------------------------------------------------------------------
MULTILINGUAL_INTENTS = [

    # ── 1. Mobile — Charging ─────────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"ఛార్జింగ్", r"ఛార్జ్", r"చార్జింగ్", r"ఛార్జ్ అవ్వడం లేదు",
                   r"ఛార్జింగ్ ప్రాబ్లం", r"మొబైల్ ఛార్జింగ్", r"ఛార్జ్ కాదు"],
            "ta": [r"சார்ஜ்", r"சார்ஜிங்", r"சார்ஜ் ஆகவில்லை", r"சார்ஜர்",
                   r"மொபைல் சார்ஜ்", r"சார்ஜ் ஆகல"],
            "hi": [r"चार्ज", r"चार्जिंग", r"चार्ज नहीं हो रहा", r"चार्जर",
                   r"मोबाइल चार्जिंग", r"चार्ज नहीं"],
            "en": [r"charging", r"not charging", r"charger port", r"charging issue",
                   r"battery charge", r"charge problem", r"won't charge"],
        },
        "target_service": "mobile_repair",
        "problem_type": "Charging port / power IC failure",
        "required_professional": "Mobile Repair Technician",
        "title": "Mobile Charging Problem — Repair Needed",
        "description": "My mobile phone is not charging properly. I need a technician to inspect and repair the charging port connector or power IC.",
        "factors": ["Charging port pin damage", "Battery degradation", "Motherboard power IC health"],
        "price_base": (400, 1500),
        "duration": "1–2 working hours",
    },

    # ── 2. Mobile — Screen / Display ────────────────────────────────────────
    {
        "patterns": {
            "te": [r"డిస్ప్లే", r"స్క్రీన్", r"పగిలిపోయింది", r"స్క్రీన్ పగిలింది",
                   r"టచ్ పనిచేయడం లేదు", r"గాజు పగిలింది"],
            "ta": [r"டிஸ்ப்ளே", r"திரை", r"உடைந்துவிட்டது", r"டச் வேலை செய்யவில்லை",
                   r"திரை உடைந்தது"],
            "hi": [r"डिस्प्ले", r"स्क्रीन", r"टूट गई", r"स्क्रीन टूट गई",
                   r"टच काम नहीं कर रहा", r"कांच टूट गया"],
            "en": [r"screen", r"display", r"cracked", r"touch not working",
                   r"broken screen", r"glass shattered", r"screen crack"],
        },
        "target_service": "mobile_repair",
        "problem_type": "Screen crack & touch failure",
        "required_professional": "Mobile Display Technician",
        "title": "Mobile Screen Cracked — Replacement Required",
        "description": "My mobile phone screen is cracked and requires replacement. Looking for a skilled technician to replace the display panel.",
        "factors": ["Screen type (OLED vs LCD)", "Frame bending", "Original vs OEM display part"],
        "price_base": (800, 2500),
        "duration": "1–3 working hours",
    },

    # ── 5. Air Conditioner ──────────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"ఏసి", r"ఏసీ", r"ఎయిర్ కండీషనర్", r"ఏసీ కూలింగ్ లేదు",
                   r"ఏసి పని చేయడం లేదు", r"గ్యాస్ లీక్", r"ఏసి గ్యాస్"],
            "ta": [r"ஏசி", r"ஏர் கண்டிஷனர்", r"கூலிங் வரவில்லை",
                   r"ஏசி குளிர்விக்கவில்லை", r"கம்ப்ரசர்"],
            "hi": [r"एसी", r"एयर कंडीशनर", r"एसी कूलिंग नहीं",
                   r"गैस खत्म", r"कंप्रेसर", r"एसी काम नहीं कर रहा"],
            "en": [r"air conditioner", r"air conditioning",
                   r"ac not cooling", r"ac is not cooling",
                   r"ac repair", r"ac service", r"ac problem",
                   r"gas refill", r"compressor issue",
                   r"\bac\b", r"split ac", r"window ac", r"\baircon\b"],
        },
        "target_service": "ac_repair",
        "problem_type": "AC cooling deficiency / gas leak",
        "required_professional": "HVAC / AC Technician",
        "title": "Air Conditioner Not Cooling — Repair Required",
        "description": "Air conditioner is running but not providing adequate cooling. Need an AC technician for gas pressure inspection, filter cleaning, and compressor diagnostics.",
        "factors": ["Gas recharge type (R32 / R410A)",
                    "Indoor coil vs outdoor compressor leak",
                    "Copper piping condition"],
        "price_base": (599, 3200),
        "duration": "1.5–3 working hours",
    },

    # ── 3. Refrigerator / Fridge ────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"ఫ్రిజ్", r"ఫ్రిజ్ చల్లగా లేదు", r"రెఫ్రిజరేటర్",
                   r"ఫ్రిజ్ కూలింగ్", r"చల్లబడడం లేదు", r"ఫ్రిజ్ పని చేయడం లేదు"],
            "ta": [r"ஃப்ரிட்ஜ்", r"பிரிட்ஜ்", r"குளிரூட்டி",
                   r"குளிர் வரவில்லை", r"ஃப்ரிட்ஜ் குளிர்விக்கவில்லை",
                   r"ரெஃப்ரிஜிரேட்டர்"],
            "hi": [r"फ्रिज", r"रेफ्रिजरेटर", r"फ्रिज ठंडा नहीं",
                   r"कूलिंग नहीं", r"फ्रिज काम नहीं कर रहा",
                   r"फ्रिज की कूलिंग"],
            "en": [r"fridge", r"refrigerator", r"fridge not cooling",
                   r"fridge repair", r"refrigerator cooling", r"freezer",
                   r"fridge compressor", r"fridge problem"],
        },
        "target_service": "refrigerator_repair",
        "problem_type": "Refrigerator cooling failure",
        "required_professional": "Refrigerator Repair Technician",
        "title": "Refrigerator Not Cooling — Repair Needed",
        "description": "My refrigerator is not cooling properly. I need a technician to inspect the compressor, thermostat, gas level, and PCB board.",
        "factors": ["Compressor health", "Thermostat / PCB board condition",
                    "Gas refill requirement (R600a / R134a)"],
        "price_base": (450, 2200),
        "duration": "1.5–4 working hours",
    },

    # ── 4. Washing Machine ──────────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"వాషింగ్ మెషిన్", r"వాషింగ్", r"లాండ్రీ", r"బట్టలు ఉతకడం",
                   r"మెషిన్ తిరగడం లేదు", r"మెషిన్ డ్రెయిన్ కాదు"],
            "ta": [r"வாஷிங் மெஷின்", r"துணி துவைக்கும் இயந்திரம்",
                   r"வாஷிங்", r"சுழலவில்லை", r"ஸ்பின் ஆகவில்லை"],
            "hi": [r"वाशिंग मशीन", r"कपड़े धोने की मशीन",
                   r"वाशिंग", r"स्पिन नहीं", r"मशीन नहीं घूम रही",
                   r"ड्रेन नहीं"],
            "en": [r"washing machine", r"washer", r"laundry machine",
                   r"spin not working", r"drum not spinning",
                   r"washing machine not draining", r"front load", r"top load"],
        },
        "target_service": "washing_machine_repair",
        "problem_type": "Washing machine drum / motor failure",
        "required_professional": "Washing Machine Repair Technician",
        "title": "Washing Machine Repair Required",
        "description": "My washing machine is not working properly. I need a technician to inspect the motor, drum, drain pump, and PCB board.",
        "factors": ["Motor / belt / drum bearing failure",
                    "Control PCB board condition",
                    "Drain pump and filter blockage"],
        "price_base": (450, 2200),
        "duration": "1.5–4 working hours",
    },

    # ── 6. Fan ──────────────────────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"ఫ్యాన్", r"సీలింగ్ ఫ్యాన్", r"ఫ్యాన్ శబ్దం",
                   r"ఫ్యాన్ తిరగడం లేదు", r"ఫ్యాన్ స్లో"],
            "ta": [r"விசிறி", r"மின்விசிறி", r"சீலிங் ஃபேன்",
                   r"விசிறி சத்தம்", r"விசிறி வேலை செய்யவில்லை"],
            "hi": [r"पंखा", r"सीलिंग फैन", r"पंखा शोर", r"पंखा नहीं चल रहा",
                   r"पंखा धीमा"],
            "en": [r"fan", r"ceiling fan", r"exhaust fan", r"fan noise",
                   r"fan not working", r"fan slow", r"fan capacitor"],
        },
        "target_service": "fan_repair",
        "problem_type": "Fan bearing noise / capacitor failure",
        "required_professional": "Electrician / Appliance Technician",
        "title": "Fan Not Working — Inspection and Repair Needed",
        "description": "My ceiling fan is not working properly or making noise. Need a technician to inspect the capacitor, bearings, and winding.",
        "factors": ["Capacitor vs motor failure",
                    "Fan model and blade size",
                    "Regulator / speed controller check"],
        "price_base": (200, 900),
        "duration": "30 min – 2 working hours",
    },

    # ── 7. Geyser / Water Heater ────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"గీజర్", r"వాటర్ హీటర్", r"వేడి నీళ్లు రావడం లేదు",
                   r"గీజర్ పని చేయడం లేదు"],
            "ta": [r"கீசர்", r"வாட்டர் ஹீட்டர்", r"சூடான தண்ணீர் வரவில்லை"],
            "hi": [r"गीजर", r"वाटर हीटर", r"गर्म पानी नहीं",
                   r"गीजर काम नहीं कर रहा"],
            "en": [r"geyser", r"water heater", r"geyser not heating",
                   r"hot water not coming", r"geyser leaking"],
        },
        "target_service": "geyser_repair",
        "problem_type": "Geyser element / thermostat failure",
        "required_professional": "Geyser / Appliance Technician",
        "title": "Geyser Not Heating Water — Repair Required",
        "description": "My geyser is not providing hot water. Need a technician to check the heating element, thermostat, and safety valve.",
        "factors": ["Element / thermostat failure",
                    "Inner tank corrosion",
                    "Pressure relief valve condition"],
        "price_base": (350, 1600),
        "duration": "1–2.5 working hours",
    },

    # ── 8. Mixer / Grinder ──────────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"మిక్సీ", r"గ్రైండర్", r"మిక్సర్", r"మిక్సీ పని చేయడం లేదు"],
            "ta": [r"மிக்ஸி", r"கிரைண்டர்", r"மிக்ஸர்",
                   r"மிக்ஸி வேலை செய்யவில்லை"],
            "hi": [r"मिक्सर", r"मिक्सी", r"ग्राइंडर",
                   r"मिक्सर काम नहीं कर रहा"],
            "en": [r"mixer", r"grinder", r"mixie", r"mixer not working",
                   r"blender", r"juicer"],
        },
        "target_service": "mixer_repair",
        "problem_type": "Mixer motor / coupler failure",
        "required_professional": "Small Appliance Repair Technician",
        "title": "Mixer / Grinder Not Working — Repair Required",
        "description": "My mixer/grinder is not working. Need a technician to check the motor brushes, coupler, and speed switch.",
        "factors": ["Motor brushes / coupler failure",
                    "Jar seal and blade sharpness",
                    "Speed switch condition"],
        "price_base": (200, 900),
        "duration": "30 min – 1.5 working hours",
    },

    # ── 9. Microwave ────────────────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"మైక్రోవేవ్", r"ఓవెన్", r"మైక్రోవేవ్ పని చేయడం లేదు"],
            "ta": [r"மைக்ரோவேவ்", r"ஓவன்", r"மைக்ரோவேவ் வேலை செய்யவில்லை"],
            "hi": [r"माइक्रोवेव", r"ओवन", r"माइक्रोवेव काम नहीं कर रहा"],
            "en": [r"microwave", r"oven", r"microwave not working",
                   r"microwave heating", r"convection oven"],
        },
        "target_service": "microwave_repair",
        "problem_type": "Microwave heating / control failure",
        "required_professional": "Microwave / Appliance Technician",
        "title": "Microwave Not Working — Repair Required",
        "description": "My microwave is not working or heating food properly. Need a technician to inspect the magnetron, capacitor, and control panel.",
        "factors": ["Magnetron / capacitor condition",
                    "Control panel PCB",
                    "Door latch and safety interlock"],
        "price_base": (350, 1800),
        "duration": "1–3 working hours",
    },

    # ── 10. Plumbing — Tap ──────────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"నల్లా కారుతోంది", r"నల్లా లీక్", r"ట్యాప్ కారుతోంది",
                   r"నల్లా", r"ట్యాప్", r"పైపు లీక్", r"నీళ్లు కారుతున్నాయి",
                   r"డ్రైనేజీ", r"సింక్", r"బ్లాక్"],
            "ta": [r"குழாய் கசிவு", r"குழாய் லீக்", r"தண்ணீர் கசிகிறது",
                   r"குழாய்", r"சமையலறை சிங்", r"டாய்லெட்"],
            "hi": [r"नल", r"नल टपक रहा", r"पाइप लीक", r"टपकना",
                   r"सिंक", r"पानी टपक"],
            "en": [r"tap", r"leaking tap", r"faucet dripping", r"pipe leak",
                   r"water leakage", r"sink", r"drain", r"clogged", r"plumbing"],
        },
        "target_service": "plumbing",
        "problem_type": "Water pipe / tap leakage",
        "required_professional": "Certified Plumber",
        "title": "Leaking Tap / Water Pipe — Plumber Required",
        "description": "There is a water leak from a tap or pipe. Need an experienced plumber to inspect, replace washers/valves, and seal the leak.",
        "factors": ["Concealed vs surface pipeline",
                    "Replacement valve / gasket cost",
                    "Accessibility under sink/wall"],
        "price_base": (350, 1400),
        "duration": "1–2 working hours",
    },

    # ── 11. Electrical ──────────────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"స్విచ్", r"కరెంట్", r"వైరింగ్", r"స్పార్క్",
                   r"ఫ్యూజ్", r"సర్కిట్", r"ఎలక్ట్రికల్"],
            "ta": [r"சுவிட்ச்", r"வயரிங்", r"மின்சாரம்", r"பழுது",
                   r"ஸ்பார்க்", r"மின்னல்"],
            "hi": [r"स्विच", r"वायरिंग", r"करंट", r"स्पार्क",
                   r"शॉर्ट सर्किट", r"फ्यूज", r"बिजली"],
            "en": [r"switch", r"wiring", r"short circuit", r"sparking",
                   r"socket", r"breaker", r"mcb", r"electrical", r"fuse"],
        },
        "target_service": "electrical",
        "problem_type": "Electrical switch & circuit fault",
        "required_professional": "Licensed Electrician",
        "title": "Electrical Fault — Electrician Required",
        "description": "Electrical switch/circuit is malfunctioning with power disruption or sparking. Need a licensed electrician to inspect and fix the issue.",
        "factors": ["Number of points affected",
                    "MCB / switch modular type",
                    "Internal wire burning extent"],
        "price_base": (300, 1200),
        "duration": "1–3 working hours",
    },

    # ── 12. Carpentry / Furniture ───────────────────────────────────────────
    {
        "patterns": {
            "te": [r"తలుపు", r"చెక్క", r"కప్ బోర్డ్", r"కప్‌బోర్డ్",
                   r"మంచం", r"కుర్చీ", r"హింజ్", r"లాక్", r"ఫర్నిచర్"],
            "ta": [r"கதவு", r"மரம்", r"அலமாரி", r"மேஜை",
                   r"நாற்காலி", r"பூட்டு", r"தளபாடம்"],
            "hi": [r"दरवाजा", r"लकड़ी", r"अलमारी", r"मेज",
                   r"कुर्सी", r"कब्जा", r"ताला", r"फर्नीचर"],
            "en": [r"door", r"wooden", r"cupboard", r"wardrobe", r"hinge",
                   r"drawer", r"carpenter", r"lock broken", r"furniture",
                   r"cabinet"],
        },
        "target_service": "carpentry",
        "problem_type": "Wooden structure / hinge alignment fault",
        "required_professional": "Experienced Carpenter",
        "title": "Wooden Furniture / Door Repair Required",
        "description": "Wooden furniture or door is damaged. Looking for a skilled carpenter to repair woodwork, align hinges, and ensure smooth closure.",
        "factors": ["Plywood / hardwood replacement needs",
                    "Hardware hinges & locks quality",
                    "Surface polish / alignment effort"],
        "price_base": (400, 2200),
        "duration": "2–4 working hours",
    },

    # ── 13. Painting ────────────────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"పెయింట్", r"పెయింటింగ్", r"రంగు", r"గోడలు"],
            "ta": [r"வண்ணம்", r"பெயிண்டிங்", r"சுவர்"],
            "hi": [r"पेंट", r"पेंटिंग", r"रंगाई", r"दीवार"],
            "en": [r"paint", r"painting", r"wall paint", r"interior painting",
                   r"whitewash"],
        },
        "target_service": "painting",
        "problem_type": "Interior wall painting & putty coat",
        "required_professional": "Professional Painter",
        "title": "Interior Wall Painting Required",
        "description": "Interior walls require paint. Looking for a professional painter for surface preparation, putty application, and smooth emulsion finish.",
        "factors": ["Total wall area (sq ft)",
                    "Dampness / primer preparatory coats",
                    "Paint grade (distemper vs luxury emulsion)"],
        "price_base": (1500, 7500),
        "duration": "1–3 working days",
    },

    # ── 14. Cleaning ────────────────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"క్లీనింగ్", r"శుభ్రం", r"దుమ్ము", r"మొత్తం ఇల్లు"],
            "ta": [r"சுத்தம்", r"சுத்தம் செய்ய", r"தூசி"],
            "hi": [r"सफाई", r"साफ", r"डीप क्लीनिंग", r"घर की सफाई"],
            "en": [r"cleaning", r"deep clean", r"house cleaning",
                   r"bathroom clean", r"dust"],
        },
        "target_service": "cleaning",
        "problem_type": "Deep interior cleaning requirement",
        "required_professional": "Professional Cleaning Crew",
        "title": "Deep House Cleaning Service Required",
        "description": "Complete interior house cleaning required including floors, kitchen tiles, bathrooms, and dust removal.",
        "factors": ["Home square footage / number of rooms",
                    "Hard water scale / tile stain intensity",
                    "Equipment and cleaning chemicals provided"],
        "price_base": (500, 3000),
        "duration": "2–6 working hours",
    },

    # ── 15. Vehicle ─────────────────────────────────────────────────────────
    {
        "patterns": {
            "te": [r"బైక్", r"కార్", r"పంక్చర్",
                   r"స్టార్ట్ అవ్వడం లేదు", r"బ్రేక్"],
            "ta": [r"பைக்", r"கார்", r"பஞ்சர்",
                   r"ஸ்டார்ட் ஆகவில்லை"],
            "hi": [r"गाड़ी", r"बाइक", r"कार", r"पंचर",
                   r"स्टार्ट नहीं"],
            "en": [r"bike", r"car", r"vehicle", r"puncture",
                   r"not starting", r"brake issue", r"motorcycle"],
        },
        "target_service": "vehicle_repair",
        "problem_type": "Vehicle ignition / mechanical fault",
        "required_professional": "Automotive Mechanic",
        "title": "Vehicle Repair & Servicing Required",
        "description": "Vehicle has a breakdown and requires inspection. Need a mechanic to check battery, brakes, and vital components.",
        "factors": ["Vehicle make & model complexity",
                    "Spare parts needed (battery, cables, pads)",
                    "On-site breakdown location"],
        "price_base": (450, 3500),
        "duration": "1.5–4 working hours",
    },
]

# ---------------------------------------------------------------------------
# Language auto-detection from Unicode script ranges
# ---------------------------------------------------------------------------
def detect_language(text: str) -> Tuple[str, str]:
    """Detects whether text is Telugu, Tamil, Hindi, or English based on Unicode."""
    if not text:
        return "en", "English"

    te_count = len(re.findall(r'[\u0C00-\u0C7F]', text))
    ta_count = len(re.findall(r'[\u0B80-\u0BFF]', text))
    hi_count = len(re.findall(r'[\u0900-\u097F]', text))

    total_indic = te_count + ta_count + hi_count
    if total_indic > 0:
        if te_count >= ta_count and te_count >= hi_count:
            return "te", "Telugu"
        elif ta_count >= te_count and ta_count >= hi_count:
            return "ta", "Tamil"
        elif hi_count >= te_count and hi_count >= ta_count:
            return "hi", "Hindi"

    return "en", "English"

# ---------------------------------------------------------------------------
# Main voice transcript analyser
# ---------------------------------------------------------------------------
def analyze_voice_transcript(
    transcript: str,
    selected_lang: Optional[str] = "auto"
) -> Dict[str, Any]:
    """
    Parses spoken transcript in Telugu, Tamil, Hindi, or English.
    Returns structured job details matching the EXACT appliance / fault mentioned.
    """
    cleaned = (transcript or "").strip()
    if not cleaned:
        return {"error": "Empty audio transcript received. Please speak clearly into the microphone."}

    # Determine language
    if selected_lang and selected_lang in LANGUAGES and selected_lang != "auto":
        lang_code = selected_lang
        lang_name = LANGUAGES[selected_lang]["name"]
    else:
        lang_code, lang_name = detect_language(cleaned)

    lower_text = cleaned.lower()

    # ── Intent matching ────────────────────────────────────────────────────
    # Check patterns for detected language AND English (English patterns always
    # active as backup). For indic scripts the original unicode text is also
    # checked against the indic patterns directly.
    matched_intent = None
    for intent in MULTILINGUAL_INTENTS:
        lang_patterns = intent["patterns"].get(lang_code, [])
        en_patterns   = intent["patterns"].get("en", [])
        all_patterns  = lang_patterns + (en_patterns if lang_code != "en" else [])

        for pat in all_patterns:
            # Match against original text (preserves indic) AND lowercase
            if re.search(pat, cleaned) or re.search(pat, lower_text):
                matched_intent = intent
                break
        if matched_intent:
            break

    # ── Matched a specific intent ─────────────────────────────────────────
    if matched_intent:
        svc_key = matched_intent["target_service"]
        spec = SERVICE_CATALOG.get(svc_key, SERVICE_CATALOG["appliance_repair"])
        p_min, p_max = matched_intent["price_base"]
        p_typical = int((p_min + p_max) / 2)

        return {
            "status": "success",
            "detected_language": lang_code,
            "language_name": lang_name,
            "original_transcript": cleaned,
            "job_title": matched_intent["title"],
            "job_description": (
                f"{matched_intent['description']}\n\n"
                f"Spoken Voice Input ({lang_name}): \"{cleaned}\""
            ),
            "category": spec["group_id"],
            "category_name": spec["group_name"],
            "service_name": spec["service_name"],
            "problem_type": matched_intent["problem_type"],
            "required_professional": matched_intent["required_professional"],
            "is_new_category": False,
            "estimated_price": {
                "min": p_min,
                "max": p_max,
                "typical": p_typical,
                "labour_estimate": f"₹{int(p_min * 0.4):,} – ₹{int(p_max * 0.4):,}",
                "materials_estimate": f"₹{int(p_min * 0.6):,} – ₹{int(p_max * 0.6):,} (approximate — verify with technician)",
                "factors": matched_intent["factors"],
            },
            "estimated_time": matched_intent["duration"],
            "confidence": 95.0,
            "is_ambiguous": False,
        }

    # ── Fallback to general multimodal analysis ───────────────────────────
    general = detect_service_from_multimodal(
        product_category=None,
        damage_type=None,
        text=cleaned,
    )

    p_min = general["estimated_price"]["min"]
    p_max = general["estimated_price"]["max"]
    p_typical = general["estimated_price"]["typical"]

    svc_name = general["service_name"]
    prof_title = (
        f"{svc_name} Technician" if "Repair" in svc_name
        else f"{svc_name} Specialist"
    )

    return {
        "status": "success",
        "detected_language": lang_code,
        "language_name": lang_name,
        "original_transcript": cleaned,
        "job_title": general["suggested_title"],
        "job_description": (
            f"Customer request: {cleaned}\n\n"
            f"Expected Work: Diagnostic inspection and necessary repair work.\n"
            f"Spoken Voice Input ({lang_name}): \"{cleaned}\""
        ),
        "category": general["group_id"],
        "category_name": general["group_name"],
        "service_name": svc_name,
        "problem_type": f"{svc_name} — diagnostic required",
        "required_professional": prof_title,
        "is_new_category": general.get("is_new_category", False),
        "estimated_price": {
            "min": p_min,
            "max": p_max,
            "typical": p_typical,
            "labour_estimate": general["estimated_price"]["labour_estimate"],
            "materials_estimate": general["estimated_price"]["materials_estimate"],
            "factors": general["estimated_price"]["factors"],
        },
        "estimated_time": general["estimated_duration"]["display"],
        "confidence": general["confidence"],
        "is_ambiguous": general.get("is_ambiguous", False),
        "clarification_prompt": general.get("clarification_prompt"),
    }
