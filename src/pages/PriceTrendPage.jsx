import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPriceTrends, getPopularRoutes } from '../services/api'

export default function PriceTrendPage() {
    const [searchParams] = useSearchParams()
    const initialRoute = searchParams.get('route') || 'BOM-GOI'
    const [route, setRoute] = useState(initialRoute)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [popularRoutes, setPopularRoutes] = useState([])
    const [chartPeriod, setChartPeriod] = useState('30D')

    useEffect(() => { loadTrends() }, [route])
    useEffect(() => {
        getPopularRoutes().then(d => setPopularRoutes(d.routes || [])).catch(() => { })
    }, [])

    async function loadTrends() {
        setLoading(true)
        setError(null)
        try {
            const result = await getPriceTrends(route)
            setData(result)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Chart points from data
    const chartPoints = useMemo(() => {
        if (!data?.chartData) return []
        let points = data.chartData
        if (chartPeriod === '7D') points = points.slice(-7)
        else if (chartPeriod === '30D') points = points.slice(-30)

        if (points.length === 0) return []

        const maxPrice = Math.max(...points.map(p => p.price))
        const minPrice = Math.min(...points.map(p => p.price))
        const range = maxPrice - minPrice || 1
        const width = 400
        const height = 130

        return points.map((p, i) => ({
            x: (i / (points.length - 1 || 1)) * width,
            y: height - ((p.price - minPrice) / range) * (height - 20) - 10,
            price: p.price,
            date: p.date,
        }))
    }, [data, chartPeriod])

    const chartPath = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
    const areaPath = chartPath + ` L${chartPoints[chartPoints.length - 1]?.x || 0},150 L0,150 Z`

    // Prediction chart points
    const predictionPoints = useMemo(() => {
        if (!data?.predictions || chartPoints.length === 0) return []
        const lastHistorical = chartPoints[chartPoints.length - 1]
        const predictions = data.predictions.slice(0, 7)
        const allPrices = [...chartPoints.map(p => p.price), ...predictions.map(p => p.price)]
        const maxPrice = Math.max(...allPrices)
        const minPrice = Math.min(...allPrices)
        const range = maxPrice - minPrice || 1

        return predictions.map((p, i) => ({
            x: lastHistorical.x + ((i + 1) / predictions.length) * (400 - lastHistorical.x),
            y: 130 - ((p.price - minPrice) / range) * (130 - 20) - 10,
            price: p.price,
            date: p.date,
        }))
    }, [data, chartPoints])

    const predPath = predictionPoints.length > 0
        ? `M${chartPoints[chartPoints.length - 1]?.x},${chartPoints[chartPoints.length - 1]?.y} ` + predictionPoints.map(p => `L${p.x},${p.y}`).join(' ')
        : ''

    const decisionColor = data?.decision?.action === 'BUY NOW' ? 'emerald-ai'
        : data?.decision?.action === 'WAIT' ? 'amber-500'
            : 'primary'

    return (
        <div className="bg-background-light font-display text-slate-900 min-h-screen flex justify-center">
            <div className="relative w-full max-w-[430px] h-full min-h-screen bg-background-light flex flex-col overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center bg-white/80 backdrop-blur-md sticky top-0 z-50 p-4 justify-between border-b border-slate-200">
                    <Link to="/dashboard" className="text-slate-900 flex size-10 items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
                        <span className="material-symbols-outlined">arrow_back_ios_new</span>
                    </Link>
                    <div className="flex flex-col items-center">
                        <h2 className="text-slate-900 text-sm font-bold leading-tight tracking-tight">{data?.from || route.split('-')[0]} → {data?.to || route.split('-')[1]}</h2>
                        <p className="text-slate-500 text-[10px] font-medium uppercase tracking-widest">Price Insights</p>
                    </div>
                    <div className="flex w-10 items-center justify-end">
                        <button className="text-slate-900">
                            <span className="material-symbols-outlined">notifications</span>
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pb-40">
                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <p className="text-slate-500 text-sm">Analyzing price data...</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && !loading && (
                        <div className="p-6 text-center">
                            <span className="material-symbols-outlined text-red-400 text-3xl mb-2">error</span>
                            <p className="text-sm text-red-600">{error}</p>
                            <button onClick={loadTrends} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold">Retry</button>
                        </div>
                    )}

                    {data && !loading && (
                        <>
                            {/* Price Hero */}
                            <div className="px-6 pt-6 text-center">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 ${data.trendDirection === 'down' ? 'bg-emerald-ai/10 text-emerald-ai' : data.trendDirection === 'up' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                                    }`}>
                                    <span className="material-symbols-outlined text-sm">
                                        {data.trendDirection === 'down' ? 'trending_down' : data.trendDirection === 'up' ? 'trending_up' : 'trending_flat'}
                                    </span>
                                    {data.trendDirection === 'down' ? `${Math.abs(data.trend)}% Drop` : data.trendDirection === 'up' ? `${data.trend}% Rise` : 'Stable'} — {data.dataPointsAnalyzed} data points
                                </div>
                                <h3 className="text-slate-900 text-4xl font-extrabold tracking-tight">{data.currentPriceFormatted}</h3>
                                <p className="text-slate-500 text-sm font-medium mt-1">Current Average Fare</p>
                            </div>

                            {/* Chart */}
                            <div className="mt-8 px-4 relative">
                                <div className="flex justify-center mb-6">
                                    <div className="flex h-9 w-64 items-center justify-center rounded-lg bg-slate-200/50 p-1">
                                        {['7D', '30D', '90D'].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setChartPeriod(p)}
                                                className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${chartPeriod === p ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="relative h-48 w-full px-2">
                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 400 150">
                                        {/* Grid lines */}
                                        <line className="text-slate-100" stroke="currentColor" strokeWidth="1" x1="0" x2="400" y1="30" y2="30" />
                                        <line className="text-slate-100" stroke="currentColor" strokeWidth="1" x1="0" x2="400" y1="70" y2="70" />
                                        <line className="text-slate-100" stroke="currentColor" strokeWidth="1" x1="0" x2="400" y1="110" y2="110" />

                                        <defs>
                                            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                                <stop offset="0%" stopColor="#1e3b8a" stopOpacity="0.2" />
                                                <stop offset="100%" stopColor="#1e3b8a" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>

                                        {chartPoints.length > 0 && (
                                            <>
                                                <path d={areaPath} fill="url(#chartGradient)" />
                                                <path d={chartPath} fill="none" stroke="#1e3b8a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                                            </>
                                        )}

                                        {predPath && (
                                            <path d={predPath} fill="none" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" strokeDasharray="6 4" />
                                        )}

                                        {/* Current price dot */}
                                        {chartPoints.length > 0 && (
                                            <>
                                                <circle cx={chartPoints[chartPoints.length - 1].x} cy={chartPoints[chartPoints.length - 1].y} fill="#1e3b8a" r="5" stroke="white" strokeWidth="2" />
                                                <rect className="shadow-sm" fill="white" height="24" rx="6" width="65" x={chartPoints[chartPoints.length - 1].x - 32} y={chartPoints[chartPoints.length - 1].y - 32} />
                                                <text fill="#1e3b8a" fontSize="9" fontWeight="bold" textAnchor="middle" x={chartPoints[chartPoints.length - 1].x} y={chartPoints[chartPoints.length - 1].y - 16}>
                                                    {data.currentPriceFormatted}
                                                </text>
                                            </>
                                        )}
                                    </svg>
                                    <div className="flex justify-between mt-2 px-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Past</span>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-primary uppercase">Today</span>
                                            <div className="w-px h-2 bg-primary" />
                                        </div>
                                        <span className="text-[10px] font-bold text-emerald-ai uppercase">Forecast</span>
                                    </div>
                                </div>
                            </div>

                            {/* AI Forecast Panel */}
                            <div className="px-4 mt-8">
                                <div className="glass-panel rounded-xl p-6 relative overflow-hidden">
                                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-ai/20 rounded-full blur-3xl" />
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary p-2 rounded-lg text-white shadow-lg shadow-primary/30">
                                                <span className="material-symbols-outlined text-xl animate-pulse-soft">psychology</span>
                                            </div>
                                            <div>
                                                <h4 className="text-slate-900 font-bold text-base leading-none">AI Forecast</h4>
                                                <p className="text-slate-500 text-xs mt-1">{data.dataPointsAnalyzed} data points analyzed</p>
                                            </div>
                                        </div>
                                        <div className={`bg-${decisionColor} text-white px-3 py-1.5 rounded-lg text-xs font-black tracking-wider shadow-md`}>
                                            {data.decision.action}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-slate-700 text-sm leading-relaxed">
                                            {data.decision.reason}
                                        </p>
                                        <div>
                                            <div className="flex justify-between items-end mb-1.5">
                                                <span className="text-slate-500 text-xs font-bold uppercase tracking-tight">Confidence Score</span>
                                                <span className={`text-${decisionColor} text-sm font-black`}>{data.decision.confidence}%</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-primary to-emerald-ai rounded-full shadow-inner transition-all duration-700"
                                                    style={{ width: `${data.decision.confidence}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <div className="flex-1 bg-white/50 p-3 rounded-lg border border-slate-100">
                                                <p className="text-slate-400 text-[10px] font-bold uppercase">Lowest Price</p>
                                                <p className="text-slate-900 font-extrabold text-lg">{data.lowestPriceFormatted}</p>
                                            </div>
                                            <div className="flex-1 bg-white/50 p-3 rounded-lg border border-slate-100">
                                                <p className="text-slate-400 text-[10px] font-bold uppercase">Average Fare</p>
                                                <p className="text-slate-900 font-extrabold text-lg">{data.averagePriceFormatted}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Route Selector */}
                            {popularRoutes.length > 0 && (
                                <div className="px-4 mt-6">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">Explore Other Routes</p>
                                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
                                        {popularRoutes.slice(0, 8).map(r => (
                                            <button
                                                key={r.route}
                                                onClick={() => setRoute(r.route)}
                                                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${route === r.route ? 'bg-primary text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600'}`}
                                            >
                                                {r.from} → {r.to}
                                                <span className={`ml-1 ${r.direction === 'down' ? 'text-emerald-400' : r.direction === 'up' ? 'text-red-400' : 'text-slate-400'}`}>
                                                    {r.direction === 'down' ? '↓' : r.direction === 'up' ? '↑' : '→'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Track Trip Toggle */}
                            <div className="px-4 mt-6">
                                <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-primary">notifications_active</span>
                                        <div>
                                            <p className="text-slate-900 font-bold text-sm">Track this route</p>
                                            <p className="text-slate-500 text-xs">Alert me if price drops below ₹{Math.round(data.currentPrice * 0.9).toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input defaultChecked className="sr-only peer" type="checkbox" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                                    </label>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Bottom Nav */}
                <div className="absolute bottom-0 left-0 right-0 flex border-t border-slate-100 bg-white/90 backdrop-blur-lg px-4 pb-8 pt-3">
                    <Link className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-400" to="/search">
                        <span className="material-symbols-outlined text-[24px]">search</span>
                        <p className="text-[10px] font-bold tracking-tight">Search</p>
                    </Link>
                    <Link className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-400" to="/dashboard">
                        <span className="material-symbols-outlined text-[24px]">dashboard</span>
                        <p className="text-[10px] font-bold tracking-tight">Dashboard</p>
                    </Link>
                    <Link className="flex flex-1 flex-col items-center justify-center gap-1 text-primary" to="/trends">
                        <span className="material-symbols-outlined text-[24px] fill-1">trending_up</span>
                        <p className="text-[10px] font-bold tracking-tight">Predictions</p>
                    </Link>
                    <Link className="flex flex-1 flex-col items-center justify-center gap-1 text-slate-400" to="/alerts">
                        <span className="material-symbols-outlined text-[24px]">notifications</span>
                        <p className="text-[10px] font-bold tracking-tight">Alerts</p>
                    </Link>
                </div>

                {/* CTA Button */}
                <div className="absolute bottom-24 left-0 right-0 px-6">
                    <Link to={`/search?from=${route.split('-')[0]}&to=${route.split('-')[1]}`} className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                        View Best Flight Deals
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
