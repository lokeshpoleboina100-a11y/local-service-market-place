import re
from typing import Dict, Any, List, Optional
from multilingual_voice import detect_language

# NearWork Knowledge Base in 4 Languages
KNOWLEDGE_TOPICS = [
    {
        "id": "post_job",
        "keywords": ["post", "create job", "post job", "job post", "need work", "hire", "రాయడం", "జాబ్", "வேலை", "போஸ்ட்", "जॉब", "काम"],
        "action_link": "/customer/post-job",
        "action_text": "Post a Job Now",
        "responses": {
            "en": "To post a job on NearWork:\n1. Tap the **'+' Post Job** button on your customer home screen.\n2. You can use our **AI Multilingual Voice Mic** to simply speak your problem in Telugu, Tamil, Hindi, or English.\n3. The AI will automatically detect your problem, recommend the exact service category, and generate realistic price & time estimates.\n4. Select your location on the map, choose whether you want **Bidding ON or OFF**, and tap **Post Job**.",
            "te": "NearWork లో జాబ్ పోస్ట్ చేయడానికి:\n1. కస్టమర్ హోమ్ స్క్రీన్‌లో **'+' జాబ్ పోస్ట్ చేయండి** బటన్‌ను నొక్కండి.\n2. మా **AI వాయిస్ మైక్** ఉపయోగించి తెలుగులో మీ సమస్యను నేరుగా మాట్లాడవచ్చు.\n3. AI మీ సమస్యను గుర్తించి, ఖచ్చితమైన కేటగిరీ మరియు అంచనా ధరను స్వయంచాలకంగా సిద్ధం చేస్తుంది.\n4. మీ లొకేషన్ ఎంచుకుని, బిడ్డింగ్ ఆన్/ఆఫ్ చేసి జాబ్‌ను పోస్ట్ చేయండి.",
            "ta": "NearWork-ல் வேலை பதிவு செய்ய:\n1. வாடிக்கையாளர் முகப்புத் திரையில் உள்ள **'+' வேலை பதிவிடு** பொத்தானை அழுத்தவும்.\n2. எங்கள் **AI குரல் உதவியாளர்** மூலம் தமிழில் பேசி வேலையை விவரிக்கலாம்.\n3. AI தானாகவே சரியான வகையையும் மதிப்பீட்டுத் தொகையையும் உருவாக்கும்.\n4. உங்கள் இருப்பிடத்தைத் தேர்ந்தெடுத்து வேலையை இடுங்கள்.",
            "hi": "NearWork पर जॉब पोस्ट करने के लिए:\n1. कस्टमर होम स्क्रीन पर **'+' जॉब पोस्ट करें** बटन दबाएं।\n2. आप हमारे **AI वॉयस माइक** का उपयोग करके हिंदी में बोलकर अपनी समस्या बता सकते हैं।\n3. AI समस्या को समझकर सही सर्विस और अनुमानित बजट खुद तय करेगा।\n4. अपनी लोकेशन चुनें और जॉब पोस्ट करें।"
        }
    },
    {
        "id": "bidding_choice",
        "keywords": ["bidding", "bid", "recommend", "recommendation", "direct", "turn off", "ബിഡ്ഡിംഗ്", "బిడ్డింగ్", "ஏலம்", "बिडिंग", "सिफारिश"],
        "action_link": "/customer/post-job",
        "action_text": "Post with Bidding Preference",
        "responses": {
            "en": "NearWork offers two ways to find workers:\n\n• **Bidding ON (Competitive)**: Local workers review your job and submit customized bids with price and timeline. You can compare reviews, ratings, and choose the best offer.\n\n• **Bidding OFF (Direct AI Recommendations)**: Skip the bidding wait! NearWork's AI directly evaluates local workers based on skills, verified credentials, proximity, and ratings, presenting you a ranked list with clear reasons. You can select and assign instantly.\n\nYou can toggle this setting for every job on the Create Job screen.",
            "te": "NearWork లో వర్కర్లను ఎంచుకోవడానికి రెండు మార్గాలు ఉన్నాయి:\n\n• **బిడ్డింగ్ ఆన్**: స్థానిక వర్కర్లు మీ పనిని చూసి వారి ధరలతో బిడ్ చేస్తారు. మీరు రేటింగ్‌లు చూసి ఉత్తమ వర్కర్‌ని ఎంచుకోవచ్చు.\n\n• **బిడ్డింగ్ ఆఫ్ (AI రికమండేషన్స్)**: బిడ్డింగ్ కోసం వేచి ఉండకుండా, మీ నైపుణ్యాలు మరియు సామీప్యత ఆధారంగా టాప్ వెరిఫైడ్ వర్కర్లను AI నేరుగా సూచిస్తుంది. వెంటనే వర్కర్‌ని అసైన్ చేసుకోవచ్చు.",
            "ta": "NearWork-ல் பணியாளர்களைத் தேர்ந்தெடுக்க 2 வழிகள்:\n\n• **ஏலம் ஆன் (Bidding ON)**: தொழிலாளர்கள் தங்கள் விலையை ஏலமாக வைப்பார்கள். நீங்கள் ஒப்பிட்டு தேர்ந்தெடுக்கலாம்.\n\n• **ஏலம் ஆஃப் (AI பரிந்துரைகள்)**: AI சிறந்த சரிபார்க்கப்பட்ட பணியாளர்களை உடனடியாக பரிந்துரைக்கும். உடனே பணி ஒதுக்கலாம்.",
            "hi": "NearWork पर वर्कर्स चुनने के दो विकल्प हैं:\n\n• **बिडिंग चालू (Bidding ON)**: वर्कर्स अपनी दरें और समय बताएंगे। आप रेटिंग्स और रेट देखकर चुन सकते हैं।\n\n• **बिडिंग बंद (AI सिफारिशें)**: AI सीधे आपकी जरूरत के हिसाब से सबसे योग्य और सत्यापित वर्कर्स की लिस्ट देगा। आप तुरंत वर्कर चुन सकते हैं।"
        }
    },
    {
        "id": "navigation",
        "keywords": ["navigate", "navigation", "map", "track", "rapido", "live location", "reach", "arrival", "నెవిగేషన్", "మ్యాప్", "வழிசெலுத்தல்", "மேப்", "नेविगेशन", "मैप", "ट्रैकिंग"],
        "action_link": "/worker/my-jobs",
        "action_text": "View Active Jobs",
        "responses": {
            "en": "NearWork features a **Rapido-Style Real Navigation System**:\n\n• **For Workers**: Once assigned, tap **'Navigate to Customer'** to launch Google Maps with turn-by-turn routing directly to the customer's shared location. Toggle **'Share Live GPS Location'** to broadcast your real-time position with consent.\n• **For Customers**: Watch your worker's live journey on the interactive map: `Worker Assigned` → `On the Way` → `Arrived` → `Work Started` → `Completed`, with real driving distance and arrival time.\n• **Privacy**: Live location and exact addresses are strictly protected and visible ONLY to the customer and the assigned worker.",
            "te": "NearWork లో **రాపిడో తరహా లైవ్ నేవిగేషన్ సిస్టమ్** ఉంది:\n\n• **వర్కర్ల కోసం**: కస్టమర్ లొకేషన్‌కు నేరుగా వెళ్లడానికి **'Navigate to Customer'** బటన్ నొక్కితే గూగుల్ మ్యాప్స్ ఓపెన్ అవుతుంది. లైవ్ జీపీఎస్ లొకేషన్ షేర్ చేయవచ్చు.\n• **కస్టమర్ల కోసం**: వర్కర్ ప్రయాణాన్ని లైవ్‌గా ట్రాక్ చేయవచ్చు: అసైన్ చేయబడింది → వస్తున్నారు → చేరుకున్నారు → పని ప్రారంభమైంది → పూర్తయింది.\n• **రక్షణ**: కస్టమర్ చిరునామా కేవలం కేటాయించిన వర్కర్‌కు మాత్రమే కనిపిస్తుంది.",
            "ta": "NearWork-ல் **ராபிடோ பாணி நேரடி வழிசெலுத்தல்** உள்ளது:\n\n• **பணியாளர்களுக்கு**: 'Navigate to Customer' அழுத்தி கூகுள் மேப்ஸ் மூலம் வாடிக்கையாளரின் இடத்தை அடையலாம்.\n• **வாடிக்கையாளர்களுக்கு**: தொழிலாளர் வருவதை மேப்பில் நேரலையாகக் கண்காணிக்கலாம்.\n• **பாதுகாப்பு**: முகவரி மற்றும் நேரலை இடம் சம்பந்தப்பட்ட நபர்களுக்கு மட்டுமே தெரியும்.",
            "hi": "NearWork में **रैपिडो जैसा लाइव नेविगेशन सिस्टम** है:\n\n• **वर्कर्स के लिए**: 'Navigate to Customer' बटन दबाकर गूगल मैप्स पर ग्राहक की लोकेशन तक जा सकते हैं और लाइव लोकेशन शेयर कर सकते हैं।\n• **कस्टमर्स के लिए**: मैप पर वर्कर का लाइव स्टेटस देख सकते हैं (आ रहे हैं, पहुंच गए, काम शुरू, काम पूरा)।\n• **सुरक्षा**: आपकी निजी लोकेशन केवल अधिकृत वर्कर को ही दिखती है।"
        }
    },
    {
        "id": "verification",
        "keywords": ["verify", "verification", "badge", "aadhaar", "pan", "fake", "trust", "చెల్లుబాటు", "ధృవీకరణ", "சரிபார்ப்பு", "सत्यापन", "वेरिफिकेशन"],
        "action_link": "/worker/verification",
        "action_text": "Check Verification Status",
        "responses": {
            "en": "NearWork uses real identity and skill verification:\n\n• Verified workers carry the **Verified Pro Badge**.\n• We validate government IDs (Aadhaar checksum, PAN structure, Driving Licence) and check against duplicate accounts.\n• Verification statuses: **Not Verified**, **Pending Review**, **Verified**, **Failed**, or **Requires Review**.\n• Sensitive document numbers are securely masked (e.g. `XXXX-XXXX-1234`) and never shared publicly.\n• Phone/email checks are separate from official government identity verification.",
            "te": "NearWork లో నిజమైన ఐడెంటిటీ వెరిఫికేషన్ వ్యవస్థ ఉంది:\n\n• ధృవీకరించబడిన వర్కర్లకు **Verified Pro Badge** ఉంటుంది.\n• ఆధార్, పాన్ కార్డుల నంబర్లను మరియు డూప్లికేట్ ఖాతాలను తనిఖీ చేస్తాము.\n• మీ డాక్యుమెంట్ నంబర్లు ఎల్లప్పుడూ సురక్షితంగా మాస్క్ చేయబడి ఉంటాయి (`XXXX-XXXX-1234`).",
            "ta": "NearWork-ல் முறையான அடையாளச் சரிபார்ப்பு செய்யப்படுகிறது:\n\n• சரிபார்க்கப்பட்ட தொழிலாளர்களுக்கு **Verified Badge** வழங்கப்படும்.\n• ஆதார், பான் கார்டு ஆகியவை சரிபார்க்கப்படும்.\n• அடையாள ஆவண எண்கள் பாதுகாப்பாக மறைக்கப்படும் (`XXXX-XXXX-1234`).",
            "hi": "NearWork पर असली पहचान और स्किल वेरिफिकेशन होता है:\n\n• वेरिफाइड वर्कर्स को **Verified Badge** मिलता है।\n• आधार, पैन कार्ड की प्रामाणिकता जांची जाती है।\n• आपके दस्तावेज़ नंबर सुरक्षित रूप से मास्क किए जाते हैं (`XXXX-XXXX-1234`)।"
        }
    },
    {
        "id": "payment",
        "keywords": ["pay", "payment", "money", "upi", "escrow", "safe", "refund", "చెల్లింపు", "డబ్బులు", "பணம்", "கட்டணம்", "भुगतान", "पैसे"],
        "action_link": "/customer",
        "action_text": "Go to Payments",
        "responses": {
            "en": "NearWork protects customer and worker funds with **Secure Escrow Payments**:\n\n• Customers fund milestones or make one-time UPI/card payments.\n• Money is safely held in escrow until the customer inspects and approves the completed work.\n• Once approved, funds are instantly transferred to the worker's payout account.\n• In case of issues, dispute mediation and refund processes protect your money.",
            "te": "NearWork లో **సురక్షిత ఎస్క్రో చెల్లింపులు (Escrow Payments)** ఉన్నాయి:\n\n• మీరు చెల్లించిన డబ్బు పని పూర్తయ్యే వరకు సురక్షితంగా ఉంటుంది.\n• మీరు పనిని పరిశీలించి ఆమోదించిన తర్వాతే వర్కర్‌కు డబ్బులు విడుదలవుతాయి.",
            "ta": "NearWork-ல் **பாதுகாப்பான எஸ்க்ரோ கட்டண முறை** உள்ளது:\n\n• வேலை திருப்திகரமாக முடிந்த பிறகே தொழிலாளருக்கு பணம் விடுவிக்கப்படும்.\n• யுபிஐ மற்றும் கார்டுகள் மூலம் பணம் செலுத்தலாம்.",
            "hi": "NearWork पर **सुरक्षित एस्क्रो पेमेंट** की सुविधा है:\n\n• जब तक काम पूरा होकर आप संतुष्ट नहीं होते, पैसे सुरक्षित रहते हैं।\n• काम की पुष्टि करने के बाद ही वर्कर को भुगतान रिलीज होता है।"
        }
    }
]

def answer_ai_query(query: str, selected_lang: Optional[str] = "auto") -> Dict[str, Any]:
    cleaned = (query or "").strip()
    if not cleaned:
        return {
            "reply": "Hello! I am your NearWork AI Assistant. How can I help you today? You can ask about posting jobs, bidding, worker navigation, verification, or payments in Telugu, Tamil, Hindi, or English.",
            "language": "en",
            "action_link": None,
            "action_text": None,
            "suggestions": ["How do I post a job?", "Bidding ON vs OFF?", "How does Worker Navigation work?", "How to get verified?"]
        }

    # Language detection
    if selected_lang and selected_lang != "auto":
        lang = selected_lang
    else:
        lang, _ = detect_language(cleaned)

    lower_query = cleaned.lower()

    # Match topic
    best_topic = None
    best_score = 0

    for topic in KNOWLEDGE_TOPICS:
        score = 0
        for kw in topic["keywords"]:
            if kw.lower() in lower_query:
                score += 1
        if score > best_score:
            best_score = score
            best_topic = topic

    if best_topic and best_score > 0:
        reply_text = best_topic["responses"].get(lang, best_topic["responses"]["en"])
        return {
            "reply": reply_text,
            "language": lang,
            "topic_id": best_topic["id"],
            "action_link": best_topic.get("action_link"),
            "action_text": best_topic.get("action_text"),
            "suggestions": ["How do I post a job?", "Bidding vs Recommendations", "How does Worker Navigation work?", "Payment & Escrow help"]
        }

    # General Fallback
    fallbacks = {
        "en": f"I understand you are asking about: \"{cleaned}\".\n\nI can assist you with:\n• **Posting Jobs**: Use voice or photo to describe your problem\n• **Bidding Controls**: Turn Bidding ON for bids, or OFF for instant AI worker recommendations\n• **Rapido-Style Navigation**: Track worker arrival with live GPS\n• **Identity Verification**: Get verified with Aadhaar/PAN\n• **Secure Payments**: Escrow milestone protection\n\nWhat would you like to explore?",
        "te": f"మీరు అడిగిన ప్రశ్న: \"{cleaned}\".\n\nనేను మీకు సహాయం చేయగలను:\n• **జాబ్ పోస్ట్ చేయడం**: వాయిస్ ద్వారా లేదా ఫోటోతో పోస్ట్ చేయండి\n• **బిడ్డింగ్ నియంత్రణలు**: బిడ్డింగ్ ఆన్/ఆఫ్ చేయండి\n• **లైవ్ మ్యాప్ నేవిగేషన్**: వర్కర్ లైవ్ లొకేషన్ ట్రాకింగ్\n• **వెరిఫికేషన్**: ఆధార్ / పాన్ కార్డ్ తో వెరిఫై చేసుకోండి\n• **సురక్షిత పేమెంట్లు**: ఎస్క్రో భద్రత",
        "ta": f"உங்கள் கேள்வி: \"{cleaned}\".\n\nநான் உங்களுக்கு உதவ முடியும்:\n• **வேலை இடுதல்**: குரல் மூலம் பதிவு செய்தல்\n• **ஏல முறை**: Bidding ON / OFF செய்தல்\n• **நேரலை மேப்**: தொழிலாளர் வருகையைக் கண்காணித்தல்\n• **சரிபார்ப்பு**: ஆதார் மற்றும் பான் சரிபார்ப்பு\n• **பாதுகாப்பான கட்டணம்**: எஸ்க்ரோ முறை",
        "hi": f"आपका प्रश्न: \"{cleaned}\".\n\nमैं इन विषयों में आपकी सहायता कर सकता हूँ:\n• **जॉब पोस्ट करना**: आवाज़ या फ़ोटो से पोस्ट करें\n• **बिडिंग विकल्प**: Bidding ON या OFF चुनें\n• **लाइव नेविगेशन**: वर्कर के आने का लाइव ट्रैक\n• **वेरिफिकेशन**: आधार/पैन से सत्यापन\n• **सुरक्षित पेमेंट**: एस्क्रो सुरक्षा"
    }

    return {
        "reply": fallbacks.get(lang, fallbacks["en"]),
        "language": lang,
        "topic_id": "general",
        "action_link": "/customer/post-job",
        "action_text": "Explore NearWork",
        "suggestions": ["How do I post a job?", "How does Bidding work?", "How to track worker arrival?", "How to get verified?"]
    }
