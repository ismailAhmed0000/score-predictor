export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const body: unknown = await res.json();
    if (body && typeof body === 'object' && 'message' in body) {
      const message = (body as { message: string | string[] }).message;
      return Array.isArray(message) ? message.join(', ') : message;
    }
  } catch {
    // response wasn't JSON
  }
  return res.statusText || `Request failed (${res.status})`;
}
