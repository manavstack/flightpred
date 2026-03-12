import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { findBudgetFlights } from '../services/api'

const BUDGET_PRESETS = [3000, 4000, 5000, 6000, 8000, 10000]

const ORIGINS = [
    { code: '', label: 'Any City' },
    { code: 'DEL', label: 'Delhi' },
    { code: 'BOM', label: 'Mumbai' },
    { code: 'BLR', label: 'Bangalore' },
    { code: 'HYD', label: 'Hyderabad' },
    { code: 'MAA', label: 'Chennai' },
    { code: 'CCU', label: 'Kolkata' },
]

export default function BudgetFinderPage() {
    const [budget, setBudget] = useState(5000)
    const [customBudget, setCustomBudget] = useState('')
    const [from, setFrom] = useState('')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [expandedRoute, setExpandedRoute] = useState(null)

    useEffect(() => { handleSearch() }, [])

    async function handleSearch(e) {
        if (e) e.preventDefault()
        const searchBudget = customBudget || budget
        setLoading(true)
        setError(null)
        try {
            const result = await findBudgetFlights(searchBudget, from)
            setData(result)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function selectPreset(val) {
        setBudget(val)
        setCustomBudget('')
        setTimeout(() => handleSearch(), 0)
    }

    return (
        <div className="bg-background-light font-display text-slate-900 min-h-screen pb-28">
            {/* Header */}
            <header className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 pt-4 pb-10 px-4 sticky top-0 z-50 shadow-lg">
                <div className="flex items-center gap-3 mb-5">
                    <Link to="/dashboard" className="bg-white/10 p-2 rounded-full text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-white text-lg font-bold">Smart Budget Finder</h1>
                        <p className="text-white/60 text-xs">AI-powered trip discovery within your budget</p>
                    </div>
                    <span className="material-symbols-outlined text-white/40 text-3xl">savings</span>
                </div>

                {/* Budget Input */}
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider mb-2">Your Maximum Budget</p>
                    <div className="flex items-center gap-3">
                        <span className="text-white/80 text-2xl font-bold">₹</span>
                        <input
                            className="flex-1 bg-transparent text-white text-3xl font-black outline-none placeholder:text-white/30"
                            type="number"
                            value={customBudget || budget}
                            onChange={e => setCustomBudget(e.target.value)}
                            placeholder="5000"
                        />
                        <button
                            onClick={handleSearch}
                            className="bg-white text-emerald-700 px-5 py-2.5 rounded-lg font-bold text-sm shadow-md active:scale-95 transition-transform"
                        >
                            Find
                        </button>
                    </div>
                </div>
            </header>

            <main className="px-4 -mt-5 space-y-5">
                {/* Budget Presets */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {BUDGET_PRESETS.map(val => (
                        <button
                            key={val}
                            onClick={() => selectPreset(val)}
                            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${(customBudget ? parseInt(customBudget) : budget) === val ? 'bg-emerald-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600'}`}
                        >
                            ₹{val.toLocaleString('en-IN')}
                        </button>
                    ))}
                </div>

                {/* Origin Filter */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {ORIGINS.map(o => (
                        <button
                            key={o.code}
                            onClick={() => { setFrom(o.code); setTimeout(() => handleSearch(), 0) }}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${from === o.code ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}
                        >
                            {o.code ? `From ${o.label}` : '🌍 All Cities'}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
                            <span className="material-symbols-outlined absolute inset-0 m-auto text-emerald-600 text-lg flex items-center justify-center">travel_explore</span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Finding the best deals...</p>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                        <p className="text-sm text-red-600">{error}</p>
                        <button onClick={handleSearch} className="mt-2 text-xs font-bold text-emerald-600">Retry</button>
                    </div>
                )}

                {data && !loading && (
                    <>
                        {/* Summary Banner */}
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-5 text-white shadow-lg">
                            <div className="flex items-start gap-3">
                                <div className="bg-white/20 p-2 rounded-lg">
                                    <span className="material-symbols-outlined text-xl">explore</span>
                                </div>
                                <div>
                                    <p className="font-bold text-base">{data.summary.totalRoutes} routes found!</p>
                                    <p className="text-white/80 text-xs mt-1 leading-relaxed">{data.summary.message}</p>
                                </div>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="space-y-4">
                            {data.results.map((route, idx) => {
                                const isExpanded = expandedRoute === route.route

                                return (
                                    <div
                                        key={route.route}
                                        className={`bg-white rounded-xl shadow-sm border transition-all overflow-hidden ${idx === 0 ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-slate-100'}`}
                                    >
                                        {idx === 0 && (
                                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold uppercase tracking-wider text-center py-1.5">
                                                🏆 Best Deal Under Your Budget
                                            </div>
                                        )}

                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded font-bold">{route.tag}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xl font-black text-primary">{route.from}</span>
                                                        <span className="material-symbols-outlined text-slate-300 text-sm">arrow_forward</span>
                                                        <span className="text-xl font-black text-primary">{route.to}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5">{route.fromCity} → {route.toCity}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-emerald-600">{route.bestPriceFormatted}</p>
                                                    <p className="text-[10px] text-emerald-500 font-bold">Save {route.maxSavingsPercent}%</p>
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-500 mb-3">{route.highlight}</p>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                    <span className="material-symbols-outlined text-sm">calendar_today</span>
                                                    <span>Best: <strong className="text-slate-700">{route.bestDateFormatted}</strong></span>
                                                    <span className="text-slate-300 mx-1">|</span>
                                                    <span>{route.availableDates} dates available</span>
                                                </div>
                                                <button
                                                    onClick={() => setExpandedRoute(isExpanded ? null : route.route)}
                                                    className="text-primary text-xs font-bold flex items-center gap-0.5"
                                                >
                                                    {isExpanded ? 'Less' : 'More Dates'}
                                                    <span className={`material-symbols-outlined text-sm transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                                                </button>
                                            </div>

                                            {/* Expanded Best Dates */}
                                            {isExpanded && (
                                                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 animate-[fadeIn_0.3s]">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top 5 Cheapest Dates</p>
                                                    {route.bestDays.map((day, i) => (
                                                        <Link
                                                            key={day.date}
                                                            to={`/search?from=${route.from}&to=${route.to}&date=${day.date}`}
                                                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-emerald-50 transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                                                    {i + 1}
                                                                </span>
                                                                <div>
                                                                    <p className="text-xs font-bold">{day.dayName}</p>
                                                                    {day.isWeekend && <span className="text-[9px] text-amber-500 font-bold">Weekend</span>}
                                                                </div>
                                                            </div>
                                                            <div className="text-right flex items-center gap-2">
                                                                <span className="text-sm font-bold text-emerald-600">{day.priceFormatted}</span>
                                                                <span className="material-symbols-outlined text-slate-300 text-sm">chevron_right</span>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}

                            {data.results.length === 0 && (
                                <div className="text-center py-16">
                                    <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">search_off</span>
                                    <p className="text-slate-500 font-medium">No routes found under ₹{(customBudget || budget).toLocaleString('en-IN')}</p>
                                    <p className="text-xs text-slate-400 mt-1">Try increasing your budget or changing the origin city</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 pb-6 pt-3 flex items-center justify-between z-50">
                <Link className="flex flex-col items-center gap-1 text-slate-400" to="/search">
                    <span className="material-symbols-outlined">search</span>
                    <span className="text-[10px] font-bold">Search</span>
                </Link>
                <Link className="flex flex-col items-center gap-1 text-slate-400" to="/dashboard">
                    <span className="material-symbols-outlined">dashboard</span>
                    <span className="text-[10px] font-bold">Dashboard</span>
                </Link>
                <Link className="flex flex-col items-center gap-1 text-emerald-600" to="/budget">
                    <span className="material-symbols-outlined fill-1">savings</span>
                    <span className="text-[10px] font-bold">Budget</span>
                </Link>
                <Link className="flex flex-col items-center gap-1 text-slate-400" to="/advisor">
                    <span className="material-symbols-outlined">psychology</span>
                    <span className="text-[10px] font-bold">Advisor</span>
                </Link>
            </nav>
        </div>
    )
}
