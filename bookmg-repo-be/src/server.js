import express from 'express'

const app = express()
const baseUrl = new URL(process.env.BASE_URL)

app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(Number(baseUrl.port), baseUrl.hostname, () => {
  console.log(`Backend running at ${baseUrl.origin}`)
})
