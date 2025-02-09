import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import NodeID3 from 'node-id3';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import os from 'os';

dotenv.config();

const s3Client = new S3Client({ 
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

// Förbättrad streamToBuffer-funktion för S3 streams
async function streamToBuffer(stream: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk: any) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

async function listFiles() {
    try {
        console.log('Ansluter till S3...');
        const bucketName = process.env.AWS_BUCKET_NAME;
        const params = {
            Bucket: bucketName,
            Prefix: 'songs/',
        };

        // Hämta lista över objekt i S3-bucketen
        console.log('Hämtar fillista...');
        const { Contents } = await s3Client.send(new ListObjectsV2Command(params));
        
        if (!Contents) {
            console.log('Inga filer hittades i bucketen.');
            return;
        }

        console.log(`Hittade ${Contents.length} filer. Analyserar metadata...`);
        console.log('----------------------------------------');

        for (const item of Contents) {
            if (!item.Key) continue;
            
            const fileName = item.Key;
            if (!fileName.toLowerCase().endsWith('.mp3')) continue;

            console.log(`\nFil: ${fileName}`);
            console.log('Storlek:', Math.round(item.Size! / 1024), 'KB');

            try {
                // Hämta filen för att läsa metadata
                const fileData = await s3Client.send(new GetObjectCommand({
                    Bucket: bucketName,
                    Key: fileName,
                }));

                if (fileData.Body) {
                    const fileBuffer = await streamToBuffer(fileData.Body);
                    const tags = NodeID3.read(fileBuffer);

                    // Spara temporärt till disk för att kunna läsa längden
                    const tempFile = path.join(os.tmpdir(), path.basename(fileName));
                    await fs.writeFile(tempFile, fileBuffer);
                    
                    // Läs låtlängd
                    let duration = 0;
                    try {
                        duration = await getAudioDurationInSeconds(tempFile);
                    } catch (error) {
                        console.warn(`Kunde inte läsa längd för ${fileName}`);
                    }
                    
                    // Ta bort temporär fil
                    await fs.unlink(tempFile).catch(console.error);

                    console.log('Metadata:');
                    console.log('- Titel:', tags.title || 'Saknas');
                    console.log('- Artist:', tags.artist || 'Saknas');
                    console.log('- Album:', tags.album || 'Saknas');
                    console.log('- Genre:', tags.genre || 'Saknas');
                    console.log('- Längd:', duration ? `${Math.floor(duration/60)}:${Math.round(duration%60).toString().padStart(2, '0')}` : 'Saknas');

                    if (tags.comment) {
                        const commentText = typeof tags.comment === 'string' 
                            ? tags.comment 
                            : tags.comment.text || '';
                        console.log('- Kommentar:', commentText);
                        
                        // Försök hitta energinivå i kommentaren
                        const energyMatch = commentText.match(/Energy[:\s]*(\d+)/i);
                        if (energyMatch) {
                            const energyValue = parseInt(energyMatch[1], 10);
                            console.log('- Energinivå:', energyValue);
                        }
                    }
                }
            } catch (error) {
                console.error(`Kunde inte läsa metadata för ${fileName}:`, error);
            }
            console.log('----------------------------------------');
        }

        console.log('\nAnalys slutförd!');
    } catch (error) {
        console.error('Ett fel uppstod:', error);
    }
}

// Kör skriptet
console.log('Startar S3-musikanalys...\n');
listFiles(); 