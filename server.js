const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV === 'development'
// OS sets HOSTNAME to machine name (e.g. ubuntu-1); using it for bind breaks nginx → 127.0.0.1:PORT (502).
const listenHost = process.env.LISTEN_HOST || '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname: listenHost, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, listenHost, async (err) => {
    if (err) throw err
    console.log(`> Ready on http://${listenHost}:${port}`)
  })
})
