// Typed client for the SyncWire server auth API.
// Base URL is configurable per environment; default matches the local
// docker-compose port mapping (app service → 18080).

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:18080/api';

export interface DeviceInfo {
  name: string;
  platform: 'web' | 'android';
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; displayName: string };
  device: { id: string; name: string };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function post<T>(
  path: string,
  body: unknown,
  accessToken?: string,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the SyncWire server. Is it running?');
  }

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (Array.isArray(data.message)) message = data.message.join('; ');
      else if (data.message) message = data.message;
    } catch {
      // non-JSON error body — keep statusText
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** The `device` block the server requires on register/login. */
export function webDeviceInfo(): DeviceInfo {
  const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser';
  return { name: `${browser} (Web)`, platform: 'web' };
}

export const authApi = {
  register(input: { email: string; password: string; displayName: string }) {
    return post<AuthResult>('/auth/register', {
      ...input,
      device: webDeviceInfo(),
    });
  },
  login(input: { email: string; password: string }) {
    return post<AuthResult>('/auth/login', {
      ...input,
      device: webDeviceInfo(),
    });
  },
  refresh(refreshToken: string) {
    return post<AuthResult>('/auth/refresh', { refreshToken });
  },
  logout(accessToken: string, refreshToken: string) {
    return post<void>('/auth/logout', { refreshToken }, accessToken);
  },
};
