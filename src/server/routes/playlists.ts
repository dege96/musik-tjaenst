import express from 'express';
import { Pool } from 'pg';
import { authenticateToken, requireBusiness } from '../middleware/auth';

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

interface PlaylistRequest {
    name: string;
    businessType: string;
    energyProfile: {
        low: number;
        medium: number;
        high: number;
    };
}

// Hämta alla spellistor för ett företag
router.get('/', authenticateToken, async (req: any, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, COUNT(ps.song_id) as song_count 
             FROM playlists p 
             LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
             WHERE p.created_by = $1 OR p.is_template = true
             GROUP BY p.id
             ORDER BY p.created_at DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Kunde inte hämta spellistor' });
    }
});

// Skapa ny spellista
router.post('/', authenticateToken, requireBusiness, async (req: any, res) => {
    const { name, businessType, energyProfile }: PlaylistRequest = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO playlists (name, created_by, business_type, energy_profile)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [name, req.user.id, businessType, JSON.stringify(energyProfile)]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Kunde inte skapa spellista' });
    }
});

// Uppdatera spellista
router.put('/:id', authenticateToken, requireBusiness, async (req: any, res) => {
    const { id } = req.params;
    const { name, energyProfile }: Partial<PlaylistRequest> = req.body;

    try {
        // Kontrollera ägarskap
        const ownerCheck = await pool.query(
            'SELECT created_by FROM playlists WHERE id = $1',
            [id]
        );

        if (!ownerCheck.rows[0] || ownerCheck.rows[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'Ingen behörighet att ändra denna spellista' });
        }

        const result = await pool.query(
            `UPDATE playlists 
             SET name = COALESCE($1, name),
                 energy_profile = COALESCE($2, energy_profile),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND created_by = $4
             RETURNING *`,
            [name, energyProfile ? JSON.stringify(energyProfile) : null, id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Spellista hittades inte' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Kunde inte uppdatera spellista' });
    }
});

// Lägg till låt i spellista
router.post('/:id/songs', authenticateToken, requireBusiness, async (req: any, res) => {
    const { id } = req.params;
    const { songId, position } = req.body;

    try {
        // Kontrollera ägarskap
        const ownerCheck = await pool.query(
            'SELECT created_by FROM playlists WHERE id = $1',
            [id]
        );

        if (!ownerCheck.rows[0] || ownerCheck.rows[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'Ingen behörighet att ändra denna spellista' });
        }

        await pool.query(
            `INSERT INTO playlist_songs (playlist_id, song_id, position)
             VALUES ($1, $2, $3)`,
            [id, songId, position]
        );

        res.status(201).json({ message: 'Låt tillagd i spellistan' });
    } catch (err) {
        res.status(500).json({ error: 'Kunde inte lägga till låt i spellistan' });
    }
});

// Ta bort låt från spellista
router.delete('/:id/songs/:songId', authenticateToken, requireBusiness, async (req: any, res) => {
    const { id, songId } = req.params;

    try {
        // Kontrollera ägarskap
        const ownerCheck = await pool.query(
            'SELECT created_by FROM playlists WHERE id = $1',
            [id]
        );

        if (!ownerCheck.rows[0] || ownerCheck.rows[0].created_by !== req.user.id) {
            return res.status(403).json({ error: 'Ingen behörighet att ändra denna spellista' });
        }

        await pool.query(
            'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
            [id, songId]
        );

        res.json({ message: 'Låt borttagen från spellistan' });
    } catch (err) {
        res.status(500).json({ error: 'Kunde inte ta bort låt från spellistan' });
    }
});

export default router; 