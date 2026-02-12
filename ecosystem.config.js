const path = require('path')
const appDir = path.resolve(__dirname)

module.exports = {
  apps: [
    {
      name: 'rash',
      script: 'npm',
      args: 'start',
      cwd: appDir,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/root/.pm2/logs/rash-error.log',
      out_file: '/root/.pm2/logs/rash-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
}
