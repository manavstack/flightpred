import { Router } from 'express';
import db from '../db.js';
import { BASE_PRICES } from '../services/amadeus.js';
import { getPricePrediction } from '../services/prediction.js';

const router = Router();

const CITY_NAMES = {
    DEL: 'Delhi', BOM: 'Mumbai', BLR: 'Bangalore', MAA: 'Chennai',
    CCU: 'Kolkata', HYD: 'Hyderabad', GOI: 'Goa', COK: 'Kochi',
    AMD: 'Ahmedabad', PNQ: 'Pune', JAI: 'Jaipur', LKO: 'Lucknow',
    SXR: 'Srinagar', IXC: 'Chandigarh', GAU: 'Guwahati',
};

const SEASONAL_EVENTS = [
    { name: 'Republic Day', start: '01-20', end: '01-28', impact: 'high', tip: 'Book 3-4 weeks in advance for Republic Day travel.' },
    { name: 'Holi', start: '03-10', end: '03-20', impact: 'medium', tip: 'Prices rise moderately. Book 2 weeks ahead.' },
    { name: 'Summer Vacation', start: '05-01', end: '06-15', impact: 'very_high', tip: 'Peak season! Book at least 6 weeks in advance for best fares.' },
    { name: 'Independence Day', start: '08-10', end: '08-18', impact: 'high', tip: 'Long weekend rush. Book early or travel mid-week.' },
    { name: 'Ganesh Chaturthi', start: '09-05', end: '09-15', impact: 'medium', tip: 'Mumbai routes spike. Consider alternate dates.' },
    { name: 'Navratri/Dussehra', start: '10-01', end: '10-15', impact: 'high', tip: 'Festival rush. Tuesday/Wednesday flights are cheapest.' },
    { name: 'Diwali', start: '10-25', end: '11-10', impact: 'very_high', tip: 'Highest demand period! Book 2 months ahead or travel on Diwali day itself for lower fares.' },
    { name: 'Christmas/New Year', start: '12-20', end: '01-05', impact: 'very_high', tip: 'International + domestic rush. Budget an extra 30-40%.' },
];

function getUpcomingEvents() {
    const today = new Date();
    const results = [];
    for (const event of SEASONAL_EVENTS) {
        const [sMonth, sDay] = event.start.split('-').map(Number);
        const [eMonth, eDay] = event.end.split('-').map(Number);
        let eventStart = new Date(today.getFullYear(), sMonth - 1, sDay);
        let eventEnd = new Date(today.getFullYear(), eMonth - 1, eDay);
        if (eventEnd < today) {
            eventStart = new Date(today.getFullYear() + 1, sMonth - 1, sDay);
            eventEnd = new Date(today.getFullYear() + 1, eMonth - 1, eDay);
        }
        const daysUntil = Math.ceil((eventStart - today) / (1000 * 60 * 60 * 24));
        if (daysUntil <= 90 && daysUntil >= -7) {
            results.push({ ...event, daysUntil, isActive: daysUntil <= 0 });
        }
    }
    return results.sort((a, b) => a.daysUntil - b.daysUntil);
}

// GET /api/advisor/analyze — personalized travel intelligence
router.get('/analyze', (req, res) => {
    try {
        const userId = req.userId;
        const insights = [];
        const warnings = [];
        const tips = [];
        const opportunities = [];

        // 1. Analyze user's alerts for price drops
        const alerts = db.prepare('SELECT * FROM alerts WHERE user_id = ? AND status = ?').all(userId, 'active');
        for (const alert of alerts) {
            const route = `${alert.from_code}-${alert.to_code}`;
            try {
                const prediction = getPricePrediction(route, 14);
                if (prediction.currentPrice > 0) {
                    if (prediction.currentPrice <= alert.threshold_price) {
                        opportunities.push({
                            type: 'price_below_threshold',
                            icon: 'local_offer',
                            priority: 'high',
                            title: `🎯 ${alert.from_city} → ${alert.to_city} is below your target!`,
                            description: `Current price ${prediction.currentPriceFormatted} is under your ₹${alert.threshold_price.toLocaleString('en-IN')} threshold. Book now!`,
                            action: { label: 'Search Flights', link: `/search?from=${alert.from_code}&to=${alert.to_code}` },
                            route,
                            currentPrice: prediction.currentPrice,
                        });
                    }
                    if (prediction.decision.action === 'WAIT') {
                        tips.push({
                            type: 'wait_recommendation',
                            icon: 'schedule',
                            priority: 'medium',
                            title: `⏳ Wait on ${alert.from_code} → ${alert.to_code}`,
                            description: `Prices are dropping (${prediction.trend}%). Our AI predicts better fares in 3-5 days.`,
                            route,
                        });
                    } else if (prediction.decision.action === 'BUY NOW') {
                        warnings.push({
                            type: 'buy_now_warning',
                            icon: 'trending_up',
                            priority: 'high',
                            title: `⚡ Act fast on ${alert.from_code} → ${alert.to_code}`,
                            description: `${prediction.decision.reason}`,
                            action: { label: 'Book Now', link: `/search?from=${alert.from_code}&to=${alert.to_code}` },
                            route,
                        });
                    }
                }
            } catch (e) { /* skip routes without data */ }
        }

        // 2. Analyze search history for patterns
        const searches = db.prepare(`
            SELECT from_code, to_code, COUNT(*) as count, MAX(searched_at) as last_searched
            FROM search_history WHERE user_id = ?
            GROUP BY from_code, to_code ORDER BY count DESC LIMIT 5
        `).all(userId);

        if (searches.length > 0) {
            const topRoute = searches[0];
            insights.push({
                type: 'frequent_route',
                icon: 'repeat',
                priority: 'info',
                title: `📊 Your most searched: ${topRoute.from_code} → ${topRoute.to_code}`,
                description: `You've searched this route ${topRoute.count} time${topRoute.count > 1 ? 's' : ''}. Set a price alert to never miss a deal!`,
                action: { label: 'Set Alert', link: '/alerts' },
            });
        }

        // 3. Find cheapest routes available now
        const cheapRoutes = db.prepare(`
            SELECT route, from_code, to_code, MIN(price) as min_price
            FROM price_history
            WHERE recorded_at > datetime('now', '-7 days')
            GROUP BY route
            ORDER BY min_price ASC LIMIT 3
        `).all();

        for (const r of cheapRoutes) {
            const fromCity = CITY_NAMES[r.from_code] || r.from_code;
            const toCity = CITY_NAMES[r.to_code] || r.to_code;
            opportunities.push({
                type: 'cheap_route_now',
                icon: 'savings',
                priority: 'medium',
                title: `💸 ${fromCity} → ${toCity} from ₹${r.min_price.toLocaleString('en-IN')}`,
                description: `One of the cheapest routes this week. Great for spontaneous trips!`,
                action: { label: 'View Flights', link: `/search?from=${r.from_code}&to=${r.to_code}` },
                route: r.route,
                price: r.min_price,
            });
        }

        // 4. Seasonal warnings
        const upcomingEvents = getUpcomingEvents();
        for (const event of upcomingEvents.slice(0, 2)) {
            if (event.isActive) {
                warnings.push({
                    type: 'seasonal_active',
                    icon: 'celebration',
                    priority: 'high',
                    title: `🎉 ${event.name} travel rush is ACTIVE`,
                    description: event.tip,
                });
            } else if (event.daysUntil <= 30) {
                warnings.push({
                    type: 'seasonal_upcoming',
                    icon: 'event',
                    priority: 'medium',
                    title: `📅 ${event.name} in ${event.daysUntil} days`,
                    description: event.tip,
                });
            }
        }

        // 5. General smart tips
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 2 || dayOfWeek === 3) {
            tips.push({
                type: 'booking_day_tip',
                icon: 'lightbulb',
                priority: 'info',
                title: '💡 Great day to book flights!',
                description: 'Tuesday and Wednesday typically have the lowest airfares. Airlines often release sales early in the week.',
            });
        }

        tips.push({
            type: 'general_tip',
            icon: 'tips_and_updates',
            priority: 'info',
            title: '🧠 Pro Tip: 6 AM flights save up to 15%',
            description: 'Early morning and late night flights (red-eye) are consistently 10-15% cheaper than peak hours (8-10 AM, 5-8 PM).',
        });

        tips.push({
            type: 'general_tip',
            icon: 'calendar_month',
            priority: 'info',
            title: '📆 Sweet Spot: Book 3-6 weeks ahead',
            description: 'For domestic Indian flights, the optimal booking window is 21-45 days before departure. Last-minute bookings cost 25-40% more.',
        });

        // Score overall travel readiness
        const score = Math.min(100, 50 + (alerts.length * 10) + (searches.length * 5) + (opportunities.length * 8));

        res.json({
            score,
            scoreLabel: score >= 80 ? 'Expert Traveler' : score >= 60 ? 'Smart Traveler' : 'Getting Started',
            summary: {
                totalInsights: insights.length + warnings.length + tips.length + opportunities.length,
                activeAlerts: alerts.length,
                searchesAnalyzed: searches.length,
            },
            opportunities,
            warnings,
            insights,
            tips,
            upcomingEvents: upcomingEvents.slice(0, 3),
        });
    } catch (error) {
        console.error('Advisor error:', error);
        res.status(500).json({ error: 'Failed to generate travel advice.' });
    }
});

export default router;
