# Verdkomunumo — Complete Project Specification

## Summary

**Verdkomunumo** (Esperanto: "Green Community") is a social network for the Esperanto community. It allows Esperanto speakers and learners to connect, publish content, chat, and practice the language in a dedicated environment.

- **Stack**: SvelteKit + TypeScript + Tailwind CSS + Supabase + Vercel
- **Target audience**: Esperanto speakers and learners (~10,000–50,000 potential users)
- **Infrastructure cost**: $0 USD/month (Supabase + Vercel free tiers)

---

## 1. Branding

### Identity

- **Name**: Verdkomunumo
- **Tagline**: "La verda komunumo de Esperantujo" (The green community of the Esperanto world)
- **Tone**: Professional yet social (Facebook meets LinkedIn). Inclusive, global, curious, respectful.
- **Typography**: Inter (full support for Esperanto supersignoj: ĉ ĝ ĥ ĵ ŝ ŭ)

### Logo

The logo is a modernized **verda stelo** (green star — the Esperanto symbol) inside a circle. Three variants:

- **On green**: Semi-transparent white circle + white star
- **On light**: Green circle #1B7A4A + white star
- **On dark**: Semi-transparent green circle + star #4ADE80

### Color palette — Default theme (Esperanto green)

```
Primary:     #1B7A4A  (dark Esperanto green)
Accent:      #24A366  (medium green)
Background:  #E8F5E9  (very light green)
Surface:     #F5FBF5  (almost white with green tint)
Text:        #14532D  (very dark green)
```

### Additional themes (user selectable)

**Dark mode:**
```
Background:  #0F172A
Surface:     #1E293B
Accent:      #22C55E
Text:        #4ADE80
```

**Vivid colors:**
```
Primary:     #7C3AED  (purple)
Secondary:   #EC4899  (pink)
Accent:      #F59E0B  (amber)
Complement:  #06B6D4  (cyan)
```

**Minimal:**
```
Background:  #FAFAFA
Surface:     #E5E5E5
Text muted:  #737373
Text:        #171717
```

### Theme implementation

Use CSS custom properties in `:root` and theme classes on `<html>`:
- `.theme-green` (default)
- `.theme-dark`
- `.theme-vivid`
- `.theme-minimal`

Store user preference in the `profiles` table and `localStorage` for instant loading.

---

## 2. Tech Stack

### Frontend
- **SvelteKit** with TypeScript
- **Tailwind CSS** for styling
- **Inter** font (Google Fonts)

### Backend (Supabase)
- **Supabase Auth**: Email/password + Google OAuth
- **Supabase Database**: PostgreSQL with Row Level Security (RLS)
- **Supabase Storage**: Avatars and post images
- **Supabase Realtime**: Real-time chat and notifications

### Deploy
- **Vercel** (hosting + auto CI/CD from GitHub)
- **Domain**: TBD (verdkomunumo.com or verdkomunumo.eo)

### Suggested packages
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/ssr": "^0.1.0",
    "date-fns": "^3.0.0",
    "zod": "^3.22.0",
    "lucide-svelte": "^0.300.0"
  },
  "devDependencies": {
    "@sveltejs/adapter-vercel": "^5.0.0",
    "@sveltejs/kit": "^2.0.0",
    "svelte": "^4.0.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 3. Folder structure

```
verdkomunumo/
├── src/
│   ├── routes/
│   │   ├── (auth)/
│   │   │   ├── login/+page.svelte
│   │   │   ├── register/+page.svelte
│   │   │   └── +layout.svelte
│   │   ├── (app)/
│   │   │   ├── feed/+page.svelte
│   │   │   ├── feed/+page.server.ts
│   │   │   ├── profile/[username]/+page.svelte
│   │   │   ├── profile/[username]/+page.server.ts
│   │   │   ├── post/[id]/+page.svelte
│   │   │   ├── post/[id]/+page.server.ts
│   │   │   ├── search/+page.svelte
│   │   │   ├── messages/+page.svelte
│   │   │   ├── messages/[conversationId]/+page.svelte
│   │   │   ├── notifications/+page.svelte
│   │   │   ├── settings/+page.svelte
│   │   │   ├── category/[slug]/+page.svelte
│   │   │   ├── category/[slug]/+page.server.ts
│   │   │   └── +layout.svelte
│   │   ├── admin/
│   │   │   ├── +page.svelte
│   │   │   ├── categories/+page.svelte
│   │   │   ├── reports/+page.svelte
│   │   │   └── +layout.svelte
│   │   ├── auth/callback/+server.ts    ← OAuth callback handler
│   │   ├── +layout.svelte              ← Root layout
│   │   ├── +layout.server.ts           ← Root server load (session)
│   │   ├── +page.svelte                ← Landing page
│   │   └── +error.svelte
│   ├── lib/
│   │   ├── components/
│   │   │   ├── ui/                     ← Reusable components (Button, Input, Modal, etc.)
│   │   │   ├── auth/                   ← LoginForm, RegisterForm
│   │   │   ├── feed/                   ← PostCard, PostComposer, FeedList, CategoryFilter
│   │   │   ├── profile/               ← ProfileHeader, ProfileEdit, FollowButton, LevelBadge
│   │   │   ├── chat/                   ← ChatList, ChatWindow, MessageBubble
│   │   │   ├── notifications/          ← NotificationList, NotificationItem
│   │   │   ├── search/                 ← SearchBar, SearchResults, UserCard
│   │   │   ├── layout/                 ← Navbar, Sidebar, MobileNav
│   │   │   └── esperanto/              ← EsperantoCorrector, SupersignojKeyboard
│   │   ├── supabase/
│   │   │   ├── client.ts              ← Browser client
│   │   │   └── server.ts              ← Server client
│   │   ├── stores/
│   │   │   ├── theme.ts               ← Svelte store for theme
│   │   │   ├── notifications.ts       ← Svelte store for notifications
│   │   │   └── auth.ts                ← Svelte store for auth state
│   │   ├── utils.ts
│   │   ├── validators.ts              ← Zod schemas
│   │   ├── constants.ts               ← Categories, levels, config
│   │   └── types.ts                   ← TypeScript types
│   ├── app.html
│   ├── app.css                         ← Global styles + theme variables
│   └── hooks.server.ts                 ← SvelteKit hooks (auth middleware)
├── static/
│   ├── logo.svg
│   ├── logo-dark.svg
│   └── og-image.png
├── supabase/
│   ├── migrations/                     ← SQL migrations
│   └── seed.sql                        ← Initial data (categories)
├── svelte.config.js
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── package.json
└── .env.local.example
```

---

## 4. Database (Supabase PostgreSQL)

### Table: profiles

Extends Supabase `auth.users` table.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  esperanto_level TEXT DEFAULT 'komencanto' CHECK (esperanto_level IN ('komencanto', 'progresanto', 'flua')),
  theme TEXT DEFAULT 'green' CHECK (theme IN ('green', 'dark', 'vivid', 'minimal')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
  website TEXT DEFAULT '',
  location TEXT DEFAULT '',
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'name', 'uzanto_' || LEFT(NEW.id::TEXT, 8)), ' ', '_')),
    COALESCE(NEW.raw_user_meta_data->>'name', 'Nova Uzanto')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Table: categories

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,           -- e.g. "Ĝenerala"
  slug TEXT UNIQUE NOT NULL,           -- e.g. "generala"
  description TEXT DEFAULT '',         -- Description in Esperanto
  description_es TEXT DEFAULT '',      -- Description in Spanish
  icon TEXT DEFAULT '📌',
  color TEXT DEFAULT '#1B7A4A',
  post_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO public.categories (name, slug, description, description_es, icon, sort_order) VALUES
  ('Ĝenerala', 'generala', 'Ĝenerala diskutado', 'General / free discussion', '💬', 1),
  ('Lernado', 'lernado', 'Lernado de Esperanto', 'Esperanto learning', '📚', 2),
  ('Kulturo', 'kulturo', 'Kulturo, libroj, muziko, filmo', 'Culture, books, music, film', '🎭', 3),
  ('Novaĵoj', 'novajoj', 'Novaĵoj de la Esperanto-mondo', 'Esperanto world news', '📰', 4),
  ('Teknologio', 'teknologio', 'Teknologio kaj scienco', 'Technology and science', '💻', 5),
  ('Vojaĝoj', 'vojagoj', 'Vojaĝoj kaj renkontiĝoj', 'Travel and meetups', '✈️', 6),
  ('Helpo', 'helpo', 'Helpo kaj demandoj', 'Help and questions', '🤝', 7),
  ('Ludoj', 'ludoj', 'Ludoj kaj amuzaĵoj', 'Games and entertainment', '🎮', 8);
```

### Table: category_suggestions

```sql
CREATE TABLE public.category_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  reason TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: posts

```sql
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  image_urls TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_category_id ON public.posts(category_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
```

### Table: comments

```sql
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,  -- For threaded replies
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  likes_count INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON public.comments(post_id);
```

### Table: likes

```sql
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_post_like UNIQUE (user_id, post_id),
  CONSTRAINT unique_comment_like UNIQUE (user_id, comment_id),
  CONSTRAINT like_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);
```

### Table: follows

```sql
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);
```

### Table: conversations

```sql
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: conversation_participants

```sql
CREATE TABLE public.conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_participant UNIQUE (conversation_id, user_id)
);
```

### Table: messages

```sql
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
```

### Table: notifications

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'message', 'mention', 'category_approved', 'category_rejected')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;
```

### Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, only owner can update
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Posts: public read, only author can create/update/delete
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (is_deleted = false);
CREATE POLICY "posts_insert_own" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_update_own" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "posts_delete_own" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Comments: public read, authenticated can create
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Likes: public read, create/delete own
CREATE POLICY "likes_select" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Follows: public read, create/delete own
CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Categories: public read for active categories
CREATE POLICY "categories_select" ON public.categories FOR SELECT USING (is_active = true);

-- Category suggestions: create own, read own + admins
CREATE POLICY "suggestions_insert" ON public.category_suggestions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "suggestions_select" ON public.category_suggestions FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
);

-- Messages: only conversation participants
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);

-- Conversation participants: only participants can read
CREATE POLICY "participants_select" ON public.conversation_participants FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()
  )
);

-- Conversations: only participants can read
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = conversations.id AND user_id = auth.uid()
  )
);

-- Notifications: only the recipient
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
```

### SQL helper functions

```sql
-- Function: update like counters on posts
CREATE OR REPLACE FUNCTION public.handle_post_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.post_id IS NOT NULL THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.post_id IS NOT NULL THEN
    UPDATE public.posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_post_like();

-- Function: update comment like counters
CREATE OR REPLACE FUNCTION public.handle_comment_like()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.comment_id IS NOT NULL THEN
    UPDATE public.comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.comment_id IS NOT NULL THEN
    UPDATE public.comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_like();

-- Function: update followers_count and following_count
CREATE OR REPLACE FUNCTION public.handle_follow()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE public.profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow();

-- Function: update comments_count on posts
CREATE OR REPLACE FUNCTION public.handle_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count();

-- Function: update post_count on categories
CREATE OR REPLACE FUNCTION public.handle_category_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.categories SET post_count = post_count + 1 WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.categories SET post_count = post_count - 1 WHERE id = OLD.category_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_category_change
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_category_post_count();

-- Function: update posts_count on profiles
CREATE OR REPLACE FUNCTION public.handle_profile_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET posts_count = posts_count + 1 WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET posts_count = posts_count - 1 WHERE id = OLD.user_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_post_change
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_profile_post_count();

-- Function: update conversation updated_at on new message
CREATE OR REPLACE FUNCTION public.handle_conversation_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations SET updated_at = NOW() WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_conversation_update();
```

### Supabase Storage Buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

-- Policies: avatars
CREATE POLICY "avatars_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policies: post images
CREATE POLICY "post_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "post_images_insert_auth" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'post-images' AND auth.role() = 'authenticated'
);
```

---

## 5. Features (detailed)

### 5.1 Authentication

- Register with email + password (with email confirmation)
- Login with Google OAuth
- SvelteKit hooks (`hooks.server.ts`) for session management and route protection
- Auto-redirect: unauthenticated → `/login`, authenticated → `/feed`
- Auto-create profile on signup via SQL trigger
- OAuth callback handler at `/auth/callback/+server.ts`

### 5.2 User profile

- Fields: username, display_name, bio, avatar, esperanto_level, website, location
- Public page at `/profile/[username]` showing user's posts
- Edit profile at `/settings`
- Level badge visible: 🌱 Komencanto, 🌿 Progresanto, 🌳 Flua
- Follower, following, and post counters
- User self-declares their level

### 5.3 Posts

- Create post with text (max 5000 chars) + up to 4 images
- Each post must belong to a category (required)
- Edit and delete own posts
- Individual post view at `/post/[id]`
- "Edited" indicator if modified

### 5.4 Feed / Timeline

- **Global feed** (`/feed`): all posts sorted by newest first
- **Following feed**: filter to see only posts from people you follow
- **Category filter**: sidebar or tabs with all 8 categories
- Infinite scroll pagination (cursor-based, not offset)
- Individual category page: `/category/[slug]`

### 5.5 Category system

**8 initial categories (seed data):**

| Name | Slug | Icon | Description |
|------|------|------|-------------|
| Ĝenerala | generala | 💬 | General / free discussion |
| Lernado | lernado | 📚 | Esperanto learning |
| Kulturo | kulturo | 🎭 | Culture, books, music, film |
| Novaĵoj | novajoj | 📰 | Esperanto world news |
| Teknologio | teknologio | 💻 | Technology and science |
| Vojaĝoj | vojagoj | ✈️ | Travel and meetups |
| Helpo | helpo | 🤝 | Help and questions |
| Ludoj | ludoj | 🎮 | Games and entertainment |

**Suggestion system:**
- Any authenticated user can suggest a new category
- Admins see pending suggestions in the admin panel
- On approval, the category is created automatically
- On rejection, the user gets notified

### 5.6 Follow / Unfollow

- "Sekvi" (Follow) / "Malsekvi" (Unfollow) button on profiles
- Cannot follow yourself
- Counters updated in real time via SQL triggers
- Follower/following list accessible from profile

### 5.7 Likes and comments

- Like/unlike toggle on posts and comments
- Threaded comments (parent_id for replies)
- Counters updated via SQL triggers
- Notification sent to author on like or comment

### 5.8 Search

- Search users by username or display_name
- Search posts by content (PostgreSQL full-text search)
- Filter results by category
- Debounced search suggestions while typing

### 5.9 Chat / Direct messages

- Start conversation from another user's profile
- Conversation list sorted by last message
- Real-time messages using Supabase Realtime subscriptions
- Unread indicator
- Max 5000 characters per message

### 5.10 Notifications

**Notification types:**
- Someone liked your post
- Someone commented on your post
- Someone started following you
- New direct message
- Your category suggestion was approved/rejected

**Implementation:**
- Badge with unread count in navbar
- Full list at `/notifications`
- Mark as read individually or "mark all as read"
- Real-time updates via Supabase Realtime subscriptions

### 5.11 Level system

Three self-declared levels shown as badge on profile:
- 🌱 **Komencanto** (Beginner) — Default on signup
- 🌿 **Progresanto** (Intermediate)
- 🌳 **Flua** (Fluent)

User changes it in Settings. No automatic evaluation (future phase).

### 5.12 Esperanto corrector

**Initial phase (basic):**
- Virtual keyboard for supersignoj (ĉ, ĝ, ĥ, ĵ, ŝ, ŭ) in post composer
- Automatic X-system conversion: cx→ĉ, gx→ĝ, hx→ĥ, jx→ĵ, sx→ŝ, ux→ŭ
- Highlight unrecognized words (basic dictionary)

**Future phase:**
- LanguageTool Esperanto API integration
- Inline correction suggestions

### 5.13 Admin panel

- Accessible only for users with role = 'admin' or 'moderator'
- **Moderate posts**: view reports, delete posts, ban users
- **Categories**: approve/reject suggestions, edit existing categories
- **Basic stats**: total users, posts per day, popular categories

### 5.14 Theme system

4 available themes:
1. **Esperanto green** (default) — `.theme-green`
2. **Dark mode** — `.theme-dark`
3. **Vivid colors** — `.theme-vivid`
4. **Minimal** — `.theme-minimal`

Implementation:
- CSS custom properties defined per theme
- Toggle in Settings and navbar (palette icon)
- Persistence: `localStorage` + `theme` field in `profiles`
- SSR-safe: read from cookie to avoid theme flash on load

---

## 6. SvelteKit-specific patterns

### Auth middleware (hooks.server.ts)

```typescript
// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Handle } from '@sveltejs/kit'

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, { ...options, path: '/' })
          })
        }
      }
    }
  )

  event.locals.safeGetSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession()
    if (!session) return { session: null, user: null }

    const { data: { user }, error } = await event.locals.supabase.auth.getUser()
    if (error) return { session: null, user: null }

    return { session, user }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version'
    }
  })
}
```

### Svelte stores for reactivity

```typescript
// src/lib/stores/theme.ts
import { writable } from 'svelte/store'

export type Theme = 'green' | 'dark' | 'vivid' | 'minimal'

function createThemeStore() {
  const { subscribe, set } = writable<Theme>('green')

  return {
    subscribe,
    setTheme: (theme: Theme) => {
      set(theme)
      document.documentElement.className = `theme-${theme}`
      localStorage.setItem('verdkomunumo-theme', theme)
    },
    init: () => {
      const saved = localStorage.getItem('verdkomunumo-theme') as Theme | null
      if (saved) {
        set(saved)
        document.documentElement.className = `theme-${saved}`
      }
    }
  }
}

export const themeStore = createThemeStore()
```

### Load functions for server-side data

```typescript
// src/routes/(app)/feed/+page.server.ts
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, url }) => {
  const { supabase } = locals
  const category = url.searchParams.get('category')
  const cursor = url.searchParams.get('cursor')

  let query = supabase
    .from('posts')
    .select(`
      *,
      author:profiles!user_id(*),
      category:categories!category_id(*)
    `)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (category) {
    query = query.eq('categories.slug', category)
  }

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: posts, error } = await query

  return { posts: posts ?? [] }
}
```

### Form actions for mutations

```typescript
// src/routes/(app)/post/[id]/+page.server.ts
import type { Actions } from './$types'
import { fail } from '@sveltejs/kit'

export const actions: Actions = {
  like: async ({ locals, params }) => {
    const { session } = await locals.safeGetSession()
    if (!session) return fail(401)

    const { error } = await locals.supabase
      .from('likes')
      .insert({ user_id: session.user.id, post_id: params.id })

    if (error) return fail(400, { message: error.message })
    return { success: true }
  },

  unlike: async ({ locals, params }) => {
    const { session } = await locals.safeGetSession()
    if (!session) return fail(401)

    const { error } = await locals.supabase
      .from('likes')
      .delete()
      .match({ user_id: session.user.id, post_id: params.id })

    if (error) return fail(400, { message: error.message })
    return { success: true }
  }
}
```

---

## 7. Environment variables

```env
# .env.local.example

# Supabase
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# App
PUBLIC_APP_URL=http://localhost:5173
PUBLIC_APP_NAME=Verdkomunumo
```

Note: SvelteKit uses `PUBLIC_` prefix for client-exposed env vars. Server-only vars have no prefix.

---

## 8. Development phases

### Phase 1 — Foundation (Week 1–2)
- [x] Setup SvelteKit project + Supabase + Tailwind (Bun)
- [x] Configure folder structure
- [x] Implement theme system (CSS custom properties — 4 themes)
- [x] Auth: email registration, login, Google OAuth (UI done; backend pending)
- [x] Auth hooks and route protection middleware
- [x] Complete database schema + migrations (11 tables + RLS + 7 triggers)
- [x] Seed categories (8 categories)
- [x] Profile: view `/profile/[username]`, edit in `/settings`
- [x] Main layout: navbar, sidebar, mobile nav — responsive
- [x] Landing page (redirects to /feed in demo mode)
- [x] **EXTRA:** i18n system — Esperanto, Español, English, Português, 日本語
- [x] **EXTRA:** Demo/mockup mode with realistic mock data (no Supabase needed)

### Phase 2 — Social content (Week 3–4)
- [ ] Post composer (text + images + category selector)
- [~] Global feed UI (cards done, infinite scroll pending)
- [~] Following feed (server logic done, UI toggle done)
- [x] Category filter + individual category page `/category/[slug]`
- [~] Follow / Unfollow button (UI stub in profile, server actions pending)
- [ ] Post likes (UI + server action pending)
- [x] Post detail page `/post/[id]` with comment list and compose form
- [ ] Comment likes
- [ ] Threaded comments (parent_id replies)
- [x] User and post search page `/search` (client-side with mock data)

### Phase 3 — Communication (Week 5–6)
- [x] Chat: conversation list `/messages` with unread indicator
- [x] Chat: chat window `/messages/[conversationId]` with bubble UI
- [ ] Chat: Supabase Realtime subscriptions
- [x] Notifications: page `/notifications` with unread dot and mark-all button
- [~] Notifications: navbar badge (store done, page done, badge count integration pending)
- [ ] Notifications: Realtime updates
- [~] Level system (badge in profile done; selector in settings done)
- [ ] Category suggestions + approval workflow

### Phase 4 — Polish (Week 7–8)
- [ ] Esperanto corrector (supersignoj keyboard component + X-system conversion)
- [x] Admin panel `/admin` (dashboard with stats, post table, user list — mock data)
- [ ] Admin: categories page `/admin/categories`
- [ ] Admin: reports page `/admin/reports`
- [ ] SEO: metadata, Open Graph, sitemap
- [ ] Performance: lazy loading images, optimization
- [ ] Accessibility: aria labels, keyboard navigation
- [ ] Deploy to Vercel + custom domain
- [ ] Final testing and bug fixes

---

## 9. Code conventions

- **Naming**: camelCase for variables/functions, PascalCase for components, snake_case for SQL columns
- **Components**: `.svelte` files, one component per file
- **Imports**: `$lib/` alias (built into SvelteKit)
- **Server state**: load functions in `+page.server.ts` / `+layout.server.ts`
- **Client state**: Svelte stores for global state (theme, auth), component-level reactivity for local state
- **Validation**: Zod schemas for forms and API inputs
- **Styles**: Tailwind utility classes, CSS custom properties for themes only
- **Code language**: Variables, functions, comments, and documentation in English. UI text bilingual (Esperanto primary + Spanish secondary)
- **Commits**: Conventional Commits (feat:, fix:, chore:, etc.)

---

## 10. Notes for the programming agent

1. **Start with Phase 1** in order. Each task depends on the previous one.
2. **Supabase**: use `@supabase/ssr` for the SvelteKit client (not the deprecated `@supabase/auth-helpers-sveltekit`).
3. **SvelteKit**: use server load functions (`+page.server.ts`) for data fetching. Use `+page.ts` only for client-side logic.
4. **Images**: configure Supabase Storage URLs for optimized image loading.
5. **Realtime**: use Supabase Realtime channels for chat and notifications. Subscribe in `onMount()` and unsubscribe in `onDestroy()`.
6. **RLS**: ALL tables have Row Level Security. Never bypass it.
7. **Counters**: likes_count, followers_count, etc. are managed via SQL triggers, NOT from the frontend.
8. **Themes**: implement with CSS custom properties, NOT with Tailwind dark mode class strategy.
9. **Supersignoj**: the X-system conversion (cx→ĉ) must work in ALL text inputs, not just posts.
10. **Responsive**: mobile-first. Layout must work from 320px to 1440px+.
11. **SvelteKit adapter**: use `@sveltejs/adapter-vercel` for Vercel deployment.
12. **Form actions**: use SvelteKit form actions (`+page.server.ts` with `actions`) for mutations when possible, with progressive enhancement.
13. **Reactivity**: leverage Svelte's built-in reactivity (`$:` syntax) instead of external state management libraries where possible.
14. **Env vars**: use `$env/static/public` for `PUBLIC_` vars and `$env/static/private` for server-only vars. Never use `process.env`.
