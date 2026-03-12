import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getFareCalendar, getPopularRoutes } from '../services/api'

const DEMAND_COLORS = {
    low: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-400', label: 'Low Demand' },
    medium: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-400', label: 'Normal' },
    high: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-400', label: 'High Demand' },
    peak: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-400', label: 'Peak Demand' },
}

export default function FareCalendarPage() {
    const [route, setRoute] = useState('DEL-BOM')
    const [month, setMonth] = useState(() => {
        const d = new Date()
        d.setMonth(d.getMonth() + 1)
        return d.toISOString().slice(0, 7)
    })
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selectedDay, setSelectedDay] = useState(null)
    const [popularRoutes, setPopularRoutes] = useState([])

    useEffect(() => { loadCalendar() }, [route, month])
    useEffect(() => {
        getPopularRoutes().then(d => setPopularRoutes(d.routes || [])).catch(() => {})
    }, [])

    async function loadCalendar() {
        setLoading(true)
        setError(null)
        setSelectedDay(null)
        try {
            const result = await getFareCalendar(route, month)
            setData(result)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function changeMonth(delta) {
        const [y, m] = month.split('-').map(Number)
        const d = new Date(y, m - 1 + delta)
        setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    function getPriceColor(day) {
        if (!data || day.isPast) return 'bg-slate-50 text-slate-300'
        const colors = DEMAND_COLORS[day.demand] || DEMAND_COLORS.medium
        return `${colors.bg} ${colors.text} ${colors.border}`
    }

    // Build the calendar grid with empty slots for day alignment
    function buildGrid() {
        if (!data?.calendar) return []
        const firstDay = data.calendar[0]?.dayOfWeek || 0
        const grid = Array(firstDay).fill(null)
        return [...grid, ...data.calendar]
    }

    const grid = buildGrid()

    return (
        <div className="bg-background-light font-display text-slate-900 min-h-screen pb-28">
            {/* Header */}
            <header className="bg-gradient-to-br from-primary via-primary to-accent-indigo pt-4 pb-8 px-4 sticky top-0 z-50 shadow-lg">
                <div className="flex items-center gap-3 mb-5">
                    <Link to="/dashboard" className="bg-white/10 p-2 rounded-full text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-white text-lg font-bold">AI Fare Calendar</h1>
                        <p className="text-white/60 text-xs">Find the cheapest day to fly</p>
                    </div>
                    <span className="material-symbols-outlined text-white/40 text-3xl animate-pulse-soft">auto_awesome</span>
                </div>

                {/* Route Selector Pills */}
                <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
                    {['DEL-BOM', 'BOM-GOI', 'DEL-BLR', 'DEL-GOI', 'BLR-HYD', 'BOM-BLR'].map(r => (
                        <button
                            key={r}
                            onClick={() => setRoute(r)}
                            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${route === r ? 'bg-white text-primary shadow-md' : 'bg-white/15 text-white/80 border border-white/20'}`}
                        >
                            {r.replace('-', ' → ')}
                        </button>
                    ))}
                </div>
            </header>

            <main className="px-4 -mt-4 space-y-5">
                {/* Month Navigator */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex items-center justify-between">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-slate-600">chevron_left</span>
                    </button>
                    <div className="text-center">
                        <p className="font-bold text-lg">{data?.monthName || month}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Predicted Fares</p>
                    </div>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-slate-600">chevron_right</span>
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <span className="material-symbols-outlined absolute inset-0 m-auto text-primary text-lg flex items-center justify-center">calendar_month</span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Generating fare predictions...</p>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                        <p className="text-sm text-red-600">{error}</p>
                        <button onClick={loadCalendar} className="mt-2 text-xs font-bold text-primary">Retry</button>
                    </div>
                )}

                {data && !loading && (
                    <>
                        {/* Legend */}
                        <div className="flex items-center justify-center gap-3 flex-wrap">
                            {Object.entries(DEMAND_COLORS).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-1.5">
                                    <span className={`w-2.5 h-2.5 rounded-full ${val.dot}`} />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{val.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                            {/* Day headers */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                    <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase py-1">{d}</div>
                                ))}
                            </div>

                            {/* Day cells */}
                            <div className="grid grid-cols-7 gap-1.5">
                                {grid.map((day, idx) => {
                                    if (!day) return <div key={`empty-${idx}`} />

                                    const isSelected = selectedDay?.date === day.date
                                    const isCheapest = data.insights.cheapestDay?.date === day.date
                                    const isMostExpensive = data.insights.mostExpensiveDay?.date === day.date

                                    return (
                                        <button
                                            key={day.date}
                                            onClick={() => !day.isPast && setSelectedDay(day)}
                                            disabled={day.isPast}
                                            className={`relative rounded-lg p-1.5 text-center transition-all border ${day.isPast ? 'bg-slate-50 text-slate-300 border-transparent cursor-not-allowed' :
                                                isSelected ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105' :
                                                    `${getPriceColor(day)} hover:shadow-md hover:scale-[1.02] cursor-pointer`
                                                }`}
                                        >
                                            <p className={`text-xs font-bold ${isSelected ? 'text-white' : ''}`}>{day.day}</p>
                                            <p className={`text-[9px] font-bold mt-0.5 ${isSelected ? 'text-white/80' : day.isPast ? 'text-slate-300' : ''}`}>
                                                {day.isPast ? '–' : `₹${(day.price / 1000).toFixed(1)}k`}
                                            </p>
                                            {isCheapest && !day.isPast && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                                                    <span className="text-[8px] text-white font-bold">✓</span>
                                                </span>
                                            )}
                                            {isMostExpensive && !day.isPast && (
                                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                                                    <span className="text-[8px] text-white font-bold">!</span>
                                                </span>
                                            )}
                                            {day.seasonalEvent && !day.isPast && (
                                                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Selected Day Detail */}
                        {selectedDay && (
                            <div className="bg-white rounded-xl shadow-md border-2 border-primary/20 p-5 animate-[fadeIn_0.3s]">
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <p className="text-xs text-slate-500 font-bold uppercase">{selectedDay.dayName}, {new Date(selectedDay.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}</p>
                                        <p className="text-2xl font-black text-primary mt-1">{selectedDay.priceFormatted}</p>
                                    </div>
                                    <div className={`${DEMAND_COLORS[selectedDay.demand]?.bg} ${DEMAND_COLORS[selectedDay.demand]?.text} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1`}>
                                        <span className={`w-2 h-2 rounded-full ${DEMAND_COLORS[selectedDay.demand]?.dot}`} />
                                        {DEMAND_COLORS[selectedDay.demand]?.label}
                                    </div>
                                </div>
                                {selectedDay.seasonalEvent && (
                                    <p className="text-xs text-amber-600 font-medium mb-2">🎉 {selectedDay.seasonalEvent} period</p>
                                )}
                                <Link
                                    to={`/search?from=${data.from}&to=${data.to}&date=${selectedDay.date}`}
                                    className="w-full bg-primary text-white py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-primary/20 mt-3"
                                >
                                    <span className="material-symbols-outlined text-lg">search</span>
                                    Search Flights for This Day
                                </Link>
                            </div>
                        )}

                        {/* AI Insight Card */}
                        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-5 border border-emerald-100">
                            <div className="flex items-start gap-3">
                                <div className="bg-emerald-500 text-white p-2 rounded-lg shrink-0">
                                    <span className="material-symbols-outlined">psychology</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 mb-1">AI Recommendation</h4>
                                    <p className="text-sm text-slate-600 leading-relaxed">{data.insights.recommendation}</p>
                                    <div className="flex gap-4 mt-3">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Average</p>
                                            <p className="font-bold text-slate-800">₹{data.insights.averagePrice?.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Cheapest</p>
                                            <p className="font-bold text-emerald-600">{data.insights.cheapestDay?.priceFormatted}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Save Up To</p>
                                            <p className="font-bold text-primary">{data.insights.savingsPercent}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                <Link className="flex flex-col items-center gap-1 text-primary" to="/fare-calendar">
                    <span className="material-symbols-outlined fill-1">calendar_month</span>
                    <span className="text-[10px] font-bold">Calendar</span>
                </Link>
                <Link className="flex flex-col items-center gap-1 text-slate-400" to="/advisor">
                    <span className="material-symbols-outlined">psychology</span>
                    <span className="text-[10px] font-bold">Advisor</span>
                </Link>
            </nav>
        </div>
    )
}
