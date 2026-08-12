import type {
  Address,
  Category,
  Comment,
  Conversation,
  Creator,
  Listing,
  Message,
  Notification,
  NotificationKind,
  Order,
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
    digitalFileName: row.digital_file_name ?? undefined,
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
}

export interface OrderRow {
  id: string;
  subtotal: number | string;
  shipping_fee: number | string;
  total: number | string;
  status: string;
  payment_method: string;
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
    })),
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    total: Number(row.total),
    address: row.address,
    paymentMethod: row.payment_method as PaymentMethod,
    status: row.status as OrderStatus,
    createdAt: row.created_at,
  };
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
