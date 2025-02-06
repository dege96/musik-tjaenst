const isProduction = process.env.NODE_ENV === 'production';

export const API_BASE_URL = isProduction 
    ? 'https://musik-tjaenst-production.up.railway.app'  // Railway URL
    : 'http://localhost:3006';  // Lokal utvecklings-URL

export default {
    API_BASE_URL
}; 