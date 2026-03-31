export const queryKeys = {
  feed: (params?: object) => ['feed', params] as const,
  post: (id: string) => ['post', id] as const,
  profile: (username: string) => ['profile', username] as const,
  categories: () => ['categories'] as const,
  notifications: () => ['notifications'] as const,
  conversations: () => ['conversations'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  search: (q: string, tab: string) => ['search', q, tab] as const,
  appLayout: () => ['app-layout'] as const,
  adminDashboard: (params?: object) => ['admin-dashboard', params] as const,
  adminCategories: () => ['admin-categories'] as const,
  adminReports: () => ['admin-reports'] as const,
} 
