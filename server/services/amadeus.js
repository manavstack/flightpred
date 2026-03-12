/**
 * Amadeus Self-Service API Integration
 * Free test environment: https://developers.amadeus.com
 * 
 * This service wraps the Amadeus Flight Offers Search API.
 * In test mode, it returns realistic sample data.
 * With real credentials, it connects to the Amadeus sandbox.
 */

import { getFlightPrediction, formatFlightForML } from './mlModels.js';
import db from '../db.js';

let accessToken = null;
let tokenExpiry = 0;

const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';

async function getAccessToken() {
    const clientId = process.env.AMADEUS_CLIENT_ID;
    const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

    if (!clientId || clientId === 'YOUR_AMADEUS_CLIENT_ID') {
        return null; // Will use fallback data
    }

    if (accessToken && Date.now() < tokenExpiry) {
        return accessToken;
    }

    try {
        const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: clientId,
                client_secret: clientSecret,
            }),
        });

        const data = await response.json();
        accessToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
        return accessToken;
    } catch (error) {
        console.error('Amadeus auth error:', error.message);
        return null;
    }
}

// Indian airline data for realistic fallback
const AIRLINES = {
    '6E': { name: 'IndiGo', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/IndiGo_Airlines_logo.svg/200px-IndiGo_Airlines_logo.svg.png' },
    'SG': { name: 'SpiceJet', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/SpiceJet_logo.svg/200px-SpiceJet_logo.svg.png' },
    'AI': { name: 'Air India', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Air_India_Logo.svg/200px-Air_India_Logo.svg.png' },
    'UK': { name: 'Vistara', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Vistara_Logo.svg/200px-Vistara_Logo.svg.png' },
    'QP': { name: 'Akasa Air', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Akasa_Air_logo.svg/200px-Akasa_Air_logo.svg.png' },
    'IX': { name: 'Air India Express', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Air_India_Logo.svg/150px-Air_India_Logo.svg.png' },
};

const AIRCRAFT = {
    '6E': 'Airbus A320neo',
    'SG': 'Boeing 737-800',
    'AI': 'Airbus A350-900',
    'UK': 'Airbus A320neo',
    'QP': 'Boeing 737 MAX',
    'IX': 'Boeing 737-800',
};

// Realistic route distances (flight minutes)
const ROUTE_DURATIONS = {
    'DEL-BOM': 130, 'DEL-BLR': 160, 'DEL-MAA': 170, 'DEL-CCU': 130,
    'DEL-HYD': 135, 'DEL-GOI': 155, 'DEL-COK': 190, 'DEL-SXR': 85,
    'BOM-BLR': 95, 'BOM-MAA': 110, 'BOM-CCU': 155, 'BOM-HYD': 80,
    'BOM-GOI': 65, 'BOM-COK': 110, 'BOM-DEL': 130,
    'BLR-MAA': 50, 'BLR-CCU': 155, 'BLR-HYD': 70, 'BLR-GOI': 70,
    'MAA-CCU': 145, 'MAA-HYD': 65, 'HYD-GOI': 85, 'HYD-DEL': 135,
    'CCU-BLR': 155, 'COK-DEL': 190,
};

// Base prices per route (INR)
const BASE_PRICES = {
    'DEL-BOM': 4200, 'DEL-BLR': 4800, 'DEL-MAA': 5200, 'DEL-CCU': 4500,
    'DEL-HYD': 4600, 'DEL-GOI': 5800, 'DEL-COK': 6200, 'DEL-SXR': 5500,
    'BOM-BLR': 3200, 'BOM-MAA': 3800, 'BOM-CCU': 5500, 'BOM-HYD': 3000,
    'BOM-GOI': 2500, 'BOM-COK': 3500, 'BOM-DEL': 4200,
    'BLR-MAA': 2200, 'BLR-CCU': 5000, 'BLR-HYD': 2800, 'BLR-GOI': 3200,
    'MAA-CCU': 4500, 'MAA-HYD': 2500, 'HYD-GOI': 3800, 'HYD-DEL': 4600,
    'CCU-BLR': 5000, 'COK-DEL': 6200,
};

function generateFallbackFlights(from, to, date, passengers = 1) {
    const routeKey = `${from}-${to}`;
    const reverseKey = `${to}-${from}`;
    const baseDuration = ROUTE_DURATIONS[routeKey] || ROUTE_DURATIONS[reverseKey] || 120;
    const basePrice = BASE_PRICES[routeKey] || BASE_PRICES[reverseKey] || 4500;

    // Day-of-week price modifiers
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const weekendSurcharge = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.15 : 1.0;

    // Advance booking discount
    const daysUntil = Math.max(0, (dateObj - new Date()) / (1000 * 60 * 60 * 24));
    const advanceMultiplier = daysUntil > 21 ? 0.85 : daysUntil > 7 ? 1.0 : 1.25;

    const airlineCodes = Object.keys(AIRLINES);
    const flights = [];

    for (let i = 0; i < 6; i++) {
        const airlineCode = airlineCodes[i % airlineCodes.length];
        const airline = AIRLINES[airlineCode];

        // Random departure hour between 5 AM and 10 PM
        const depHour = 5 + Math.floor(Math.random() * 17);
        const depMin = Math.floor(Math.random() * 4) * 15;
        const isNonStop = Math.random() > 0.35;
        const actualDuration = isNonStop ? baseDuration : baseDuration + 60 + Math.floor(Math.random() * 90);

        const arrHour = depHour + Math.floor(actualDuration / 60);
        const arrMin = (depMin + actualDuration % 60) % 60;

        // Price variation per airline and time
        const priceVariation = 0.8 + Math.random() * 0.5;
        const earlyBirdDiscount = depHour < 7 ? 0.88 : depHour > 20 ? 0.92 : 1.0;
        const price = Math.round(basePrice * priceVariation * weekendSurcharge * advanceMultiplier * earlyBirdDiscount * passengers);

        const stopCities = ['AMD', 'JAI', 'NAG', 'RPR', 'IDR', 'BBI'];
        const stopCity = stopCities[Math.floor(Math.random() * stopCities.length)];

        // We will do AI prediction async later
        flights.push({
            id: `${airlineCode}-${1000 + Math.floor(Math.random() * 9000)}`,
            airline: airline.name,
            airlineCode,
            flightNo: `${airlineCode}-${100 + Math.floor(Math.random() * 900)}`,
            aircraft: AIRCRAFT[airlineCode] || 'Airbus A320',
            logo: airline.logo,
            depTime: `${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}`,
            depCode: from,
            arrTime: `${String(arrHour % 24).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`,
            arrCode: to,
            duration: `${Math.floor(actualDuration / 60)}h ${actualDuration % 60}m`,
            durationMinutes: actualDuration,
            stops: isNonStop ? 'Non-stop' : `1 stop (${stopCity})`,
            isNonStop,
            price,
            priceFormatted: `₹${price.toLocaleString('en-IN')}`,
            currency: 'INR',
            cabin: 'ECONOMY',
            seatsLeft: 1 + Math.floor(Math.random() * 9),
            date,
        });
    }

    // Sort by price
    flights.sort((a, b) => a.price - b.price);
    return flights;
}

export async function searchFlights(from, to, date, passengers = 1, cabinClass = 'ECONOMY') {
    const token = await getAccessToken();
    let flights = [];

    if (token) {
        try {
            const params = new URLSearchParams({
                originLocationCode: from,
                destinationLocationCode: to,
                departureDate: date,
                adults: String(passengers),
                travelClass: cabinClass,
                currencyCode: 'INR',
                max: '10',
            });

            const response = await fetch(
                `${AMADEUS_BASE_URL}/v2/shopping/flight-offers?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.ok) {
                const data = await response.json();
                flights = transformAmadeusResponse(data, from, to, date);
            }
        } catch (error) {
            console.error('Amadeus search error:', error.message);
        }
    }

    if (flights.length === 0) {
        // Fallback to generated data
        console.log('Using generated flight data (no Amadeus credentials or API error)');
        flights = generateFallbackFlights(from, to, date, passengers);
    }

    // Enhance flights with ML predictions
    const enhancedFlights = await Promise.all(flights.map(async (f) => {
        const mlData = formatFlightForML(f, from, to, date, cabinClass);
        const mlResult = await getFlightPrediction(mlData);

        if (mlResult && mlResult.predicted_price) {
            // Determine action based on ML output vs current price
            const currentPrice = f.price;
            const predPrice = mlResult.predicted_price;
            
            let action = 'Stable Price';
            let icon = 'trending_flat';
            if (predPrice > currentPrice * 1.1) {
                action = 'Buy Now';
                icon = 'trending_down'; // Prices will go up, buy now
            } else if (predPrice < currentPrice * 0.9) {
                action = 'Wait 2-3 Days';
                icon = 'schedule'; // Prices will go down
            } else if (mlResult.recommendation && mlResult.recommendation.best_price < currentPrice * 0.9) {
                action = 'Wait 2-3 Days';
                icon = 'schedule';
            }

            if (mlResult.alert) {
                f.alertMsg = mlResult.alert;
            }

            f.prediction = {
                action: action,
                icon: icon,
                confidence: mlResult.confidence_score,
                mlPrice: predPrice,
                recommendation: mlResult.recommendation
            };

            // ---- LOGGING MECHANISM ----
            // Fire-and-forget logging to the database so we don't slow down the response
            try {
                const errorAmount = Math.abs(currentPrice - predPrice);
                const errorPercentage = currentPrice > 0 ? (errorAmount / currentPrice) * 100 : 0;
                
                // Get accurate local ISO string to avoid SQLite UTC problems
                const localTime = new Date();
                const localTimeString = new Date(localTime.getTime() - (localTime.getTimezoneOffset() * 60000)).toISOString().slice(0, 19).replace('T', ' ');

                db.prepare(`
                    INSERT INTO prediction_logs (route, airline, departure_date, days_left, actual_price, predicted_price, confidence_score, error_amount, error_percentage, logged_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(
                    `${f.depCode}-${f.arrCode}`,
                    f.airline,
                    date,
                    mlData.days_left,
                    currentPrice,
                    predPrice,
                    mlResult.confidence_score,
                    errorAmount,
                    errorPercentage,
                    localTimeString
                );
            } catch (err) {
                console.error('Failed to log prediction to database:', err.message);
            }

        } else {
            // Fallback if ML fails
            f.prediction = { action: 'Stable Price', icon: 'trending_flat', confidence: 70 };
        }
        return f;
    }));

    // Sort by price again just in case
    enhancedFlights.sort((a, b) => a.price - b.price);
    
    // Label best match
    if (enhancedFlights.length > 0 && enhancedFlights[0].prediction.action !== 'Buy Now') {
        enhancedFlights[0].prediction.action = 'Best Match';
        enhancedFlights[0].prediction.icon = 'verified';
    }

    return enhancedFlights;
}

function transformAmadeusResponse(data, from, to, date) {
    if (!data.data || data.data.length === 0) return [];

    return data.data.map((offer, idx) => {
        const segment = offer.itineraries[0].segments[0];
        const lastSegment = offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1];
        const airlineCode = segment.carrierCode;
        const airline = AIRLINES[airlineCode] || { name: airlineCode, logo: '' };

        const duration = offer.itineraries[0].duration
            .replace('PT', '')
            .replace('H', 'h ')
            .replace('M', 'm');

        const stops = offer.itineraries[0].segments.length - 1;

        return {
            id: offer.id,
            airline: airline.name,
            airlineCode,
            flightNo: `${airlineCode}-${segment.number}`,
            aircraft: segment.aircraft?.code || 'A320',
            logo: airline.logo,
            depTime: segment.departure.at.substring(11, 16),
            depCode: segment.departure.iataCode,
            arrTime: lastSegment.arrival.at.substring(11, 16),
            arrCode: lastSegment.arrival.iataCode,
            duration,
            stops: stops === 0 ? 'Non-stop' : `${stops} stop`,
            isNonStop: stops === 0,
            price: parseFloat(offer.price.total),
            priceFormatted: `₹${parseFloat(offer.price.total).toLocaleString('en-IN')}`,
            currency: offer.price.currency,
            cabin: offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || 'ECONOMY',
            seatsLeft: offer.numberOfBookableSeats || 5,
            date,
        };
    });
}

export { AIRLINES, BASE_PRICES, ROUTE_DURATIONS };
