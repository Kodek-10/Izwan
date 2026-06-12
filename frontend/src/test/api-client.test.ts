import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../lib/api-client';

// Mock fetch
global.fetch = vi.fn();

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should have a signup method', () => {
    expect(typeof api.signup).toBe('function');
  });

  it('signup should call register and then login', async () => {
    const mockRegisterResponse = {
      ok: true,
      json: () => Promise.resolve({ id: 1, username: 'testuser' }),
    };

    const mockLoginResponse = {
      ok: true,
      json: () => Promise.resolve({ access_token: 'fake-token' }),
    };

    (global.fetch as any)
      .mockResolvedValueOnce(mockRegisterResponse)
      .mockResolvedValueOnce(mockLoginResponse);

    const result = await api.signup('testuser', 'password');

    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenNthCalledWith(1, expect.stringContaining('/auth/register'), expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ username: 'testuser', password: 'password' }),
    }));
    expect(global.fetch).toHaveBeenNthCalledWith(2, expect.stringContaining('/auth/login'), expect.anything());
    
    expect(result.access_token).toBe('fake-token');
    expect(localStorage.getItem('token')).toBe('fake-token');
  });
});
