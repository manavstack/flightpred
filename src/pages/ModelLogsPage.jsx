import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPredictionLogs, clearPredictionLogs } from '../services/api'

export default function ModelLogsPage() {
    const [logs, setLogs] = useState([])
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [clearing, setClearing] = useState(false)
    const [error, setError] = useState(null)

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const data = await getPredictionLogs()
            setLogs(data.logs || [])
            setStats(data.stats || null)
            setError(null)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLogs()
    }, [])

    const handleClearLogs = async () => {
        if (!window.confirm("Are you sure you want to permanently delete all prediction logs?")) return;
        
        try {
            setClearing(true);
            await clearPredictionLogs();
            await fetchLogs(); // Refresh to show empty state
        } catch (err) {
            setError("Failed to clear logs: " + err.message);
        } finally {
            setClearing(false);
        }
    }

    return (
        <div className="bg-background-light font-display text-slate-900 min-h-screen pb-24">
            {/* Header */}
            <header className="bg-primary text-white p-6 rounded-b-[32px] shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center gap-4 relative z-10 mb-6">
                    <Link to="/dashboard" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">AI Predictions Log</h1>
                        <p className="text-white/70 text-sm font-medium mt-1">Monitor ML Model Accuracy & Performance</p>
                    </div>
                    
                    <button 
                        onClick={handleClearLogs}
                        disabled={clearing || logs.length === 0}
                        className="ml-auto bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-white p-2 rounded-xl transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Clear all logs"
                    >
                        {clearing ? (
                             <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                        ) : (
                             <span className="material-symbols-outlined text-sm">delete</span>
                        )}
                        <span className="text-sm font-bold pr-1">Clear</span>
                    </button>
                </div>
            </header>

            <main className="px-5 py-6 mt-[-40px] relative z-20 space-y-6">
                
                {/* Stats Section */}
                {stats && !loading && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                            <span className="material-symbols-outlined text-amber-500 mb-2 bg-amber-50 p-2 rounded-full">troubleshoot</span>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Mean Abs. Error</p>
                            <p className="text-2xl font-black text-slate-800">
                                ₹{Math.round(stats.mae).toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                            <span className="material-symbols-outlined text-red-500 mb-2 bg-red-50 p-2 rounded-full">query_stats</span>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">RMSE</p>
                            <p className="text-2xl font-black text-slate-800">
                                ₹{Math.round(stats.rmse).toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                            <span className="material-symbols-outlined text-primary mb-2 bg-primary/10 p-2 rounded-full">model_training</span>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Avg Accuracy</p>
                            <p className="text-2xl font-black text-primary">
                                {stats.accuracy_percentage.toFixed(1)}%
                            </p>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                            <span className="material-symbols-outlined text-blue-500 mb-2 bg-blue-50 p-2 rounded-full">dataset</span>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Total Logs</p>
                            <p className="text-2xl font-black text-slate-800">
                                {stats.total_predictions}
                            </p>
                        </div>
                    </div>
                )}

                {/* Loading / Error States */}
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Logs Table */}
                {!loading && !error && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h2 className="font-bold text-slate-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">list_alt</span>
                                Recent Predictions
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                        <th className="p-3 whitespace-nowrap">Route / Info</th>
                                        <th className="p-3 whitespace-nowrap">Time</th>
                                        <th className="p-3 text-right">Actual</th>
                                        <th className="p-3 text-right">Predicted</th>
                                        <th className="p-3 text-right">Error</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="p-8 text-center text-slate-500 text-sm">
                                                No predictions logged yet. Perform a flight search first.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                <td className="p-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm text-slate-800">{log.route}</span>
                                                        <span className="text-[10px] text-slate-500 font-medium">
                                                            {log.airline} • {log.days_left}d Left
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
                                                        {new Date(log.logged_at).toLocaleString([], {
                                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        }).replace(',', '')}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-medium text-slate-600 text-sm">
                                                    ₹{Math.round(log.actual_price).toLocaleString('en-IN')}
                                                </td>
                                                <td className="p-3 text-right font-bold text-primary text-sm">
                                                    ₹{Math.round(log.predicted_price).toLocaleString('en-IN')}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-sm font-bold ${log.error_percentage > 15 ? 'text-red-500' : log.error_percentage > 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                            {log.error_percentage.toFixed(1)}%
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            ±₹{Math.round(log.error_amount)}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
