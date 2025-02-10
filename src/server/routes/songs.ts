import express, { Request, Response } from 'express';
import path from 'path';
import pool from '../../database/connection';

const router = express.Router();

// Hämta alla låtar
router.get('/', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(
            'SELECT * FROM songs ORDER BY title ASC'
        );
        
        // Lägg till fullständig URL för varje låt
        const songs = result.rows.map(song => ({
            ...song,
            file_url: `/songs/${encodeURIComponent(song.genre)}/${encodeURIComponent(path.basename(song.file_url))}`
        }));
        
        res.json(songs);
    } catch (err) {
        console.error('Fel vid hämtning av låtar:', err);
        res.status(500).json({ error: 'Kunde inte hämta låtar' });
    }
});

// Uppdatera låtinformation (endast admin)
router.put('/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, genre, energy_level, is_active, duration } = req.body;

    try {
        const result = await pool.query(
            `UPDATE songs 
             SET title = COALESCE($1, title),
                 genre = COALESCE($2, genre),
                 energy_level = COALESCE($3, energy_level),
                 is_active = COALESCE($4, is_active),
                 duration = COALESCE($5, duration)
             WHERE id = $6
             RETURNING *`,
            [title, genre, energy_level, is_active, duration, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Låt hittades inte' });
        }

        // Lägg till fullständig URL i svaret
        const song = {
            ...result.rows[0],
            file_url: `/songs/${encodeURIComponent(path.basename(result.rows[0].file_url))}`
        };

        res.json(song);
    } catch (err) {
        console.error('Fel vid uppdatering av låt:', err);
        res.status(500).json({ error: 'Kunde inte uppdatera låten' });
    }
});

// Hämta låtar efter energinivå
router.get('/energy/:level', async (req: Request, res: Response) => {
    const { level } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM songs WHERE energy_level = $1 AND is_active = true ORDER BY title ASC',
            [level]
        );

        // Lägg till fullständig URL för varje låt
        const songs = result.rows.map(song => ({
            ...song,
            file_url: `/songs/${encodeURIComponent(path.basename(song.file_url))}`
        }));

        res.json(songs);
    } catch (err) {
        console.error('Fel vid hämtning av låtar efter energinivå:', err);
        res.status(500).json({ error: 'Kunde inte hämta låtar' });
    }
});

export default router;
