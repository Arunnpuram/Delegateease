const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const fs = require("fs")
const path = require("path")

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

// Ensure tmp directory exists
const tmpDir = path.join(process.cwd(), "tmp")
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true })
  console.log("Created tmp directory for file uploads")
}

const PORT = process.env.PORT || 3000

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(PORT, (err) => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${PORT}`)
  })
})
