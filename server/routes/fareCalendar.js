import { Router } from 'express';
import db from '../db.js';
import { BASE_PRICES } from '../services/amadeus.js';

const router = Router();

// Indian holiday/festival calendar for seasonal demand
const SEASONAL_EVENTS = [
    { name: 'Republic Day', start: '01-20', end: '01-28', multiplier: 1.15 },
    { name: 'Holi', start: '03-10', end: '03-20', multiplier: 1.12 },
    { name: 'Summer Vacation', start: '05-01', end: '06-15', multiplier: 1.25 },
    { name: 'Independence Day', start: '08-10', end: '08-18', multiplier: 1.15 },
    { name: 'Ganesh Chaturthi', start: '09-05', end: '09-15', multiplier: 1.10 },
    { name: 'Navratri/Dussehra', start: '10-01', end: '10-15', multiplier: 1.18 },
    { name: 'Diwali', start: '10-25', end: '11-10', multiplier: 1.30 },
    { name: 'Christmas/New Year', start: '12-20', end: '01-05', multiplier: 1.35 },
];

function getSeasonalInfo(dateStr) {
    const date = new Date(dateStr);
    const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    for (const event of SEASONAL_EVENTS) {
        if (mmdd >= event.start && mmdd <= event.end) {
            return { multiplier: event.multiplier, event: event.name };
        }
    }
    return { multiplier: 1.0, event: null };
}

// GET /api/fare-calendar/:route?month=2026-04
router.get('/:route', (req, res) => {
    try {
        const { route } = req.params;
        const { month } = req.query;

        if (!route || !route.includes('-')) {
            return res.status(400).json({ error: 'Route must be in format FROM-TO, e.g. DEL-BOM' });
        }

        const [from, to] = route.toUpperCase().split('-');
        const routeKey = `${from}-${to}`;
        const reverseKey = `${to}-${from}`;

        // Get base price from routes or database
        const basePrice = BASE_PRICES[routeKey] || BASE_PRICES[reverseKey] || 4500;

        // Get historical avg from DB
        const dbAvg = db.prepare(
            'SELECT AVG(price) as avg_price FROM price_history WHERE route = ?'
        ).get(routeKey);
        const avgPrice = dbAvg?.avg_price || basePrice;

        // Parse the target month
        const targetMonth = month || new Date().toISOString().slice(0, 7);
        const [year, mon] = targetMonth.split('-').map(Number);
        const daysInMonth = new Date(year, mon, 0).getDate();

        const calendar = [];
        let cheapestDay = null;
        let cheapestPrice = Infinity;
        let mostExpensiveDay = null;
        let mostExpensivePrice = 0;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, mon - 1, day);
            const dateStr = date.toISOString().split('T')[0];
            const dayOfWeek = date.getDay();
            const isPast = date < new Date(new Date().toDateString());

            // Weekend surcharge
            const weekendMod = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.12 : 1.0;
            // Friday evening departures
            const fridayMod = dayOfWeek === 5 ? 1.06 : 1.0;

            // Advance booking discount
            const daysUntil = Math.max(0, (date - new Date()) / (1000 * 60 * 60 * 24));
            const advanceMod = daysUntil > 30 ? 0.85 : daysUntil > 14 ? 0.92 : daysUntil > 7 ? 1.0 : 1.15;

            // Seasonal factor
            const { multiplier: seasonalMod, event } = getSeasonalInfo(dateStr);

            // Day-specific variation (deterministic based on date for consistency)
            const seed = (year * 10000 + mon * 100 + day) % 100;
            const variation = 0.92 + (seed / 100) * 0.16; // 0.92 to 1.08

            const price = Math.round(avgPrice * weekendMod * fridayMod * advanceMod * seasonalMod * variation);

            // Demand level: low / medium / high / peak
            const combinedMultiplier = weekendMod * fridayMod * seasonalMod;
            let demand;
            if (combinedMultiplier >= 1.25) demand = 'peak';
            else if (combinedMultiplier >= 1.1) demand = 'high';
            else if (combinedMultiplier >= 1.0) demand = 'medium';
            else demand = 'low';

            const dayEntry = {
                date: dateStr,
                day,
                dayOfWeek,
                dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
                price,
                priceFormatted: `₹${price.toLocaleString('en-IN')}`,
                demand,
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
                isPast,
                seasonalEvent: event,
            };

            calendar.push(dayEntry);

            if (!isPast && price < cheapestPrice) {
                cheapestPrice = price;
                cheapestDay = dayEntry;
            }
            if (!isPast && price > mostExpensivePrice) {
                mostExpensivePrice = price;
                mostExpensiveDay = dayEntry;
            }
        }

        // Savings potential
        const savingsPercent = cheapestPrice && mostExpensivePrice
            ? Math.round(((mostExpensivePrice - cheapestPrice) / mostExpensivePrice) * 100)
            : 0;

        res.json({
            route: routeKey,
            from,
            to,
            month: targetMonth,
            monthName: new Date(year, mon - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
            calendar,
            insights: {
                cheapestDay,
                mostExpensiveDay,
                averagePrice: Math.round(calendar.filter(d => !d.isPast).reduce((s, d) => s + d.price, 0) / calendar.filter(d => !d.isPast).length || 1),
                savingsPercent,
                recommendation: cheapestDay
                    ? `Book on ${new Date(cheapestDay.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })} to save up to ${savingsPercent}%`
                    : 'No future dates available',
            },
        });
    } catch (error) {
        console.error('Fare calendar error:', error);
        res.status(500).json({ error: 'Failed to generate fare calendar.' });
    }
});

export default router;
