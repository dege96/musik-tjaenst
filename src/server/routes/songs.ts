import express from 'express';
import multer from 'multer';
import NodeID3 from 'node-id3';
import path from 'path';
import fs from 'fs/promises';
import pool from '../../database/connection';

const router = express.Router();

// Konfigurera multer för MP3-uppladdning med lokal lagring
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(process.cwd(), 'public', 'songs'));
    },
    filename: (req, file, cb) => {
        // Generera unikt filnamn
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') {
            cb(null, true);
        } else {
            cb(new Error('Endast MP3-filer är tillåtna'));
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB gräns
    }
});

// Hämta alla låtar
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM songs ORDER BY title ASC'
        );
        
        // Lägg till fullständig URL för varje låt och hantera specialtecken
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

// Ladda upp ny låt (endast admin)
router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Ingen fil uppladdad' });
    }

    try {
        // Läs filen som buffer först
        const fileBuffer = await fs.readFile(req.file.path);
        // Läs ID3-taggar från buffern
        const tags = NodeID3.read(fileBuffer);
        
        // Sätt standardvärden för energinivå
        const energyLevel = req.body.energy_level || 'medium';
        
        // Använd mappningen för att få genre från filsökvägen
        const filePath = req.file.path;
        const genreFromPath = path.dirname(filePath).split(path.sep).pop() || 'Okänd';

        // Spara i databasen
        const result = await pool.query(
            `INSERT INTO songs (title, genre, duration, file_url, energy_level, is_active)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                tags.title || path.basename(req.file.originalname, '.mp3'),
                genreFromPath,
                req.body.duration || 0,
                req.file.filename,
                energyLevel,
                true
            ]
        );

        // Lägg till fullständig URL i svaret
        const song = {
            ...result.rows[0],
            file_url: `/songs/${result.rows[0].file_url}`
        };

        res.status(201).json(song);
    } catch (err) {
        console.error('Uppladdningsfel:', err);
        // Ta bort filen om något går fel
        if (req.file) {
            await fs.unlink(req.file.path).catch(console.error);
        }
        res.status(500).json({ error: 'Kunde inte ladda upp låten' });
    }
});

// Uppdatera låtinformation (endast admin)
router.put('/:id', async (req, res) => {
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
            file_url: `/songs/${result.rows[0].file_url}`
        };

        res.json(song);
    } catch (err) {
        res.status(500).json({ error: 'Kunde inte uppdatera låten' });
    }
});

// Ta bort låt (endast admin)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Hämta filnamnet först
        const fileResult = await pool.query(
            'SELECT file_url FROM songs WHERE id = $1',
            [id]
        );

        if (fileResult.rows.length === 0) {
            return res.status(404).json({ error: 'Låt hittades inte' });
        }

        // Ta bort filen från disk
        const filePath = path.join(process.cwd(), 'public', 'songs', fileResult.rows[0].file_url);
        await fs.unlink(filePath).catch(console.error);

        // Ta bort från databasen
        await pool.query('DELETE FROM songs WHERE id = $1', [id]);

        res.json({ message: 'Låt borttagen' });
    } catch (err) {
        console.error('Fel vid borttagning av låt:', err);
        res.status(500).json({ error: 'Kunde inte ta bort låten' });
    }
});

// Hämta låtar efter energinivå
router.get('/energy/:level', async (req, res) => {
    const { level } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM songs WHERE energy_level = $1 AND is_active = true ORDER BY title ASC',
            [level]
        );

        // Lägg till fullständig URL för varje låt
        const songs = result.rows.map(song => ({
            ...song,
            file_url: `/songs/${song.file_url}`
        }));

        res.json(songs);
    } catch (err) {
        res.status(500).json({ error: 'Kunde inte hämta låtar' });
    }
});

export default router; 