import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const setupDatabase = async () => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction ? {
            rejectUnauthorized: false
        } : false
    });

    try {
        // I produktion antar vi att databasen redan finns
        if (!isProduction) {
            // Skapa databasen bara i utvecklingsmiljö
            const setupPool = new Pool({
                connectionString: process.env.DATABASE_URL?.replace('/musiktjanst', '/postgres'),
            });

            try {
                await setupPool.query(`
                    SELECT 'CREATE DATABASE musiktjanst'
                    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'musiktjanst')
                `);
                console.log('Databas skapad eller existerar redan');
            } finally {
                await setupPool.end();
            }
        }

        // Läs och kör migrationer
        const migrationFile = await fs.readFile(
            path.join(__dirname, 'migrations', '001_initial_schema.sql'),
            'utf-8'
        );

        await pool.query(migrationFile);
        console.log('Migrationer körda framgångsrikt');

        // Skapa admin-användare om den inte finns
        const adminExists = await pool.query(
            "SELECT * FROM users WHERE email = 'admin@musiktjanst.se'"
        );

        if (adminExists.rows.length === 0) {
            await pool.query(`
                INSERT INTO users (
                    email,
                    password_hash,
                    company_name,
                    org_number,
                    business_type,
                    role,
                    subscription_status
                ) VALUES (
                    'admin@musiktjanst.se',
                    'temppassword123', -- Byt ut mot bcrypt hash i produktion
                    'Musiktjänst Admin',
                    '000000-0000',
                    'other',
                    'admin',
                    true
                )
            `);
            console.log('Admin-användare skapad');
        }

    } catch (err) {
        console.error('Fel vid databasinstallation:', err);
        throw err;
    } finally {
        await pool.end();
    }
};

setupDatabase().then(() => {
    console.log('Databasinstallation klar');
    process.exit(0);
}).catch(err => {
    console.error('Ett fel uppstod:', err);
    process.exit(1);
}); 