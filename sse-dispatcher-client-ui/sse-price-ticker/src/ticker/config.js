// config.js

const host = 'http://localhost';
const port = '8080';

const config = {
    urls: {
        sse: `${host}:${port}/stream-sse`,
        startAllPricing: `${host}:${port}/startAllPricing`,
        pauseAllPricing: `${host}:${port}/pauseAllPricing`,
        startPricing: `${host}:${port}/startPricing`,
        pausePricing: `${host}:${port}/pausePricing`,
        ccyPairs: `${host}:${port}/ccyPairs`,
        pricingState: `${host}:${port}/pricingState`
    },
    maxReconnectAttempts: 5,
    reconnectBaseDelay: 1000 // in milliseconds
};

export default config;