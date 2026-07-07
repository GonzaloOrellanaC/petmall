/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = {
  apps: [
    {
      name: 'petmall-server',
      script: './server.ts',
      interpreter: './node_modules/.bin/tsx',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
