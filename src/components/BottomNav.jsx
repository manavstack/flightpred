import { NavLink } from 'react-router-dom'

const navItems = [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/alerts', icon: 'notifications', label: 'Alerts' },
    { to: '/search', icon: 'add', label: 'Search', isFab: true },
    { to: '/model-logs', icon: 'monitoring', label: 'AI Logs' },
    { to: '#', icon: 'account_circle', label: 'Profile' },
]

export default function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-6 pb-8 pt-3 z-50">
            <div className="flex justify-between items-center max-w-md mx-auto">
                {navItems.map((item) =>
                    item.isFab ? (
                        <div key={item.label} className="relative -mt-8">
                            <NavLink
                                to={item.to}
                                className="flex size-14 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 border-4 border-background-light active:scale-95 transition-transform"
                            >
                                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                            </NavLink>
                        </div>
                    ) : (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-slate-400'}`
                            }
                        >
                            <span className={`material-symbols-outlined`}>{item.icon}</span>
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </NavLink>
                    )
                )}
            </div>
        </nav>
    )
}
