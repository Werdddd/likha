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

export type ProfileRole = 'user' | 'admin';

/**
 * Layer 1 AI-image-detection outcome. 'clean' publishes immediately; 'pending_review'
 * is held out of public view until an admin decides 'approved' or 'rejected'.
 */
export type ModerationStatus = 'clean' | 'pending_review' | 'approved' | 'rejected';

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
  role: ProfileRole;
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
  moderationStatus: ModerationStatus;
  moderationReason?: string;
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
  digitalFilePath?: string;
  digitalFileName?: string;
  isActive: boolean;
  createdAt: string;
  moderationStatus: ModerationStatus;
  moderationReason?: string;
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
  buyerId: string;
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
  /** Revenue from orders whose payment has been verified. */
  revenue: number;
  /** Revenue sitting in orders still awaiting payment verification — not yet safe to count on. */
  pendingRevenue: number;
  ordersCount: number;
  itemsSold: number;
  listingsCount: number;
  topListings: TopListing[];
}

export type NotificationKind =
  | 'appreciation'
  | 'follow'
  | 'comment'
  | 'job_offer'
  | 'job_offer_accepted'
  | 'job_offer_rejected'
  | 'job_offer_withdrawn'
  | 'job_order_milestone_paid'
  | 'job_order_milestone_released'
  | 'job_order_update'
  | 'job_order_revision'
  | 'job_order_delivered'
  | 'job_order_cancelled'
  | 'content_flagged'
  | 'content_approved'
  | 'content_rejected';

export interface Notification {
  id: string;
  kind: NotificationKind;
  creatorId: string;
  projectId?: string;
  jobPostId?: string;
  jobOrderId?: string;
  listingId?: string;
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

export type JobPostStatus = 'open' | 'fulfilled' | 'cancelled';

export interface JobPost {
  id: string;
  buyerId: string;
  title: string;
  description: string;
  category: Category;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetFlexible: boolean;
  deadline: string | null;
  deliverableType: ProductType;
  region: Region | null;
  images: string[];
  status: JobPostStatus;
  offerCount: number;
  commentCount: number;
  createdAt: string;
}

export type JobOfferStatus = 'pending' | 'accepted' | 'not_selected' | 'withdrawn';

export interface JobOffer {
  id: string;
  jobPostId: string;
  creatorId: string;
  price: number;
  turnaroundDays: number;
  pitch: string;
  portfolioProjectId?: string;
  status: JobOfferStatus;
  createdAt: string;
}

export interface JobPostComment {
  id: string;
  jobPostId: string;
  creatorId: string;
  text: string;
  createdAt: string;
}

export type MilestoneKind = 'deposit' | 'final';
export type MilestoneStatus = 'pending' | 'paid' | 'released';

export interface JobOrderMilestone {
  id: string;
  jobOrderId: string;
  kind: MilestoneKind;
  amount: number;
  status: MilestoneStatus;
  paymentProofPath: string | null;
}

export type JobOrderStatus = 'deposit_pending' | 'in_progress' | 'revision' | 'delivered' | 'completed' | 'cancelled';

export interface JobOrder {
  id: string;
  jobPostId: string;
  offerId: string;
  buyerId: string;
  creatorId: string;
  price: number;
  deliverableType: ProductType;
  address: Address | null;
  status: JobOrderStatus;
  finalFilePath: string | null;
  finalFileName: string | null;
  milestones: JobOrderMilestone[];
  buyerConfirmedAt: string | null;
  createdAt: string;
}

export interface JobOrderUpdate {
  id: string;
  jobOrderId: string;
  creatorId: string;
  body: string;
  filePath: string | null;
  fileName: string | null;
  imagePaths: string[];
  createdAt: string;
}

export interface JobOrderUpdateComment {
  id: string;
  jobOrderId: string;
  updateId: string;
  creatorId: string;
  text: string;
  createdAt: string;
}
