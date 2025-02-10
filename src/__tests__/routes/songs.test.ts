import request from 'supertest';
import { app } from '../../server';
import { Pool } from 'pg';

describe('Songs API', () => {
  let pool: Pool;

  beforeAll(async () => {
    const testDbUrl = process.env.TEST_DATABASE_URL;
    if (!testDbUrl) {
      throw new Error('TEST_DATABASE_URL är inte satt');
    }
    pool = new Pool({ connectionString: testDbUrl });
  });

  afterAll(async () => {
    await pool.end();
    // Stäng alla öppna anslutningar
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  it('should return all songs', async () => {
    const response = await request(app)
      .get('/api/songs')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('title');
    expect(response.body[0]).toHaveProperty('genre');
    expect(response.body[0]).toHaveProperty('energy_level');
  });

  it('should filter songs by energy level', async () => {
    const response = await request(app)
      .get('/api/songs/energy/high')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    response.body.forEach((song: any) => {
      expect(song.energy_level).toBe('high');
    });
  });
}); 