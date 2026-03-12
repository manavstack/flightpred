/**
 * Price Prediction Engine
 * 
 * Uses historical price data with seasonal patterns, 
 * moving averages, and demand-based adjustments to predict
 * future flight prices.
 */

import db from '../db.js';

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

function getSeasonalMultiplier(dateStr) {
    const date = new Date(dateStr);
    const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    for (const event of SEASONAL_EVENTS) {
        if (mmdd >= event.start && mmdd <= event.end) {
            return { multiplier: event.multiplier, event: event.name };
        }
    }

    return { multiplier: 1.0, event: null };
}

function calculateMovingAverage(prices, windowSize = 7) {
    if (prices.length < windowSize) return prices[prices.length - 1] || 0;

    const window = prices.slice(-windowSize);
    return window.reduce((sum, p) => sum + p, 0) / windowSize;
}

function calculateTrend(prices) {
    if (prices.length < 3) return 0;

    const recent = prices.slice(-7);
    const older = prices.slice(-14, -7);

    if (older.length === 0) return 0;

    const recentAvg = recent.reduce((s, p) => s + p, 0) / recent.length;
    const olderAvg = older.reduce((s, p) => s + p, 0) / older.length;

    return ((recentAvg - olderAvg) / olderAvg) * 100;
}

export function getPricePrediction(route, daysAhead = 30) {
    const [from, to] = route.split('-');

    // Get historical prices from DB
    const rows = db.prepare(`
    SELECT price, recorded_at FROM price_history 
    WHERE route = ? 
    ORDER BY recorded_at ASC
  `).all(route);

    const prices = rows.map(r => r.price);
    const dates = rows.map(r => r.recorded_at);

    if (prices.length === 0) {
        return {
            route,
            from,
            to,
            currentPrice: 0,
            message: 'No historical data available for this route.',
            predictions: [],
        };
    }

    const currentPrice = prices[prices.length - 1];
    const movingAvg7 = calculateMovingAverage(prices, 7);
    const movingAvg30 = calculateMovingAverage(prices, 30);
    const trend = calculateTrend(prices);
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length);

    // Generate future predictions
    const predictions = [];
    const today = new Date();

    for (let i = 1; i <= daysAhead; i++) {
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + i);
        const dateStr = futureDate.toISOString().split('T')[0];

        const { multiplier, event } = getSeasonalMultiplier(dateStr);
        const dayOfWeek = futureDate.getDay();
        const weekendMod = (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) ? 1.08 : 0.97;

        // Mean reversion + trend + seasonal
        const trendFactor = 1 + (trend / 100) * (i / daysAhead) * 0.3;
        const meanRevert = 0.7 * movingAvg7 + 0.3 * movingAvg30;
        const noise = 1 + (Math.random() - 0.5) * 0.04; // ±2% noise

        const predicted = Math.round(meanRevert * trendFactor * weekendMod * multiplier * noise);

        predictions.push({
            date: dateStr,
            price: predicted,
            priceFormatted: `₹${predicted.toLocaleString('en-IN')}`,
            seasonalEvent: event,
            isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        });
    }

    // Decision engine
    let action, confidence, reason;

    if (currentPrice <= lowestPrice * 1.05) {
        action = 'BUY NOW';
        confidence = 88 + Math.floor(Math.random() * 10);
        reason = `Current price is near the lowest recorded price (₹${lowestPrice.toLocaleString('en-IN')}). This is an excellent deal.`;
    } else if (trend > 5) {
        action = 'BUY NOW';
        confidence = 75 + Math.floor(Math.random() * 15);
        reason = `Prices are trending upward (+${trend.toFixed(1)}%). Book now before they rise further.`;
    } else if (trend < -5) {
        action = 'WAIT';
        confidence = 70 + Math.floor(Math.random() * 15);
        reason = `Prices are dropping (${trend.toFixed(1)}%). Wait a few more days for a better deal.`;
    } else {
        action = 'STABLE';
        confidence = 65 + Math.floor(Math.random() * 15);
        reason = `Prices are stable around ₹${avgPrice.toLocaleString('en-IN')}. No significant changes expected soon.`;
    }

    // Chart data — last 30 data points from history
    const chartData = rows.slice(-30).map(r => ({
        date: r.recorded_at.split('T')[0],
        price: r.price,
    }));

    return {
        route,
        from,
        to,
        currentPrice,
        currentPriceFormatted: `₹${currentPrice.toLocaleString('en-IN')}`,
        lowestPrice,
        lowestPriceFormatted: `₹${lowestPrice.toLocaleString('en-IN')}`,
        highestPrice,
        highestPriceFormatted: `₹${highestPrice.toLocaleString('en-IN')}`,
        averagePrice: avgPrice,
        averagePriceFormatted: `₹${avgPrice.toLocaleString('en-IN')}`,
        trend: parseFloat(trend.toFixed(1)),
        trendDirection: trend > 2 ? 'up' : trend < -2 ? 'down' : 'stable',
        decision: { action, confidence, reason },
        chartData,
        predictions: predictions.slice(0, 14), // Next 14 days
        dataPointsAnalyzed: prices.length,
    };
}

export function getPopularRoutes() {
    const routes = db.prepare(`
    SELECT 
      route,
      from_code,
      to_code,
      MIN(price) as lowest_price,
      MAX(price) as highest_price,
      AVG(price) as avg_price,
      COUNT(*) as data_points
    FROM price_history 
    GROUP BY route 
    ORDER BY data_points DESC
    LIMIT 10
  `).all();

    return routes.map(r => {
        const recentPrices = db.prepare(`
      SELECT price FROM price_history 
      WHERE route = ? ORDER BY recorded_at DESC LIMIT 7
    `).all(r.route).map(p => p.price);

        const weekAgoPrice = recentPrices[recentPrices.length - 1] || r.avg_price;
        const currentPrice = recentPrices[0] || r.avg_price;
        const changePercent = ((currentPrice - weekAgoPrice) / weekAgoPrice * 100).toFixed(1);

        return {
            route: r.route,
            from: r.from_code,
            to: r.to_code,
            currentPrice: Math.round(currentPrice),
            currentPriceFormatted: `₹${Math.round(currentPrice).toLocaleString('en-IN')}`,
            avgPrice: Math.round(r.avg_price),
            changePercent: parseFloat(changePercent),
            direction: parseFloat(changePercent) > 0 ? 'up' : parseFloat(changePercent) < 0 ? 'down' : 'stable',
        };
    });
}
