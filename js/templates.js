// Each template: CSS theme class + background particle style + sample copy.
window.TEMPLATES = {
  royal: {
    name: "Royal Gold",
    blurb: "Deep maroon and gold with drifting sparkles.",
    particles: "sparkle",
  },
  blush: {
    name: "Blush Garden",
    blurb: "Soft pinks with falling petals.",
    particles: "petal",
  },
  midnight: {
    name: "Midnight Stars",
    blurb: "Navy sky, twinkling stars, silver script.",
    particles: "star",
  },
  emerald: {
    name: "Emerald Heritage",
    blurb: "Rich green and antique gold, arched photo frame.",
    particles: "sparkle",
  },
  lavender: {
    name: "Lavender Dream",
    blurb: "Dreamy purples with floating petals.",
    particles: "petal",
  },
  ivory: {
    name: "Ivory Minimal",
    blurb: "Clean, airy and modern with gentle motion.",
    particles: "sparkle",
  },
  marigold: {
    name: "Marigold Festive",
    blurb: "Warm saffron and marigold petals for a vibrant celebration.",
    particles: "petal",
  },
  bengali: {
    name: "Shubho Bibaho (Bengali)",
    blurb: "Laal-paar red & gold. Open the card with a Shubho Drishti — betel leaves part to reveal the couple.",
    particles: "leaf",
    intro: "subho",
    ornament: "alpona",
    alta: true,
    // ritual-based events (names per Bengali Hindu wedding sequence); times are offsets from the main date
    sampleEvents: [
      { name: "গায়ে হলুদ · Gaye Holud", day: -1, time: "10:00", place: "" },
      { name: "শুভ বিবাহ · Subho Drishti & Mala Badal", day: 0, time: "", place: "" },
      { name: "বৌভাত · Bou Bhat & Reception", day: 1, time: "19:00", place: "" },
    ],
    labels: {
      invite: "সপরিবারে আমন্ত্রণ",
      kicker1: "॥ শুভ বিবাহ ॥",
      married: "শুভ পরিণয়ে আবদ্ধ হচ্ছেন",
      countdown: "Counting down · শুভক্ষণ",
      events: "Celebrations · অনুষ্ঠান",
      moments: "Our moments · স্মৃতি",
      venue: "Venue · স্থান",
      rsvp: "আপনার আশীর্বাদ কাম্য",
      tap: "শুভদৃষ্টি · tap to reveal",
      sd: "শুভদৃষ্টি",
    },
  },
  kanjivaram: {
    name: "Temple Silk (South Indian)",
    blurb: "Kanjivaram magenta and temple-gold, with jasmine petals and a kolam mandala.",
    particles: "petal",
    ornament: "alpona",
    labels: { kicker1: "திருமண அழைப்பிதழ்" },
  },
  phulkari: {
    name: "Punjabi Phulkari",
    blurb: "Bright, bold and joyful — fuchsia, saffron and green with a phulkari border.",
    particles: "petal",
    labels: { kicker1: "ਵਿਆਹ ਦਾ ਸੱਦਾ" },
  },
  rajasthani: {
    name: "Royal Rajasthan",
    blurb: "A desert-sunset sky, jharokha arch frame and scalloped palace border.",
    particles: "sparkle",
    ornament: "alpona",
    labels: { kicker1: "पधारो म्हारे देस" },
  },
  nikah: {
    name: "Nikah Noor",
    blurb: "Deep teal and gold with an eight-point star, Bismillah header and twinkling stars.",
    particles: "star",
    ornament: "star8",
    labels: { kicker1: "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", invite: "With the blessings of Allah, together with their families" },
  },
  sage: {
    name: "Sage Garden",
    blurb: "Soft ivory and sage, an arched portrait and drifting eucalyptus leaves.",
    particles: "leaf",
  },
  coastal: {
    name: "Seaside Vows",
    blurb: "Sky-blue to sand, rolling animated waves and rising bubbles.",
    particles: "bubble",
    waves: true,
  },
  holud: {
    name: "Gaye Holud Haldi (Bengali)",
    blurb: "Turmeric yellow with a marigold-garland border and drifting genda phool petals.",
    particles: "petal",
    ornament: "alpona",
  },
  shola: {
    name: "Sholar Mukut (Bengali)",
    blurb: "Ivory sholapith: a shimmering mukut crest and white shola blooms that float down.",
    particles: "bloom",
    ornament: "alpona",
    crest: "mukut",
  },
  terracotta: {
    name: "Terracotta Temple (Bengali)",
    blurb: "Bishnupur-style terracotta panels, Subho Drishti betel-leaf opening and lamp-gold sparkles.",
    particles: "sparkle",
    ornament: "alpona",
    intro: "subho",
  },
  kantha: {
    name: "Kantha Stitch (Bengali)",
    blurb: "Hand-stitched look: running-stitch borders that sew themselves across the card.",
    particles: "sparkle",
    stitch: true,
  },
  kolkata: {
    name: "Kolkata Heritage (Bengali)",
    blurb: "Golden dusk, the Howrah Bridge and a yellow taxi that keeps driving by.",
    particles: "sparkle",
    scene: "kolkata",
  },
  shiuli: {
    name: "Shiuli & Kash (Bengali)",
    blurb: "Autumn sky, swaying kash phool and falling shiuli blossoms — Sharad season.",
    particles: "shiuli",
    scene: "kash",
  },
  rose: {
    name: "Rose Noir",
    blurb: "Black and rose with floating hearts.",
    particles: "heart",
  },
};

window.DEMO_CARD = {
  template: "royal",
  bride: "Ananya",
  groom: "Rohan",
  date: "2027-02-14T18:30",
  venue: "The Grand Palace",
  address: "12 Lake View Road, Udaipur",
  mapUrl: "https://maps.google.com/?q=Udaipur",
  message: "Together with our families, we joyfully invite you to celebrate the beginning of our forever.",
  events: [
    { name: "Mehendi", time: "2027-02-12T16:00", place: "Garden Courtyard" },
    { name: "Sangeet", time: "2027-02-13T19:00", place: "Ballroom" },
    { name: "Wedding", time: "2027-02-14T18:30", place: "Main Lawn" },
  ],
  rsvp: "",
  music: "",
  photo: "",
  gallery: [],
};

// Bengali variants share labels and the ritual-event preset with the main Bengali template.
["holud", "shola", "terracotta", "kantha", "kolkata", "shiuli"].forEach((k) => {
  TEMPLATES[k].labels = Object.assign({}, TEMPLATES.bengali.labels);
  TEMPLATES[k].sampleEvents = TEMPLATES.bengali.sampleEvents;
});
// gallery / picker grouping
const TAGS = {
  Bengali: ["bengali", "holud", "shola", "terracotta", "kantha", "kolkata", "shiuli"],
  Regional: ["kanjivaram", "phulkari", "rajasthani", "nikah"],
  Classic: ["royal", "emerald", "marigold"],
  Modern: ["blush", "midnight", "lavender", "ivory", "sage", "coastal", "rose"],
};
Object.entries(TAGS).forEach(([tag, keys]) => keys.forEach((k) => (TEMPLATES[k].tag = tag)));
window.TEMPLATE_TAGS = Object.keys(TAGS);
