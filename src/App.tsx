import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { FullScreenSpinner } from '@/components/ui/FullScreenSpinner'
import { ProtectedRoute } from '@/layouts/ProtectedRoute'
import { routes } from '@/lib/routes'

const AppLayout = lazy(() => import('@/layouts/AppLayout').then((module) => ({ default: module.AppLayout })))
const AuthLayout = lazy(() => import('@/layouts/AuthLayout').then((module) => ({ default: module.AuthLayout })))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })))
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })))
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })))
const AuthCallback = lazy(() => import('@/pages/auth/AuthCallback').then((module) => ({ default: module.AuthCallback })))
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage'))
const SamideanojPage = lazy(() => import('@/pages/app/SamideanojPage'))

export default function App() {
  return (
    <Suspense fallback={<FullScreenSpinner label="Loading route" />}>
      <Routes>
        <Route path={routes.authCallback} element={<AuthCallback />} />

        <Route element={<AuthLayout />}>
          <Route path={routes.login} element={<LoginPage />} />
          <Route path={routes.register} element={<RegisterPage />} />
          <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={routes.resetPassword} element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<SamideanojPage />} />
          <Route path={routes.samideanoj} element={<Navigate to={routes.map} replace />} />
          <Route path={routes.settings} element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to={routes.map} replace />} />
      </Routes>
    </Suspense>
  )
}
