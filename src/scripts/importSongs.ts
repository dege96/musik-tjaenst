import { Pool } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import NodeID3 from 'node-id3';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Funktion för att bestämma energinivå baserat på Energy-värdet
function getEnergyLevel(energyValue: number): 'low' | 'medium' | 'high' {
    if (energyValue <= 3) return 'low';
    if (energyValue <= 6) return 'medium';
    return 'high';
}

async function importSongs() {
    try {
        const baseDir = path.join(process.cwd(), 'public', 'songs');
        const categories = await fs.readdir(baseDir);

        for (const category of categories) {
            const categoryPath = path.join(baseDir, category);
            const stats = await fs.stat(categoryPath);
            
            if (!stats.isDirectory()) continue;
            
            const files = await fs.readdir(categoryPath);
            console.log(`Importerar låtar från ${category}...`);

            for (const file of files) {
                if (!file.toLowerCase().endsWith('.mp3')) continue;

                const filePath = path.join(categoryPath, file);
                const fileBuffer = await fs.readFile(filePath);
                const tags = NodeID3.read(fileBuffer);

                // Använd filnamnet som titel om ingen ID3-tag finns
                const title = tags.title || path.basename(file, '.mp3');

                // Extrahera energinivå från beskrivning
                let energyLevel: 'low' | 'medium' | 'high' = 'medium';
                if (tags.comment) {
                    const commentText = typeof tags.comment === 'string' 
                        ? tags.comment 
                        : tags.comment.text;
                    
                    const match = commentText.match(/Energy (\d+)/);
                    if (match) {
                        const energyValue = parseInt(match[1], 10);
                        energyLevel = getEnergyLevel(energyValue);
                        console.log(`Hittade energinivå ${energyValue} för ${title}`);
                    }
                }

                // Kontrollera om låten redan finns
                const existingResult = await pool.query(
                    'SELECT id FROM songs WHERE title = $1 AND genre = $2',
                    [title, category]
                );

                if (existingResult.rows.length === 0) {
                    // Spara relativ sökväg för filen
                    const relativePath = path.join(category, file);

                    await pool.query(
                        `INSERT INTO songs (
                            title, 
                            genre, 
                            duration, 
                            file_url, 
                            energy_level, 
                            is_active
                        ) VALUES ($1, $2, $3, $4, $5, $6)`,
                        [
                            title,
                            category,
                            180, // Standard 3 minuter (180 sekunder)
                            relativePath,
                            energyLevel,
                            true
                        ]
                    );
                    console.log(`Importerade: ${title} - ${category} (Energi: ${energyLevel})`);
                } else {
                    // Uppdatera energinivå för befintlig låt
                    await pool.query(
                        `UPDATE songs 
                         SET energy_level = $1
                         WHERE title = $2 AND genre = $3`,
                        [energyLevel, title, category]
                    );
                    console.log(`Uppdaterade energinivå: ${title} - ${category} (Energi: ${energyLevel})`);
                }
            }
        }

        console.log('Import slutförd!');
        process.exit(0);
    } catch (error) {
        console.error('Ett fel uppstod vid import:', error);
        process.exit(1);
    }
}

importSongs(); 