module.exports = {
  apps: [
    {
      name: 'psx-stockking-backend',
      script: 'src/index.js',
      instances: 'max', // Spawns 1 process per CPU core for maximum throughput
      exec_mode: 'cluster', // Enables Node.js built-in cluster load balancing
      watch: false,
      max_memory_restart: '1G', // Automatic restart if a worker exceeds 1GB RAM
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Graceful reload settings to achieve zero-downtime deployments
      kill_timeout: 5000,
      wait_ready: false,
      listen_timeout: 8000
    }
  ]
};
