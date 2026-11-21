export { errorMessage } from './utils';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const baseUrl = import.meta.env.VITE_API_URL ?? '';

const parseError = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? 'Request failed. Please try again.';
  } catch {
    return 'Request failed. Please try again.';
  }
};

export const api = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const isForm = options.body instanceof FormData;
  const response = await fetch(`${baseUrl}/api${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const message = await parseError(response);
    if (response.status === 401 && !path.startsWith('/auth/login')) {
      window.dispatchEvent(new CustomEvent('api:unauthorized'));
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
};

export const downloadFile = async (path: string): Promise<void> => {
  const response = await fetch(`${baseUrl}/api${path}`, { credentials: 'include' });
  if (!response.ok) throw new ApiError(await parseError(response), response.status);

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="([^"]+)"/);
  const filename = match?.[1] ?? 'dreamers-fellowship-report.pdf';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const toQuery = (values: Record<string, string | number | undefined | null>): string => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};
