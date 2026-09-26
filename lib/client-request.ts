export class RequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Bound both the connection and response body, so forms always become usable again.
export async function requestJSON<T>(url: string, init: RequestInit = {}, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(init.method === 'POST'
        ? 'Saving took too long to confirm. Your entries are still here. Check your saved progress before submitting again.'
        : 'The connection took too long. Please try again.'));
      controller.abort();
    }, timeoutMs);
  });
  try {
    return await Promise.race([timeout, (async () => {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (response.status === 401)
        throw new RequestError('Your session has ended. Sign in to save. Keep this form open so your entries stay here.', 401);
      if (!response.headers.get('content-type')?.includes('application/json'))
        throw new RequestError('The server could not confirm your request. Your entries are still here. Please try again shortly.', response.status);
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new RequestError(data.error || 'The request could not be completed. Your entries are still here.', response.status);
      return data as T;
    })()]);
  } finally {
    clearTimeout(timer);
  }
}
