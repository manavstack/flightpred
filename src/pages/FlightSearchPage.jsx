import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { searchFlights, getAirports } from '../services/api'

export default function FlightSearchPage() {
    const [searchParams] = useSearchParams()
    const [from, setFrom] = useState(searchParams.get('from') || 'DEL')
    const [to, setTo] = useState(searchParams.get('to') || 'BOM')
    const [date, setDate] = useState(searchParams.get('date') || getDefaultDate())
    const [passengers, setPassengers] = useState(1)
    const [flights, setFlights] = useState([])
    const [meta, setMeta] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('recommended')
    const [showSearch, setShowSearch] = useState(!searchParams.get('from'))
    const [airports, setAirports] = useState([])
    const [airportQuery, setAirportQuery] = useState('')
    const [activeField, setActiveField] = useState(null)

    function getDefaultDate() {
        const d = new Date()
        d.setDate(d.getDate() + 7)
        return d.toISOString().split('T')[0]
    }

    useEffect(() => {
        if (searchParams.get('from')) {
            handleSearch()
        }
    }, [])

    useEffect(() => {
        if (airportQuery.length >= 1) {
            getAirports(airportQuery).then(data => setAirports(data.airports || []))
        }
    }, [airportQuery])

    async function handleSearch(e) {
        if (e) e.preventDefault()
        if (!from || !to || !date) return

        setLoading(true)
        setError(null)
        setShowSearch(false)

        try {
            const data = await searchFlights(from.toUpperCase(), to.toUpperCase(), date, passengers)
            setFlights(data.flights || [])
            setMeta(data.meta || null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function selectAirport(code) {
        if (activeField === 'from') setFrom(code)
        else setTo(code)
        setActiveField(null)
        setAirportQuery('')
    }

    function getFilteredFlights() {
        const sorted = [...flights]
        switch (filter) {
            case 'cheapest': return sorted.sort((a, b) => a.price - b.price)
            case 'fastest': return sorted.sort((a, b) => a.durationMinutes - b.durationMinutes)
            case 'nonstop': return sorted.filter(f => f.isNonStop)
            default: return sorted // recommended = default order from AI
        }
    }

    function getBadgeConfig(prediction) {
        switch (prediction?.action) {
            case 'Buy Now':
                return { text: 'AI: Buy Now', icon: 'trending_down', bgClass: 'bg-emerald-50', textClass: 'text-emerald-600' }
            case 'Wait 2-3 Days':
                return { text: 'AI: Wait', icon: 'schedule', bgClass: 'bg-amber-50', textClass: 'text-amber-600' }
            case 'Best Match':
                return { text: 'AI: Best Match', icon: 'verified', bgClass: 'bg-primary', textClass: 'text-white' }
            default:
                return { text: 'AI: Stable', icon: 'trending_flat', bgClass: 'bg-slate-100', textClass: 'text-slate-600' }
        }
    }

    const filteredFlights = getFilteredFlights()
    const displayFrom = meta?.from?.city || from
    const displayTo = meta?.to?.city || to

    return (
        <div className="bg-background-light font-display text-slate-900 antialiased min-h-screen">
            {/* Header */}
            <header className="bg-primary pt-2 pb-6 px-4 sticky top-0 z-50 shadow-lg shadow-primary/10">
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        to="/dashboard"
                        className="bg-white/10 p-2 rounded-full text-white inline-flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div className="flex-1">
                        {meta ? (
                            <>
                                <h1 className="text-white text-lg font-bold leading-tight">{from} → {to}</h1>
                                <p className="text-white/70 text-xs">{date} • {passengers} Passenger • Economy</p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-white text-lg font-bold leading-tight">Flight Search</h1>
                                <p className="text-white/70 text-xs">Find the best deals with AI predictions</p>
                            </>
                        )}
                    </div>
                    <button
                        onClick={() => setShowSearch(!showSearch)}
                        className="bg-white text-primary px-4 py-2 rounded-full text-sm font-bold shadow-sm"
                    >
                        {showSearch ? 'Close' : 'Modify'}
                    </button>
                </div>

                {/* Search Form */}
                {showSearch && (
                    <form onSubmit={handleSearch} className="space-y-3 animate-[fadeIn_0.3s]">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold">From</p>
                                    <input
                                        className="bg-transparent text-white text-sm font-medium w-full outline-none placeholder:text-white/40 mt-1"
                                        value={from}
                                        onChange={e => { setFrom(e.target.value.toUpperCase()); setAirportQuery(e.target.value); setActiveField('from') }}
                                        onFocus={() => setActiveField('from')}
                                        placeholder="DEL"
                                        maxLength={3}
                                    />
                                </div>
                                {activeField === 'from' && airports.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                                        {airports.slice(0, 5).map(a => (
                                            <button
                                                key={a.code}
                                                type="button"
                                                onClick={() => selectAirport(a.code)}
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                                            >
                                                <span className="font-bold text-primary">{a.code}</span>
                                                <span className="text-slate-500 ml-2">{a.city}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="relative">
                                <div className="bg-white/10 border border-white/20 rounded-lg p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold">To</p>
                                    <input
                                        className="bg-transparent text-white text-sm font-medium w-full outline-none placeholder:text-white/40 mt-1"
                                        value={to}
                                        onChange={e => { setTo(e.target.value.toUpperCase()); setAirportQuery(e.target.value); setActiveField('to') }}
                                        onFocus={() => setActiveField('to')}
                                        placeholder="BOM"
                                        maxLength={3}
                                    />
                                </div>
                                {activeField === 'to' && airports.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
                                        {airports.slice(0, 5).map(a => (
                                            <button
                                                key={a.code}
                                                type="button"
                                                onClick={() => selectAirport(a.code)}
                                                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                                            >
                                                <span className="font-bold text-primary">{a.code}</span>
                                                <span className="text-slate-500 ml-2">{a.city}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/10 border border-white/20 rounded-lg p-3 flex items-center gap-3">
                                <span className="material-symbols-outlined text-white/60">calendar_month</span>
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Departure</p>
                                    <input
                                        type="date"
                                        className="bg-transparent text-white text-sm font-medium w-full outline-none mt-1 [color-scheme:dark]"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>
                            <div className="bg-white/10 border border-white/20 rounded-lg p-3 flex items-center gap-3">
                                <span className="material-symbols-outlined text-white/60">person</span>
                                <div className="flex-1">
                                    <p className="text-[10px] uppercase tracking-wider text-white/50 font-bold">Passengers</p>
                                    <select
                                        className="bg-transparent text-white text-sm font-medium w-full outline-none mt-1"
                                        value={passengers}
                                        onChange={e => setPassengers(parseInt(e.target.value))}
                                    >
                                        {[1, 2, 3, 4, 5, 6].map(n => (
                                            <option key={n} value={n} className="text-slate-900">{n} Passenger{n > 1 ? 's' : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-primary py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-transform disabled:opacity-60"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-lg">search</span>
                                    Search Flights
                                </>
                            )}
                        </button>
                    </form>
                )}
            </header>

            {/* Main */}
            <main className="px-4 py-6 space-y-4 pb-24">
                {/* Filter Pills */}
                {flights.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2">
                        {[
                            { key: 'recommended', label: 'AI Recommended', icon: 'auto_awesome' },
                            { key: 'cheapest', label: 'Cheapest' },
                            { key: 'fastest', label: 'Fastest' },
                            { key: 'nonstop', label: 'Non-stop' },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                className={`px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 shrink-0 transition-all ${filter === f.key
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-white border border-slate-200'
                                    }`}
                            >
                                {f.icon && <span className="material-symbols-outlined text-lg">{f.icon}</span>}
                                {f.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Results Count */}
                {meta && !loading && (
                    <p className="text-xs text-slate-500 font-medium px-1">
                        Found <span className="text-primary font-bold">{filteredFlights.length}</span> flights from {displayFrom} to {displayTo}
                    </p>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <span className="material-symbols-outlined absolute inset-0 m-auto text-primary text-xl flex items-center justify-center">flight</span>
                        </div>
                        <div className="text-center">
                            <p className="text-slate-600 font-bold text-sm">Searching flights...</p>
                            <p className="text-slate-400 text-xs mt-1">AI analyzing {from} → {to} prices</p>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                        <span className="material-symbols-outlined text-red-400 text-2xl mb-2">error</span>
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                        <button onClick={handleSearch} className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold">
                            Retry
                        </button>
                    </div>
                )}

                {/* Flight Cards */}
                {!loading && !error && (
                    <div className="flex flex-col gap-4">
                        {filteredFlights.map((flight, idx) => {
                            const badge = getBadgeConfig(flight.prediction)
                            const isBestMatch = flight.prediction?.action === 'Best Match'

                            return (
                                <div
                                    key={flight.id}
                                    className={`bg-white rounded-lg shadow-sm border ${isBestMatch ? 'border-2 border-primary/20' : 'border-slate-100'} p-5 relative overflow-hidden transition-all hover:shadow-md`}
                                >
                                    {/* Badge */}
                                    <div className={`absolute top-0 right-0 ${badge.bgClass} px-3 py-1.5 rounded-bl-lg flex items-center gap-1.5`}>
                                        <span className={`material-symbols-outlined ${badge.textClass} text-sm font-bold`}>
                                            {badge.icon}
                                        </span>
                                        <span className={`${badge.textClass} text-[11px] font-bold uppercase tracking-tight`}>
                                            {badge.text}
                                        </span>
                                    </div>

                                    {/* Airline Info */}
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden">
                                            {flight.logo ? (
                                                <img className="w-full h-full object-contain p-1" src={flight.logo} alt={flight.airline} onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = `<span class="material-symbols-outlined text-primary">flight</span>` }} />
                                            ) : (
                                                <span className="material-symbols-outlined text-primary">flight</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 leading-none">{flight.airline}</h3>
                                            <p className="text-xs text-slate-500 mt-1">Flight {flight.flightNo} • {flight.aircraft}</p>
                                        </div>
                                    </div>

                                    {/* Time Info */}
                                    <div className="flex justify-between items-center mb-6 px-2">
                                        <div className="text-center">
                                            <p className="text-lg font-bold">{flight.depTime}</p>
                                            <p className="text-xs text-slate-500 font-medium">{flight.depCode}</p>
                                        </div>
                                        <div className="flex-1 px-4 flex flex-col items-center">
                                            <p className="text-[10px] text-slate-400 font-bold mb-1">{flight.duration}</p>
                                            <div className="relative w-full h-[2px] bg-slate-200 rounded-full">
                                                <div className="absolute -top-1 left-0 w-2 h-2 rounded-full border-2 border-primary bg-white" />
                                                {!flight.isNonStop && (
                                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-slate-400" />
                                                )}
                                                <div className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-primary" />
                                            </div>
                                            <p className={`text-[10px] font-bold mt-1 ${flight.isNonStop ? 'text-primary' : 'text-slate-500'}`}>{flight.stops}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold">{flight.arrTime}</p>
                                            <p className="text-xs text-slate-500 font-medium">{flight.arrCode}</p>
                                        </div>
                                    </div>

                                    {/* Price & Actions */}
                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div>
                                            <p className="text-2xl font-black text-slate-900">{flight.priceFormatted}</p>
                                            <div className="flex flex-col gap-1 mt-1">
                                                {flight.seatsLeft <= 3 && (
                                                    <span className="text-[10px] text-red-500 font-bold">Only {flight.seatsLeft} seats left!</span>
                                                )}
                                                {flight.prediction?.confidence && (
                                                    <span className="text-[10px] text-slate-400 font-medium">AI Conf: {Math.round(flight.prediction.confidence)}%</span>
                                                )}
                                                {flight.prediction?.recommendation && flight.prediction.recommendation.best_days_left && (
                                                    <span className="text-[10px] text-primary font-bold">Tip: Book {flight.prediction.recommendation.best_days_left} days in advance for ₹{flight.prediction.recommendation.best_price}</span>
                                                )}
                                                {flight.alertMsg && (
                                                    <span className="text-[10px] text-amber-600 font-bold mt-1 bg-amber-50 px-2 py-1 rounded inline-block">
                                                        <span className="material-symbols-outlined text-[10px] align-middle mr-1">warning</span>
                                                        {flight.alertMsg}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link
                                                to={`/trends?route=${flight.depCode}-${flight.arrCode}`}
                                                className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-sm">insights</span>
                                                Trend
                                            </Link>
                                            <button className="bg-primary text-white px-6 py-2 rounded-lg text-xs font-bold shadow-md shadow-primary/20 active:scale-95 transition-transform">
                                                Book
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {/* No Results */}
                        {!loading && flights.length === 0 && !showSearch && (
                            <div className="text-center py-16">
                                <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">flight_takeoff</span>
                                <p className="text-slate-500 font-medium">No flights found</p>
                                <button onClick={() => setShowSearch(true)} className="mt-4 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold">
                                    Modify Search
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 pb-6 pt-3 flex items-center justify-between z-50">
                <Link className="flex flex-col items-center gap-1 text-primary" to="/search">
                    <span className="material-symbols-outlined fill-1">search</span>
                    <span className="text-[10px] font-bold">Search</span>
                </Link>
                <Link className="flex flex-col items-center gap-1 text-slate-400" to="/dashboard">
                    <span className="material-symbols-outlined">dashboard</span>
                    <span className="text-[10px] font-bold">Dashboard</span>
                </Link>
                <Link className="flex flex-col items-center gap-1 text-slate-400" to="/trends">
                    <span className="material-symbols-outlined">auto_graph</span>
                    <span className="text-[10px] font-bold">Predictions</span>
                </Link>
                <Link className="flex flex-col items-center gap-1 text-slate-400" to="/alerts">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="text-[10px] font-bold">Alerts</span>
                </Link>
            </nav>
        </div>
    )
}
