export type Theme = 'green' | 'dark' | 'vivid' | 'minimal'

export type EsperantoLevel = 'komencanto' | 'progresanto' | 'flua'

export type UserRole = 'user' | 'moderator' | 'admin' | 'owner'

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'message'
  | 'mention'
  | 'category_approved'
  | 'category_rejected'

export type CategorySuggestionStatus = 'pending' | 'approved' | 'rejected'
export type AppSuggestionStatus = 'pending' | 'planned' | 'closed'
export type ContentReportReason =
  | 'spam'
  | 'harassment'
  | 'hate'
  | 'nudity'
  | 'violence'
  | 'misinformation'
  | 'other'
export type ContentReportStatus = 'pending' | 'resolved' | 'dismissed'

export interface Profile {
  id: string
  email?: string
  username: string
  display_name: string
  bio: string
  avatar_url: string
  esperanto_level: EsperantoLevel
  theme: Theme
  role: UserRole
  website: string
  location: string
  followers_count: number
  following_count: number
  posts_count: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  post_count: number
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface LinkPreview {
  url: string
  title?: string
  description?: string
  image?: string
}

export interface Post {
  id: string
  user_id: string
  category_id: string
  content: string
  image_urls: string[]
  likes_count: number
  comments_count: number
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  author?: Profile
  category?: Category
  user_liked?: boolean
  quoted_post_id?: string | null
  quoted_post?: Post | null
  link_preview?: LinkPreview | null
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  parent_id: string | null
  content: string
  likes_count: number
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  updated_at?: string
  author?: Profile
  user_liked?: boolean
  replies?: Comment[]
  post?: Post
}

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface Conversation {
  id: string
  created_at: string
  updated_at: string
  participants?: Profile[]
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: Profile
}

export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: NotificationType
  post_id: string | null
  comment_id: string | null
  message: string
  is_read: boolean
  created_at: string
  actor?: Profile
  post?: Post
}

export interface CategorySuggestion {
  id: string
  user_id: string
  name: string
  description: string
  reason: string
  status: CategorySuggestionStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export interface AppSuggestion {
  id: string
  user_id: string
  title: string
  description: string
  context: string
  status: AppSuggestionStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  author?: Profile
}

export interface ContentReport {
  id: string
  user_id: string
  post_id: string | null
  comment_id: string | null
  reason: ContentReportReason
  details: string
  status: ContentReportStatus
  reviewed_by: string | null
  reviewed_at: string | null
  resolution_note: string
  created_at: string
  author?: Profile
  post?: Post
  comment?: Comment
}
