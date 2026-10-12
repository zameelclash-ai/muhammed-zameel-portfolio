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
  directions: "https://www.google.com/maps/search/?api=1&query=Navodaya+Hospital+Pazhayannur+Kerala+680587",
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
  // Set to false once doctors, services and timings below are your real details.
  sampleContent: true,
  // Opening hours shown on the page, e.g. "OPD: Mon-Sat 9:00 AM - 5:00 PM". Leave "" to hide.
  hours: "",
  steps: [
    { icon: "clipboard", title: "Choose", text: "Pick a department, doctor, date and time." },
    { icon: "chat", title: "Send on WhatsApp", text: "Your request opens in WhatsApp, ready to send." },
    { icon: "users", title: "Get confirmed", text: "Our reception team confirms your slot in the same chat." }
  ],
  why: [
    { icon: "chat", title: "Simple booking", text: "Book on WhatsApp, with no forms to sign up for." },
    { icon: "doctor", title: "Choose your doctor", text: "Pick the department, doctor and time that suit you." },
    { icon: "pin", title: "Close to home", text: "Care in Pazhayannur, so no long travel." },
    { icon: "phone", title: "Easy to reach", text: "Call or message us any time, and we reply to confirm." }
  ],
  faqs: [
    { q: "How do I book an appointment?", a: "Choose a department, doctor, date and time in the booking form. WhatsApp opens with your request ready to send." },
    { q: "Do I need to create an account?", a: "No. You only share your name and mobile number in the WhatsApp message." },
    { q: "How will I know my slot is confirmed?", a: "Our reception team replies on WhatsApp to confirm the date and time, or to suggest another slot." },
    { q: "Can I change or cancel my booking?", a: "Yes. Message us in the same WhatsApp chat, or call us." },
    { q: "What if it is an emergency?", a: "Please call us or go to casualty straight away. Online booking is for planned visits." }
  ],
  // Add REAL patient reviews here (with permission). The reviews section stays hidden while this is empty.
  // Example: { name: "Name", place: "Place", rating: 5, text: "Review text" }
  reviews: [],
  heroImage: "hospital-building.jpg"
};
