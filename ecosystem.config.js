module.exports = {
  apps: [{
    name: 'rash',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/rash',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/www/rash/logs/pm2-error.log',
    out_file: '/var/www/rash/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
