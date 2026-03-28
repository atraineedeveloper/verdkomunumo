import type { Profile, Post, Category, Comment, Notification, Conversation, Message } from './types'

export const DEMO_MODE =
  typeof process !== 'undefined' &&
  (process.env.PUBLIC_SUPABASE_URL ?? '').includes('placeholder')

export const mockProfile: Profile = {
  id: 'demo-user-001',
  username: 'demo_uzanto',
  display_name: 'Demo Uzanto',
  bio: 'Esperantisto ekde 2020. Mi ŝatas vojaĝi kaj lerni novajn lingvojn. 🌍',
  avatar_url: 'https://ui-avatars.com/api/?name=Demo+Uzanto&background=1B7A4A&color=fff&size=128',
  esperanto_level: 'progresanto',
  theme: 'green',
  role: 'user',
  website: 'https://example.com',
  location: 'Ciudad de México, MX',
  followers_count: 142,
  following_count: 89,
  posts_count: 37,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2025-03-01T12:00:00Z'
}

export const mockCategories: Category[] = [
  { id: 'cat-1', name: 'Ĝenerala', slug: 'generala', description: 'Ĝenerala diskutado', icon: '💬', color: '#1B7A4A', post_count: 312, sort_order: 1, is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-2', name: 'Lernado', slug: 'lernado', description: 'Lernado de Esperanto', icon: '📚', color: '#0369a1', post_count: 187, sort_order: 2, is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-3', name: 'Kulturo', slug: 'kulturo', description: 'Kulturo, libroj, muziko', icon: '🎭', color: '#7c3aed', post_count: 95, sort_order: 3, is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-4', name: 'Novaĵoj', slug: 'novajoj', description: 'Novaĵoj', icon: '📰', color: '#b45309', post_count: 64, sort_order: 4, is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-5', name: 'Teknologio', slug: 'teknologio', description: 'Teknologio kaj scienco', icon: '💻', color: '#0f766e', post_count: 128, sort_order: 5, is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-6', name: 'Vojaĝoj', slug: 'vojagoj', description: 'Vojaĝoj kaj renkontiĝoj', icon: '✈️', color: '#0891b2', post_count: 73, sort_order: 6, is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-7', name: 'Helpo', slug: 'helpo', description: 'Helpo kaj demandoj', icon: '🤝', color: '#16a34a', post_count: 44, sort_order: 7, is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat-8', name: 'Ludoj', slug: 'ludoj', description: 'Ludoj kaj amuzaĵoj', icon: '🎮', color: '#dc2626', post_count: 31, sort_order: 8, is_active: true, created_at: '2024-01-01T00:00:00Z' },
]

const mockAuthors: Profile[] = [
  {
    id: 'user-002', username: 'saraflua', display_name: 'Sara González',
    bio: 'Hispana esperantistino. Mi instruas Esperanton en Madrido.',
    avatar_url: 'https://ui-avatars.com/api/?name=Sara+G&background=7c3aed&color=fff',
    esperanto_level: 'flua', theme: 'vivid', role: 'user',
    website: '', location: 'Madrid, ES',
    followers_count: 891, following_count: 203, posts_count: 156,
    created_at: '2023-06-10T00:00:00Z', updated_at: '2025-03-01T00:00:00Z'
  },
  {
    id: 'user-003', username: 'tanaka_eo', display_name: 'Tanaka Hiroshi',
    bio: '日本からエスペランティスト。Esperanton lernas ekde 2022.',
    avatar_url: 'https://ui-avatars.com/api/?name=TH&background=dc2626&color=fff',
    esperanto_level: 'progresanto', theme: 'dark', role: 'user',
    website: '', location: 'Tokio, JP',
    followers_count: 234, following_count: 145, posts_count: 67,
    created_at: '2023-09-20T00:00:00Z', updated_at: '2025-02-15T00:00:00Z'
  },
  {
    id: 'user-004', username: 'lucas_br', display_name: 'Lucas Oliveira',
    bio: 'Brasileira esperantisto. Ŝatas muzikon kaj vojaĝojn.',
    avatar_url: 'https://ui-avatars.com/api/?name=LO&background=0369a1&color=fff',
    esperanto_level: 'komencanto', theme: 'minimal', role: 'user',
    website: '', location: 'São Paulo, BR',
    followers_count: 58, following_count: 112, posts_count: 23,
    created_at: '2024-03-05T00:00:00Z', updated_at: '2025-01-20T00:00:00Z'
  },
  {
    id: 'user-005', username: 'admin_vera', display_name: 'Vera Kowalski',
    bio: 'Administrantino de Verdkomunumo. Pola esperantistino.',
    avatar_url: 'https://ui-avatars.com/api/?name=VK&background=0f766e&color=fff',
    esperanto_level: 'flua', theme: 'green', role: 'admin',
    website: '', location: 'Varsovio, PL',
    followers_count: 1204, following_count: 89, posts_count: 412,
    created_at: '2023-01-01T00:00:00Z', updated_at: '2025-03-10T00:00:00Z'
  }
]

export const mockPosts: Post[] = [
  {
    id: 'post-001',
    user_id: 'user-005',
    category_id: 'cat-1',
    content: 'Bonvenon al Verdkomunumo! 🌿\n\nĈi tiu estas la nova socia reto por la esperanto-komunumo. Ni esperas, ke vi ĝuos ĉi tiun spacon por diskuti, lerni kaj konektiĝi kun aliaj esperantistoj tra la tuta mondo.\n\nNi estas ankoraŭ en la komenco, sed ni laboras forte por aldoni novajn funkciojn. Dankon pro via subtenado! 💚',
    image_urls: ['https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&q=80'],
    likes_count: 312,
    comments_count: 47,
    is_edited: false,
    is_deleted: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    author: mockAuthors[3],
    category: mockCategories[0]
  },
  {
    id: 'post-002',
    user_id: 'user-002',
    category_id: 'cat-2',
    content: 'Demando por komencantoj: Kio estas la plej bona metodo por lerni Esperanton rapide?\n\nMi komencis lerni antaŭ tri monatoj kaj mi jam povas legi simplajn tekstojn, sed mi havas problemojn kun la parolado. Ĉu iu havas konsilojn?',
    image_urls: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=700&q=80'],
    likes_count: 87,
    comments_count: 23,
    is_edited: false,
    is_deleted: false,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    author: mockAuthors[0],
    category: mockCategories[1]
  },
  {
    id: 'post-003',
    user_id: 'user-003',
    category_id: 'cat-6',
    content: '日本語からエスペラントへ: Mi ĵus revenis de UK2024 en Japanio! Estis nekredebla sperto. Mi renkontis esperantistojn el pli ol 50 landoj. La atmosfero estis mirinda.\n\nSe vi havas la ŝancon, definitive partoprenu la sekvan UK! ✈️🇯🇵',
    image_urls: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=700&q=80',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=700&q=80',
    ],
    likes_count: 156,
    comments_count: 31,
    is_edited: false,
    is_deleted: false,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    author: mockAuthors[1],
    category: mockCategories[5]
  },
  {
    id: 'post-004',
    user_id: 'demo-user-001',
    category_id: 'cat-5',
    content: 'Ĉu iu uzas AI-ilojn por helpi lerni Esperanton? Mi provis uzi Claude por praktiki konversacion kaj ĝi funkcias surprize bone! La gramatiko de Esperanto estas sufiĉe simpla por AI. 🤖',
    image_urls: ['https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=700&q=80'],
    likes_count: 43,
    comments_count: 12,
    is_edited: true,
    is_deleted: false,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    author: mockProfile,
    category: mockCategories[4]
  },
  {
    id: 'post-005',
    user_id: 'user-004',
    category_id: 'cat-3',
    content: 'Muziko-rekomendo! 🎵\n\nLa grupo "La Perdita Generacio" faras muzikon tute en Esperanto. Ili havas tre belan stilon — miksaĵo de bossa nova kaj jazz. Perfekte por aŭskulti dum vi studas!\n\nLigilo en la komentoj ⬇️',
    image_urls: [
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=700&q=80',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=700&q=80',
      'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=700&q=80',
    ],
    likes_count: 98,
    comments_count: 18,
    is_edited: false,
    is_deleted: false,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    author: mockAuthors[2],
    category: mockCategories[2]
  },
]

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1', user_id: 'demo-user-001', actor_id: 'user-002',
    type: 'like', post_id: 'post-004', comment_id: null, message: '', is_read: false,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    actor: mockAuthors[0]
  },
  {
    id: 'notif-2', user_id: 'demo-user-001', actor_id: 'user-005',
    type: 'follow', post_id: null, comment_id: null, message: '', is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actor: mockAuthors[3]
  },
  {
    id: 'notif-3', user_id: 'demo-user-001', actor_id: 'user-003',
    type: 'comment', post_id: 'post-004', comment_id: null, message: '', is_read: true,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    actor: mockAuthors[1]
  },
]

export const mockComments: Comment[] = [
  {
    id: 'comment-001', post_id: 'post-001', user_id: 'user-002',
    parent_id: null, content: 'Bonegan laboron! Mi estas tre feliĉa vidi ĉi tiun projekton. 🎉',
    likes_count: 24, is_deleted: false,
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    author: mockAuthors[0]
  },
  {
    id: 'comment-002', post_id: 'post-001', user_id: 'user-003',
    parent_id: null, content: 'Subarashii! Mi esperas, ke ĉi tiu reto kreskos rapide. La Esperanto-komunumo bezonas ĝin.',
    likes_count: 11, is_deleted: false,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    author: mockAuthors[1]
  },
  {
    id: 'comment-003', post_id: 'post-001', user_id: 'user-004',
    parent_id: null, content: 'Kiel mi povas helpi? Mi estas programisto kaj volonte kontribuas!',
    likes_count: 8, is_deleted: false,
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    author: mockAuthors[2]
  },
  {
    id: 'comment-004', post_id: 'post-002', user_id: 'user-003',
    parent_id: null, content: 'Mi rekomendas Duolingo + la kurson de Lernu.net. Ambaŭ estas senpagaj!',
    likes_count: 15, is_deleted: false,
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    author: mockAuthors[1]
  },
  {
    id: 'comment-005', post_id: 'post-002', user_id: 'demo-user-001',
    parent_id: null, content: 'Por mi la plej bona metodo estis trovi konversacian partneron. La parolado pliboniĝas tre rapide tiel!',
    likes_count: 9, is_deleted: false,
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    author: mockProfile
  },
  {
    id: 'comment-006', post_id: 'post-004', user_id: 'user-002',
    parent_id: null, content: 'Mi ankaŭ provis! La gramatiko de Esperanto estas vere facila por AI-modeloj.',
    likes_count: 6, is_deleted: false,
    created_at: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
    author: mockAuthors[0]
  },
  {
    id: 'comment-007', post_id: 'post-004', user_id: 'user-005',
    parent_id: null, content: 'Interesa ideo. Ni povus eĉ aldoni AI-helpanton rekte en Verdkomunumon! 🤖',
    likes_count: 18, is_deleted: false,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    author: mockAuthors[3]
  },
]

const mockAuthors2 = mockAuthors

export const mockConversations: Conversation[] = [
  {
    id: 'conv-001',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    participants: [mockProfile, mockAuthors2[0]],
    last_message: {
      id: 'msg-003', conversation_id: 'conv-001', sender_id: 'user-002',
      content: 'Ĉu vi iros al la UK ĉi-jare?', is_read: false,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      sender: mockAuthors2[0]
    },
    unread_count: 2
  },
  {
    id: 'conv-002',
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    participants: [mockProfile, mockAuthors2[3]],
    last_message: {
      id: 'msg-006', conversation_id: 'conv-002', sender_id: 'demo-user-001',
      content: 'Dankon pro la bonveno!', is_read: true,
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      sender: mockProfile
    },
    unread_count: 0
  },
  {
    id: 'conv-003',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    participants: [mockProfile, mockAuthors2[1]],
    last_message: {
      id: 'msg-009', conversation_id: 'conv-003', sender_id: 'user-003',
      content: 'Ja ne, ni renkontiĝos en Tokio!', is_read: true,
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sender: mockAuthors2[1]
    },
    unread_count: 0
  },
]

export const mockMessages: Record<string, Message[]> = {
  'conv-001': [
    { id: 'msg-001', conversation_id: 'conv-001', sender_id: 'demo-user-001', content: 'Saluton Sara! Mi legis vian artikolon pri Esperanto-metodoj. Tre utila!', is_read: true, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), sender: mockProfile },
    { id: 'msg-002', conversation_id: 'conv-001', sender_id: 'user-002', content: 'Dankon! Mi estas feliĉa, ke ĝi helpis. Ĉu vi jam provis la metodonjn?', is_read: true, created_at: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(), sender: mockAuthors[0] },
    { id: 'msg-003', conversation_id: 'conv-001', sender_id: 'user-002', content: 'Ĉu vi iros al la UK ĉi-jare?', is_read: false, created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), sender: mockAuthors[0] },
  ],
  'conv-002': [
    { id: 'msg-004', conversation_id: 'conv-002', sender_id: 'user-005', content: 'Bonvenon al Verdkomunumo! Mi estas Vera, administrantino de la reto.', is_read: true, created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), sender: mockAuthors[3] },
    { id: 'msg-005', conversation_id: 'conv-002', sender_id: 'user-005', content: 'Se vi havas demandojn aŭ sugestojn, bonvolu kontakti min!', is_read: true, created_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(), sender: mockAuthors[3] },
    { id: 'msg-006', conversation_id: 'conv-002', sender_id: 'demo-user-001', content: 'Dankon pro la bonveno!', is_read: true, created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), sender: mockProfile },
  ],
  'conv-003': [
    { id: 'msg-007', conversation_id: 'conv-003', sender_id: 'demo-user-001', content: 'Saluton! Mi vidis viajn fotojn de UK2024. Mirindaj!', is_read: true, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), sender: mockProfile },
    { id: 'msg-008', conversation_id: 'conv-003', sender_id: 'user-003', content: 'Dankon! Estis neforgesebla sperto. Ĉu vi loĝas proksime al Japanio?', is_read: true, created_at: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(), sender: mockAuthors[1] },
    { id: 'msg-009', conversation_id: 'conv-003', sender_id: 'user-003', content: 'Ja ne, ni renkontiĝos en Tokio!', is_read: true, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), sender: mockAuthors[1] },
  ],
}

export const mockSession = {
  user: { id: 'demo-user-001', email: 'demo@verdkomunumo.eo' }
}
