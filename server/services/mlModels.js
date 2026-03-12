import fetch from 'node-fetch';

const ML_API_URL = process.env.ML_API_URL || 'http://127.0.0.1:5002';

/**
 * Calls the Python ML Model to get flight price prediction, confidence score, and recommendations.
 * @param {Object} flightData - Formatted flight data matching the ML model's expected features.
 * @returns {Promise<Object>} The prediction result.
 */
export async function getFlightPrediction(flightData) {
    try {
        const response = await fetch(`${ML_API_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(flightData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`ML API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return data; 
    } catch (error) {
        console.error('Error fetching prediction from ML model:', error.message);
        return null;
    }
}

/**
 * Formats internal flight data to match the Python model's expected inputs.
 */
export function formatFlightForML(flight, fromCity, toCity, date, cabinClass) {
    const depHour = parseInt(flight.depTime.split(':')[0], 10);
    const arrHour = parseInt(flight.arrTime.split(':')[0], 10);

    const departure_time = getTimeOfDay(depHour);
    const arrival_time = getTimeOfDay(arrHour);

    const flightDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    flightDate.setHours(0, 0, 0, 0);
    const days_left = Math.max(1, Math.round((flightDate - today) / (1000 * 60 * 60 * 24)));

    let formattedStops = 'zero';
    if (flight.stops === 'Non-stop' || flight.isNonStop) {
        formattedStops = 'zero';
    } else if (typeof flight.stops === 'string' && flight.stops.includes('1')) {
        formattedStops = 'one';
    } else {
        formattedStops = 'two_or_more';
    }

    let durationHours = 2.0;
    if (flight.durationMinutes) {
        durationHours = flight.durationMinutes / 60.0;
    } else if (flight.duration) {
        const hrsMatch = flight.duration.match(/(\d+)\s*h/i);
        const minsMatch = flight.duration.match(/(\d+)\s*m/i);
        const hrs = hrsMatch ? parseInt(hrsMatch[1], 10) : 0;
        const mins = minsMatch ? parseInt(minsMatch[1], 10) : 0;
        durationHours = hrs + (mins / 60.0);
    }

    let mlClass = 'Economy';
    if (cabinClass && cabinClass.toUpperCase() === 'BUSINESS') {
        mlClass = 'Business';
    } else if (flight.cabin && flight.cabin.toUpperCase() === 'BUSINESS') {
        mlClass = 'Business';
    }

    return {
        airline: flight.airline || 'IndiGo',
        source_city: mapIataToCity(flight.depCode, fromCity),
        departure_time: departure_time,
        stops: formattedStops,
        arrival_time: arrival_time,
        destination_city: mapIataToCity(flight.arrCode, toCity),
        class: mlClass,
        duration: Number(durationHours.toFixed(2)),
        days_left: days_left
    };
}

function getTimeOfDay(hour) {
    if (hour >= 4 && hour < 8) return 'Early_Morning';
    if (hour >= 8 && hour < 12) return 'Morning';
    if (hour >= 12 && hour < 16) return 'Afternoon';
    if (hour >= 16 && hour < 20) return 'Evening';
    if (hour >= 20 && hour < 24) return 'Night';
    return 'Late_Night';
}

function mapIataToCity(iata, fallbackCityName) {
    const cityMap = {
        'DEL': 'Delhi', 'BOM': 'Mumbai', 'BLR': 'Bangalore', 'CCU': 'Kolkata',
        'HYD': 'Hyderabad', 'MAA': 'Chennai'
    };
    return cityMap[iata] || fallbackCityName || iata;
}
