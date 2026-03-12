import { Router } from 'express';
import db from '../db.js';
import { getPopularRoutes } from '../services/prediction.js';

const router = Router();

// GET /api/dashboard/stats — aggregated dashboard data
router.get('/stats', (req, res) => {
    try {
        const userId = req.userId;

        // Active alerts count
        const alertsResult = db.prepare(
            'SELECT COUNT(*) as count FROM alerts WHERE user_id = ? AND status = ?'
        ).get(userId, 'active');

        // Saved routes count
        const routesResult = db.prepare(
            'SELECT COUNT(*) as count FROM saved_routes WHERE user_id = ?'
        ).get(userId);

        // Search history count
        const searchResult = db.prepare(
            'SELECT COUNT(*) as count FROM search_history WHERE user_id = ?'
        ).get(userId);

        // Recent searches
        const recentSearches = db.prepare(`
      SELECT from_code, to_code, departure_date, cabin_class, searched_at 
      FROM search_history 
      WHERE user_id = ? 
      ORDER BY searched_at DESC 
      LIMIT 5
    `).all(userId);

        // User info
        const user = db.prepare(
            'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ?'
        ).get(userId);

        // Popular routes with trends
        const popularRoutes = getPopularRoutes().slice(0, 6);

        // Saved routes
        const savedRoutes = db.prepare(
            'SELECT * FROM saved_routes WHERE user_id = ?'
        ).all(userId);

        // Predictions count (based on price history data points)
        const predictionsCount = db.prepare(
            'SELECT COUNT(DISTINCT route) as count FROM price_history'
        ).get();

        // Calculate total savings (simulated based on alerts that would have caught price drops)
        const savings = calculateSavings(userId);

        res.json({
            user,
            stats: {
                activeAlerts: alertsResult.count,
                savedRoutes: routesResult.count,
                totalSearches: searchResult.count,
                predictions: predictionsCount.count * 12, // Multiple predictions per route
                totalSavings: savings.total,
                totalSavingsFormatted: `₹${savings.total.toLocaleString('en-IN')}`,
            },
            recentSearches,
            popularRoutes,
            savedRoutes,
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Failed to get dashboard stats.' });
    }
});

function calculateSavings(userId) {
    // Calculate notional savings from tracking prices
    const alerts = db.prepare(
        'SELECT * FROM alerts WHERE user_id = ?'
    ).all(userId);

    let total = 0;

    for (const alert of alerts) {
        const route = `${alert.from_code}-${alert.to_code}`;
        const prices = db.prepare(`
      SELECT MIN(price) as min_price, AVG(price) as avg_price 
      FROM price_history WHERE route = ?
    `).get(route);

        if (prices && prices.avg_price) {
            // Savings = average price - best price they could have booked
            const saved = Math.max(0, Math.round(prices.avg_price - prices.min_price));
            total += saved;
        }
    }

    // Add a base savings amount for demo purposes
    total = Math.max(total, 8500);

    return { total };
}

export default router;
