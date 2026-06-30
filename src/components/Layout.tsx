import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { useRealtime } from '../hooks/useRealtime'

export function Layout() {
  useRealtime() // sincronização ao vivo entre os dois sócios
  return (
    <div className="min-h-full max-w-2xl mx-auto pb-24">
      <Outlet />
      <BottomNav />
    </div>
  )
}
