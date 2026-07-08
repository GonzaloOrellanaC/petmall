/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = {
  apps: [
    {
      name: 'petmall-server',
      script: './dist/server.cjs',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4002
      }
    }
  ]
};
