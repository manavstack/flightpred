import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import flightRoutes from './routes/flights.js';
import alertRoutes from './routes/alerts.js';
import trendRoutes from './routes/trends.js';
import dashboardRoutes from './routes/dashboard.js';
import fareCalendarRoutes from './routes/fareCalendar.js';
import budgetFinderRoutes from './routes/budgetFinder.js';
import advisorRoutes from './routes/advisor.js';
import predictionRoutes from './routes/predictions.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'flight_price_analyser_super_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const color = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
        console.log(`${color}${req.method}\x1b[0m ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Optional auth middleware (attaches userId if token present, doesn't block)
function optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
    } catch (err) {
        // Token invalid, continue without auth
    }
    next();
}

// Public routes
app.use('/api/auth', authRoutes);

// Partially protected routes (work without auth but enhanced with auth)
app.use('/api/flights', optionalAuth, flightRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/fare-calendar', fareCalendarRoutes);
app.use('/api/budget-finder', budgetFinderRoutes);

// Protected routes
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/advisor', authMiddleware, advisorRoutes);
app.use('/api/predictions', predictionRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        server: 'Flight Price Analyser API',
        version: '1.0.0',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

// Seed the database on startup
async function startServer() {
    try {
        const { seedDatabase } = await import('./services/seed.js');
        await seedDatabase();
    } catch (error) {
        console.error('Seed error:', error);
    }

    app.listen(PORT, () => {
        console.log('');
        console.log('  ✈️  Flight Price Analyser API');
        console.log('  ═══════════════════════════════════');
        console.log(`  🚀 Server running on http://localhost:${PORT}`);
        console.log(`  📡 API Base: http://localhost:${PORT}/api`);
        console.log('  ─────────────────────────────────────');
        console.log('  Endpoints:');
        console.log('  POST   /api/auth/register');
        console.log('  POST   /api/auth/login');
        console.log('  GET    /api/auth/me');
        console.log('  GET    /api/flights/search?from=DEL&to=BOM&date=2026-03-20');
        console.log('  GET    /api/flights/airports?q=del');
        console.log('  GET    /api/trends');
        console.log('  GET    /api/trends/DEL-BOM');
        console.log('  GET    /api/alerts');
        console.log('  POST   /api/alerts');
        console.log('  PUT    /api/alerts/:id');
        console.log('  DELETE /api/alerts/:id');
        console.log('  GET    /api/dashboard/stats');
    console.log('  GET    /api/fare-calendar/DEL-BOM?month=2026-04');
    console.log('  GET    /api/budget-finder?budget=5000&from=DEL');
    console.log('  GET    /api/advisor/analyze');
    console.log('  GET    /api/predictions/logs');
    console.log('  GET    /api/health');
        console.log('  ═══════════════════════════════════');
        console.log('  Demo login: arjun@flyai.com / demo123');
        console.log('');
    });
}

startServer();
