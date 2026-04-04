export const routes = {
  landing: '/',
  home: '/fonto',
  feed: '/fonto',
  search: '/sercxi',
  notifications: '/sciigoj',
  messages: '/mesagxoj',
  profile: (username: string) => `/profilo/${username}`,
  profilePattern: '/profilo/:username',
  category: (slug: string) => `/kategorio/${slug}`,
  categoryPattern: '/kategorio/:slug',
  post: (id: string) => `/afisxo/${id}`,
  postPattern: '/afisxo/:id',
  settings: '/agordoj',
  login: '/ensaluti',
  register: '/registrigxi',
  forgotPassword: '/forgesis-pasvorton',
  resetPassword: '/restarigi-pasvorton',
  authCallback: '/auxtentigo/revoko',
  conversation: (conversationId: string) => `/mesagxoj/${conversationId}`,
  conversationPattern: '/mesagxoj/:conversationId',
  admin: '/administrado',
  adminCategories: '/administrado/kategorioj',
  adminReports: '/administrado/raportoj',
} as const

export function feedWithFilter(filter?: 'all' | 'following') {
  if (!filter || filter === 'all') return routes.feed
  return `${routes.feed}?filter=${filter}`
}
