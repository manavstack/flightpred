import { Router } from 'express';
import db from '../db.js';
import { BASE_PRICES } from '../services/amadeus.js';

const router = Router();

const CITY_NAMES = {
    DEL: 'Delhi', BOM: 'Mumbai', BLR: 'Bangalore', MAA: 'Chennai',
    CCU: 'Kolkata', HYD: 'Hyderabad', GOI: 'Goa', COK: 'Kochi',
    AMD: 'Ahmedabad', PNQ: 'Pune', JAI: 'Jaipur', LKO: 'Lucknow',
    SXR: 'Srinagar', IXC: 'Chandigarh', GAU: 'Guwahati', BBI: 'Bhubaneswar',
    IXR: 'Ranchi', PAT: 'Patna', NAG: 'Nagpur', VTZ: 'Visakhapatnam',
    IDR: 'Indore', RPR: 'Raipur', TRV: 'Thiruvananthapuram',
    IXB: 'Bagdogra', UDR: 'Udaipur',
};

const ROUTE_HIGHLIGHTS = {
    'BOM-GOI': { tag: '🏖️ Beach Escape', highlight: 'Perfect getaway just 1h away' },
    'DEL-GOI': { tag: '🌴 Tropical Paradise', highlight: 'Most popular holiday route' },
    'BLR-GOI': { tag: '🏖️ Weekend Beach', highlight: 'Quick weekend escape from tech city' },
    'DEL-SXR': { tag: '🏔️ Mountain Retreat', highlight: 'Escape to the valleys of Kashmir' },
    'DEL-BOM': { tag: '💼 Business Corridor', highlight: "India's busiest air route" },
    'DEL-BLR': { tag: '💻 Tech Connect', highlight: 'Silicon Valley of India route' },
    'BLR-HYD': { tag: '🏢 South Tech Hub', highlight: 'Connect the two IT capitals' },
    'MAA-CCU': { tag: '🌊 East-South Link', highlight: 'Cultural corridor of India' },
};

// GET /api/budget-finder?budget=5000&from=DEL
router.get('/', (req, res) => {
    try {
        const { budget, from } = req.query;
        const maxBudget = parseInt(budget) || 5000;
        const originCode = (from || '').toUpperCase();

        // Get all routes and their current best prices
        const allRoutes = db.prepare(`
            SELECT 
                route, from_code, to_code,
                MIN(price) as best_price,
                AVG(price) as avg_price,
                MAX(price) as max_price,
                COUNT(*) as data_points
            FROM price_history 
            GROUP BY route 
            ORDER BY MIN(price) ASC
        `).all();

        const results = [];

        for (const r of allRoutes) {
            // If origin specified, filter
            if (originCode && r.from_code !== originCode) continue;

            const basePrice = BASE_PRICES[r.route] || BASE_PRICES[`${r.to_code}-${r.from_code}`] || 4500;

            // Find cheapest upcoming days
            const today = new Date();
            const cheapDays = [];

            for (let i = 1; i <= 60; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() + i);
                const dayOfWeek = date.getDay();

                // Pricing model
                const weekendMod = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.12 : 1.0;
                const advanceMod = i > 30 ? 0.82 : i > 14 ? 0.90 : 1.0;
                const seed = (date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()) % 100;
                const variation = 0.88 + (seed / 100) * 0.15;

                const price = Math.round(Math.min(r.avg_price, basePrice) * weekendMod * advanceMod * variation);

                if (price <= maxBudget) {
                    cheapDays.push({
                        date: date.toISOString().split('T')[0],
                        price,
                        priceFormatted: `₹${price.toLocaleString('en-IN')}`,
                        dayName: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
                        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
                        savingsPercent: Math.round(((basePrice - price) / basePrice) * 100),
                    });
                }
            }

            if (cheapDays.length === 0) continue;

            // Sort by price and take top 5
            cheapDays.sort((a, b) => a.price - b.price);
            const bestDays = cheapDays.slice(0, 5);

            const highlight = ROUTE_HIGHLIGHTS[r.route] || { tag: '✈️ Flight Deal', highlight: `Great deal on ${r.from_code} to ${r.to_code}` };

            results.push({
                route: r.route,
                from: r.from_code,
                fromCity: CITY_NAMES[r.from_code] || r.from_code,
                to: r.to_code,
                toCity: CITY_NAMES[r.to_code] || r.to_code,
                bestPrice: bestDays[0].price,
                bestPriceFormatted: bestDays[0].priceFormatted,
                bestDate: bestDays[0].date,
                bestDateFormatted: bestDays[0].dayName,
                avgPrice: Math.round(r.avg_price),
                maxSavingsPercent: bestDays[0].savingsPercent,
                availableDates: cheapDays.length,
                bestDays,
                tag: highlight.tag,
                highlight: highlight.highlight,
            });
        }

        // Sort by best price
        results.sort((a, b) => a.bestPrice - b.bestPrice);

        // Budget analysis
        const totalOptions = results.length;
        const avgBestPrice = results.length > 0
            ? Math.round(results.reduce((s, r) => s + r.bestPrice, 0) / results.length)
            : 0;

        res.json({
            budget: maxBudget,
            budgetFormatted: `₹${maxBudget.toLocaleString('en-IN')}`,
            origin: originCode || 'any',
            originCity: originCode ? (CITY_NAMES[originCode] || originCode) : 'Any City',
            results,
            summary: {
                totalRoutes: totalOptions,
                avgBestPrice,
                avgBestPriceFormatted: `₹${avgBestPrice.toLocaleString('en-IN')}`,
                bestDeal: results[0] || null,
                message: totalOptions > 0
                    ? `Found ${totalOptions} routes under ₹${maxBudget.toLocaleString('en-IN')}! Best: ${results[0]?.fromCity} → ${results[0]?.toCity} at ${results[0]?.bestPriceFormatted}`
                    : `No routes found under ₹${maxBudget.toLocaleString('en-IN')}. Try increasing your budget.`,
            },
        });
    } catch (error) {
        console.error('Budget finder error:', error);
        res.status(500).json({ error: 'Failed to find budget flights.' });
    }
});

export default router;
