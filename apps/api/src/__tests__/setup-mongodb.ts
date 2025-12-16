// This script downloads the MongoDB binary for testing
// Run with: npx tsx src/__tests__/setup-mongodb.ts

import { MongoMemoryServer } from 'mongodb-memory-server';

async function downloadMongoDB() {
    console.log('Starting MongoDB binary download...');
    console.log('This may take a few minutes on first run.');

    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    console.log('MongoDB Memory Server started successfully!');
    console.log('URI:', uri);

    await mongod.stop();
    console.log('MongoDB Memory Server stopped.');
    console.log('Binary download complete. Tests should now run faster.');
}

downloadMongoDB().catch(console.error);
