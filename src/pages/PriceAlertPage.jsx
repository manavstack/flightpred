import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAlerts, createAlert, updateAlert, deleteAlert } from '../services/api'

function AlertCard({ alert, onUpdate, onDelete }) {
    const [threshold, setThreshold] = useState(alert.threshold_price)
    const [notifs, setNotifs] = useState(!!alert.notifications_on)
    const [saving, setSaving] = useState(false)

    const handleToggleNotif = async () => {
        const newVal = !notifs
        setNotifs(newVal)
        setSaving(true)
        try {
            await onUpdate(alert.id, { notifications_on: newVal })
        } catch {
            setNotifs(!newVal) // revert
        }
        setSaving(false)
    }

    const handleUpdateThreshold = async () => {
        if (threshold === alert.threshold_price) return
        setSaving(true)
        try {
            await onUpdate(alert.id, { threshold_price: threshold })
        } catch {
            setThreshold(alert.threshold_price) // revert
        }
        setSaving(false)
    }

    return (
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-primary">{alert.from_code}</span>
                        <span className="text-[10px] text-slate-400 uppercase">{alert.from_city}</span>
                    </div>
                    <span className="material-symbols-outlined text-slate-300">trending_flat</span>
                    <div className="flex flex-col items-end">
                        <span className="text-2xl font-black text-primary">{alert.to_code}</span>
                        <span className="text-[10px] text-slate-400 text-right uppercase">{alert.to_city}</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 ${alert.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-[10px] font-bold rounded uppercase`}>
                        {alert.status}
                    </span>
                    <button
                        onClick={() => onDelete(alert.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </div>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Price Threshold</label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3 text-slate-400">₹</span>
                            <input
                                className="w-full bg-slate-50 border-none rounded-lg py-2 pl-7 pr-3 text-sm font-bold focus:ring-2 focus:ring-primary/20"
                                type="number"
                                value={threshold}
                                onChange={e => setThreshold(parseInt(e.target.value) || 0)}
                                onBlur={handleUpdateThreshold}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Notifications</label>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                className="sr-only peer"
                                type="checkbox"
                                checked={notifs}
                                onChange={handleToggleNotif}
                            />
                            <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                        </label>
                    </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                        <span>{new Date(alert.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    {saving && <span className="text-primary text-[10px] font-bold animate-pulse">Saving...</span>}
                </div>
            </div>
        </div>
    )
}

export default function PriceAlertPage() {
    const [alerts, setAlerts] = useState({ active: [], expired: [] })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showForm, setShowForm] = useState(false)
    const [newAlert, setNewAlert] = useState({ from_code: '', from_city: '', to_code: '', to_city: '', threshold_price: 4000 })
    const [creating, setCreating] = useState(false)

    useEffect(() => { loadAlerts() }, [])

    async function loadAlerts() {
        try {
            setLoading(true)
            const data = await getAlerts()
            setAlerts({ active: data.active || [], expired: data.expired || [] })
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdate(id, updates) {
        await updateAlert(id, updates)
        loadAlerts()
    }

    async function handleDelete(id) {
        await deleteAlert(id)
        loadAlerts()
    }

    async function handleCreate(e) {
        e.preventDefault()
        if (!newAlert.from_code || !newAlert.to_code || !newAlert.threshold_price) return

        setCreating(true)
        try {
            await createAlert(newAlert)
            setShowForm(false)
            setNewAlert({ from_code: '', from_city: '', to_code: '', to_city: '', threshold_price: 4000 })
            loadAlerts()
        } catch (err) {
            setError(err.message)
        } finally {
            setCreating(false)
        }
    }

    return (
        <>
            <header className="sticky top-0 z-30 bg-background-light/80 backdrop-blur-md border-b border-slate-200">
                <div className="flex items-center justify-between px-4 h-16">
                    <Link to="/dashboard" className="p-2 -ml-2 text-slate-600 inline-flex items-center justify-center">
                        <span className="material-symbols-outlined">arrow_back_ios</span>
                    </Link>
                    <h1 className="text-lg font-bold tracking-tight">Price Alerts</h1>
                    <button className="p-2 -mr-2 text-slate-600">
                        <span className="material-symbols-outlined">account_circle</span>
                    </button>
                </div>
            </header>

            <main className="p-4 space-y-6 max-w-md mx-auto flex-1">
                {/* System Status */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">System Status</span>
                        <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                            </span>
                            <span className="text-xs font-medium text-green-600">LIVE</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <span className="material-symbols-outlined text-primary">psychology</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold leading-tight">Monitoring Active</h2>
                            <p className="text-sm text-slate-500">AI scanning prices for your routes 24/7</p>
                        </div>
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                        <button onClick={loadAlerts} className="mt-2 text-xs font-bold text-primary">Retry</button>
                    </div>
                )}

                {/* New Alert Form */}
                {showForm && (
                    <div className="bg-white rounded-xl p-5 border-2 border-primary/20 shadow-md animate-[fadeIn_0.3s]">
                        <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-lg">add_alert</span>
                            Create New Alert
                        </h3>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">From Code</label>
                                    <input
                                        className="w-full bg-slate-50 rounded-lg py-2 px-3 text-sm font-bold border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="DEL"
                                        maxLength={3}
                                        value={newAlert.from_code}
                                        onChange={e => setNewAlert(p => ({ ...p, from_code: e.target.value.toUpperCase() }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">To Code</label>
                                    <input
                                        className="w-full bg-slate-50 rounded-lg py-2 px-3 text-sm font-bold border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="BOM"
                                        maxLength={3}
                                        value={newAlert.to_code}
                                        onChange={e => setNewAlert(p => ({ ...p, to_code: e.target.value.toUpperCase() }))}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">From City</label>
                                    <input
                                        className="w-full bg-slate-50 rounded-lg py-2 px-3 text-sm border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Delhi"
                                        value={newAlert.from_city}
                                        onChange={e => setNewAlert(p => ({ ...p, from_city: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">To City</label>
                                    <input
                                        className="w-full bg-slate-50 rounded-lg py-2 px-3 text-sm border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Mumbai"
                                        value={newAlert.to_city}
                                        onChange={e => setNewAlert(p => ({ ...p, to_city: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Price Threshold (₹)</label>
                                <input
                                    className="w-full bg-slate-50 rounded-lg py-2 px-3 text-sm font-bold border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    type="number"
                                    value={newAlert.threshold_price}
                                    onChange={e => setNewAlert(p => ({ ...p, threshold_price: parseInt(e.target.value) || 0 }))}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-bold shadow-md disabled:opacity-60"
                                >
                                    {creating ? 'Creating...' : 'Create Alert'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Active Alerts */}
                {!loading && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                Active Alerts ({alerts.active.length})
                            </h3>
                            <span className="text-xs font-medium text-primary">View all</span>
                        </div>
                        {alerts.active.map(alert => (
                            <AlertCard key={alert.id} alert={alert} onUpdate={handleUpdate} onDelete={handleDelete} />
                        ))}
                        {alerts.active.length === 0 && !showForm && (
                            <div className="text-center py-8 bg-white/60 rounded-xl border border-dashed border-slate-300">
                                <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">notifications_off</span>
                                <p className="text-sm text-slate-400">No active alerts yet</p>
                                <p className="text-xs text-slate-400 mt-1">Tap + to create one</p>
                            </div>
                        )}
                    </section>
                )}

                {/* Expired Alerts */}
                {!loading && alerts.expired.length > 0 && (
                    <section className="space-y-4 opacity-70">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                                Expired Alerts ({alerts.expired.length})
                            </h3>
                        </div>
                        {alerts.expired.map(alert => (
                            <div key={alert.id} className="bg-white/60 rounded-xl p-5 border border-slate-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-bold">{alert.from_code}</span>
                                        <span className="material-symbols-outlined text-slate-400 text-sm">trending_flat</span>
                                        <span className="text-lg font-bold">{alert.to_code}</span>
                                    </div>
                                    <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded uppercase">Expired</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-400">
                                    <span>Threshold: ₹{alert.threshold_price.toLocaleString('en-IN')}</span>
                                    <button onClick={() => handleDelete(alert.id)} className="text-red-400 hover:text-red-600 text-[10px] font-bold">Remove</button>
                                </div>
                            </div>
                        ))}
                    </section>
                )}
            </main>

            {/* FAB */}
            <button
                onClick={() => setShowForm(!showForm)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-40 active:scale-95 transition-transform"
            >
                <span className="material-symbols-outlined text-3xl">{showForm ? 'close' : 'add'}</span>
            </button>
        </>
    )
}
