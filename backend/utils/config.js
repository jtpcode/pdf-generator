import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '..', '.env') })

export const DATABASE_URL = process.env.NODE_ENV === 'test'
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL
export const JWT_SECRET = process.env.JWT_SECRET
export const PORT = process.env.PORT || 3001
export const UPLOADS_DIR = process.env.NODE_ENV === 'test'
  ? 'test-uploads'
  : 'uploads'