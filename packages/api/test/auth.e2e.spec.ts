import createApp from '../src/app';
import { useIsolatedDb } from './helpers/db';

describe('Auth E2E', () => {
  const iso = useIsolatedDb();
  const app = createApp();

  it('registers and logs in a business owner, then gets profile', async () => {
    const email = `owner+${Date.now()}@example.com`;
    const register = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'StrongPass123!',
        name: 'Owner Test',
        role: 'business_owner',
        phone: '+1234567890'
      })
    });
    expect(register.status).toBe(200);
    const regJson = await register.json();
    expect(regJson.success).toBe(true);
    expect(regJson.data.token).toBeDefined();

    const login = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'StrongPass123!' })
    });
    expect(login.status).toBe(200);
    const { data: loginData } = await login.json();
    expect(loginData.token).toBeDefined();

    const me = await app.request('/api/auth/me', {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });
    expect(me.status).toBe(200);
    const meJson = await me.json();
    expect(meJson.data.user.email).toBe(email);
  });
  afterAll(() => iso.cleanup());
});


