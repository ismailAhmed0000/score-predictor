import postgres, { type Options } from 'postgres';

function isSupabaseUrl(connectionString: string): boolean {
  return (
    connectionString.includes('supabase.co') ||
    connectionString.includes('pooler.supabase.com')
  );
}

function usesTransactionPooler(connectionString: string): boolean {
  return (
    /:6543(\/|$|\?)/.test(connectionString) ||
    connectionString.includes('pooler.supabase.com')
  );
}

export function createPostgresClient(
  connectionString: string,
  overrides: Options<Record<string, never>> = {},
) {
  const isSupabase = isSupabaseUrl(connectionString);

  return postgres(connectionString, {
    ssl: isSupabase ? 'require' : undefined,
    // Required for Supabase transaction pooler; safe for session pooler too.
    prepare: usesTransactionPooler(connectionString) ? false : undefined,
    ...overrides,
  });
}
