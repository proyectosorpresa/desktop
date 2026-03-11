// ton-block-sync.ts

// This script synchronizes blocks from the TON blockchain with caching and database storage.

// Import necessary libraries
const axios = require('axios');
const NodeCache = require('node-cache');
const { Client } = require('pg'); // PostgreSQL client

// Configuration
const cache = new NodeCache();
const dbClient = new Client({
    user: 'your_db_user',
    host: 'localhost',
    database: 'ton_blocks',
    password: 'your_db_password',
    port: 5432,
});

// Connect to the database
async function connectDB() {
    await dbClient.connect();
}

// Fetch block data from the TON blockchain
async function fetchBlockData(blockNumber) {
    const response = await axios.get(`https://ton-blockchain-api-url/blocks/${blockNumber}`);
    return response.data;
}

// Save block data to the database
async function saveBlockData(blockData) {
    const query = 'INSERT INTO blocks(id, data) VALUES($1, $2) ON CONFLICT (id) DO NOTHING;';
    await dbClient.query(query, [blockData.id, JSON.stringify(blockData)]);
}

// Synchronize blocks
async function syncBlocks(blockRange) {
    for (let blockNumber = blockRange.start; blockNumber <= blockRange.end; blockNumber++) {
        // Check cache first
        const cachedData = cache.get(`block_${blockNumber}`);
        if (cachedData) {
            console.log(`Block ${blockNumber} retrieved from cache.`);
            continue;
        }

        // Fetch block data from the API
        const blockData = await fetchBlockData(blockNumber);
        if (blockData) {
            // Save to cache
            cache.set(`block_${blockNumber}`, blockData);
            // Save to database
            await saveBlockData(blockData);
            console.log(`Block ${blockNumber} synced and saved.`);
        } else {
            console.log(`Block ${blockNumber} not found.`);
        }
    }
}

// Main function
(async () => {
    await connectDB();
    await syncBlocks({ start: 1, end: 100 }); // Sync blocks from 1 to 100
    await dbClient.end();
    console.log('Synchronization complete.');
})();