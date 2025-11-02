// Development server script with WebSocket/HMR configuration
const { spawn } = require('child_process');
const path = require('path');

console.log('Starting Next.js development server with WebSocket configuration...');

// Environment variables that can help with WebSocket/HMR issues
const env = {
  ...process.env,
  // Force development server to use specific host and port
  HOST: process.env.HOST || 'localhost',
  PORT: process.env.PORT || '3000',
  // Enable more verbose logging for debugging
 DEBUG: process.env.DEBUG || 'next:*',
  // Additional Next.js specific environment variables
  NEXT_PRIVATE_DEBUG: process.env.NEXT_PRIVATE_DEBUG || '1',
  // Disable compression to avoid potential WebSocket issues
  NEXT_COMPRESS: process.env.NEXT_COMPRESS || 'false',
};

// Spawn the next dev command with specific flags
const devServer = spawn('npx', ['next', 'dev', '--hostname', 'localhost', '--port', '3000'], {
  stdio: 'inherit',
  env: env,
  cwd: process.cwd(),
});

devServer.on('error', (err) => {
  console.error('Failed to start development server:', err);
  process.exit(1);
});

devServer.on('close', (code) => {
  console.log(`Development server exited with code ${code}`);
  process.exit(code);
});

console.log('Next.js development server started on http://localhost:3000');
console.log('WebSocket connections for HMR should now be working.');
console.log('If you still experience issues, check:');
console.log('- Firewall settings blocking WebSocket connections');
console.log('- Antivirus software interfering with local connections');
console.log('- Proxy settings that might affect local development');