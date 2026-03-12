/**
 * API Service Layer
 * Centralized API calls to the backend server
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function getToken() {
    return localStorage.getItem('flight_token');
}

function getAuthHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest(url, options = {}) {
    const response = await fetch(`${API_BASE}${url}`, {
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...options.headers,
        },
        ...options,
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || `API Error: ${response.status}`);
    }

    return data;
}

// ──────────── Auth ────────────

export async function login(email, password) {
    const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('flight_token', data.token);
    localStorage.setItem('flight_user', JSON.stringify(data.user));
    return data;
}

export async function register(name, email, password) {
    const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });
    localStorage.setItem('flight_token', data.token);
    localStorage.setItem('flight_user', JSON.stringify(data.user));
    return data;
}

export function logout() {
    localStorage.removeItem('flight_token');
    localStorage.removeItem('flight_user');
}

export function getCurrentUser() {
    const user = localStorage.getItem('flight_user');
    return user ? JSON.parse(user) : null;
}

export function isAuthenticated() {
    return !!getToken();
}

export async function getProfile() {
    return apiRequest('/auth/me');
}

// ──────────── Flights ────────────

export async function searchFlights(from, to, date, passengers = 1, cabin = 'ECONOMY') {
    const params = new URLSearchParams({ from, to, date, passengers, cabin });
    return apiRequest(`/flights/search?${params}`);
}

export async function getAirports(query = '') {
    const params = query ? `?q=${encodeURIComponent(query)}` : '';
    return apiRequest(`/flights/airports${params}`);
}

// ──────────── Price Trends ────────────

export async function getPriceTrends(route) {
    return apiRequest(`/trends/${route}`);
}

export async function getPopularRoutes() {
    return apiRequest('/trends');
}

// ──────────── Alerts ────────────

export async function getAlerts() {
    return apiRequest('/alerts');
}

export async function createAlert(alertData) {
    return apiRequest('/alerts', {
        method: 'POST',
        body: JSON.stringify(alertData),
    });
}

export async function updateAlert(id, updates) {
    return apiRequest(`/alerts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

export async function deleteAlert(id) {
    return apiRequest(`/alerts/${id}`, {
        method: 'DELETE',
    });
}

// ──────────── Dashboard ────────────

export async function getDashboardStats() {
    return apiRequest('/dashboard/stats');
}

// ──────────── Fare Calendar ────────────

export async function getFareCalendar(route, month) {
    const params = month ? `?month=${month}` : '';
    return apiRequest(`/fare-calendar/${route}${params}`);
}

// ──────────── Budget Finder ────────────

export async function findBudgetFlights(budget, from = '') {
    const params = new URLSearchParams({ budget });
    if (from) params.set('from', from);
    return apiRequest(`/budget-finder?${params}`);
}

// ──────────── AI Advisor ────────────

export async function getAdvisorInsights() {
    return apiRequest('/advisor/analyze');
}

export async function getHealthCheck() {
    return apiRequest('/health');
}

// ──────────── ML Predictions ────────────

export async function getPredictionLogs() {
    return apiRequest('/predictions/logs');
}

export async function clearPredictionLogs() {
    return apiRequest('/predictions/logs', {
        method: 'DELETE'
    });
}

