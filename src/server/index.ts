import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import songsRouter from './routes/songs';
import playlistsRouter from './routes/playlists';
import path from 'path';

// Ladda miljövariabler
dotenv.config();

const app = express();
const port = process.env.PORT || 3004;

// Konfigurera CORS
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3004',
        'http://localhost:3005',
        'http://localhost:3006',
        'http://localhost:3007',
        'http://localhost:3008',
        'https://musik-tjaenst.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 600,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Statiska filer
app.use('/songs', express.static(path.join(process.cwd(), 'public', 'songs'), {
    setHeaders: (res, filePath) => {
        if (path.extname(filePath) === '.mp3') {
            res.set('Content-Type', 'audio/mpeg');
        }
    }
}));
app.use(express.static(path.join(process.cwd(), 'public')));

// Databasanslutning
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Testa databasanslutningen
pool.connect()
    .then(() => console.log('Ansluten till databasen'))
    .catch(err => {
        console.error('Databasanslutningsfel:', err);
        process.exit(1);
    });

// Routes
app.use('/api/songs', songsRouter);
app.use('/api/playlists', playlistsRouter);

// Hälsokontroll
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// Felhantering
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Ett internt serverfel har inträffat',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Starta servern
app.listen(port, () => {
    console.log(`Server körs på port ${port}`);
    console.log(`CORS tillåter anslutningar från: ${corsOptions.origin.join(', ')}`);
}); 