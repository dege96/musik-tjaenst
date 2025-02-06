import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function updateSchema() {
    try {
        // Droppa existerande tabeller
        await pool.query(`
            DROP TABLE IF EXISTS playlist_songs CASCADE;
            DROP TABLE IF EXISTS songs CASCADE;
        `);

        // Skapa om songs-tabellen med genre istället för artist
        await pool.query(`
            CREATE TABLE songs (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                genre VARCHAR(255) NOT NULL,
                duration INTEGER NOT NULL,
                file_url VARCHAR(255) NOT NULL,
                energy_level energy_level NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE playlist_songs (
                playlist_id INTEGER REFERENCES playlists(id),
                song_id INTEGER REFERENCES songs(id),
                position INTEGER NOT NULL,
                PRIMARY KEY (playlist_id, song_id)
            );
        `);

        console.log('Databasschema uppdaterat framgångsrikt');
        process.exit(0);
    } catch (err) {
        console.error('Fel vid uppdatering av schema:', err);
        process.exit(1);
    }
}

updateSchema(); 