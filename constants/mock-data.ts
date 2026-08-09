import type { Creator, Discipline, Project, Region } from '../types';

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
    discipline: 'Illustration',
    profileMode: 'open_for_work',
    tags: ['editorial', 'watercolor', 'character design'],
    followerCount: 3120,
    followingCount: 214,
    projectCount: 18,
    responseTime: 'Usually responds within a day',
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
    discipline: 'UI/UX Design',
    profileMode: 'open_for_work',
    tags: ['mobile', 'design systems', 'case study'],
    followerCount: 1893,
    followingCount: 98,
    projectCount: 12,
    responseTime: 'Usually responds within a few hours',
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
    discipline: 'Photography',
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
    discipline: '3D Art',
    profileMode: 'open_for_work',
    tags: ['blender', 'folklore', 'stylized'],
    followerCount: 4520,
    followingCount: 120,
    projectCount: 9,
    responseTime: 'Usually responds within 2 days',
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
    discipline: 'Graphic Design',
    profileMode: 'open_for_work',
    tags: ['branding', 'lettering', 'pattern'],
    followerCount: 2210,
    followingCount: 176,
    projectCount: 21,
    responseTime: 'Usually responds within a day',
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
    discipline: 'Crafts',
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
    discipline: 'Writing',
    profileMode: 'open_for_work',
    tags: ['copywriting', 'essays', 'brand voice'],
    followerCount: 1340,
    followingCount: 260,
    projectCount: 33,
    responseTime: 'Usually responds within a day',
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

export const getCreatorById = (id: string): Creator | undefined =>
  creators.find((c) => c.id === id);

export const getProjectById = (id: string): Project | undefined =>
  projects.find((p) => p.id === id);

export const getProjectsByCreator = (creatorId: string): Project[] =>
  projects.filter((p) => p.creatorId === creatorId);

export const currentUser: Creator = creators[0];
