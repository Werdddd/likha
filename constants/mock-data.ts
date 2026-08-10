import type { Creator, Discipline, Listing, Notification, Project, Region } from '../types';

export const disciplines: Discipline[] = [
  'Illustration',
  'Graphic Design',
  'Photography',
  'UI/UX Design',
  'Writing',
  '3D Art',
  'Crafts',
];

export const regions: Region[] = ['Manila', 'Cebu', 'Davao', 'Iloilo', 'Baguio', 'Bacolod'];

const avatar = (seed: string) => `https://picsum.photos/seed/${seed}/200/200`;
const cover = (seed: string) => `https://picsum.photos/seed/${seed}/800/500`;

export const creators: Creator[] = [
  {
    id: 'c1',
    name: 'Mika Santos',
    handle: 'mikasantos',
    avatarUrl: avatar('mika'),
    coverUrl: cover('mika-cover'),
    bio: 'Editorial illustrator drawing modern stories with a Filipino heart. Open for commissions.',
    region: 'Manila',
    disciplines: ['Illustration'],
    profileMode: 'open_for_work',
    tags: ['editorial', 'watercolor', 'character design'],
    followerCount: 3120,
    followingCount: 214,
    projectCount: 18,
    badges: ['Top Seller', 'Verified ID'],
  },
  {
    id: 'c2',
    name: 'Julio Ramos',
    handle: 'julioramos',
    avatarUrl: avatar('julio'),
    coverUrl: cover('julio-cover'),
    bio: 'UI/UX designer crafting clean, human-centered products for PH startups.',
    region: 'Cebu',
    disciplines: ['UI/UX Design'],
    profileMode: 'open_for_work',
    tags: ['mobile', 'design systems', 'case study'],
    followerCount: 1893,
    followingCount: 98,
    projectCount: 12,
    badges: ['Fast Responder'],
  },
  {
    id: 'c3',
    name: 'Bea Villanueva',
    handle: 'beavillanueva',
    avatarUrl: avatar('bea'),
    coverUrl: cover('bea-cover'),
    bio: 'Street and portrait photographer based in Davao. Film shooter at heart.',
    region: 'Davao',
    disciplines: ['Photography'],
    profileMode: 'portfolio',
    tags: ['film', 'portraits', 'street'],
    followerCount: 902,
    followingCount: 341,
    projectCount: 27,
    badges: ['Student'],
  },
  {
    id: 'c4',
    name: 'Carlo Dizon',
    handle: 'carlodizon',
    avatarUrl: avatar('carlo'),
    coverUrl: cover('carlo-cover'),
    bio: '3D artist exploring Filipino folklore through modern renders.',
    region: 'Manila',
    disciplines: ['3D Art'],
    profileMode: 'open_for_work',
    tags: ['blender', 'folklore', 'stylized'],
    followerCount: 4520,
    followingCount: 120,
    projectCount: 9,
    badges: ['Top Seller'],
  },
  {
    id: 'c5',
    name: 'Trisha Aquino',
    handle: 'trishaaquino',
    avatarUrl: avatar('trisha'),
    coverUrl: cover('trisha-cover'),
    bio: 'Graphic designer & letterer. Banig patterns meet modern branding.',
    region: 'Iloilo',
    disciplines: ['Graphic Design'],
    profileMode: 'open_for_work',
    tags: ['branding', 'lettering', 'pattern'],
    followerCount: 2210,
    followingCount: 176,
    projectCount: 21,
    badges: ['Verified ID'],
  },
  {
    id: 'c6',
    name: 'Ka Ronnie Cruz',
    handle: 'karonniecruz',
    avatarUrl: avatar('ronnie'),
    coverUrl: cover('ronnie-cover'),
    bio: 'Woodcraft and weaving artisan from Baguio, sharing process and stories.',
    region: 'Baguio',
    disciplines: ['Crafts'],
    profileMode: 'portfolio',
    tags: ['woodcraft', 'weaving', 'heritage'],
    followerCount: 615,
    followingCount: 88,
    projectCount: 14,
    badges: [],
  },
  {
    id: 'c7',
    name: 'Nadine Reyes',
    handle: 'nadinereyes',
    avatarUrl: avatar('nadine'),
    coverUrl: cover('nadine-cover'),
    bio: 'Copywriter and essayist. Words that sound like home.',
    region: 'Bacolod',
    disciplines: ['Writing'],
    profileMode: 'open_for_work',
    tags: ['copywriting', 'essays', 'brand voice'],
    followerCount: 1340,
    followingCount: 260,
    projectCount: 33,
    badges: ['Fast Responder'],
  },
];

const projectSeeds: Array<{
  creatorId: string;
  title: string;
  description: string;
  mediums: string[];
  discipline: Discipline;
  region: Region;
}> = [
  { creatorId: 'c1', title: 'Buwan ng Wika Editorial Series', description: 'A five-piece illustration series celebrating Filipino language for a national magazine feature.', mediums: ['watercolor', 'editorial'], discipline: 'Illustration', region: 'Manila' },
  { creatorId: 'c1', title: 'Jeepney Dreams', description: 'Character study exploring jeepney culture through bold color and pattern.', mediums: ['digital', 'character design'], discipline: 'Illustration', region: 'Manila' },
  { creatorId: 'c1', title: 'Sinulog Spirit', description: 'Festival-inspired poster set commissioned for a Cebu cultural event.', mediums: ['poster', 'festival'], discipline: 'Illustration', region: 'Manila' },
  { creatorId: 'c2', title: 'Sari-Sari App Redesign', description: 'End-to-end UX case study: problem, process, and solution for a neighborhood store ordering app.', mediums: ['mobile', 'case study'], discipline: 'UI/UX Design', region: 'Cebu' },
  { creatorId: 'c2', title: 'Likha Design System', description: 'Component library and design tokens built for a creator marketplace.', mediums: ['design systems'], discipline: 'UI/UX Design', region: 'Cebu' },
  { creatorId: 'c2', title: 'Lalamove Driver App Flows', description: 'Onboarding and delivery-tracking flow improvements for a logistics app.', mediums: ['mobile', 'flows'], discipline: 'UI/UX Design', region: 'Cebu' },
  { creatorId: 'c3', title: 'Davao Streets, Vol. 2', description: 'A black-and-white film series documenting everyday life in Davao.', mediums: ['film', 'street'], discipline: 'Photography', region: 'Davao' },
  { creatorId: 'c3', title: 'Portraits of the Market', description: 'Portrait series shot at Bankerohan Public Market, gear: Pentax K1000, Kodak Portra 400.', mediums: ['portraits', 'film'], discipline: 'Photography', region: 'Davao' },
  { creatorId: 'c3', title: 'Golden Hour, Samal', description: 'Landscape and lifestyle set from Samal Island at sunset.', mediums: ['landscape'], discipline: 'Photography', region: 'Davao' },
  { creatorId: 'c4', title: 'Aswang Reimagined', description: 'Stylized 3D character renders reinterpreting Filipino folklore creatures.', mediums: ['blender', 'folklore'], discipline: '3D Art', region: 'Manila' },
  { creatorId: 'c4', title: 'Barong Motif Study', description: 'Procedural 3D pattern experiments inspired by barong tagalog embroidery.', mediums: ['procedural', 'pattern'], discipline: '3D Art', region: 'Manila' },
  { creatorId: 'c5', title: 'Manggahan Brand Identity', description: 'Full branding suite for a mango farm cooperative, with banig-inspired patterns.', mediums: ['branding', 'pattern'], discipline: 'Graphic Design', region: 'Iloilo' },
  { creatorId: 'c5', title: 'Dinagyang Type Poster', description: 'Hand-lettered festival poster celebrating Iloilo’s Dinagyang.', mediums: ['lettering', 'poster'], discipline: 'Graphic Design', region: 'Iloilo' },
  { creatorId: 'c6', title: 'Weaving the Cordillera', description: 'Process journal documenting a traditional Cordillera weaving piece from start to finish.', mediums: ['weaving', 'heritage'], discipline: 'Crafts', region: 'Baguio' },
  { creatorId: 'c6', title: 'Pinewood Carving Series', description: 'A set of hand-carved pinewood figures inspired by Baguio folklore.', mediums: ['woodcraft'], discipline: 'Crafts', region: 'Baguio' },
  { creatorId: 'c7', title: 'Brand Voice: Local Coffee Co.', description: 'Copywriting case study for a Negros-based coffee brand’s full launch campaign.', mediums: ['copywriting', 'brand voice'], discipline: 'Writing', region: 'Bacolod' },
  { creatorId: 'c7', title: 'Essays on Coming Home', description: 'A personal essay collection about balikbayan life, published in a local zine.', mediums: ['essays'], discipline: 'Writing', region: 'Bacolod' },
];

export const projects: Project[] = projectSeeds.map((seed, index) => {
  const id = `p${index + 1}`;
  const mediaCount = 2 + (index % 3);
  return {
    id,
    creatorId: seed.creatorId,
    title: seed.title,
    description: seed.description,
    coverUrl: cover(`${id}-cover`),
    media: Array.from({ length: mediaCount }, (_, i) => ({
      id: `${id}-m${i + 1}`,
      type: 'image' as const,
      url: cover(`${id}-media-${i + 1}`),
    })),
    discipline: seed.discipline,
    mediums: seed.mediums,
    region: seed.region,
    appreciations: 20 + index * 13,
    commentCount: index % 7,
    createdAt: new Date(2026, 0, 1 + index * 4).toISOString(),
  };
});

const listingSeeds: Array<{
  creatorId: string;
  projectId?: string;
  title: string;
  description: string;
  price: number;
  category: Discipline;
  tags: string[];
  stock: number | null;
}> = [
  { creatorId: 'c1', projectId: 'p1', title: 'Buwan ng Wika Print Set', description: 'A set of five giclée art prints from the Buwan ng Wika editorial series, printed on 250gsm matte stock.', price: 850, category: 'Illustration', tags: ['print', 'editorial'], stock: 25 },
  { creatorId: 'c1', title: 'Custom Character Commission', description: 'A fully rendered character illustration, tailored to your brief. Includes two rounds of revisions.', price: 3500, category: 'Illustration', tags: ['commission', 'character design'], stock: null },
  { creatorId: 'c2', title: 'Mobile UI Kit — Sari-Sari Style', description: 'A Figma component library of 60+ mobile screens inspired by neighborhood store ordering apps.', price: 1200, category: 'UI/UX Design', tags: ['ui kit', 'figma'], stock: 50 },
  { creatorId: 'c2', title: 'Design System Audit', description: "A one-hour consult reviewing your product's design system, with a written action-item report.", price: 2500, category: 'UI/UX Design', tags: ['consulting'], stock: null },
  { creatorId: 'c4', projectId: 'p10', title: 'Aswang Reimagined Art Print', description: 'A museum-quality print of the Aswang Reimagined 3D character series, signed and numbered.', price: 950, category: '3D Art', tags: ['print', 'folklore'], stock: 15 },
  { creatorId: 'c4', title: 'Custom 3D Character Render', description: 'A stylized 3D character render built to spec in Blender, delivered as a high-res still.', price: 5000, category: '3D Art', tags: ['commission', 'blender'], stock: null },
  { creatorId: 'c5', projectId: 'p12', title: 'Manggahan Branding Package', description: 'Full branding suite: logo, color system, and banig-inspired pattern library, delivered with usage guidelines.', price: 8000, category: 'Graphic Design', tags: ['branding'], stock: null },
  { creatorId: 'c5', title: 'Banig Pattern Sticker Pack', description: 'A pack of 12 vinyl stickers featuring hand-drawn banig-inspired patterns.', price: 250, category: 'Graphic Design', tags: ['stickers', 'pattern'], stock: 100 },
  { creatorId: 'c7', title: 'Brand Voice Copywriting Package', description: 'A full brand-voice package: tone guide, tagline options, and sample copy for your top three channels.', price: 4500, category: 'Writing', tags: ['copywriting'], stock: null },
];

export const listings: Listing[] = listingSeeds.map((seed, index) => {
  const id = `l${index + 1}`;
  const imageCount = 2 + (index % 2);
  return {
    id,
    creatorId: seed.creatorId,
    projectId: seed.projectId,
    title: seed.title,
    description: seed.description,
    coverUrl: cover(`${id}-cover`),
    images: Array.from({ length: imageCount }, (_, i) => cover(`${id}-media-${i + 1}`)),
    price: seed.price,
    category: seed.category,
    tags: seed.tags,
    stock: seed.stock,
    createdAt: new Date(2026, 1, 1 + index * 5).toISOString(),
  };
});

export const getCreatorById = (id: string): Creator | undefined =>
  creators.find((c) => c.id === id);

export const getProjectById = (id: string): Project | undefined =>
  projects.find((p) => p.id === id);

export const getProjectsByCreator = (creatorId: string): Project[] =>
  projects.filter((p) => p.creatorId === creatorId);

export const getListingById = (id: string): Listing | undefined =>
  listings.find((l) => l.id === id);

export const getListingsByCreator = (creatorId: string): Listing[] =>
  listings.filter((l) => l.creatorId === creatorId);

export const getListingByProjectId = (projectId: string): Listing | undefined =>
  listings.find((l) => l.projectId === projectId);

export const currentUser: Creator = creators[0];

export const notifications: Notification[] = [
  { id: 'n1', kind: 'appreciation', creatorId: 'c2', projectId: 'p1', createdAt: new Date(2026, 7, 9, 8, 15).toISOString(), read: false },
  { id: 'n2', kind: 'follow', creatorId: 'c5', createdAt: new Date(2026, 7, 8, 19, 40).toISOString(), read: false },
  { id: 'n3', kind: 'comment', creatorId: 'c3', projectId: 'p2', createdAt: new Date(2026, 7, 8, 12, 5).toISOString(), read: false },
  { id: 'n4', kind: 'appreciation', creatorId: 'c4', projectId: 'p1', createdAt: new Date(2026, 7, 7, 21, 30).toISOString(), read: true },
  { id: 'n5', kind: 'follow', creatorId: 'c7', createdAt: new Date(2026, 7, 6, 9, 0).toISOString(), read: true },
  { id: 'n6', kind: 'comment', creatorId: 'c6', projectId: 'p3', createdAt: new Date(2026, 7, 4, 16, 20).toISOString(), read: true },
];
