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
const port = process.env.PORT || 3006;

// CORS konfiguration
const allowedOrigins = [
    'http://localhost:3007',
    'http://localhost:3000',
    'https://musik-tjaenst.vercel.app',
    'https://musik-tjaenst-production.up.railway.app'
];

// Om CORS_ORIGIN är satt som kommaseparerad lista, lägg till dessa också
if (process.env.CORS_ORIGIN) {
    const corsOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
    allowedOrigins.push(...corsOrigins);
}

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log('Blocked origin:', origin); // För debugging
            const msg = 'CORS policy på denna sida tillåter inte access från den här ursprungsdomänen.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

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

if (process.env.NODE_ENV === 'development') {
    console.log('Körs i utvecklingsläge');
} else {
    console.log('Körs i produktionsläge');
}

// Felhantering
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Ett internt serverfel har inträffat',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server körs på port ${port}`);
        console.log(`CORS tillåter anslutningar från: ${allowedOrigins.join(', ')}`);
    });
}

export { app }; 