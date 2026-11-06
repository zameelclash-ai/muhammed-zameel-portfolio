// ===== Edit this file to customise the site =====
window.HOSPITAL = {
  name: "Navodaya Hospital and Research Centre",
  shortName: "Navodaya Hospital",
  company: "NHRC Life Care Private Limited",
  tagline: "Redefining Health Care",
  // WhatsApp number with country code, digits only (e.g. 919876543210). REPLACE THIS to switch bookings on.
  whatsapp: "910000000000",
  phone: "+91 80866 55666",
  phone2: "+91 98468 45521",
  email: "nhrclifecare@gmail.com",
  website: "https://www.navodayahospital.org",
  address: "Thiruvilwamala Road, Near Panchayat Office, Pazhayannur, Thrissur - 680587",
  mapEmbed: "",
  directions: "https://www.google.com/maps/search/?api=1&query=Navodaya+Hospital+and+Research+Centre+Pazhayannur+Thrissur+680587",
  hours: "Emergency services, ambulance and pharmacy: 24x7",
  timeSlots: ["09:00 AM","10:00 AM","11:00 AM","12:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM","06:00 PM","07:00 PM"],

  // Departments from the hospital brochure. call:true = emergency/critical care (call, not book online).
  departments: [
    { id: "anaesthesiology", name: "Anaesthesiology", icon: "icu" },
    { id: "bariatric", name: "Bariatric Surgery", icon: "surgery" },
    { id: "criticalcare", name: "Critical Care Medicine", icon: "icu", call: true },
    { id: "cardiology", name: "Cardiology / Interventional Cardiology", icon: "heart" },
    { id: "cts", name: "Cardiothoracic Surgery", icon: "heart" },
    { id: "dentistry", name: "Dentistry", icon: "tooth" },
    { id: "derma", name: "Dermatology & Cosmetology", icon: "drop" },
    { id: "dietetics", name: "Dietetics & Nutrition", icon: "clipboard" },
    { id: "diabetology", name: "Diabetology & Endocrinology", icon: "drop" },
    { id: "emergency", name: "Emergency Medicine", icon: "ambulance", call: true },
    { id: "ent", name: "ENT", icon: "ear" },
    { id: "general", name: "General Medicine", icon: "steth" },
    { id: "gensurgery", name: "General Surgery & Surgical Gastroenterology", icon: "surgery" },
    { id: "haematology", name: "Haematology", icon: "drop" },
    { id: "gastro", name: "Medical Gastroenterology", icon: "steth" },
    { id: "nephrology", name: "Nephrology", icon: "drop" },
    { id: "neurology", name: "Neurology", icon: "brain" },
    { id: "neurosurgery", name: "Neuro Surgery", icon: "brain" },
    { id: "nuclear", name: "Nuclear Medicine", icon: "xray" },
    { id: "obg", name: "Obstetrics & Gynaecology", icon: "woman" },
    { id: "oncology", name: "Oncology (Medical & Surgical)", icon: "microscope" },
    { id: "ophthal", name: "Ophthalmology", icon: "eye" },
    { id: "ortho", name: "Orthopaedics & Joint Replacement", icon: "bone" },
    { id: "paeds", name: "Paediatrics", icon: "child" },
    { id: "plastic", name: "Plastic Surgery", icon: "surgery" },
    { id: "psychiatry", name: "Psychiatry", icon: "brain" },
    { id: "pulmo", name: "Pulmonology", icon: "steth" },
    { id: "physio", name: "Physiotherapy & Rehabilitation", icon: "users" },
    { id: "checkup", name: "Health Check-up & Wellness", icon: "clipboard" },
    { id: "rheuma", name: "Rheumatology", icon: "bone" },
    { id: "robotic", name: "Robotic Surgery", icon: "surgery" },
    { id: "urology", name: "Urology", icon: "drop" },
    { id: "vascular", name: "Vascular Surgery & Transplant (Liver, Kidney & Heart)", icon: "heart" },
    { id: "travel", name: "Travel Medicine", icon: "pin" },
    { id: "maternity", name: "Pre and Post Maternity Care", icon: "woman" },
    { id: "lab", name: "Laboratory Medicine (Biochemistry, Microbiology, Pathology)", icon: "flask" },
    { id: "radiology", name: "Radiology & Imaging", icon: "xray" }
  ],

  // Leadership, from the brochure.
  people: [
    { name: "Mr. Abdul Jaleel P M", role: "Managing Director" },
    { name: "Dr. Farraz Shahithulla", role: "Director and Administrator" },
    { name: "Adv. Muhammad Rafi A.K", role: "Director and Legal Adviser" },
    { name: "Dr. Abdul Jaleel T", role: "Director and Medical Superintendent" },
    { name: "Mrs. Veena Sivakumar", role: "Director and Public Relation Manager" }
  ],

  services: [
    { icon: "ambulance", name: "Ambulance & Emergency Care", text: "24x7 emergency services and ambulance." },
    { icon: "icu", name: "ICU | PICU | NICU", text: "Intensive care for adults, children and newborns." },
    { icon: "flask", name: "Laboratory & Pathology", text: "Biochemistry, microbiology and pathology." },
    { icon: "xray", name: "Radiology & Imaging", text: "Diagnostic imaging services." },
    { icon: "pill", name: "Pharmacy 24x7", text: "Medicines available round the clock." },
    { icon: "clipboard", name: "Health Check-up Plans", text: "Different types of health check-up plans." },
    { icon: "bed", name: "Spacious Halls & Waiting Areas", text: "Comfortable space for patients and families." },
    { icon: "users", name: "Information & Help Desk", text: "Appointments, emergencies and patient reports in one place." }
  ],

  steps: [
    { icon: "clipboard", title: "Choose", text: "Pick a department, date and time." },
    { icon: "chat", title: "Send on WhatsApp", text: "Your request opens in WhatsApp, ready to send." },
    { icon: "users", title: "Get confirmed", text: "Our reception team confirms your slot in the same chat." }
  ],

  // "Why choose NHRC", from the brochure.
  why: [
    { icon: "doctor", title: "Experienced doctors", text: "Top-class doctors with decades of experience." },
    { icon: "icu", title: "Ultramodern infrastructure", text: "State-of-the-art facilities and ambience." },
    { icon: "ambulance", title: "24x7 emergency", text: "Emergency services, ambulance and pathology." },
    { icon: "users", title: "Round-the-clock staff", text: "Medical and paramedical staff always available, with efficient, cordial nursing." },
    { icon: "chat", title: "Helpful PR team", text: "A very helpful and polite team to guide you." },
    { icon: "clipboard", title: "Health check-up plans", text: "Different types of health check-up plans." },
    { icon: "pin", title: "Ideal location", text: "Central Pazhayannur with ample parking, wide stairs and large patient-transport elevators." },
    { icon: "pill", title: "Pharmacy & canteen 24x7", text: "Always open for patients and visitors." }
  ],

  vision: "To bring healthcare of international standards to this region, to evolve as a premier hospital in the country and to TOUCH the lives of the people we serve through excellence in clinical care, quality and commitment.",
  mission: [
    "To provide Hope, Care and Cure.",
    "To provide compassionate, accessible, high-quality, cost-effective healthcare to one and all.",
    "To serve with a patient's first motto and work towards patient-centred care.",
    "To develop, share and apply new knowledge and technology in the delivery of patient care.",
    "To play an active role in promoting and improving health within our community.",
    "To cultivate an environment of trust, honesty, mutual respect, equality and ethics."
  ],

  faqs: [
    { q: "How do I book an appointment?", a: "Choose a department, date and time in the booking form. WhatsApp opens with your request ready to send." },
    { q: "Do I need to create an account?", a: "No. You only share your name and mobile number in the WhatsApp message." },
    { q: "How will I know my slot is confirmed?", a: "Our reception team replies on WhatsApp to confirm the date and time, or to suggest another slot." },
    { q: "Where is the hospital?", a: "Thiruvilwamala Road, near Panchayat Office, Pazhayannur, Thrissur - 680587." },
    { q: "Where can I get patient reports or information?", a: "At the NHRC Information Desk, or call us on the numbers in the contact section." },
    { q: "What if it is an emergency?", a: "Call us or come straight to casualty. Emergency services and ambulance are available 24x7. Online booking is for planned visits." }
  ],

  // Add REAL patient reviews here (with permission). The reviews section stays hidden while this is empty.
  // Example: { name: "Name", place: "Place", rating: 5, text: "Review text" }
  reviews: []
};
