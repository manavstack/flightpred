import { Router } from 'express';
import { searchFlights } from '../services/amadeus.js';
import db from '../db.js';

const router = Router();

// Indian airport database
const AIRPORTS = {
    DEL: { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi' },
    BOM: { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai' },
    BLR: { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bangalore' },
    MAA: { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai' },
    CCU: { code: 'CCU', name: 'Netaji Subhas Chandra Bose International Airport', city: 'Kolkata' },
    HYD: { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad' },
    GOI: { code: 'GOI', name: 'Manohar International Airport', city: 'Goa' },
    COK: { code: 'COK', name: 'Cochin International Airport', city: 'Kochi' },
    AMD: { code: 'AMD', name: 'Sardar Vallabhbhai Patel International Airport', city: 'Ahmedabad' },
    PNQ: { code: 'PNQ', name: 'Pune Airport', city: 'Pune' },
    JAI: { code: 'JAI', name: 'Jaipur International Airport', city: 'Jaipur' },
    LKO: { code: 'LKO', name: 'Chaudhary Charan Singh International Airport', city: 'Lucknow' },
    SXR: { code: 'SXR', name: 'Sheikh ul-Alam International Airport', city: 'Srinagar' },
    IXC: { code: 'IXC', name: 'Chandigarh Airport', city: 'Chandigarh' },
    GAU: { code: 'GAU', name: 'Lokpriya Gopinath Bordoloi International Airport', city: 'Guwahati' },
    BBI: { code: 'BBI', name: 'Biju Patnaik International Airport', city: 'Bhubaneswar' },
    IXR: { code: 'IXR', name: 'Birsa Munda Airport', city: 'Ranchi' },
    PAT: { code: 'PAT', name: 'Jay Prakash Narayan International Airport', city: 'Patna' },
    NAG: { code: 'NAG', name: 'Dr. Babasaheb Ambedkar International Airport', city: 'Nagpur' },
    VTZ: { code: 'VTZ', name: 'Visakhapatnam Airport', city: 'Visakhapatnam' },
    IDR: { code: 'IDR', name: 'Devi Ahilyabai Holkar Airport', city: 'Indore' },
    RPR: { code: 'RPR', name: 'Swami Vivekananda Airport', city: 'Raipur' },
    TRV: { code: 'TRV', name: 'Trivandrum International Airport', city: 'Thiruvananthapuram' },
    IXB: { code: 'IXB', name: 'Bagdogra Airport', city: 'Bagdogra' },
    UDR: { code: 'UDR', name: 'Maharana Pratap Airport', city: 'Udaipur' },
};

// GET /api/flights/search
router.get('/search', async (req, res) => {
    try {
        const { from, to, date, passengers, cabin } = req.query;

        if (!from || !to || !date) {
            return res.status(400).json({ error: 'from, to, and date are required query parameters.' });
        }

        const fromCode = from.toUpperCase();
        const toCode = to.toUpperCase();

        const flights = await searchFlights(
            fromCode,
            toCode,
            date,
            parseInt(passengers) || 1,
            cabin || 'ECONOMY'
        );

        // Save to search history if user is authenticated
        if (req.userId) {
            db.prepare(`
        INSERT INTO search_history (user_id, from_code, to_code, departure_date, passengers, cabin_class) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.userId, fromCode, toCode, date, parseInt(passengers) || 1, cabin || 'ECONOMY');
        }

        res.json({
            flights,
            meta: {
                from: AIRPORTS[fromCode] || { code: fromCode, city: fromCode },
                to: AIRPORTS[toCode] || { code: toCode, city: toCode },
                date,
                passengers: parseInt(passengers) || 1,
                cabin: cabin || 'ECONOMY',
                resultsCount: flights.length,
            },
        });
    } catch (error) {
        console.error('Flight search error:', error);
        res.status(500).json({ error: 'Failed to search flights.' });
    }
});

// GET /api/flights/airports — list airports for autocomplete
router.get('/airports', (req, res) => {
    const { q } = req.query;
    let results = Object.values(AIRPORTS);

    if (q) {
        const query = q.toLowerCase();
        results = results.filter(
            a => a.code.toLowerCase().includes(query) ||
                a.city.toLowerCase().includes(query) ||
                a.name.toLowerCase().includes(query)
        );
    }

    res.json({ airports: results });
});

export default router;
