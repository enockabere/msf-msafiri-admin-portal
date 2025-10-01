module.exports = {
  apps: [
    {
      name: 'msf-admin-portal',
      script: 'npm',
      args: 'start',
      cwd: '/home/leo-server/projects/msafiri/msf-msafiri-admin-portal',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true
    }
  ]
};