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

// Handle pool errors
pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Test connection on startup
export async function connectDatabase(): Promise<void> {
    try {
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database');

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
    await pool.end();
    console.log('🔌 Database connection pool closed');
} 