import createApp from '../src/app';
import { useIsolatedDb } from './helpers/db';
async function bootstrapOwner(app) {
    const email = `owner+${Date.now()}@example.com`;
    const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'StrongPass123!', name: 'Owner', role: 'business_owner' })
    });
    const json = await res.json();
    return { token: json.data.token, email };
}
describe('Orders E2E', () => {
    const iso = useIsolatedDb();
    const app = createApp();
    it('creates and lists orders with pagination clamp', async () => {
        const { token } = await bootstrapOwner(app);
        const create = await app.request('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                customerName: 'Alice',
                pickupAddress: 'A', pickupLatitude: 1, pickupLongitude: 1,
                deliveryAddress: 'B', deliveryLatitude: 2, deliveryLongitude: 2,
                priority: 'medium'
            })
        });
        expect(create.status).toBe(201);
        const list = await app.request('/api/orders?limit=500', {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(list.status).toBe(200);
        const data = await list.json();
        expect(data.data.pagination.limit).toBeLessThanOrEqual(100);
    });
    afterAll(() => iso.cleanup());
});
//# sourceMappingURL=orders.e2e.spec.js.map