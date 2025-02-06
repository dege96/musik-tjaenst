import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const setupDatabase = async () => {
    // Anslut till postgres för att skapa databasen
    const setupPool = new Pool({
        connectionString: process.env.DATABASE_URL?.replace('/musiktjanst', '/postgres'),
    });

    try {
        // Skapa databasen om den inte finns
        await setupPool.query(`
            SELECT 'CREATE DATABASE musiktjanst'
            WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'musiktjanst')
        `).then(() => {
            console.log('Databas skapad eller existerar redan');
        });
    } catch (err) {
        console.error('Fel vid skapande av databas:', err);
        process.exit(1);
    } finally {
        await setupPool.end();
    }

    // Anslut till den nya databasen
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        // Läs och kör migrationer
        const migrationFile = await fs.readFile(
            path.join(__dirname, 'migrations', '001_initial_schema.sql'),
            'utf-8'
        );

        await pool.query(migrationFile);
        console.log('Migrationer körda framgångsrikt');

        // Skapa admin-användare
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
        console.error('Fel vid körning av migrationer:', err);
        process.exit(1);
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