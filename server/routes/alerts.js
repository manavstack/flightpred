import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/alerts — list user's alerts
router.get('/', (req, res) => {
    const alerts = db.prepare(`
    SELECT * FROM alerts WHERE user_id = ? ORDER BY 
      CASE status WHEN 'active' THEN 0 ELSE 1 END,
      created_at DESC
  `).all(req.userId);

    const active = alerts.filter(a => a.status === 'active');
    const expired = alerts.filter(a => a.status === 'expired');

    res.json({ alerts, active, expired, total: alerts.length });
});

// POST /api/alerts — create a new alert
router.post('/', (req, res) => {
    try {
        const { from_code, from_city, to_code, to_city, threshold_price } = req.body;

        if (!from_code || !to_code || !threshold_price) {
            return res.status(400).json({ error: 'from_code, to_code, and threshold_price are required.' });
        }

        const result = db.prepare(`
      INSERT INTO alerts (user_id, from_code, from_city, to_code, to_city, threshold_price) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.userId, from_code, from_city || from_code, to_code, to_city || to_code, threshold_price);

        const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({ alert });
    } catch (error) {
        console.error('Create alert error:', error);
        res.status(500).json({ error: 'Failed to create alert.' });
    }
});

// PUT /api/alerts/:id — update an alert
router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { threshold_price, notifications_on, status } = req.body;

        // Verify ownership
        const existing = db.prepare('SELECT * FROM alerts WHERE id = ? AND user_id = ?').get(id, req.userId);
        if (!existing) {
            return res.status(404).json({ error: 'Alert not found.' });
        }

        const updates = [];
        const values = [];

        if (threshold_price !== undefined) {
            updates.push('threshold_price = ?');
            values.push(threshold_price);
        }
        if (notifications_on !== undefined) {
            updates.push('notifications_on = ?');
            values.push(notifications_on ? 1 : 0);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update.' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id, req.userId);

        db.prepare(`
      UPDATE alerts SET ${updates.join(', ')} 
      WHERE id = ? AND user_id = ?
    `).run(...values);

        const updated = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
        res.json({ alert: updated });
    } catch (error) {
        console.error('Update alert error:', error);
        res.status(500).json({ error: 'Failed to update alert.' });
    }
});

// DELETE /api/alerts/:id — delete an alert
router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;

        const existing = db.prepare('SELECT * FROM alerts WHERE id = ? AND user_id = ?').get(id, req.userId);
        if (!existing) {
            return res.status(404).json({ error: 'Alert not found.' });
        }

        db.prepare('DELETE FROM alerts WHERE id = ? AND user_id = ?').run(id, req.userId);

        res.json({ message: 'Alert deleted successfully.', id: parseInt(id) });
    } catch (error) {
        console.error('Delete alert error:', error);
        res.status(500).json({ error: 'Failed to delete alert.' });
    }
});

export default router;
