import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function Layout() {
    return (
        <div className="relative flex min-h-screen w-full flex-col pb-24">
            <Outlet />
            <BottomNav />
        </div>
    )
}
