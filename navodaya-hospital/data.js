// ===== Edit this file to customise the site =====
window.HOSPITAL = {
  name: "Navodaya Hospital",
  // WhatsApp number with country code, digits only (e.g. 919876543210). REPLACE THIS.
  whatsapp: "910000000000",
  phone: "+91 89433 11555",
  email: "contact@kspdc.com",
  address: "Pazhayannur, Kerala 680587",
  // Google Maps embed URL (optional). Leave "" to hide the map.
  mapEmbed: "",
  timeSlots: ["09:00 AM","10:00 AM","11:00 AM","12:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM","06:00 PM","07:00 PM"],
  departments: [
    { id: "general",  name: "General Medicine", icon: "steth", text: "Fever, infections, diabetes, BP and everyday illness." },
    { id: "cardio",   name: "Cardiology",       icon: "heart", text: "Heart check-ups, ECG, Echo and cardiac care." },
    { id: "ortho",    name: "Orthopaedics",     icon: "bone", text: "Bone, joint, sports injury and fracture care." },
    { id: "gynae",    name: "Obstetrics & Gynaecology", icon: "woman", text: "Antenatal care, delivery and women's health." },
    { id: "paeds",    name: "Paediatrics",      icon: "child", text: "Newborn, child care and vaccinations." },
    { id: "neuro",    name: "Neurology",        icon: "brain", text: "Headache, stroke, epilepsy and nerve disorders." },
    { id: "ent",      name: "ENT",              icon: "ear", text: "Ear, nose and throat diagnosis and surgery." },
    { id: "derma",    name: "Dermatology",      icon: "drop", text: "Skin, hair and allergy treatment." }
  ],
  // Placeholder doctors – replace with real names, photos and timings.
  doctors: [
    { name: "Dr. A. Kumar",   dept: "general", qual: "MD (General Medicine)", exp: "20 yrs", days: "Mon–Sat" },
    { name: "Dr. R. Menon",   dept: "cardio",  qual: "DM (Cardiology)",       exp: "15 yrs", days: "Mon, Wed, Fri" },
    { name: "Dr. S. Nair",    dept: "ortho",   qual: "MS (Orthopaedics)",     exp: "12 yrs", days: "Tue, Thu, Sat" },
    { name: "Dr. P. Fathima", dept: "gynae",   qual: "MD, DGO",               exp: "18 yrs", days: "Mon–Sat" },
    { name: "Dr. V. Joseph",  dept: "paeds",   qual: "MD (Paediatrics)",      exp: "14 yrs", days: "Mon–Sat" },
    { name: "Dr. M. Rahman",  dept: "neuro",   qual: "DM (Neurology)",        exp: "10 yrs", days: "Wed, Sat" },
    { name: "Dr. K. Pillai",  dept: "ent",     qual: "MS (ENT)",              exp: "11 yrs", days: "Mon, Thu" },
    { name: "Dr. L. George",  dept: "derma",   qual: "MD (Dermatology)",      exp: "9 yrs",  days: "Tue, Fri" }
  ],
  services: [
    { icon: "ambulance", name: "24×7 Emergency & Ambulance" },
    { icon: "icu", name: "ICU & Critical Care" },
    { icon: "flask", name: "Laboratory" },
    { icon: "xray", name: "X-Ray, Ultrasound & CT" },
    { icon: "pill", name: "24-hour Pharmacy" },
    { icon: "bed", name: "In-patient Rooms" },
    { icon: "surgery", name: "Operation Theatres" },
    { icon: "clipboard", name: "Health Check-up Packages" }
  ],
  why: [
    { icon: "doctor", title: "Experienced Doctors", text: "Senior consultants across all major specialities." },
    { icon: "ambulance", title: "24×7 Emergency", text: "Casualty, ICU and ambulance ready day and night." },
    { icon: "rupee", title: "Affordable Care", text: "Transparent pricing with insurance and cashless help." },
    { icon: "microscope", title: "Modern Diagnostics", text: "In-house lab, X-ray, ultrasound and more." },
    { icon: "users", title: "Patient-First Approach", text: "Respectful, caring staff who listen and explain." },
    { icon: "pin", title: "Close to Home", text: "Quality treatment in Pazhayannur, no long travel." }
  ],
  // SAMPLE testimonials – REPLACE with real patient reviews (with permission) before going live.
  reviews: [
    { name: "Patient name", place: "Pazhayannur", rating: 5, text: "Replace this with a real review from one of your patients." },
    { name: "Patient name", place: "Thrissur", rating: 5, text: "Replace this with a real review from one of your patients." },
    { name: "Patient name", place: "Wadakkanchery", rating: 4, text: "Replace this with a real review from one of your patients." }
  ],
  heroImage: "hospital-building.jpg"
};
