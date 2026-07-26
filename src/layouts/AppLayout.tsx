import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { ToastViewport } from '@/components/ToastViewport'

export function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <Outlet />
      </main>
      <ToastViewport />
    </>
  )
}
