import { Pool, QueryResult } from 'pg';
import dotenv from 'dotenv';
import { z } from 'zod';

// Schema definitions
const EnergyProfileSchema = z.object({
    low: z.number().min(0).max(100),
    medium: z.number().min(0).max(100),
    high: z.number().min(0).max(100),
    very_high: z.number().min(0).max(100)
}).refine(data => {
    const sum = data.low + data.medium + data.high + data.very_high;
    return sum === 100;
}, "Energy profile must sum to 100%");

const SongCriteriaSchema = z.object({
    minEnergy: z.enum(['low', 'medium', 'high', 'very_high']).optional(),
    maxEnergy: z.enum(['low', 'medium', 'high', 'very_high']).optional(),
    preferredGenres: z.array(z.string())
}).refine(data => {
    return data.minEnergy || data.maxEnergy;
}, "Either minEnergy or maxEnergy must be specified");

const TemplatePlaylistSchema = z.object({
    name: z.string(),
    businessType: z.string(),
    energyProfile: EnergyProfileSchema,
    songCriteria: SongCriteriaSchema
});

type TemplatePlaylist = z.infer<typeof TemplatePlaylistSchema>;
type EnergyLevel = 'low' | 'medium' | 'high' | 'very_high';

class PlaylistTemplateManager {
    private pool: Pool;
    private templates: TemplatePlaylist[];

    constructor(connectionString: string) {
        this.pool = new Pool({ connectionString });
        this.templates = [
            {
                name: 'Gym',
                businessType: 'gym',
                energyProfile: { low: 0, medium: 10, high: 30, very_high: 60 },
                songCriteria: {
                    minEnergy: 'high',
                    preferredGenres: ['electronic', 'rock', 'hip-hop']
                }
            },
            {
                name: 'Office',
                businessType: 'office',
                energyProfile: { low: 30, medium: 60, high: 10, very_high: 0 },
                songCriteria: {
                    maxEnergy: 'medium',
                    preferredGenres: ['ambient', 'jazz', 'lofi']
                }
            },
        ];
    }

    private async createDatabaseSchema(): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Drop existing tables and types
            await client.query(`
                DROP TABLE IF EXISTS playlist_songs CASCADE;
                DROP TABLE IF EXISTS songs CASCADE;
                DROP TABLE IF EXISTS playlists CASCADE;
                DROP TYPE IF EXISTS energy_level CASCADE;
            `);

            // Create new enum type
            await client.query(`
                CREATE TYPE energy_level AS ENUM ('low', 'medium', 'high', 'very_high');
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS playlists (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    business_type VARCHAR(100) NOT NULL,
                    energy_profile JSONB NOT NULL,
                    is_template BOOLEAN DEFAULT false,
                    created_by VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS songs (
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

                CREATE TABLE IF NOT EXISTS playlist_songs (
                    playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
                    song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
                    position INTEGER NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (playlist_id, song_id)
                );

                CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs(genre);
                CREATE INDEX IF NOT EXISTS idx_songs_energy ON songs(energy_level);
            `);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw new Error(`Schema creation failed: ${error}`);
        } finally {
            client.release();
        }
    }

    private getEnergyLevels(criteria: TemplatePlaylist['songCriteria']): EnergyLevel[] {
        const energyOrder: EnergyLevel[] = ['low', 'medium', 'high', 'very_high'];
        
        if (criteria.minEnergy) {
            const startIndex = energyOrder.indexOf(criteria.minEnergy);
            return energyOrder.slice(startIndex);
        }
        
        if (criteria.maxEnergy) {
            const endIndex = energyOrder.indexOf(criteria.maxEnergy) + 1;
            return energyOrder.slice(0, endIndex);
        }

        return energyOrder;
    }

    private async createTemplatePlaylist(template: TemplatePlaylist): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');

            // Create playlist
            const playlistResult = await client.query(
                `INSERT INTO playlists (
                    name, 
                    business_type, 
                    energy_profile, 
                    is_template,
                    created_by
                ) VALUES ($1, $2, $3, true, null)
                RETURNING id`,
                [
                    template.name,
                    template.businessType,
                    JSON.stringify(template.energyProfile)
                ]
            );

            const playlistId = playlistResult.rows[0].id;
            const energyLevels = this.getEnergyLevels(template.songCriteria);

            // Find matching songs
            const songsResult = await client.query(
                `SELECT id 
                 FROM songs 
                 WHERE energy_level = ANY($1)
                 AND genre = ANY($2)
                 AND is_active = true
                 ORDER BY RANDOM()
                 LIMIT 50`,
                [energyLevels, template.songCriteria.preferredGenres]
            );

            // Add songs to playlist
            if (songsResult.rows.length > 0) {
                const values = songsResult.rows
                    .map((song, index) => `(${playlistId}, ${song.id}, ${index})`)
                    .join(', ');

                await client.query(`
                    INSERT INTO playlist_songs (playlist_id, song_id, position)
                    VALUES ${values}
                `);
            }

            await client.query('COMMIT');
            console.log(`Created template: ${template.name} with ${songsResult.rows.length} songs`);
        } catch (error) {
            await client.query('ROLLBACK');
            throw new Error(`Failed to create template ${template.name}: ${error}`);
        } finally {
            client.release();
        }
    }

    public async initialize(): Promise<void> {
        try {
            await this.createDatabaseSchema();
            
            for (const template of this.templates) {
                const validatedTemplate = TemplatePlaylistSchema.parse(template);
                await this.createTemplatePlaylist(validatedTemplate);
            }
            
            console.log('Template initialization completed successfully');
        } catch (error) {
            console.error('Template initialization failed:', error);
            throw error;
        }
    }
}

// Usage
async function main() {
    dotenv.config();

    const manager = new PlaylistTemplateManager(process.env.DATABASE_URL!);
    
    try {
        await manager.initialize();
        process.exit(0);
    } catch (error) {
        console.error('Failed to initialize templates:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

export { PlaylistTemplateManager, TemplatePlaylistSchema };