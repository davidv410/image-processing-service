import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

if(!process.env.DATABASE_URL){
    throw new Error("Database url not set")
}

export default defineConfig({
    schema: "./db/schema.js",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL
    }
})