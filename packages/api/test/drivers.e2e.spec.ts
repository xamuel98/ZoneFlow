import createApp from '../src/app';
import { useIsolatedDb } from './helpers/db';

async function bootstrapOwner(app: any) {
  const email = `owner+${Date.now()}@example.com`;
  const register = await app.request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'StrongPass123!', name: 'Owner', role: 'business_owner' })
  });
  const reg = await register.json();
  return { token: reg.data.token, email };
}

describe('Drivers E2E', () => {
  const iso = useIsolatedDb();
  const app = createApp();

  it('creates and lists drivers with clamped pagination', async () => {
    const { token } = await bootstrapOwner(app);

    const create = await app.request('/api/drivers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: 'Driver Test',
        email: `driver+${Date.now()}@example.com`,
        phone: '5555555555',
        vehicleType: 'bike'
      })
    });
    expect(create.status).toBe(201);

    const list = await app.request('/api/drivers?limit=1000', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(list.status).toBe(200);
    const json = await list.json();
    expect(json.data.pagination.limit).toBeLessThanOrEqual(100);
  });
  afterAll(() => iso.cleanup());
});


