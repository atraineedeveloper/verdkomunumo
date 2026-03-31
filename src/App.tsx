import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/layouts/ProtectedRoute'
import { FullScreenSpinner } from '@/components/ui/FullScreenSpinner'
import { routes } from '@/lib/routes'

const AppLayout = lazy(() => import('@/layouts/AppLayout').then((module) => ({ default: module.AppLayout })))
const AuthLayout = lazy(() => import('@/layouts/AuthLayout').then((module) => ({ default: module.AuthLayout })))
const AdminLayout = lazy(() => import('@/layouts/AdminLayout').then((module) => ({ default: module.AdminLayout })))

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const AuthCallback = lazy(() => import('@/pages/auth/AuthCallback').then((module) => ({ default: module.AuthCallback })))

const LandingPage = lazy(() => import('@/pages/public/LandingPage'))

const FeedPage = lazy(() => import('@/pages/app/FeedPage'))
const SearchPage = lazy(() => import('@/pages/app/SearchPage'))
const NotificationsPage = lazy(() => import('@/pages/app/NotificationsPage'))
const MessagesPage = lazy(() => import('@/pages/app/MessagesPage'))
const ConversationPage = lazy(() => import('@/pages/app/ConversationPage'))
const ProfilePage = lazy(() => import('@/pages/app/ProfilePage'))
const CategoryPage = lazy(() => import('@/pages/app/CategoryPage'))
const PostDetailPage = lazy(() => import('@/pages/app/PostDetailPage'))
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'))

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'))
const AdminReportsPage = lazy(() => import('@/pages/admin/AdminReportsPage'))

export default function App() {
  return (
    <Suspense fallback={<FullScreenSpinner label="Loading route" />}>
      <Routes>
        <Route path={routes.landing} element={<LandingPage />} />

        <Route path={routes.authCallback} element={<AuthCallback />} />

        <Route element={<AuthLayout />}>
          <Route path={routes.login} element={<LoginPage />} />
          <Route path={routes.register} element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path={routes.feed} element={<FeedPage />} />
          <Route path={routes.search} element={<SearchPage />} />
          <Route path={routes.notifications} element={<NotificationsPage />} />
          <Route path={routes.messages} element={<MessagesPage />} />
          <Route path={routes.conversationPattern} element={<ConversationPage />} />
          <Route path={routes.profilePattern} element={<ProfilePage />} />
          <Route path={routes.categoryPattern} element={<CategoryPage />} />
          <Route path={routes.postPattern} element={<PostDetailPage />} />
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
