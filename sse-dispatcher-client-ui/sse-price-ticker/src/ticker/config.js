// src/config.js
const config = {
    sseUrl: 'http://localhost:8080/stream-sse',
    maxReconnectAttempts: 10,
    reconnectBaseDelay: 1000, // in milliseconds
};

export default config;