import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || '4';
//# sourceMappingURL=vitest.setup.js.map