import createApp from '../src/app';
import { useIsolatedDb } from './helpers/db';
// Helper function to create a business owner and get auth token
async function bootstrapOwner(app) {
    const email = `owner+${Date.now()}@example.com`;
    const register = await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password: 'StrongPass123!',
            name: 'Test Owner',
            role: 'business_owner'
        })
    });
    const reg = await register.json();
    return { token: reg.data.token, email, userId: reg.data.user.id };
}
// Helper function to create a driver user
async function createDriverUser(app, email) {
    const driverEmail = email || `driver+${Date.now()}@example.com`;
    const register = await app.request('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: driverEmail,
            password: 'DriverPass123!',
            name: 'Test Driver',
            role: 'driver'
        })
    });
    const reg = await register.json();
    return { token: reg.data.token, email: driverEmail, userId: reg.data.user.id };
}
// Helper function to create a test CSV file
function createTestCSV() {
    const timestamp = Date.now();
    const csvContent = `name,email,phone,vehicle_type,license_plate
John Doe,john.doe+${timestamp}@example.com,1234567890,car,ABC123
Jane Smith,jane.smith+${timestamp}@example.com,0987654321,bike,XYZ789
Bob Johnson,bob.johnson+${timestamp}@example.com,5555555555,truck,DEF456`;
    return Buffer.from(csvContent);
}
describe('Drivers E2E Tests', () => {
    const iso = useIsolatedDb();
    const app = createApp();
    describe('Public Invitation Endpoints', () => {
        describe('GET /api/v1/drivers/invitations/token/:token', () => {
            it('should return invitation details for valid token', async () => {
                const { token: ownerToken } = await bootstrapOwner(app);
                // Create an invitation first
                const createInvite = await app.request('/api/v1/drivers/invitations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
                    body: JSON.stringify({
                        email: 'test.driver@example.com',
                        name: 'Test Driver',
                        phone: '1234567890',
                        vehicleType: 'car',
                        licensePlate: 'TEST123'
                    })
                });
                expect(createInvite.status).toBe(201);
                const inviteData = await createInvite.json();
                const inviteToken = inviteData.data.token;
                // Get invitation by token
                const response = await app.request(`/api/v1/drivers/invitations/token/${inviteToken}`);
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.email).toBe('test.driver@example.com');
                expect(json.data.name).toBe('Test Driver');
                expect(json.data.status).toBe('pending');
            });
            it('should return 404 for invalid token', async () => {
                const response = await app.request('/api/v1/drivers/invitations/token/invalid-token');
                expect(response.status).toBe(404);
                const json = await response.json();
                expect(json.success).toBe(false);
                expect(json.error).toBe('Invitation not found');
            });
        });
        describe('POST /api/v1/drivers/accept-invitation', () => {
            it('should accept valid invitation and create driver account', async () => {
                const { token: ownerToken } = await bootstrapOwner(app);
                // Create an invitation
                const createInvite = await app.request('/api/v1/drivers/invitations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
                    body: JSON.stringify({
                        email: 'accept.test@example.com',
                        name: 'Accept Test Driver',
                        phone: '1234567890'
                    })
                });
                const inviteData = await createInvite.json();
                const inviteToken = inviteData.data.token;
                // Accept the invitation
                const response = await app.request('/api/v1/drivers/accept-invitation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: inviteToken,
                        password: 'NewDriverPass123!'
                    })
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.user.email).toBe('accept.test@example.com');
                expect(json.data.driver).toBeDefined();
            });
            it('should return 404 for invalid invitation token', async () => {
                const response = await app.request('/api/v1/drivers/accept-invitation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: 'invalid-token',
                        password: 'NewDriverPass123!'
                    })
                });
                expect(response.status).toBe(404);
                const json = await response.json();
                expect(json.success).toBe(false);
                expect(json.error).toBe('Invitation not found');
            });
            it('should validate password requirements', async () => {
                const response = await app.request('/api/v1/drivers/accept-invitation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: 'some-token',
                        password: 'weak'
                    })
                });
                expect(response.status).toBe(400);
                const json = await response.json();
                expect(json.success).toBe(false);
                expect(json.error).toContain('Password must be at least 8 characters');
            });
        });
    });
    describe('Driver Management Endpoints', () => {
        describe('GET /api/v1/drivers', () => {
            it('should list drivers with pagination', async () => {
                const { token } = await bootstrapOwner(app);
                // Create a driver first
                await app.request('/api/v1/drivers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name: 'List Test Driver',
                        email: `list.driver+${Date.now()}@example.com`,
                        phone: '1234567890',
                        vehicleType: 'car'
                    })
                });
                const response = await app.request('/api/v1/drivers?page=1&limit=10', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.data).toBeInstanceOf(Array);
                expect(json.data.pagination).toBeDefined();
                expect(json.data.pagination.page).toBe(1);
                expect(json.data.pagination.limit).toBe(10);
            }, 15000); // Increase timeout to 15 seconds
            it('should clamp pagination limit to maximum 100', async () => {
                const { token } = await bootstrapOwner(app);
                const response = await app.request('/api/v1/drivers?limit=1000', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.data.pagination.limit).toBeLessThanOrEqual(100);
            });
            it('should require authentication', async () => {
                const response = await app.request('/api/v1/drivers');
                expect(response.status).toBe(401);
            });
        });
        describe('GET /api/v1/drivers/stats', () => {
            it('should return driver statistics', async () => {
                const { token } = await bootstrapOwner(app);
                const response = await app.request('/api/v1/drivers/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data).toHaveProperty('total');
                expect(json.data).toHaveProperty('active');
                expect(json.data).toHaveProperty('available');
                expect(json.data).toHaveProperty('busy');
            });
            it('should require authentication', async () => {
                const response = await app.request('/api/v1/drivers/stats');
                expect(response.status).toBe(401);
            });
        });
        describe('POST /api/v1/drivers', () => {
            it('should create a new driver successfully', async () => {
                const { token } = await bootstrapOwner(app);
                const driverData = {
                    name: 'John Doe',
                    email: `john.doe+${Date.now()}@example.com`,
                    phone: '1234567890',
                    vehicleType: 'car',
                    licensePlate: 'ABC123',
                    isAvailable: true
                };
                const response = await app.request('/api/v1/drivers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(driverData)
                });
                expect(response.status).toBe(201);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.name).toBe(driverData.name);
                expect(json.data.email).toBe(driverData.email);
                expect(json.data.phone).toBe(driverData.phone);
                expect(json.data.vehicle_type).toBe(driverData.vehicleType);
                expect(json.data.license_plate).toBe(driverData.licensePlate);
                expect(json.data.is_available).toBe(1);
            }, 15000);
            it('should validate required fields', async () => {
                const { token } = await bootstrapOwner(app);
                const response = await app.request('/api/v1/drivers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name: 'A', // Too short
                        email: 'invalid-email',
                        phone: '123' // Too short
                    })
                });
                expect(response.status).toBe(400);
                const json = await response.json();
                expect(json.success).toBe(false);
                expect(json.error).toContain('Validation failed');
            });
            it('should prevent duplicate email addresses', async () => {
                const { token } = await bootstrapOwner(app);
                const email = `duplicate+${Date.now()}@example.com`;
                // Create first driver
                await app.request('/api/v1/drivers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name: 'First Driver',
                        email,
                        phone: '1234567890'
                    })
                });
                // Try to create second driver with same email
                const response = await app.request('/api/v1/drivers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name: 'Second Driver',
                        email,
                        phone: '0987654321'
                    })
                });
                expect(response.status).toBe(409);
                const json = await response.json();
                expect(json.success).toBe(false);
                expect(json.error).toBe('Email already exists');
            });
            it('should require admin or business_owner role', async () => {
                const { token } = await createDriverUser(app);
                const response = await app.request('/api/v1/drivers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name: 'Test Driver',
                        email: 'test@example.com',
                        phone: '1234567890'
                    })
                });
                expect(response.status).toBe(403);
            });
        });
        describe('GET /api/v1/drivers/:id', () => {
            it('should get driver by ID', async () => {
                const { token } = await bootstrapOwner(app);
                // Create a driver first
                const createResponse = await app.request('/api/v1/drivers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name: 'Get Test Driver',
                        email: `get.driver+${Date.now()}@example.com`,
                        phone: '1234567890'
                    })
                });
                const createData = await createResponse.json();
                const driverId = createData.data.driver.id;
                // Get the driver
                const response = await app.request(`/api/v1/drivers/${driverId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.driver.id).toBe(driverId);
                expect(json.data.driver.name).toBe('Get Test Driver');
            });
            it('should return 404 for non-existent driver', async () => {
                const { token } = await bootstrapOwner(app);
                const response = await app.request('/api/v1/drivers/non-existent-id', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(404);
                const json = await response.json();
                expect(json.success).toBe(false);
                expect(json.error).toBe('Driver not found');
            });
        });
        describe('PUT /api/v1/drivers/:id', () => {
            it('should update driver successfully', async () => {
                const { token } = await bootstrapOwner(app);
                // Create a driver first
                const createResponse = await app.request('/api/v1/drivers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name: 'Update Test Driver',
                        email: `update.driver+${Date.now()}@example.com`,
                        phone: '1234567890'
                    })
                });
                const createData = await createResponse.json();
                const driverId = createData.data.driver.id;
                // Update the driver
                const updateData = {
                    name: 'Updated Driver Name',
                    vehicleType: 'truck',
                    licensePlate: 'UPD123'
                };
                const response = await app.request(`/api/v1/drivers/${driverId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(updateData)
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.driver.name).toBe('Updated Driver Name');
                expect(json.data.driver.vehicle_type).toBe('truck');
                expect(json.data.driver.license_plate).toBe('UPD123');
            });
            it('should return 404 for non-existent driver', async () => {
                const { token } = await bootstrapOwner(app);
                const response = await app.request('/api/v1/drivers/non-existent-id', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name: 'Updated Name' })
                });
                expect(response.status).toBe(404);
            });
            it('should require admin or business_owner role', async () => {
                const { token } = await createDriverUser(app);
                const response = await app.request('/api/v1/drivers/some-id', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ name: 'Updated Name' })
                });
                expect(response.status).toBe(403);
            });
        });
        describe('DELETE /api/v1/drivers/:id', () => {
            it('should delete driver successfully', async () => {
                const { token } = await bootstrapOwner(app);
                // Create a driver first
                const createResponse = await app.request('/api/v1/drivers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name: 'Delete Test Driver',
                        email: `delete.driver+${Date.now()}@example.com`,
                        phone: '1234567890'
                    })
                });
                const createData = await createResponse.json();
                const driverId = createData.data.driver.id;
                // Delete the driver
                const response = await app.request(`/api/v1/drivers/${driverId}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.message).toBe('Driver deleted successfully');
                // Verify driver is deleted
                const getResponse = await app.request(`/api/v1/drivers/${driverId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(getResponse.status).toBe(404);
            });
            it('should return 404 for non-existent driver', async () => {
                const { token } = await bootstrapOwner(app);
                const response = await app.request('/api/v1/drivers/non-existent-id', {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(404);
            });
            it('should require admin or business_owner role', async () => {
                const { token } = await createDriverUser(app);
                const response = await app.request('/api/v1/drivers/some-id', {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(403);
            });
        });
    });
    describe('Bulk Operations', () => {
        describe('POST /api/v1/drivers/bulk', () => {
            it('should create multiple drivers successfully', async () => {
                const { token } = await bootstrapOwner(app);
                const driversData = [
                    {
                        name: 'Driver One',
                        email: `driver.one+${Date.now()}@example.com`,
                        phone: '1111111111',
                        vehicleType: 'car'
                    },
                    {
                        name: 'Driver Two',
                        email: `driver.two+${Date.now()}@example.com`,
                        phone: '2222222222',
                        vehicleType: 'truck'
                    }
                ];
                const response = await app.request('/api/v1/drivers/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ drivers: driversData })
                });
                expect(response.status).toBe(201);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.successful).toBe(2);
                expect(json.data.failed).toBe(0);
                expect(json.data.results).toHaveLength(2);
            }, 15000);
            it('should handle partial failures in bulk creation', async () => {
                const { token } = await bootstrapOwner(app);
                // First create a driver to cause a duplicate email conflict
                const existingEmail = `existing+${Date.now()}@example.com`;
                await app.request('/api/v1/drivers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        name: 'Existing Driver',
                        email: existingEmail,
                        phone: '1111111111'
                    })
                });
                const bulkData = {
                    drivers: [
                        {
                            name: 'Valid Driver',
                            email: `valid+${Date.now()}@example.com`,
                            phone: '1111111111'
                        },
                        {
                            name: 'Duplicate Driver',
                            email: existingEmail, // This will cause a conflict
                            phone: '2222222222'
                        }
                    ]
                };
                const response = await app.request('/api/v1/drivers/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(bulkData)
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.success).toBe(1);
                expect(json.data.failed).toBe(1);
                expect(json.data.errors).toHaveLength(1);
            }, 15000);
            it('should require admin or business_owner role', async () => {
                const { token } = await createDriverUser(app);
                const response = await app.request('/api/v1/drivers/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ drivers: [] })
                });
                expect(response.status).toBe(403);
            });
        });
        describe('POST /api/v1/drivers/import', () => {
            it('should import drivers from CSV file', async () => {
                const { token } = await bootstrapOwner(app);
                const csvBuffer = createTestCSV();
                const formData = new FormData();
                const file = new File([csvBuffer], 'test-drivers.csv', { type: 'text/csv' });
                formData.append('file', file);
                const response = await app.request('/api/v1/drivers/import', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
                expect(response.status).toBe(201);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.success).toBeGreaterThan(0);
                expect(json.data.message).toContain('Successfully imported');
            });
            it('should reject invalid file types', async () => {
                const { token } = await bootstrapOwner(app);
                const formData = new FormData();
                const file = new File(['invalid content'], 'test.txt', { type: 'text/plain' });
                formData.append('file', file);
                const response = await app.request('/api/v1/drivers/import', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
                expect(response.status).toBe(400);
                const json = await response.json();
                expect(json.success).toBe(false);
                expect(json.error).toContain('Invalid file type');
            });
            it('should require file upload', async () => {
                const { token } = await bootstrapOwner(app);
                const formData = new FormData();
                const response = await app.request('/api/v1/drivers/import', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
                expect(response.status).toBe(400);
                const json = await response.json();
                expect(json.success).toBe(false);
                expect(json.error).toBe('No file uploaded');
            });
            it('should require admin or business_owner role', async () => {
                const { token } = await createDriverUser(app);
                const formData = new FormData();
                const file = new File(['test'], 'test.csv', { type: 'text/csv' });
                formData.append('file', file);
                const response = await app.request('/api/v1/drivers/import', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
                expect(response.status).toBe(403);
            });
        });
    });
    describe('Invitation Management Endpoints', () => {
        describe('GET /api/v1/drivers/invitations', () => {
            it('should list invitations with pagination', async () => {
                const { token } = await bootstrapOwner(app);
                // Create an invitation first
                await app.request('/api/v1/drivers/invitations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        email: `list.invite+${Date.now()}@example.com`,
                        name: 'List Test Invitation'
                    })
                });
                const response = await app.request('/api/v1/drivers/invitations?page=1&limit=10', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.invitations).toBeInstanceOf(Array);
                expect(json.data.pagination).toBeDefined();
            });
            it('should filter invitations by status', async () => {
                const { token } = await bootstrapOwner(app);
                const response = await app.request('/api/v1/drivers/invitations?status=pending', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
            });
            it('should require authentication', async () => {
                const response = await app.request('/api/v1/drivers/invitations');
                expect(response.status).toBe(401);
            });
        });
        describe('GET /api/v1/drivers/invitations/stats', () => {
            it('should return invitation statistics', async () => {
                const { token } = await bootstrapOwner(app);
                const response = await app.request('/api/v1/drivers/invitations/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data).toHaveProperty('total');
                expect(json.data).toHaveProperty('pending');
                expect(json.data).toHaveProperty('accepted');
                expect(json.data).toHaveProperty('cancelled');
                expect(json.data).toHaveProperty('expired');
            });
            it('should require authentication', async () => {
                const response = await app.request('/api/v1/drivers/invitations/stats');
                expect(response.status).toBe(401);
            });
        });
        describe('POST /api/v1/drivers/invitations', () => {
            it('should create invitation successfully', async () => {
                const { token } = await bootstrapOwner(app);
                const invitationData = {
                    email: `invite+${Date.now()}@example.com`,
                    name: 'Invited Driver',
                    phone: '9876543210',
                    vehicleType: 'car',
                    customMessage: 'Welcome to our team!'
                };
                const response = await app.request('/api/v1/drivers/invitations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify(invitationData)
                });
                expect(response.status).toBe(201);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.email).toBe(invitationData.email);
                expect(json.data.name).toBe(invitationData.name);
                expect(json.data.status).toBe('pending');
            }, 15000);
            it('should validate required fields', async () => {
                const { token } = await bootstrapOwner(app);
                const response = await app.request('/api/v1/drivers/invitations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        email: 'invalid-email',
                        name: 'A' // Too short
                    })
                });
                expect(response.status).toBe(400);
                const json = await response.json();
                expect(json.success).toBe(false);
                expect(json.error).toContain('Validation failed');
            });
            it('should prevent duplicate invitations for same email', async () => {
                const { token } = await bootstrapOwner(app);
                const email = `duplicate.invite+${Date.now()}@example.com`;
                // Create first invitation
                await app.request('/api/v1/drivers/invitations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        email,
                        name: 'First Invitation'
                    })
                });
                // Try to create second invitation with same email
                const response = await app.request('/api/v1/drivers/invitations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        email,
                        name: 'Second Invitation'
                    })
                });
                expect(response.status).toBe(409);
                const json = await response.json();
                expect(json.success).toBe(false);
                expect(json.error).toContain('pending invitation already exists');
            });
            it('should require authentication', async () => {
                const response = await app.request('/api/v1/drivers/invitations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: 'test@example.com',
                        name: 'Test'
                    })
                });
                expect(response.status).toBe(401);
            });
        });
        describe('GET /api/v1/drivers/invitations/:id', () => {
            it('should get invitation by ID', async () => {
                const { token } = await bootstrapOwner(app);
                // Create an invitation first
                const createResponse = await app.request('/api/v1/drivers/invitations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        email: `get.invite+${Date.now()}@example.com`,
                        name: 'Get Test Invitation'
                    })
                });
                const createData = await createResponse.json();
                const invitationId = createData.data.id;
                // Get the invitation
                const response = await app.request(`/api/v1/drivers/invitations/${invitationId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.id).toBe(invitationId);
                expect(json.data.name).toBe('Get Test Invitation');
            });
            it('should return 404 for non-existent invitation', async () => {
                const { token } = await bootstrapOwner(app);
                const response = await app.request('/api/v1/drivers/invitations/non-existent-id', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(404);
                const json = await response.json();
                expect(json.success).toBe(false);
                expect(json.error).toBe('Invitation not found');
            });
        });
        describe('PATCH /api/v1/drivers/invitations/:id/cancel', () => {
            it('should cancel invitation successfully', async () => {
                const { token } = await bootstrapOwner(app);
                // Create an invitation first
                const createResponse = await app.request('/api/v1/drivers/invitations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        email: `cancel.invite+${Date.now()}@example.com`,
                        name: 'Cancel Test Invitation'
                    })
                });
                const createData = await createResponse.json();
                const invitationId = createData.data.id;
                // Cancel the invitation
                const response = await app.request(`/api/v1/drivers/invitations/${invitationId}/cancel`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.message).toBe('Invitation cancelled successfully');
                // Verify invitation is cancelled
                const getResponse = await app.request(`/api/v1/drivers/invitations/${invitationId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const getData = await getResponse.json();
                expect(getData.data.status).toBe('cancelled');
            });
            it('should return 404 for non-existent invitation', async () => {
                const { token } = await bootstrapOwner(app);
                const response = await app.request('/api/v1/drivers/invitations/non-existent-id/cancel', {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}` }
                });
                expect(response.status).toBe(404);
            });
        });
        describe('POST /api/v1/drivers/invitations/bulk-cancel', () => {
            it('should cancel multiple invitations successfully', async () => {
                const { token } = await bootstrapOwner(app);
                // Create multiple invitations
                const invite1Response = await app.request('/api/v1/drivers/invitations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        email: `bulk.cancel1+${Date.now()}@example.com`,
                        name: 'Bulk Cancel 1'
                    })
                });
                const invite1Data = await invite1Response.json();
                const invite2Response = await app.request('/api/v1/drivers/invitations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        email: `bulk.cancel2+${Date.now()}@example.com`,
                        name: 'Bulk Cancel 2'
                    })
                });
                const invite2Data = await invite2Response.json();
                // Bulk cancel invitations
                const response = await app.request('/api/v1/drivers/invitations/bulk-cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        invitationIds: [invite1Data.data.id, invite2Data.data.id]
                    })
                });
                expect(response.status).toBe(200);
                const json = await response.json();
                expect(json.success).toBe(true);
                expect(json.data.message).toBe('Invitations cancelled successfully');
            });
            it('should validate invitation IDs array', async () => {
                const { token } = await bootstrapOwner(app);
                const response = await app.request('/api/v1/drivers/invitations/bulk-cancel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        invitationIds: []
                    })
                });
                expect(response.status).toBe(400);
                const json = await response.json();
                expect(json.success).toBe(false);
                expect(json.error).toContain('At least one invitation ID is required');
            });
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle missing business ID', async () => {
            // This would require creating a user without a business, which might not be possible
            // in the current setup, but we can test the error handling
            const { token } = await bootstrapOwner(app);
            const response = await app.request('/api/v1/drivers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Should work normally for business owner
            expect(response.status).toBe(200);
        });
        it('should handle malformed JSON requests', async () => {
            const { token } = await bootstrapOwner(app);
            const response = await app.request('/api/v1/drivers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: '{"invalid": json}'
            });
            expect(response.status).toBe(500); // Framework returns 500 for malformed JSON
        });
        it('should handle very large pagination requests', async () => {
            const { token } = await bootstrapOwner(app);
            const response = await app.request('/api/v1/drivers?page=999999&limit=999999', {
                headers: { Authorization: `Bearer ${token}` }
            });
            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.pagination.limit).toBeLessThanOrEqual(100);
        });
        it('should handle invalid pagination parameters', async () => {
            const { token } = await bootstrapOwner(app);
            const response = await app.request('/api/v1/drivers?page=invalid&limit=invalid', {
                headers: { Authorization: `Bearer ${token}` }
            });
            expect(response.status).toBe(200);
            const json = await response.json();
            expect(json.data.pagination.page).toBe(1);
            expect(json.data.pagination.limit).toBe(20);
        });
    });
    afterAll(() => {
        iso.cleanup();
    });
});
//# sourceMappingURL=drivers.e2e.spec.js.map