/**
 * Seed Data Generator
 * 
 * Generates realistic historical price data for popular
 * Indian domestic flight routes over the past 90 days.
 */

import db from '../db.js';
import bcrypt from 'bcryptjs';
import { BASE_PRICES } from './amadeus.js';

const POPULAR_ROUTES = [
  { from: 'DEL', to: 'BOM', fromCity: 'Delhi', toCity: 'Mumbai' },
  { from: 'DEL', to: 'BLR', fromCity: 'Delhi', toCity: 'Bangalore' },
  { from: 'BOM', to: 'BLR', fromCity: 'Mumbai', toCity: 'Bangalore' },
  { from: 'DEL', to: 'MAA', fromCity: 'Delhi', toCity: 'Chennai' },
  { from: 'BOM', to: 'GOI', fromCity: 'Mumbai', toCity: 'Goa' },
  { from: 'DEL', to: 'CCU', fromCity: 'Delhi', toCity: 'Kolkata' },
  { from: 'HYD', to: 'DEL', fromCity: 'Hyderabad', toCity: 'Delhi' },
  { from: 'BLR', to: 'GOI', fromCity: 'Bangalore', toCity: 'Goa' },
  { from: 'MAA', to: 'CCU', fromCity: 'Chennai', toCity: 'Kolkata' },
  { from: 'DEL', to: 'GOI', fromCity: 'Delhi', toCity: 'Goa' },
  { from: 'BOM', to: 'HYD', fromCity: 'Mumbai', toCity: 'Hyderabad' },
  { from: 'BLR', to: 'HYD', fromCity: 'Bangalore', toCity: 'Hyderabad' },
];

const AIRLINES_FOR_SEED = ['IndiGo', 'SpiceJet', 'Air India', 'Vistara', 'Akasa Air', 'Air India Express'];

export function seedDatabase() {
  // Check if already seeded
  const existingCount = db.prepare('SELECT COUNT(*) as c FROM price_history').get();
  if (existingCount.c > 100) {
    console.log(`📊 Database already seeded (${existingCount.c} price records). Skipping.`);
    return;
  }

  console.log('🌱 Seeding database with historical price data...');

  const insertPrice = db.prepare(`
    INSERT INTO price_history (route, from_code, to_code, price, airline, currency, recorded_at)
    VALUES (?, ?, ?, ?, ?, 'INR', ?)
  `);

  const seedPrices = db.transaction(() => {
    const today = new Date();

    for (const route of POPULAR_ROUTES) {
      const routeKey = `${route.from}-${route.to}`;
      const reverseKey = `${route.to}-${route.from}`;
      const basePrice = BASE_PRICES[routeKey] || BASE_PRICES[reverseKey] || 4500;

      // Generate 90 days of history
      for (let day = 90; day >= 0; day--) {
        const date = new Date(today);
        date.setDate(date.getDate() - day);
        const dateStr = date.toISOString();

        // Simulate price patterns
        const dayOfWeek = date.getDay();
        const weekendMod = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.12 : 1.0;

        // Seasonal wave
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const seasonalWave = Math.sin((dayOfYear / 365) * Math.PI * 2) * 0.08;

        // Weekly cycle
        const weekCycle = Math.sin((day / 7) * Math.PI * 2) * 0.05;

        // Random walk
        const randomWalk = (Math.random() - 0.5) * 0.1;

        // Long-term trend (slight upward over 90 days)
        const trendFactor = 1 + (90 - day) * 0.0005;

        // Generate 2-3 prices per day (different airlines)
        const numAirlines = 2 + Math.floor(Math.random() * 2);
        for (let a = 0; a < numAirlines; a++) {
          const airline = AIRLINES_FOR_SEED[Math.floor(Math.random() * AIRLINES_FOR_SEED.length)];
          const airlinePriceMod = 0.85 + Math.random() * 0.35;

          const price = Math.round(
            basePrice * (1 + seasonalWave + weekCycle + randomWalk) * weekendMod * trendFactor * airlinePriceMod
          );

          insertPrice.run(routeKey, route.from, route.to, price, airline, dateStr);
        }
      }
    }
  });

  seedPrices();

  // Seed demo user
  const existingUser = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (existingUser.c === 0) {
    const hashedPassword = bcrypt.hashSync('demo123', 10);

    db.prepare(`
      INSERT INTO users (name, email, password, avatar_url) VALUES (?, ?, ?, ?)
    `).run(
      'Manav Mishra',
      'arjun@flyai.com',
      hashedPassword,
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDNlyLG44KVmKOQ5gYdYAOrKBrnraSv1Q6Awx0SdwPIhu0BbRoiejxcfvbppgop0iTeikMNM4SHJ3Kw01y6homscHUMErt72mgpLtXnlmGDxUhZJ2NesQsxo1hYzvZtz4kkvnY5wiN6285GWNFBANw7DOnvZi-1o8vI1zok9ReF1AJEbNClPEo8HxyTjpx6AW0Hz2sCs6gldzFfDxCvilc5RY66Bj0jsO1OcCdU3DHabI9N3isZtlErcEUtYbVL10q1gfDx47c2-XxM'
    );

    const userId = db.prepare('SELECT id FROM users WHERE email = ?').get('arjun@flyai.com').id;

    // Seed alerts
    db.prepare(`
      INSERT INTO alerts (user_id, from_code, from_city, to_code, to_city, threshold_price, notifications_on, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, 'HYD', 'Hyderabad', 'DEL', 'Delhi', 4000, 1, 'active');

    db.prepare(`
      INSERT INTO alerts (user_id, from_code, from_city, to_code, to_city, threshold_price, notifications_on, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, 'BLR', 'Bangalore', 'COK', 'Kochi', 3200, 0, 'active');

    db.prepare(`
      INSERT INTO alerts (user_id, from_code, from_city, to_code, to_city, threshold_price, notifications_on, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, 'MAA', 'Chennai', 'GOI', 'Goa', 2800, 1, 'expired');

    // Seed saved routes
    db.prepare(`
      INSERT INTO saved_routes (user_id, from_code, to_code, from_city, to_city) VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'DEL', 'BOM', 'Delhi', 'Mumbai');

    db.prepare(`
      INSERT INTO saved_routes (user_id, from_code, to_code, from_city, to_city) VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'DEL', 'BLR', 'Delhi', 'Bangalore');

    db.prepare(`
      INSERT INTO saved_routes (user_id, from_code, to_code, from_city, to_city) VALUES (?, ?, ?, ?, ?)
    `).run(userId, 'BOM', 'GOI', 'Mumbai', 'Goa');

    console.log('👤 Demo user created: arjun@flyai.com / demo123');
  }

  const finalCount = db.prepare('SELECT COUNT(*) as c FROM price_history').get();
  console.log(`✅ Seeded ${finalCount.c} price history records for ${POPULAR_ROUTES.length} routes.`);
}
