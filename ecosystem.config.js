const path = require('path')
const appDir = path.resolve(__dirname)

module.exports = {
  apps: [
    {
      name: 'rash',
      script: 'server.js',
      cwd: appDir,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        LISTEN_HOST: '0.0.0.0'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        LISTEN_HOST: '0.0.0.0'
      },
      error_file: '/root/.pm2/logs/rash-error.log',
      out_file: '/root/.pm2/logs/rash-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    }
  ]
}
