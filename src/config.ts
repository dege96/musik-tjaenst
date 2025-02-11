const isProduction = process.env.NODE_ENV === 'production';

export const API_BASE_URL = isProduction 
    ? process.env.REACT_APP_API_URL || 'https://musik-tjaenst-production.up.railway.app'
    : 'http://localhost:3006';

console.log('Using API URL:', API_BASE_URL); // För debugging

export default {
    API_BASE_URL
}; 