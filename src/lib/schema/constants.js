export const SCHEMA_CONTEXT = 'https://schema.org';

export const SITE_NAME = 'BY Photography';
export const SITE_TAGLINE = 'Cinematic Luxury Visuals';
export const SITE_DESCRIPTION =
  'Premium cinematic photography and videography. Weddings, maternity, pre-wedding, baby shoots, and bespoke editorial visuals.';

export const BUSINESS = {
  legalName: 'BY Photography',
  telephone: '+91-85537-02039',
  email: 'hello@byphotography.studio',
  instagram: 'https://www.instagram.com/b_y__creation',
  whatsapp: 'https://wa.me/918553702039',
  priceRange: '₹₹₹',
  areaServed: ['India', 'Karnataka'],
  knowsAbout: [
    'Wedding photography',
    'Pre-wedding photography',
    'Maternity photography',
    'Baby photography',
    'Cinematic videography',
    'Drone photography',
    'Commercial photography',
  ],
};

export const SERVICE_ITEMS = [
  { name: 'Weddings', description: 'Luxury wedding photography and cinematic wedding films.' },
  { name: 'Portraits', description: 'Editorial portraits with intentional light and atmosphere.' },
  { name: 'Drone', description: 'Aerial perspectives for events and commercial projects.' },
  { name: 'Commercial', description: 'Brand and commercial visuals with a cinematic finish.' },
];

export const ABOUT_FAQ = [
  {
    question: "What is BY Photography's Director's Cut approach?",
    answer: 'Curated sequences and intent—not a dump of files. Every delivery is shaped like a cinematic edit.',
  },
  {
    question: 'How does BY Photography use light?',
    answer: 'Shadow, contrast, and atmosphere are shaped on purpose—light is treated as language in every frame.',
  },
  {
    question: 'What does BY Photography prioritize in a frame?',
    answer: 'We chase feeling first; technical craft and story structure follow emotional truth.',
  },
];

export function getSiteOrigin() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  const env = import.meta.env.VITE_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  return 'https://www.byphotography.in';
}
