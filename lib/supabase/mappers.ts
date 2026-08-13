import type {
  Address,
  Category,
  Comment,
  Conversation,
  Creator,
  CreatorOrder,
  Listing,
  Message,
  Notification,
  NotificationKind,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  ProductCategory,
  ProductType,
  ProfileMode,
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
  read: boolean;
  created_at: string;
}

export function notificationRowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    kind: row.kind as NotificationKind,
    creatorId: row.actor_id,
    projectId: row.project_id ?? undefined,
    createdAt: row.created_at,
    read: row.read,
  };
}
