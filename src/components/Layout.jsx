import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import BottomNav from './BottomNav'
import { getHealthCheck } from '../services/api'

export default function Layout() {
    const [mlStatus, setMlStatus] = useState('checking'); // 'checking', 'connected', 'error'

    useEffect(() => {
        // Ping our Node API health check. We assume if Node is up, 
        // it serves as the proxy to our ML functionality.
        getHealthCheck()
            .then(() => setMlStatus('connected'))
            .catch(() => setMlStatus('error'));
    }, []);

    return (
        <div className="relative flex min-h-screen w-full flex-col pb-24 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            {/* Top Fixed Application Header */}
            <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
                <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo Area */}
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                            <span className="material-symbols-outlined text-[20px]">flight_takeoff</span>
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 hidden sm:block">
                            FlyAI
                        </span>
                    </div>

                    {/* AI Status Indicator */}
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${
                            mlStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                            mlStatus === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' : 
                            'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20'
                        }`}>
                            <span className={`w-2 h-2 rounded-full mr-2 ${
                                mlStatus === 'connected' ? 'bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 
                                mlStatus === 'error' ? 'bg-red-500' : 
                                'bg-yellow-500 animate-pulse'
                            }`}></span>
                            {mlStatus === 'connected' ? 'AI Connected' : mlStatus === 'error' ? 'AI Offline' : 'Checking AI...'}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto">
                <Outlet />
            </main>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    )
}
