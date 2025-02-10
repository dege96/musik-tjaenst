import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { Pool, PoolConfig } from 'pg';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import NodeID3 from 'node-id3';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import os from 'os';
import { z } from 'zod';
import winston from 'winston';

// Types and interfaces
type EnergyLevel = 'low' | 'medium' | 'high' | 'very_high';

interface SongTags {
    title?: string;
    comment?: string | { text: string };
}

interface SongData {
    title: string;
    genre: string;
    duration: number;
    energyLevel: EnergyLevel;
    fileUrl: string;
}

// Configuration schema
const ConfigSchema = z.object({
    aws: z.object({
        region: z.string(),
        accessKeyId: z.string(),
        secretAccessKey: z.string(),
        bucketName: z.string(),
        cloudfrontDomain: z.string(),
    }),
    database: z.object({
        url: z.string().url(),
    }),
    import: z.object({
        batchSize: z.number().int().positive().default(50),
        songsPrefix: z.string().default('songs/'),
    }),
});

// Logger configuration
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'song-import.log' })
    ]
});

class SongImporter {
    private s3Client: S3Client;
    private pool: Pool;
    private config: z.infer<typeof ConfigSchema>;
    private readonly BATCH_SIZE: number;

    constructor(config: z.infer<typeof ConfigSchema>) {
        this.config = config;
        this.BATCH_SIZE = config.import.batchSize;

        this.s3Client = new S3Client({
            region: config.aws.region,
            credentials: {
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey
            }
        });

        this.pool = new Pool({
            connectionString: config.database.url,
        });
    }

    private async streamToBuffer(stream: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const chunks: any[] = [];
            stream.on('data', (chunk: any) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }

    private getEnergyLevel(energyValue: number): EnergyLevel {
        if (energyValue <= 3) return 'low';
        if (energyValue <= 5) return 'medium';
        if (energyValue <= 6) return 'high';
        return 'very_high';
    }

    private async cleanupTempFile(filePath: string): Promise<void> {
        try {
            await fs.unlink(filePath);
        } catch (error) {
            logger.warn(`Failed to remove temporary file: ${filePath}`, { error });
        }
    }

    private parseEnergyLevel(tags: SongTags): EnergyLevel {
        try {
            const commentText = typeof tags.comment === 'string' 
                ? tags.comment 
                : tags.comment?.text || '';
            
            const energyMatch = commentText.match(/Energy[:\s]*(\d+)/i);
            if (energyMatch) {
                return this.getEnergyLevel(parseInt(energyMatch[1], 10));
            }
            
            const numericValue = parseInt(commentText.trim(), 10);
            if (!isNaN(numericValue)) {
                return this.getEnergyLevel(numericValue);
            }
        } catch (error) {
            logger.warn('Failed to parse energy level, using default', { error });
        }
        return 'medium';
    }

    private async processSongFile(fileName: string): Promise<SongData | null> {
        try {
            const fileData = await this.s3Client.send(new GetObjectCommand({
                Bucket: this.config.aws.bucketName,
                Key: fileName,
            }));

            if (!fileData.Body) {
                throw new Error('No file body received from S3');
            }

            const fileBuffer = await this.streamToBuffer(fileData.Body);
            const tags = NodeID3.read(fileBuffer) as SongTags;
            
            // Extract genre from file path
            const genreMatch = fileName.match(/songs\/([^/]+)\//);
            const genre = genreMatch ? genreMatch[1] : 'Unknown';
            
            const title = tags.title || path.basename(fileName, '.mp3');

            // Process duration
            const tempFile = path.join(os.tmpdir(), path.basename(fileName));
            await fs.writeFile(tempFile, fileBuffer);
            
            let duration = 180;
            try {
                duration = Math.round(await getAudioDurationInSeconds(tempFile));
            } catch (error) {
                logger.warn(`Could not read duration for ${fileName}, using default`, { error });
            }
            
            await this.cleanupTempFile(tempFile);

            const energyLevel = this.parseEnergyLevel(tags);
            const fileUrl = `https://${this.config.aws.cloudfrontDomain}/songs/${genre}/${path.basename(fileName)}`;

            return {
                title,
                genre,
                duration,
                energyLevel,
                fileUrl
            };
        } catch (error) {
            logger.error(`Failed to process song file: ${fileName}`, { error });
            return null;
        }
    }

    private async saveSongToDatabase(song: SongData): Promise<boolean> {
        try {
            const existingResult = await this.pool.query(
                'SELECT id FROM songs WHERE title = $1 AND genre = $2',
                [song.title, song.genre]
            );

            if (existingResult.rows.length === 0) {
                await this.pool.query(
                    `INSERT INTO songs (
                        title, 
                        genre, 
                        duration, 
                        file_url, 
                        energy_level, 
                        is_active
                    ) VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        song.title,
                        song.genre,
                        song.duration,
                        song.fileUrl,
                        song.energyLevel,
                        true
                    ]
                );
                return true;
            }
            return false;
        } catch (error) {
            logger.error(`Failed to save song to database: ${song.title}`, { error });
            return false;
        }
    }

    public async importSongs(): Promise<void> {
        try {
            logger.info('Starting song import from S3...');
            
            const { Contents } = await this.s3Client.send(new ListObjectsV2Command({
                Bucket: this.config.aws.bucketName,
                Prefix: this.config.import.songsPrefix,
            }));

            if (!Contents || Contents.length === 0) {
                logger.info('No files found in bucket');
                return;
            }

            logger.info(`Found ${Contents.length} files`);
            
            const mp3Files = Contents.filter(item => 
                item.Key && item.Key.toLowerCase().endsWith('.mp3')
            );

            for (let i = 0; i < mp3Files.length; i += this.BATCH_SIZE) {
                const batch = mp3Files.slice(i, i + this.BATCH_SIZE);
                const batchPromises = batch.map(async (item) => {
                    if (!item.Key) return;
                    
                    const songData = await this.processSongFile(item.Key);
                    if (songData) {
                        const saved = await this.saveSongToDatabase(songData);
                        if (saved) {
                            logger.info(`Imported: ${songData.title} (${songData.genre})`, {
                                energyLevel: songData.energyLevel,
                                duration: songData.duration
                            });
                        } else {
                            logger.info(`Skipped existing song: ${songData.title} (${songData.genre})`);
                        }
                    }
                });

                await Promise.all(batchPromises);
                logger.info(`Processed batch ${i / this.BATCH_SIZE + 1} of ${Math.ceil(mp3Files.length / this.BATCH_SIZE)}`);
            }

            logger.info('Import completed successfully');
        } catch (error) {
            logger.error('Import failed', { error });
            throw error;
        } finally {
            await this.pool.end();
        }
    }
}

// Application startup
async function main() {
    try {
        dotenv.config();

        const config = ConfigSchema.parse({
            aws: {
                region: process.env.AWS_REGION,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                bucketName: process.env.AWS_BUCKET_NAME,
                cloudfrontDomain: process.env.CLOUDFRONT_DISTRIBUTION_NAME,
            },
            database: {
                url: process.env.DATABASE_URL,
            },
            import: {
                batchSize: 50,
                songsPrefix: 'songs/',
            },
        });

        const importer = new SongImporter(config);
        await importer.importSongs();
        process.exit(0);
    } catch (error) {
        logger.error('Application failed', { error });
        process.exit(1);
    }
}

main();