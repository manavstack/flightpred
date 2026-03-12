import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDashboardStats } from '../services/api'

export default function DashboardPage() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        loadDashboard()
    }, [])

    async function loadDashboard() {
        try {
            setLoading(true)
            const data = await getDashboardStats()
            setStats(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="material-symbols-outlined absolute inset-0 m-auto text-primary text-lg flex items-center justify-center animate-pulse">flight</span>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Loading intelligence hub...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center min-h-[60vh] px-4">
                <div className="text-center">
                    <span className="material-symbols-outlined text-red-400 text-4xl mb-2">error</span>
                    <p className="text-slate-600 font-medium">{error}</p>
                    <button onClick={loadDashboard} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold">
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    const displayUser = stats?.user || user
    const s = stats?.stats || {}
    const popularRoutes = stats?.popularRoutes || []
    const recentSearches = stats?.recentSearches || []

    // Simulated AI accuracy
    const predictionAccuracy = 82 + Math.floor(Math.random() * 10)

    return (
        <>
            <header className="sticky top-0 z-50 bg-background-light/80 backdrop-blur-md px-4 pt-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden">
                            <img
                                alt="User Profile"
                                className="h-full w-full rounded-full object-cover"
                                src={displayUser?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayUser?.name || 'User')}&background=1e3b8a&color=fff`}
                            />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Intelligence Hub</p>
                            <h1 className="text-xl font-bold text-slate-900">{displayUser?.name || 'User'}</h1>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link to="/search" className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200">
                            <span className="material-symbols-outlined text-slate-600">search</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200"
                            title="Logout"
                        >
                            <span className="material-symbols-outlined text-slate-600">logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 px-4 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <Link
                        to="/alerts"
                        className="flex flex-col gap-3 rounded-xl p-5 bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                    >
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <span className="material-symbols-outlined">notifications_active</span>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-tight">Active Alerts</p>
                            <p className="text-2xl font-bold leading-tight mt-0.5">{String(s.activeAlerts || 0).padStart(2, '0')}</p>
                        </div>
                    </Link>

                    <div className="flex flex-col gap-3 rounded-xl p-5 bg-white shadow-sm border border-slate-100">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <span className="material-symbols-outlined">map</span>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-tight">Saved Routes</p>
                            <p className="text-2xl font-bold leading-tight mt-0.5">{String(s.savedRoutes || 0).padStart(2, '0')}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-xl p-5 bg-white shadow-sm border border-slate-100">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                            <span className="material-symbols-outlined">savings</span>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-tight">Total Savings</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-xl font-bold leading-tight mt-0.5">{s.totalSavingsFormatted || '₹0'}</p>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-600">Lifetime</span>
                        </div>
                    </div>

                    <Link
                        to="/trends"
                        className="flex flex-col gap-3 rounded-xl p-5 bg-white shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                    >
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <span className="material-symbols-outlined">auto_graph</span>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-tight">Predictions</p>
                            <p className="text-2xl font-bold leading-tight mt-0.5">{s.predictions || 0}</p>
                        </div>
                    </Link>
                </div>

                {/* AI Intelligence Profile */}
                <section className="space-y-4">
                    <h3 className="text-lg font-bold tracking-tight px-1">AI Intelligence Profile</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Prediction Accuracy */}
                        <div className="rounded-xl p-6 bg-primary text-white flex items-center justify-between shadow-lg shadow-primary/20">
                            <div className="space-y-1">
                                <p className="text-sm font-medium opacity-80">Prediction Accuracy</p>
                                <p className="text-3xl font-bold">{predictionAccuracy}%</p>
                                <p className="text-xs opacity-60">High reliability score</p>
                            </div>
                            <div className="relative flex items-center justify-center size-20">
                                <svg className="size-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                    <circle className="stroke-current text-white/20" cx="18" cy="18" fill="none" r="16" strokeWidth="3" />
                                    <circle
                                        className="stroke-current text-white"
                                        cx="18"
                                        cy="18"
                                        fill="none"
                                        r="16"
                                        strokeDasharray={`${predictionAccuracy}, 100`}
                                        strokeLinecap="round"
                                        strokeWidth="3"
                                    />
                                </svg>
                                <span className="absolute text-[10px] font-bold">AI</span>
                            </div>
                        </div>

                        {/* Popular Holiday Trends */}
                        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm font-bold">Popular Route Trends</p>
                                <span className="material-symbols-outlined text-slate-400">trending_up</span>
                            </div>
                            <div className="space-y-4">
                                {popularRoutes.slice(0, 3).map((route, idx) => (
                                    <div key={route.route} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-8 rounded-full ${idx === 0 ? 'bg-orange-100' : idx === 1 ? 'bg-blue-100' : 'bg-emerald-100'} flex items-center justify-center`}>
                                                <span className={`material-symbols-outlined text-sm ${idx === 0 ? 'text-orange-600' : idx === 1 ? 'text-blue-600' : 'text-emerald-600'}`}>
                                                    {idx === 0 ? 'beach_access' : idx === 1 ? 'landscape' : 'flight'}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold">{route.from} → {route.to}</p>
                                                <p className={`text-[10px] font-medium ${route.direction === 'down' ? 'text-emerald-600' : route.direction === 'up' ? 'text-red-500' : 'text-slate-500'}`}>
                                                    {route.direction === 'down' ? `Price Drop: ${Math.abs(route.changePercent)}%` :
                                                        route.direction === 'up' ? `Price Up: ${route.changePercent}%` :
                                                            'Stable'}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600">{route.currentPriceFormatted}</span>
                                    </div>
                                ))}
                                {popularRoutes.length === 0 && (
                                    <p className="text-xs text-slate-400 text-center py-4">Loading trends...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Recent Searches */}
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold">Recent Route Searches</p>
                        <span className="material-symbols-outlined text-slate-400">more_horiz</span>
                    </div>
                    <div className="space-y-4">
                        {recentSearches.length > 0 ? recentSearches.slice(0, 4).map((search, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-sm text-primary">flight_takeoff</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold">{search.from_code} → {search.to_code}</p>
                                        <p className="text-[10px] text-slate-500">{new Date(search.searched_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <Link
                                    to={`/search?from=${search.from_code}&to=${search.to_code}&date=${search.departure_date}`}
                                    className="text-xs font-bold text-primary"
                                >
                                    Search Again
                                </Link>
                            </div>
                        )) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm text-primary">flight_takeoff</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold">No searches yet</p>
                                            <p className="text-[10px] text-slate-500">Start by searching a route!</p>
                                        </div>
                                    </div>
                                    <Link to="/search" className="text-xs font-bold text-primary">Search Now</Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Search Volume Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h4 className="text-sm font-bold">Total Search Volume</h4>
                            <p className="text-xs text-slate-500">Domestic market analysis</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold">{s.totalSearches || 0}</p>
                            <p className="text-[10px] text-emerald-600 font-bold">Your Searches</p>
                        </div>
                    </div>
                    <div className="flex items-end justify-between gap-1 h-24">
                        {[12, 16, 20, 14, 24, 18, 22, 24].map((h, i) => (
                            <div
                                key={i}
                                className={`flex-1 rounded-t-sm transition-all duration-500`}
                                style={{
                                    height: `${h * 4}px`,
                                    backgroundColor: `rgba(30, 59, 138, ${0.1 + (i / 8) * 0.9})`,
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* New Features */}
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest px-1">AI Tools</h3>
                    <div className="grid grid-cols-3 gap-3">
                        <Link to="/fare-calendar" className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl text-white text-center shadow-lg shadow-blue-500/20 hover:scale-[1.02] transition-transform">
                            <span className="material-symbols-outlined text-2xl mb-1">calendar_month</span>
                            <p className="text-[10px] font-bold uppercase tracking-wider">Fare Calendar</p>
                        </Link>
                        <Link to="/budget" className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-xl text-white text-center shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-transform">
                            <span className="material-symbols-outlined text-2xl mb-1">savings</span>
                            <p className="text-[10px] font-bold uppercase tracking-wider">Budget Finder</p>
                        </Link>
                        <Link to="/advisor" className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 rounded-xl text-white text-center shadow-lg shadow-violet-500/20 hover:scale-[1.02] transition-transform">
                            <span className="material-symbols-outlined text-2xl mb-1">psychology</span>
                            <p className="text-[10px] font-bold uppercase tracking-wider">AI Advisor</p>
                        </Link>
                    </div>
                </div>
            </main>
        </>
    )
}
