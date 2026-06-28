import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createPostgresClient } from './connection';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = createPostgresClient(connectionString, { max: 1 });
  const db = drizzle(sql);

  try {
    console.log('Applying migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await sql.end();
  }
}

main();
