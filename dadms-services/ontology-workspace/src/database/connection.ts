import { Pool, PoolConfig } from 'pg';

const poolConfig: PoolConfig = {
    user: process.env['DB_USER'] || 'dadms_user',
    host: process.env['DB_HOST'] || 'localhost',
    database: process.env['DB_NAME'] || 'dadms',
    password: process.env['DB_PASSWORD'] || 'dadms_password',
    port: parseInt(process.env['DB_PORT'] || '5432'),
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

// Error handling for the pool
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test connection on startup
export async function connectDatabase(): Promise<void> {
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database (Ontology Workspace Service)');

        // Test query
        const result = await client.query('SELECT NOW()');
        console.log('📅 Database time:', result.rows[0].now);

        client.release();
    } catch (error) {
        console.error('❌ Failed to connect to database:', error);
        throw error;
    }
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
    try {
        await pool.end();
        console.log('🔌 Database connection pool closed');
    } catch (error) {
        console.error('❌ Error closing database connection:', error);
    }
}

// Database health check
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; responseTime: number; error?: string }> {
    const start = Date.now();
    try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();

        return {
            healthy: true,
            responseTime: Date.now() - start
        };
    } catch (error) {
        return {
            healthy: false,
            responseTime: Date.now() - start,
            error: error instanceof Error ? error.message : 'Unknown database error'
        };
    }
} 