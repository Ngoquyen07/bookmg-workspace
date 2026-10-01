import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

// Resolve from the backend directory, independent of the terminal's cwd.
dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
  quiet: true,
})
