import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/predictions/logs
router.get('/logs', (req, res) => {
    try {
        const logs = db.prepare(`
            SELECT * FROM prediction_logs 
            ORDER BY logged_at DESC 
            LIMIT 100
        `).all();

        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total_predictions,
                AVG(error_amount) as mean_absolute_error,
                AVG(error_percentage) as mean_error_percentage,
                AVG(confidence_score) as avg_confidence
            FROM prediction_logs
        `).get();

        // Calculate RMSE
        // SQLite doesn't have a built-in SQRT function or STDEV natively available 
        // without extensions in older versions, so we calculate it in Node.
        const sumSquaredErrors = db.prepare(`
            SELECT SUM(error_amount * error_amount) as sse FROM prediction_logs
        `).get();
        
        const count = stats.total_predictions || 0;
        let rmse = 0;
        if (count > 0 && sumSquaredErrors.sse) {
            rmse = Math.sqrt(sumSquaredErrors.sse / count);
        }

        res.json({
            stats: {
                total_predictions: count,
                mae: stats.mean_absolute_error || 0,
                rmse: rmse,
                mape: stats.mean_error_percentage || 0, // Mean Absolute Percentage Error
                avg_confidence: stats.avg_confidence || 0,
                accuracy_percentage: 100 - (stats.mean_error_percentage || 0)
            },
            logs: logs
        });
    } catch (error) {
        console.error('Failed to fetch prediction logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// DELETE /api/predictions/logs
router.delete('/logs', (req, res) => {
    try {
        db.prepare('DELETE FROM prediction_logs').run();
        res.json({ message: 'Prediction logs cleared successfully' });
    } catch (error) {
        console.error('Failed to clear prediction logs:', error);
        res.status(500).json({ error: 'Failed to clear logs' });
    }
});

export default router;
