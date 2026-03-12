import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
    const { login, register, loading, error } = useAuth()
    const navigate = useNavigate()
    const [isRegister, setIsRegister] = useState(false)
    const [formData, setFormData] = useState({ name: '', email: '', password: '' })
    const [localError, setLocalError] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setLocalError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLocalError('')

        try {
            if (isRegister) {
                if (!formData.name || !formData.email || !formData.password) {
                    setLocalError('All fields are required.')
                    return
                }
                if (formData.password.length < 6) {
                    setLocalError('Password must be at least 6 characters.')
                    return
                }
                await register(formData.name, formData.email, formData.password)
            } else {
                if (!formData.email || !formData.password) {
                    setLocalError('Email and password are required.')
                    return
                }
                await login(formData.email, formData.password)
            }
            navigate('/dashboard')
        } catch (err) {
            setLocalError(err.message)
        }
    }

    const displayError = localError || error

    return (
        <div className="bg-background-light min-h-screen flex flex-col justify-between overflow-x-hidden text-slate-900 font-display">
            {/* Hero Section */}
            <div className="relative w-full h-[40vh] min-h-[300px] shrink-0 overflow-hidden bg-slate-900">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-80 mix-blend-screen"
                    style={{
                        backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCR8u3hYHwvFq-jC458AgW46uDAcSqiXuNdU9E7rZ12318XFXnduRI9FHRJa1E2e8klHp8iRDKrj0QIpzo46dmxRzsfxTJZa2XozMNtl6plMVEIU9fxK8lBMPCjbDilKL-Ba5LO1pTEN4KxMTkn1uOcXg4R2AGvM6MRlmqVetvetLD4bM0gaj6Yh2cWLWbMLSDLG-fBHzusLdcwM7yuio46damors0NqxV40xEhwYvOF-TSCRxItsFy-HoNcVSR2G4medc4gU7FWUOo')`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-background-light" />
                <div className="absolute top-8 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                    <span className="text-[10px] font-medium text-white tracking-wider uppercase">System Online</span>
                </div>
            </div>

            {/* Login Card */}
            <div className="flex-1 -mt-12 px-4 pb-8 z-10 w-full max-w-md mx-auto relative">
                <div className="bg-white rounded-2xl shadow-soft p-6 sm:p-8 w-full border border-slate-100 backdrop-blur-sm">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4 text-primary">
                            <span className="material-symbols-outlined text-3xl">flight_takeoff</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-2">
                            AI-Powered Flight Intelligence
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            {isRegister ? 'Create your account to start saving.' : 'Welcome back to the future of travel.'}
                        </p>
                    </div>

                    {/* Tab Toggle */}
                    <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setIsRegister(false)}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${!isRegister ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setIsRegister(true)}
                            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${isRegister ? 'bg-white text-primary shadow-sm' : 'text-slate-500'}`}
                        >
                            Register
                        </button>
                    </div>

                    {/* Error Message */}
                    {displayError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 animate-[fadeIn_0.3s]">
                            <span className="material-symbols-outlined text-red-500 text-lg">error</span>
                            <p className="text-sm text-red-600 font-medium">{displayError}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                        {/* Name (Register only) */}
                        {isRegister && (
                            <label className="flex flex-col gap-1.5 group animate-[fadeIn_0.3s]">
                                <span className="text-sm font-semibold text-slate-700 ml-1">Full Name</span>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-[20px]">person</span>
                                    </div>
                                    <input
                                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 font-normal text-base"
                                        placeholder="Arjun Kapoor"
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>
                            </label>
                        )}

                        {/* Email */}
                        <label className="flex flex-col gap-1.5 group">
                            <span className="text-sm font-semibold text-slate-700 ml-1">Email</span>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">mail</span>
                                </div>
                                <input
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 font-normal text-base"
                                    placeholder="name@example.com"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </label>

                        {/* Password */}
                        <label className="flex flex-col gap-1.5 group">
                            <span className="text-sm font-semibold text-slate-700 ml-1">Password</span>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">lock</span>
                                </div>
                                <input
                                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 font-normal text-base"
                                    placeholder="Enter your password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </label>

                        {/* Remember Me & Forgot (login only) */}
                        {!isRegister && (
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input
                                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 bg-slate-50 checked:border-primary checked:bg-primary transition-all"
                                            type="checkbox"
                                        />
                                        <span className="material-symbols-outlined absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[16px] text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity">
                                            check
                                        </span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                                        Remember me
                                    </span>
                                </label>
                                <a className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors" href="#">
                                    Forgot Password?
                                </a>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full bg-gradient-to-r from-accent-blue to-accent-indigo hover:opacity-90 active:scale-[0.98] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>{isRegister ? 'Creating Account...' : 'Signing In...'}</span>
                                </>
                            ) : (
                                <>
                                    <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-[20px]">
                                        arrow_forward
                                    </span>
                                </>
                            )}
                        </button>

                        {/* Demo Credentials Hint */}
                        <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-xs text-blue-700 font-medium text-center">
                                <span className="font-bold">Demo Login:</span> arjun@flyai.com / demo123
                            </p>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 text-center border-t border-slate-100 pt-6">
                        <p className="text-slate-500 text-sm">
                            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                className="font-bold text-primary hover:text-primary-dark transition-colors ml-1"
                                onClick={() => { setIsRegister(!isRegister); setLocalError('') }}
                            >
                                {isRegister ? 'Sign In' : 'Register now'}
                            </button>
                        </p>
                        <div
                            className="mt-6 flex items-center justify-center gap-2 opacity-60 hover:opacity-100 transition-opacity cursor-help"
                            title="Secured by JSON Web Token"
                        >
                            <span className="material-symbols-outlined text-slate-400 text-[18px]">verified_user</span>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">JWT Secure</span>
                        </div>
                    </div>
                </div>
                <div className="h-8" />
            </div>
        </div>
    )
}
