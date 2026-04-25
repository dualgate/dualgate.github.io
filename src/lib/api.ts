const API_BASE = import.meta.env.VITE_API_URL || '';

export interface PersonalDevice {
  email: string;
  uuid: string;
  is_active: boolean;
  tier: string;
  created_at: string | null;
  name?: string;
}

class ApiClient {
  private token: string | null = null;

  setToken(t: string) {
    this.token = t;
    localStorage.setItem('jwt', t);
  }

  loadToken(): string | null {
    this.token = localStorage.getItem('jwt');
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('jwt');
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
    const resp = await fetch(`${API_BASE}${path}`, { ...init, headers });
    if (resp.status === 401) {
      this.clearToken();
      window.dispatchEvent(new Event('session-expired'));
      throw new Error('SESSION_EXPIRED');
    }
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}));
      throw new Error(body.detail || `Error ${resp.status}`);
    }
    return resp.json();
  }

  // Auth (same as web-portal)
  requestCode(email: string) {
    return this.request<{ status: string; cooldown: number }>('/api/web/auth', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  verify(email: string, code: string) {
    return this.request<{ token: string; user: { id: number; email: string } }>('/api/web/verify', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  // Personal VLESS devices
  getPersonalDevices() {
    return this.request<{ devices: PersonalDevice[]; count: number }>('/api/personal/devices');
  }

  createPersonalDevice(name: string = 'Personal Device') {
    return this.request<{ device: PersonalDevice }>('/api/personal/devices', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  deletePersonalDevice(email: string) {
    return this.request<{ status: string }>(`/api/personal/devices/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();
