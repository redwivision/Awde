import 'dotenv/config';
import { issueMagicToken } from '../server/auth';
const email = `e2e-prod-${Date.now()}@test.com`;
const magic = await issueMagicToken(email);
console.log(magic);