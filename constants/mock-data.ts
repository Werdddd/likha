import type {
  Comment,
  Conversation,
  Creator,
  DigitalCategory,
  Discipline,
  Listing,
  Notification,
  PhysicalCategory,
  Project,
  ProductCategory,
  Region,
} from '../types';

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

export const digitalCategories: DigitalCategory[] = [
  'Digital Art',
  'Templates',
  'Illustrations',
  'Stickers',
  'Fonts',
  'UI Kits',
  'Presets',
];

export const physicalCategories: PhysicalCategory[] = ['Prints', 'Crafts', 'Photography Prints'];

export const productCategories: ProductCategory[] = [...digitalCategories, ...physicalCategories];

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
    createdAt: new Date(2026, 0, 1 + index * 4).toISOString(),
  };
});

const listingSeeds: Array<{
  creatorId: string;
  projectId?: string;
  title: string;
  description: string;
  price: number;
  productType: 'digital' | 'physical';
  category: ProductCategory;
  tags: string[];
  stock: number | null;
}> = [
  { creatorId: 'c1', projectId: 'p1', title: 'Buwan ng Wika Print Set', description: 'A set of five giclée art prints from the Buwan ng Wika editorial series, printed on 250gsm matte stock.', price: 850, productType: 'physical', category: 'Prints', tags: ['print', 'editorial'], stock: 25 },
  { creatorId: 'c1', title: 'Custom Character Illustration', description: 'A fully rendered character illustration, tailored to your brief. Delivered as a high-res digital file with two rounds of revisions.', price: 3500, productType: 'digital', category: 'Illustrations', tags: ['commission', 'character design'], stock: null },
  { creatorId: 'c2', title: 'Mobile UI Kit — Sari-Sari Style', description: 'A Figma component library of 60+ mobile screens inspired by neighborhood store ordering apps.', price: 1200, productType: 'digital', category: 'UI Kits', tags: ['ui kit', 'figma'], stock: null },
  { creatorId: 'c2', title: 'Design System Starter Templates', description: "A Figma template pack with a written action-item guide for auditing your product's design system.", price: 2500, productType: 'digital', category: 'Templates', tags: ['design systems', 'figma'], stock: null },
  { creatorId: 'c3', title: 'Davao Streets Film Print Set', description: 'A set of six archival photography prints from the Davao Streets black-and-white film series, printed on fine art paper.', price: 1400, productType: 'physical', category: 'Photography Prints', tags: ['print', 'film', 'street'], stock: 20 },
  { creatorId: 'c3', title: 'Golden Hour Lightroom Presets', description: 'A pack of 15 Lightroom presets for warm, film-inspired color grading, developed for the Golden Hour, Samal series.', price: 450, productType: 'digital', category: 'Presets', tags: ['lightroom', 'presets'], stock: null },
  { creatorId: 'c4', projectId: 'p10', title: 'Aswang Reimagined Art Print', description: 'A museum-quality print of the Aswang Reimagined 3D character series, signed and numbered.', price: 950, productType: 'physical', category: 'Prints', tags: ['print', 'folklore'], stock: 15 },
  { creatorId: 'c4', title: 'Custom 3D Character Render', description: 'A stylized 3D character render built to spec in Blender, delivered as a high-res digital still.', price: 5000, productType: 'digital', category: 'Digital Art', tags: ['commission', 'blender'], stock: null },
  { creatorId: 'c5', projectId: 'p12', title: 'Manggahan Branding Templates', description: 'Full branding template suite: logo files, color system, and banig-inspired pattern library, with usage guidelines.', price: 8000, productType: 'digital', category: 'Templates', tags: ['branding'], stock: null },
  { creatorId: 'c5', title: 'Banig Pattern Sticker Pack', description: 'A digital sticker pack of 12 hand-drawn banig-inspired patterns, print-at-home ready.', price: 250, productType: 'digital', category: 'Stickers', tags: ['stickers', 'pattern'], stock: null },
  { creatorId: 'c5', title: 'Dinagyang Display Font', description: 'A hand-lettered display font family inspired by Iloilo’s Dinagyang festival typography, with commercial licensing.', price: 900, productType: 'digital', category: 'Fonts', tags: ['font', 'lettering'], stock: null },
  { creatorId: 'c6', title: 'Handwoven Cordillera Wall Hanging', description: 'A one-of-a-kind handwoven wall hanging made using traditional Cordillera weaving techniques.', price: 2800, productType: 'physical', category: 'Crafts', tags: ['weaving', 'heritage'], stock: 6 },
  { creatorId: 'c6', title: 'Pinewood Carved Figure', description: 'A hand-carved pinewood figure inspired by Baguio folklore, made to order by a local artisan.', price: 1600, productType: 'physical', category: 'Crafts', tags: ['woodcraft'], stock: null },
  { creatorId: 'c7', title: 'Brand Voice Copywriting Templates', description: 'A brand-voice template pack: tone guide, tagline worksheet, and sample copy structures for your top three channels.', price: 1800, productType: 'digital', category: 'Templates', tags: ['copywriting', 'brand voice'], stock: null },
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
    productType: seed.productType,
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

export const conversations: Conversation[] = [
  {
    id: 'conv1',
    creatorId: 'c2',
    read: false,
    messages: [
      { id: 'conv1-m1', fromMe: false, text: 'Hey Mika! Loved the Buwan ng Wika series. Any chance you take on UI illustration commissions?', createdAt: new Date(2026, 7, 9, 9, 2).toISOString() },
      { id: 'conv1-m2', fromMe: true, text: 'Thank you Julio! Yes, I do — what did you have in mind?', createdAt: new Date(2026, 7, 9, 9, 14).toISOString() },
      { id: 'conv1-m3', fromMe: false, text: 'A set of empty-state illustrations for the Sari-Sari app, maybe 4-5 pieces.', createdAt: new Date(2026, 7, 9, 9, 16).toISOString() },
      { id: 'conv1-m4', fromMe: false, text: 'Timeline would be about two weeks. Budget is flexible.', createdAt: new Date(2026, 7, 9, 9, 17).toISOString() },
    ],
  },
  {
    id: 'conv2',
    creatorId: 'c5',
    read: true,
    messages: [
      { id: 'conv2-m1', fromMe: true, text: 'Hi Trisha, the Banig Pattern Sticker Pack is gorgeous — did you design the pattern from scratch?', createdAt: new Date(2026, 7, 7, 14, 3).toISOString() },
      { id: 'conv2-m2', fromMe: false, text: 'Thank you! Yes, based on a weave I sketched from a market visit in Iloilo.', createdAt: new Date(2026, 7, 7, 14, 20).toISOString() },
      { id: 'conv2-m3', fromMe: false, text: 'Glad it caught your eye 🙂', createdAt: new Date(2026, 7, 7, 14, 21).toISOString() },
    ],
  },
  {
    id: 'conv3',
    creatorId: 'c4',
    read: true,
    messages: [
      { id: 'conv3-m1', fromMe: false, text: 'Saw your Jeepney Dreams project — would love to collab on a folklore x jeepney render sometime.', createdAt: new Date(2026, 7, 5, 11, 0).toISOString() },
      { id: 'conv3-m2', fromMe: true, text: "That sounds fun, let's talk details closer to September.", createdAt: new Date(2026, 7, 5, 18, 45).toISOString() },
    ],
  },
  {
    id: 'conv4',
    creatorId: 'c7',
    read: true,
    messages: [
      { id: 'conv4-m1', fromMe: true, text: 'Nadine, do you write artist bios? Need one for an upcoming feature.', createdAt: new Date(2026, 7, 2, 10, 10).toISOString() },
      { id: 'conv4-m2', fromMe: false, text: 'I do! Send me your project links and a few keywords and I can draft something this week.', createdAt: new Date(2026, 7, 2, 10, 40).toISOString() },
    ],
  },
];

export const getConversationById = (id: string): Conversation | undefined =>
  conversations.find((c) => c.id === id);

export const getConversationsSorted = (list: Conversation[] = conversations): Conversation[] =>
  [...list].sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1]?.createdAt ?? '';
    const bLast = b.messages[b.messages.length - 1]?.createdAt ?? '';
    return bLast.localeCompare(aLast);
  });

export const comments: Comment[] = [
  { id: 'cm1', projectId: 'p1', creatorId: 'c2', text: 'The color palette in this series is stunning. What was your reference for the third piece?', createdAt: new Date(2026, 7, 8, 10, 12).toISOString() },
  { id: 'cm2', projectId: 'p1', creatorId: 'c5', text: 'This is such a lovely tribute to Buwan ng Wika. The linework is so clean.', createdAt: new Date(2026, 7, 8, 15, 40).toISOString() },
  { id: 'cm3', projectId: 'p1', creatorId: 'c4', text: 'Would love to see a print set of these!', createdAt: new Date(2026, 7, 9, 8, 5).toISOString() },
  { id: 'cm4', projectId: 'p2', creatorId: 'c3', text: 'The jeepney patterns here are so alive, love the composition.', createdAt: new Date(2026, 7, 8, 12, 5).toISOString() },
  { id: 'cm5', projectId: 'p3', creatorId: 'c6', text: 'Sinulog energy captured perfectly, ang ganda!', createdAt: new Date(2026, 7, 4, 16, 20).toISOString() },
  { id: 'cm6', projectId: 'p4', creatorId: 'c1', text: 'Really clean UX flow — the onboarding screens especially.', createdAt: new Date(2026, 7, 6, 9, 30).toISOString() },
  { id: 'cm7', projectId: 'p4', creatorId: 'c7', text: 'This case study is super thorough, thanks for sharing your process.', createdAt: new Date(2026, 7, 7, 14, 2).toISOString() },
];

export const getCommentsByProjectId = (projectId: string): Comment[] =>
  comments.filter((c) => c.projectId === projectId);
