import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import fs from 'fs'
import path from 'path'

function opticOkStoragePlugin(): Plugin {
  const dataFilePath = path.resolve(import.meta.dirname || process.cwd(), 'server_data.json')

  const readData = () => {
    if (fs.existsSync(dataFilePath)) {
      try {
        return JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'))
      } catch {
        return {}
      }
    }
    return {}
  }

  const writeData = (data: any) => {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8')
    } catch (e) {
      console.error('Failed to write server_data.json:', e)
    }
  }

  return {
    name: 'opticok-storage-api',
    configureServer(server) {
      server.middlewares.use('/api/storage', (req, res, next) => {
        if (req.method === 'GET') {
          const data = readData()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
          return
        }

        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body)
              const current = readData()
              const merged = { ...current, ...incoming }
              writeData(merged)
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: String(err) }))
            }
          })
          return
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl(), opticOkStoragePlugin()],
  server: {
    host: true, // Açık ağ (0.0.0.0) erişimine izin ver
    port: 5173,
    strictPort: false
  }
})
