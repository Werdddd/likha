export type ProfileMode = 'portfolio' | 'open_for_work';

export type Category =
  | 'Illustration'
  | 'Graphic Design'
  | 'Photography'
  | 'UI/UX Design'
  | 'Writing'
  | '3D Art'
  | 'Crafts';

export type Region =
  | 'Manila'
  | 'Cebu'
  | 'Davao'
  | 'Iloilo'
  | 'Baguio'
  | 'Bacolod';

export type ProductType = 'digital' | 'physical';

export type DigitalCategory =
  | 'Digital Art'
  | 'Templates'
  | 'Illustrations'
  | 'Stickers'
  | 'Fonts'
  | 'UI Kits'
  | 'Presets';

export type PhysicalCategory = 'Prints' | 'Crafts' | 'Photography Prints';

export type ProductCategory = DigitalCategory | PhysicalCategory;

export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  region: Region;
  categories: Category[];
  profileMode: ProfileMode;
  tags: string[];
  followerCount: number;
  followingCount: number;
  projectCount: number;
  badges: string[];
}

export interface ProjectMedia {
  id: string;
  type: 'image' | 'video' | 'text';
  url: string;
  caption?: string;
}

export interface Project {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  coverUrl: string;
  media: ProjectMedia[];
  categories: string[];
  mediums: string[];
  region: Region;
  appreciations: number;
  commentCount: number;
  createdAt: string;
}

export interface FilterState {
  query: string;
  category: Category | null;
  region: Region | null;
}

export interface Listing {
  id: string;
  creatorId: string;
  projectId?: string;
  title: string;
  description: string;
  coverUrl: string;
  images: string[];
  price: number;
  productType: ProductType;
  category: ProductCategory;
  tags: string[];
  stock: number | null;
  digitalFileName?: string;
  createdAt: string;
}

export interface CartLine {
  listingId: string;
  quantity: number;
}

export interface Address {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  region: Region;
  postalCode: string;
}

export type PaymentMethod = 'gcash' | 'card';

export interface OrderItem {
  listingId: string;
  title: string;
  coverUrl: string;
  price: number;
  quantity: number;
  productType: ProductType;
}

export type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'rejected';

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  address: Address | null;
  paymentMethod: PaymentMethod;
  paymentProofPath: string | null;
  paymentVerified: boolean;
  status: OrderStatus;
  createdAt: string;
}

export interface CreatorOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  address: Address | null;
  paymentMethod: PaymentMethod;
  paymentProofPath: string | null;
  paymentVerified: boolean;
  items: OrderItem[];
}

export interface TopListing {
  listingId: string;
  title: string;
  coverUrl: string;
  unitsSold: number;
  revenue: number;
}

export interface DashboardStats {
  revenue: number;
  ordersCount: number;
  itemsSold: number;
  listingsCount: number;
  topListings: TopListing[];
}

export type NotificationKind = 'appreciation' | 'follow' | 'comment';

export interface Notification {
  id: string;
  kind: NotificationKind;
  creatorId: string;
  projectId?: string;
  createdAt: string;
  read: boolean;
}

export interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  creatorId: string;
  lastMessage?: Message;
  read: boolean;
}

export interface Comment {
  id: string;
  projectId: string;
  creatorId: string;
  text: string;
  createdAt: string;
}
