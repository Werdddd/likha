export type ProfileMode = 'portfolio' | 'open_for_work';

export type Discipline =
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

export interface Creator {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  coverUrl: string;
  bio: string;
  region: Region;
  disciplines: Discipline[];
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
  discipline: Discipline;
  mediums: string[];
  region: Region;
  appreciations: number;
  commentCount: number;
  createdAt: string;
}

export interface FilterState {
  query: string;
  discipline: Discipline | null;
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
  category: Discipline;
  tags: string[];
  stock: number | null;
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

export type PaymentMethod = 'cod' | 'gcash' | 'card';

export interface OrderItem {
  listingId: string;
  title: string;
  coverUrl: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  address: Address;
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export type OrderStatus = 'processing' | 'shipped' | 'delivered';

export type NotificationKind = 'appreciation' | 'follow' | 'comment';

export interface Notification {
  id: string;
  kind: NotificationKind;
  creatorId: string;
  projectId?: string;
  createdAt: string;
  read: boolean;
}
