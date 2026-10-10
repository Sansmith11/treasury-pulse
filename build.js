const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== Treasury Pulse Automated Vercel Build Script ===');
console.log('Current working directory:', process.cwd());

if (fs.existsSync(path.join(process.cwd(), 'frontend', 'package.json'))) {
  console.log('-> Detected build from repository root.');
  console.log('-> Installing frontend dependencies...');
  execSync('npm --prefix frontend install', { stdio: 'inherit' });
  
  console.log('-> Building frontend Vite distribution...');
  execSync('npm --prefix frontend run build', { stdio: 'inherit' });
  
  const frontendDist = path.join(process.cwd(), 'frontend', 'dist');
  const rootDist = path.join(process.cwd(), 'dist');
  
  if (fs.existsSync(frontendDist)) {
    console.log('-> Syncing frontend/dist to root dist/ directory for Vercel...');
    fs.cpSync(frontendDist, rootDist, { recursive: true });
    console.log('-> Successfully created root dist/ directory!');
  }
} else if (fs.existsSync(path.join(process.cwd(), 'package.json'))) {
  console.log('-> Detected build from inside frontend directory.');
  console.log('-> Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('-> Building Vite distribution...');
  execSync('npm run build', { stdio: 'inherit' });
} else {
  console.error('Error: Could not locate package.json in current directory or frontend directory.');
  process.exit(1);
}

console.log('=== Build completed successfully! ===');
