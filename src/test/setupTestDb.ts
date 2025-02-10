import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

async function setupTestDatabase() {
    // Anslut till postgres för att skapa testdatabasen
    const adminPool = new Pool({
        connectionString: 'postgres://postgres:postgres@localhost:5432/postgres'
    });

    try {
        // Koppla från alla anslutningar till testdatabasen
        await adminPool.query(`
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = 'musik_test'
            AND pid <> pg_backend_pid();
        `);

        // Skapa testdatabasen (utanför transaktion)
        await adminPool.query('DROP DATABASE IF EXISTS musik_test');
        await adminPool.query('CREATE DATABASE musik_test');

        // Anslut till testdatabasen
        const testPool = new Pool({
            connectionString: process.env.TEST_DATABASE_URL
        });

        // Skapa schema och testdata
        await testPool.query(`
            CREATE TYPE user_role AS ENUM ('admin', 'business');
            CREATE TYPE energy_level AS ENUM ('low', 'medium', 'high', 'very_high');
            CREATE TYPE business_type AS ENUM ('gym', 'cafe', 'retail', 'restaurant', 'office', 'other');

            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                company_name VARCHAR(255) NOT NULL,
                org_number VARCHAR(20) UNIQUE NOT NULL,
                business_type business_type NOT NULL,
                role user_role NOT NULL DEFAULT 'business'
            );

            -- Skapa testanvändare
            INSERT INTO users (email, password_hash, company_name, org_number, business_type, role)
            VALUES ('test@test.com', 'test-hash', 'Test Company', '123456-7890', 'gym', 'business')
            RETURNING id;
        `);

        await testPool.end();
        await adminPool.end();
        
        console.log('Testdatabas skapad');
    } catch (error) {
        console.error('Fel vid skapande av testdatabas:', error);
        process.exit(1);
    }
}

setupTestDatabase(); 