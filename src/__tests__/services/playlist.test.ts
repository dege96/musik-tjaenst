import { PlaylistService } from '../../server/routes/playlists';
import { Pool } from 'pg';

describe('PlaylistService', () => {
  let playlistService: PlaylistService;
  let pool: Pool;

  beforeAll(() => {
    const testDbUrl = process.env.TEST_DATABASE_URL;
    if (!testDbUrl) {
      throw new Error('TEST_DATABASE_URL är inte satt');
    }

    pool = new Pool({ connectionString: testDbUrl });
    playlistService = new PlaylistService(testDbUrl);
  });

  afterAll(async () => {
    await pool.end();
    // Stäng alla öppna anslutningar
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  it('should create a playlist', async () => {
    const playlistData = {
      name: 'Test Playlist',
      businessType: 'gym',
      energyProfile: { low: 0, medium: 30, high: 70 }
    };

    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    const userId = userResult.rows[0].id;

    const result = await playlistService.createPlaylist(playlistData, userId);
    expect(result.rows[0]).toHaveProperty('id');
    expect(result.rows[0].name).toBe(playlistData.name);
  });
}); 