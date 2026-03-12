import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAdvisorInsights } from '../services/api'
import { useAuth } from '../context/AuthContext'

const PRIORITY_STYLES = {
    high: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700' },
}

function InsightCard({ item, type }) {
    const style = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.info
    const typeConfig = {
        opportunity: { label: 'Opportunity', emoji: '🎯' },
        warning: { label: 'Warning', emoji: '⚠️' },
        insight: { label: 'Insight', emoji: '💡' },
        tip: { label: 'Pro Tip', emoji: '🧠' },
    }
    const config = typeConfig[type] || typeConfig.tip

    return (
        <div className={`${style.bg} border ${style.border} rounded-xl p-4 transition-all hover:shadow-md`}>
            <div className="flex items-start gap-3">
                <div className={`${style.icon} mt-0.5`}>
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className={`${style.badge} text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider`}>
                            {config.emoji} {config.label}
                        </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 leading-snug">{item.title}</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{item.description}</p>
                    {item.action && (
                        <Link
                            to={item.action.link}
                            className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                        >
                            {item.action.label}
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function AdvisorPage() {
    const { user } = useAuth()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeTab, setActiveTab] = useState('all')

    useEffect(() => { loadAdvisor() }, [])

    async function loadAdvisor() {
        setLoading(true)
        setError(null)
        try {
            const result = await getAdvisorInsights()
            setData(result)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const tabs = [
        { key: 'all', label: 'All', icon: 'dashboard' },
        { key: 'opportunities', label: 'Deals', icon: 'local_offer' },
        { key: 'warnings', label: 'Alerts', icon: 'warning' },
        { key: 'tips', label: 'Tips', icon: 'lightbulb' },
    ]

    function getFilteredItems() {
        if (!data) return []
        switch (activeTab) {
            case 'opportunities': return data.opportunities.map(i => ({ ...i, _type: 'opportunity' }))
            case 'warnings': return data.warnings.map(i => ({ ...i, _type: 'warning' }))
            case 'tips': return [...data.insights.map(i => ({ ...i, _type: 'insight' })), ...data.tips.map(i => ({ ...i, _type: 'tip' }))]
            default:
                return [
                    ...data.opportunities.map(i => ({ ...i, _type: 'opportunity' })),
                    ...data.warnings.map(i => ({ ...i, _type: 'warning' })),
                    ...data.insights.map(i => ({ ...i, _type: 'insight' })),
                    ...data.tips.map(i => ({ ...i, _type: 'tip' })),
                ]
        }
    }

    const items = getFilteredItems()

    return (
        <div className="bg-background-light font-display text-slate-900 min-h-screen pb-28">
            {/* Header */}
            <header className="bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 pt-4 pb-8 px-4 sticky top-0 z-50 shadow-lg relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />

                <div className="flex items-center gap-3 mb-5 relative z-10">
                    <Link to="/dashboard" className="bg-white/10 p-2 rounded-full text-white">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-white text-lg font-bold">AI Travel Advisor</h1>
                        <p className="text-white/60 text-xs">Personalized intelligence for smarter travel</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20">
                        <span className="material-symbols-outlined text-white text-2xl animate-pulse-soft">psychology</span>
                    </div>
                </div>

                {/* Score Card */}
                {data && (
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 relative z-10">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Travel Intelligence Score</p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-white text-3xl font-black">{data.score}</span>
                                    <span className="text-white/60 text-sm font-medium">/ 100</span>
                                </div>
                                <p className="text-white/70 text-xs mt-0.5">{data.scoreLabel}</p>
                            </div>
                            <div className="relative flex items-center justify-center size-20">
                                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                    <circle className="stroke-current text-white/10" cx="18" cy="18" fill="none" r="16" strokeWidth="3" />
                                    <circle
                                        className="stroke-current text-white"
                                        cx="18" cy="18" fill="none" r="16"
                                        strokeDasharray={`${data.score}, 100`}
                                        strokeLinecap="round" strokeWidth="3"
                                    />
                                </svg>
                                <span className="absolute text-white text-sm font-bold">
                                    <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-3 pt-3 border-t border-white/10">
                            <div>
                                <p className="text-white/40 text-[10px] font-bold uppercase">Active Alerts</p>
                                <p className="text-white font-bold">{data.summary.activeAlerts}</p>
                            </div>
                            <div>
                                <p className="text-white/40 text-[10px] font-bold uppercase">Routes Tracked</p>
                                <p className="text-white font-bold">{data.summary.searchesAnalyzed}</p>
                            </div>
                            <div>
                                <p className="text-white/40 text-[10px] font-bold uppercase">AI Insights</p>
                                <p className="text-white font-bold">{data.summary.totalInsights}</p>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            <main className="px-4 -mt-3 space-y-5">
                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                        <div className="relative">
                            <div className="w-14 h-14 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                            <span className="material-symbols-outlined absolute inset-0 m-auto text-purple-600 text-lg flex items-center justify-center">psychology</span>
                        </div>
                        <div className="text-center">
                            <p className="text-slate-600 font-bold text-sm">Analyzing your travel patterns...</p>
                            <p className="text-slate-400 text-xs mt-1">AI is reviewing prices, alerts & seasonal data</p>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                        <p className="text-sm text-red-600">{error}</p>
                        <button onClick={loadAdvisor} className="mt-2 text-xs font-bold text-purple-600">Retry</button>
                    </div>
                )}

                {data && !loading && (
                    <>
                        {/* Tab Pills */}
                        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${activeTab === tab.key ? 'bg-purple-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600'}`}
                                >
                                    <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                                    {tab.label}
                                    {tab.key === 'opportunities' && data.opportunities.length > 0 && (
                                        <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                                            {data.opportunities.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Upcoming Events */}
                        {activeTab === 'all' && data.upcomingEvents.length > 0 && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-amber-500">event</span>
                                    <h4 className="font-bold text-sm text-slate-800">Upcoming Travel Seasons</h4>
                                </div>
                                <div className="space-y-2">
                                    {data.upcomingEvents.map((event, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white/60 rounded-lg p-3">
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{event.name}</p>
                                                <p className="text-[10px] text-slate-500">{event.tip}</p>
                                            </div>
                                            <div className="text-right shrink-0 ml-3">
                                                {event.isActive ? (
                                                    <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full uppercase">Active Now</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">{event.daysUntil}d away</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Info Cards */}
                        <div className="space-y-3">
                            {items.map((item, idx) => (
                                <InsightCard key={`${item._type}-${idx}`} item={item} type={item._type} />
                            ))}
                        </div>

                        {items.length === 0 && (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">check_circle</span>
                                <p className="text-slate-500 font-medium">No {activeTab === 'all' ? '' : activeTab} at the moment</p>
                                <p className="text-xs text-slate-400 mt-1">Check back later for new insights</p>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100">
                            <h4 className="text-sm font-bold mb-4">Quick Actions</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <Link to="/fare-calendar" className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                    <span className="material-symbols-outlined text-blue-500">calendar_month</span>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Fare Calendar</p>
                                        <p className="text-[10px] text-slate-500">Find cheapest days</p>
                                    </div>
                                </Link>
                                <Link to="/budget" className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                                    <span className="material-symbols-outlined text-emerald-500">savings</span>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Budget Finder</p>
                                        <p className="text-[10px] text-slate-500">Trips within budget</p>
                                    </div>
                                </Link>
                                <Link to="/trends" className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                                    <span className="material-symbols-outlined text-purple-500">trending_up</span>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Price Trends</p>
                                        <p className="text-[10px] text-slate-500">AI predictions</p>
                                    </div>
                                </Link>
                                <Link to="/alerts" className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                                    <span className="material-symbols-outlined text-amber-500">notifications</span>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Price Alerts</p>
                                        <p className="text-[10px] text-slate-500">Get notified</p>
                                    </div>
                                </Link>
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
                <Link className="flex flex-col items-center gap-1 text-slate-400" to="/fare-calendar">
                    <span className="material-symbols-outlined">calendar_month</span>
                    <span className="text-[10px] font-bold">Calendar</span>
                </Link>
                <Link className="flex flex-col items-center gap-1 text-purple-600" to="/advisor">
                    <span className="material-symbols-outlined fill-1">psychology</span>
                    <span className="text-[10px] font-bold">Advisor</span>
                </Link>
            </nav>
        </div>
    )
}
