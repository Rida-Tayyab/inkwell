import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

// For development, use Neon's free tier or local Postgres
// For local testing without Docker, you can use a cloud DB
if (!connectionString) {
  // Try loading from .env.local if not already loaded
  try {
    const { config } = require('dotenv');
    config({ path: '.env.local', override: true });
  } catch (e) {
    // ignore
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is required. Set it to a Neon PostgreSQL connection string from https://neon.tech'
    );
  }
}

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
