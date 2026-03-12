import { Router } from 'express';
import { getPricePrediction, getPopularRoutes } from '../services/prediction.js';

const router = Router();

// GET /api/trends/:route — e.g. /api/trends/DEL-BOM
router.get('/:route', (req, res) => {
    try {
        const { route } = req.params;

        if (!route || !route.includes('-')) {
            return res.status(400).json({ error: 'Route must be in format FROM-TO, e.g. DEL-BOM' });
        }

        const prediction = getPricePrediction(route.toUpperCase(), 30);

        if (prediction.currentPrice === 0) {
            return res.status(404).json({ error: `No price data found for route ${route}` });
        }

        res.json(prediction);
    } catch (error) {
        console.error('Trends error:', error);
        res.status(500).json({ error: 'Failed to get price trends.' });
    }
});

// GET /api/trends — popular route trends
router.get('/', (req, res) => {
    try {
        const routes = getPopularRoutes();
        res.json({ routes });
    } catch (error) {
        console.error('Popular routes error:', error);
        res.status(500).json({ error: 'Failed to get popular routes.' });
    }
});

export default router;
