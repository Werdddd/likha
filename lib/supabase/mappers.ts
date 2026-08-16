import type {
  Address,
  Category,
  Comment,
  Conversation,
  Creator,
  CreatorOrder,
  JobOffer,
  JobOfferStatus,
  JobOrder,
  JobOrderMilestone,
  JobOrderStatus,
  JobOrderUpdate,
  JobOrderUpdateComment,
  JobPost,
  JobPostComment,
  JobPostStatus,
  Listing,
  Message,
  MilestoneKind,
  MilestoneStatus,
  ModerationStatus,
  Notification,
  NotificationKind,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  ProductCategory,
  ProductType,
  ProfileMode,
  ProfileRole,
  Project,
  ProjectMedia,
  Region,
} from '../../types';

export interface ProfileRow {
  id: string;
  handle: string;
  name: string;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string;
  region: string | null;
  categories: string[];
  profile_mode: string;
  tags: string[];
  badges: string[];
  follower_count: number;
  following_count: number;
  project_count: number;
  role: string;
}

export function profileRowToCreator(row: ProfileRow): Creator {
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    avatarUrl: row.avatar_url ?? '',
    coverUrl: row.cover_url ?? '',
    bio: row.bio,
    region: (row.region as Region) ?? 'Manila',
    categories: row.categories as Category[],
    profileMode: row.profile_mode as ProfileMode,
    tags: row.tags,
    followerCount: row.follower_count,
    followingCount: row.following_count,
    projectCount: row.project_count,
    badges: row.badges,
    role: row.role as ProfileRole,
  };
}

const EDITABLE_PROFILE_FIELDS = [
  'name',
  'handle',
  'avatarUrl',
  'coverUrl',
  'bio',
  'region',
  'categories',
  'profileMode',
  'tags',
] as const;

type EditableProfileFields = Pick<Creator, (typeof EDITABLE_PROFILE_FIELDS)[number]>;

const CAMEL_TO_SNAKE: Record<keyof EditableProfileFields, string> = {
  name: 'name',
  handle: 'handle',
  avatarUrl: 'avatar_url',
  coverUrl: 'cover_url',
  bio: 'bio',
  region: 'region',
  categories: 'categories',
  profileMode: 'profile_mode',
  tags: 'tags',
};

export function creatorUpdatesToProfileRow(
  updates: Partial<EditableProfileFields>,
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const field of EDITABLE_PROFILE_FIELDS) {
    if (updates[field] !== undefined) {
      row[CAMEL_TO_SNAKE[field]] = updates[field];
    }
  }
  return row;
}

export interface ProjectMediaRow {
  id: string;
  url: string;
  type: string;
  caption: string | null;
  position: number;
}

export interface ProjectRow {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  cover_url: string | null;
  categories: string[];
  mediums: string[];
  region: string;
  appreciation_count: number;
  comment_count: number;
  created_at: string;
  moderation_status: string;
  moderation_reason: string | null;
  profiles?: ProfileRow | null;
  project_media?: ProjectMediaRow[];
}

export function projectRowToProject(row: ProjectRow): Project {
  const media: ProjectMedia[] = (row.project_media ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((m) => ({
      id: m.id,
      type: m.type as ProjectMedia['type'],
      url: m.url,
      caption: m.caption ?? undefined,
    }));

  return {
    id: row.id,
    creatorId: row.creator_id,
    title: row.title,
    description: row.description,
    coverUrl: row.cover_url ?? media[0]?.url ?? '',
    media,
    categories: row.categories,
    mediums: row.mediums,
    region: row.region as Region,
    appreciations: row.appreciation_count,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    moderationStatus: row.moderation_status as ModerationStatus,
    moderationReason: row.moderation_reason ?? undefined,
  };
}

export interface CommentRow {
  id: string;
  project_id: string;
  creator_id: string;
  text: string;
  created_at: string;
}

export function commentRowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    projectId: row.project_id,
    creatorId: row.creator_id,
    text: row.text,
    createdAt: row.created_at,
  };
}

export interface ListingImageRow {
  id: string;
  url: string;
  position: number;
}

export interface ListingRow {
  id: string;
  creator_id: string;
  project_id: string | null;
  title: string;
  description: string;
  cover_url: string | null;
  price: number | string;
  product_type: string;
  category: string;
  tags: string[];
  stock: number | null;
  digital_file_path: string | null;
  digital_file_name: string | null;
  is_active: boolean;
  created_at: string;
  moderation_status: string;
  moderation_reason: string | null;
  profiles?: ProfileRow | null;
  listing_images?: ListingImageRow[];
}

export function listingRowToListing(row: ListingRow): Listing {
  const images = (row.listing_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((img) => img.url);

  return {
    id: row.id,
    creatorId: row.creator_id,
    projectId: row.project_id ?? undefined,
    title: row.title,
    description: row.description,
    coverUrl: row.cover_url ?? images[0] ?? '',
    images,
    price: Number(row.price),
    productType: row.product_type as ProductType,
    category: row.category as ProductCategory,
    tags: row.tags,
    stock: row.stock,
    digitalFilePath: row.digital_file_path ?? undefined,
    digitalFileName: row.digital_file_name ?? undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    moderationStatus: row.moderation_status as ModerationStatus,
    moderationReason: row.moderation_reason ?? undefined,
  };
}

export interface OrderItemRow {
  id: string;
  listing_id: string | null;
  title: string;
  cover_url: string | null;
  price: number | string;
  quantity: number;
  product_type: string;
}

export interface OrderRow {
  id: string;
  subtotal: number | string;
  shipping_fee: number | string;
  total: number | string;
  status: string;
  payment_method: string;
  payment_proof_path: string | null;
  payment_verified: boolean;
  address: Address | null;
  created_at: string;
  order_items?: OrderItemRow[];
}

export function orderRowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    items: (row.order_items ?? []).map((item) => ({
      listingId: item.listing_id ?? '',
      title: item.title,
      coverUrl: item.cover_url ?? '',
      price: Number(item.price),
      quantity: item.quantity,
      productType: item.product_type as ProductType,
    })),
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    total: Number(row.total),
    address: row.address,
    paymentMethod: row.payment_method as PaymentMethod,
    paymentProofPath: row.payment_proof_path,
    paymentVerified: row.payment_verified,
    status: row.status as OrderStatus,
    createdAt: row.created_at,
  };
}

export interface CreatorOrderItemRow {
  id: string;
  order_id: string;
  listing_id: string | null;
  title: string;
  cover_url: string | null;
  price: number | string;
  quantity: number;
  product_type: string;
  orders: {
    id: string;
    buyer_id: string;
    status: string;
    address: Address | null;
    payment_method: string;
    payment_proof_path: string | null;
    payment_verified: boolean;
    created_at: string;
  };
}

export function creatorOrderItemRowsToCreatorOrders(rows: CreatorOrderItemRow[]): CreatorOrder[] {
  const byOrder = new Map<string, CreatorOrder>();

  for (const row of rows) {
    const item: OrderItem = {
      listingId: row.listing_id ?? '',
      title: row.title,
      coverUrl: row.cover_url ?? '',
      price: Number(row.price),
      quantity: row.quantity,
      productType: row.product_type as ProductType,
    };

    const existing = byOrder.get(row.order_id);
    if (existing) {
      existing.items.push(item);
    } else {
      byOrder.set(row.order_id, {
        id: row.order_id,
        buyerId: row.orders.buyer_id,
        status: row.orders.status as OrderStatus,
        createdAt: row.orders.created_at,
        address: row.orders.address,
        paymentMethod: row.orders.payment_method as PaymentMethod,
        paymentProofPath: row.orders.payment_proof_path,
        paymentVerified: row.orders.payment_verified,
        items: [item],
      });
    }
  }

  return Array.from(byOrder.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export function messageRowToMessage(row: MessageRow, myId: string): Message {
  return {
    id: row.id,
    text: row.text,
    fromMe: row.sender_id === myId,
    createdAt: row.created_at,
  };
}

export interface ConversationRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  user_a_last_read_at: string;
  user_b_last_read_at: string;
  last_message_at: string;
  created_at: string;
  messages?: MessageRow[];
}

export function conversationRowToConversation(row: ConversationRow, myId: string): Conversation {
  const otherId = row.user_a_id === myId ? row.user_b_id : row.user_a_id;
  const myLastReadAt = row.user_a_id === myId ? row.user_a_last_read_at : row.user_b_last_read_at;
  const lastMessageRow = row.messages?.[0];

  return {
    id: row.id,
    creatorId: otherId,
    lastMessage: lastMessageRow ? messageRowToMessage(lastMessageRow, myId) : undefined,
    read: !lastMessageRow || new Date(myLastReadAt) >= new Date(lastMessageRow.created_at),
  };
}

export interface NotificationRow {
  id: string;
  recipient_id: string;
  actor_id: string;
  kind: string;
  project_id: string | null;
  job_post_id: string | null;
  job_order_id: string | null;
  listing_id: string | null;
  note: string | null;
  content_title: string | null;
  read: boolean;
  created_at: string;
}

export function notificationRowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    kind: row.kind as NotificationKind,
    creatorId: row.actor_id,
    projectId: row.project_id ?? undefined,
    jobPostId: row.job_post_id ?? undefined,
    jobOrderId: row.job_order_id ?? undefined,
    listingId: row.listing_id ?? undefined,
    note: row.note ?? undefined,
    contentTitle: row.content_title ?? undefined,
    createdAt: row.created_at,
    read: row.read,
  };
}

export interface JobPostImageRow {
  id: string;
  url: string;
  position: number;
}

export interface JobPostRow {
  id: string;
  buyer_id: string;
  title: string;
  description: string;
  category: string;
  budget_min: number | string | null;
  budget_max: number | string | null;
  budget_flexible: boolean;
  deadline: string | null;
  deliverable_type: string;
  region: string | null;
  status: string;
  offer_count: number;
  comment_count: number;
  created_at: string;
  moderation_status: string;
  moderation_reason: string | null;
  profiles?: ProfileRow | null;
  job_post_images?: JobPostImageRow[];
}

export function jobPostRowToJobPost(row: JobPostRow): JobPost {
  const images = (row.job_post_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((img) => img.url);

  return {
    id: row.id,
    buyerId: row.buyer_id,
    title: row.title,
    description: row.description,
    category: row.category as Category,
    budgetMin: row.budget_min === null ? null : Number(row.budget_min),
    budgetMax: row.budget_max === null ? null : Number(row.budget_max),
    budgetFlexible: row.budget_flexible,
    deadline: row.deadline,
    deliverableType: row.deliverable_type as ProductType,
    region: (row.region as Region) ?? null,
    images,
    status: row.status as JobPostStatus,
    offerCount: row.offer_count,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    moderationStatus: row.moderation_status as ModerationStatus,
    moderationReason: row.moderation_reason ?? undefined,
  };
}

export interface JobOfferRow {
  id: string;
  job_post_id: string;
  creator_id: string;
  price: number | string;
  turnaround_days: number;
  pitch: string;
  portfolio_project_id: string | null;
  status: string;
  created_at: string;
}

export function jobOfferRowToJobOffer(row: JobOfferRow): JobOffer {
  return {
    id: row.id,
    jobPostId: row.job_post_id,
    creatorId: row.creator_id,
    price: Number(row.price),
    turnaroundDays: row.turnaround_days,
    pitch: row.pitch,
    portfolioProjectId: row.portfolio_project_id ?? undefined,
    status: row.status as JobOfferStatus,
    createdAt: row.created_at,
  };
}

export interface JobPostCommentRow {
  id: string;
  job_post_id: string;
  creator_id: string;
  text: string;
  created_at: string;
}

export function jobPostCommentRowToComment(row: JobPostCommentRow): JobPostComment {
  return {
    id: row.id,
    jobPostId: row.job_post_id,
    creatorId: row.creator_id,
    text: row.text,
    createdAt: row.created_at,
  };
}

export interface JobOrderMilestoneRow {
  id: string;
  job_order_id: string;
  kind: string;
  amount: number | string;
  status: string;
  payment_proof_path: string | null;
}

export function jobOrderMilestoneRowToMilestone(row: JobOrderMilestoneRow): JobOrderMilestone {
  return {
    id: row.id,
    jobOrderId: row.job_order_id,
    kind: row.kind as MilestoneKind,
    amount: Number(row.amount),
    status: row.status as MilestoneStatus,
    paymentProofPath: row.payment_proof_path,
  };
}

export interface JobOrderRow {
  id: string;
  job_post_id: string;
  offer_id: string;
  buyer_id: string;
  creator_id: string;
  price: number | string;
  deliverable_type: string;
  address: Address | null;
  status: string;
  final_file_path: string | null;
  final_file_name: string | null;
  buyer_confirmed_at: string | null;
  created_at: string;
  job_order_milestones?: JobOrderMilestoneRow[];
}

export function jobOrderRowToJobOrder(row: JobOrderRow): JobOrder {
  return {
    id: row.id,
    jobPostId: row.job_post_id,
    offerId: row.offer_id,
    buyerId: row.buyer_id,
    creatorId: row.creator_id,
    price: Number(row.price),
    deliverableType: row.deliverable_type as ProductType,
    address: row.address,
    status: row.status as JobOrderStatus,
    finalFilePath: row.final_file_path,
    finalFileName: row.final_file_name,
    milestones: (row.job_order_milestones ?? []).map(jobOrderMilestoneRowToMilestone),
    buyerConfirmedAt: row.buyer_confirmed_at,
    createdAt: row.created_at,
  };
}

export interface JobOrderUpdateImageRow {
  id: string;
  path: string;
  position: number;
}

export interface JobOrderUpdateRow {
  id: string;
  job_order_id: string;
  creator_id: string;
  body: string;
  file_path: string | null;
  file_name: string | null;
  created_at: string;
  job_order_update_images?: JobOrderUpdateImageRow[];
}

export function jobOrderUpdateRowToJobOrderUpdate(row: JobOrderUpdateRow): JobOrderUpdate {
  return {
    id: row.id,
    jobOrderId: row.job_order_id,
    creatorId: row.creator_id,
    body: row.body,
    filePath: row.file_path,
    fileName: row.file_name,
    imagePaths: (row.job_order_update_images ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((img) => img.path),
    createdAt: row.created_at,
  };
}

export interface JobOrderUpdateCommentRow {
  id: string;
  job_order_id: string;
  update_id: string;
  creator_id: string;
  text: string;
  created_at: string;
}

export function jobOrderUpdateCommentRowToComment(row: JobOrderUpdateCommentRow): JobOrderUpdateComment {
  return {
    id: row.id,
    jobOrderId: row.job_order_id,
    updateId: row.update_id,
    creatorId: row.creator_id,
    text: row.text,
    createdAt: row.created_at,
  };
}
