import express, { Request, Response, NextFunction } from 'express';
import { Pool, QueryResult } from 'pg';
import { authenticateToken, requireBusiness } from '../middleware/auth';
import { z } from 'zod';

// Types
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        role: string;
    };
}

// Validation schemas
const PlaylistSchema = z.object({
    name: z.string().min(1).max(100),
    businessType: z.string(),
    energyProfile: z.object({
        low: z.number().min(0).max(100),
        medium: z.number().min(0).max(100),
        high: z.number().min(0).max(100),
    }),
});

const AddSongSchema = z.object({
    songId: z.string(),
    position: z.number().int().min(0),
});

// Database service
export class PlaylistService {
    private pool: Pool;

    constructor(connectionString: string) {
        this.pool = new Pool({ connectionString });
    }

    async getPlaylists(userId: string): Promise<QueryResult> {
        return this.pool.query(
            `SELECT p.*, 
                    COUNT(ps.song_id) as song_count,
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id', s.id,
                            'title', s.title,
                            'duration', s.duration,
                            'energy_level', s.energy_level
                        ) ORDER BY ps.position
                    ) FILTER (WHERE s.id IS NOT NULL) as songs
             FROM playlists p 
             LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
             LEFT JOIN songs s ON ps.song_id = s.id
             WHERE p.created_by = $1 OR p.is_template = true
             GROUP BY p.id
             ORDER BY p.created_at DESC`,
            [userId]
        );
    }

    async createPlaylist(data: z.infer<typeof PlaylistSchema>, userId: string): Promise<QueryResult> {
        return this.pool.query(
            `INSERT INTO playlists (name, created_by, business_type, energy_profile)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [data.name, userId, data.businessType, JSON.stringify(data.energyProfile)]
        );
    }

    async verifyPlaylistOwnership(playlistId: string, userId: string): Promise<boolean> {
        const result = await this.pool.query(
            'SELECT created_by FROM playlists WHERE id = $1',
            [playlistId]
        );
        return result.rows[0]?.created_by === userId;
    }

    async updatePlaylist(
        playlistId: string, 
        userId: string, 
        updates: Partial<z.infer<typeof PlaylistSchema>>
    ): Promise<QueryResult> {
        return this.pool.query(
            `UPDATE playlists 
             SET name = COALESCE($1, name),
                 energy_profile = COALESCE($2, energy_profile),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND created_by = $4
             RETURNING *`,
            [
                updates.name, 
                updates.energyProfile ? JSON.stringify(updates.energyProfile) : null, 
                playlistId, 
                userId
            ]
        );
    }

    async addSong(playlistId: string, songData: z.infer<typeof AddSongSchema>): Promise<void> {
        await this.pool.query(
            `INSERT INTO playlist_songs (playlist_id, song_id, position)
             VALUES ($1, $2, $3)`,
            [playlistId, songData.songId, songData.position]
        );
    }

    async removeSong(playlistId: string, songId: string): Promise<void> {
        await this.pool.query(
            'DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2',
            [playlistId, songId]
        );
    }
}

// Error handling
class PlaylistError extends Error {
    constructor(
        public statusCode: number,
        message: string
    ) {
        super(message);
        this.name = 'PlaylistError';
    }
}

// Router setup
const createPlaylistRouter = (connectionString: string) => {
    const router = express.Router();
    const playlistService = new PlaylistService(connectionString);

    // Error handler middleware
    const asyncHandler = (fn: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<any>) => {
        return (req: Request, res: Response, next: NextFunction) => {
            Promise.resolve(fn(req as AuthenticatedRequest, res, next)).catch(next);
        };
    };

    // Routes
    router.get('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
        const result = await playlistService.getPlaylists(req.user.id);
        res.json(result.rows);
    }));

    router.post('/', authenticateToken, requireBusiness, asyncHandler(async (req: AuthenticatedRequest, res) => {
        const validatedData = PlaylistSchema.parse(req.body);
        const result = await playlistService.createPlaylist(validatedData, req.user.id);
        res.status(201).json(result.rows[0]);
    }));

    router.put('/:id', authenticateToken, requireBusiness, asyncHandler(async (req: AuthenticatedRequest, res) => {
        const { id } = req.params;
        const validatedData = PlaylistSchema.partial().parse(req.body);

        const hasAccess = await playlistService.verifyPlaylistOwnership(id, req.user.id);
        if (!hasAccess) {
            throw new PlaylistError(403, 'Ingen behörighet att ändra denna spellista');
        }

        const result = await playlistService.updatePlaylist(id, req.user.id, validatedData);
        if (result.rows.length === 0) {
            throw new PlaylistError(404, 'Spellista hittades inte');
        }

        res.json(result.rows[0]);
    }));

    router.post('/:id/songs', authenticateToken, requireBusiness, asyncHandler(async (req: AuthenticatedRequest, res) => {
        const { id } = req.params;
        const validatedData = AddSongSchema.parse(req.body);

        const hasAccess = await playlistService.verifyPlaylistOwnership(id, req.user.id);
        if (!hasAccess) {
            throw new PlaylistError(403, 'Ingen behörighet att ändra denna spellista');
        }

        await playlistService.addSong(id, validatedData);
        res.status(201).json({ message: 'Låt tillagd i spellistan' });
    }));

    router.delete('/:id/songs/:songId', authenticateToken, requireBusiness, asyncHandler(async (req: AuthenticatedRequest, res) => {
        const { id, songId } = req.params;

        const hasAccess = await playlistService.verifyPlaylistOwnership(id, req.user.id);
        if (!hasAccess) {
            throw new PlaylistError(403, 'Ingen behörighet att ändra denna spellista');
        }

        await playlistService.removeSong(id, songId);
        res.json({ message: 'Låt borttagen från spellistan' });
    }));

    // Error handling middleware
    router.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (err instanceof z.ZodError) {
            return res.status(400).json({ error: 'Ogiltig data', details: err.errors });
        }
        if (err instanceof PlaylistError) {
            return res.status(err.statusCode).json({ error: err.message });
        }
        console.error(err);
        res.status(500).json({ error: 'Ett internt serverfel inträffade' });
    });

    return router;
}

export default createPlaylistRouter;