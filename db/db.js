import "dotenv/config"
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false
})

export const db = drizzle(pool)