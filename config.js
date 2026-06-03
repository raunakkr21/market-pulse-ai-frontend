/* Market Pulse AI: Environment-Aware Connection Configuration */

const isLocalhost = window.location.hostname === "localhost" || 
                     window.location.hostname === "127.0.0.1" || 
                     window.location.hostname === "" || 
                     window.location.protocol === "file:";

// Map FastAPI backend ports dynamically based on host location
window.API_BASE_URL = isLocalhost ? "http://localhost:8000" : "https://market-pulse-ai-production-5400.up.railway.app";
window.WS_BASE_URL = isLocalhost ? "ws://localhost:8000" : "wss://market-pulse-ai-production-5400.up.railway.app";

console.log(`[CONFIG] Active Ingest endpoints initialized: API=${window.API_BASE_URL}, WS=${window.WS_BASE_URL}`);
