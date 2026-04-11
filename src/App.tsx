import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/layouts/ProtectedRoute'
import { FullScreenSpinner } from '@/components/ui/FullScreenSpinner'
import { lazyRetry } from '@/lib/lazyRetry'
import { routes } from '@/lib/routes'

const AppLayout = lazy(() =>
  lazyRetry(() => import('@/layouts/AppLayout').then((module) => ({ default: module.AppLayout })), 'AppLayout')
)
const AuthLayout = lazy(() =>
  lazyRetry(() => import('@/layouts/AuthLayout').then((module) => ({ default: module.AuthLayout })), 'AuthLayout')
)
const AdminLayout = lazy(() =>
  lazyRetry(() => import('@/layouts/AdminLayout').then((module) => ({ default: module.AdminLayout })), 'AdminLayout')
)

const LoginPage = lazy(() =>
  lazyRetry(() => import('@/pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })), 'LoginPage')
)
const RegisterPage = lazy(() =>
  lazyRetry(() => import('@/pages/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })), 'RegisterPage')
)
const ForgotPasswordPage = lazy(() =>
  lazyRetry(
    () => import('@/pages/auth/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })),
    'ForgotPasswordPage'
  )
)
const ResetPasswordPage = lazy(() =>
  lazyRetry(
    () => import('@/pages/auth/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })),
    'ResetPasswordPage'
  )
)
const AuthCallback = lazy(() =>
  lazyRetry(() => import('@/pages/auth/AuthCallback').then((module) => ({ default: module.AuthCallback })), 'AuthCallback')
)

const LandingPage = lazy(() => lazyRetry(() => import('@/pages/public/LandingPage'), 'LandingPage'))

const FeedPage = lazy(() => lazyRetry(() => import('@/pages/app/FeedPage'), 'FeedPage'))
const SearchPage = lazy(() => lazyRetry(() => import('@/pages/app/SearchPage'), 'SearchPage'))
const NotificationsPage = lazy(() => lazyRetry(() => import('@/pages/app/NotificationsPage'), 'NotificationsPage'))
const MessagesPage = lazy(() => lazyRetry(() => import('@/pages/app/MessagesPage'), 'MessagesPage'))
const ConversationPage = lazy(() => lazyRetry(() => import('@/pages/app/ConversationPage'), 'ConversationPage'))
const CommunityChatPage = lazy(() => lazyRetry(() => import('@/pages/app/CommunityChatPage'), 'CommunityChatPage'))
const ProfilePage = lazy(() => lazyRetry(() => import('@/pages/app/ProfilePage'), 'ProfilePage'))
const CategoryPage = lazy(() => lazyRetry(() => import('@/pages/app/CategoryPage'), 'CategoryPage'))
const PostDetailPage = lazy(() => lazyRetry(() => import('@/pages/app/PostDetailPage'), 'PostDetailPage'))
const SettingsPage = lazy(() => lazyRetry(() => import('@/pages/app/SettingsPage'), 'SettingsPage'))

const AdminDashboardPage = lazy(() =>
  lazyRetry(() => import('@/pages/admin/AdminDashboardPage'), 'AdminDashboardPage')
)
const AdminCategoriesPage = lazy(() =>
  lazyRetry(() => import('@/pages/admin/AdminCategoriesPage'), 'AdminCategoriesPage')
)
const AdminReportsPage = lazy(() => lazyRetry(() => import('@/pages/admin/AdminReportsPage'), 'AdminReportsPage'))

export default function App() {
  return (
    <Suspense fallback={<FullScreenSpinner label="Loading route" />}>
      <Routes>
        <Route path={routes.landing} element={<LandingPage />} />

        <Route path={routes.authCallback} element={<AuthCallback />} />

        <Route element={<AuthLayout />}>
          <Route path={routes.login} element={<LoginPage />} />
          <Route path={routes.register} element={<RegisterPage />} />
          <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={routes.resetPassword} element={<ResetPasswordPage />} />
        </Route>

        {/* Public routes — readable without login */}
        <Route element={<AppLayout />}>
          <Route path={routes.feed} element={<FeedPage />} />
          <Route path={routes.search} element={<SearchPage />} />
          <Route path={routes.profilePattern} element={<ProfilePage />} />
          <Route path={routes.categoryPattern} element={<CategoryPage />} />
          <Route path={routes.postPattern} element={<PostDetailPage />} />
        </Route>

        {/* Private routes — require login */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path={routes.notifications} element={<NotificationsPage />} />
          <Route path={routes.messages} element={<MessagesPage />} />
          <Route path={routes.conversationPattern} element={<ConversationPage />} />
          <Route path={routes.communityChat} element={<CommunityChatPage />} />
          <Route path={routes.settings} element={<SettingsPage />} />
        </Route>

        <Route element={<ProtectedRoute minRole="moderator"><AdminLayout /></ProtectedRoute>}>
          <Route path={routes.admin} element={<AdminDashboardPage />} />
          <Route path={routes.adminReports} element={<AdminReportsPage />} />
        </Route>

        <Route element={<ProtectedRoute minRole="admin"><AdminLayout /></ProtectedRoute>}>
          <Route path={routes.adminCategories} element={<AdminCategoriesPage />} />
        </Route>

        <Route path="*" element={<Navigate to={routes.feed} replace />} />
      </Routes>
    </Suspense>
  )
}
