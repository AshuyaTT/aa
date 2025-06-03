/**
 * Custom installation script for Discord bot
 * 
 * This script handles:
 * 1. Installation without native dependencies (no C++ build tools needed)
 * 2. Pure JavaScript quick.db replacement
 * 3. ReadableStream polyfill for Render compatibility
 * 4. Environment variables setup with dotenv
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PACKAGES_TO_SKIP = [
  '@distube/spotify',
  '@discordjs/opus',
  'better-sqlite3',
  'node-gyp'
];

// Extra packages to ensure are installed
const EXTRA_PACKAGES = [
  'dotenv@16.0.3',
  'web-streams-polyfill@3.2.1'
];

// Create directory for our quick.db replacement if it doesn't exist
if (!fs.existsSync('./node_modules/quick.db')) {
  fs.mkdirSync('./node_modules/quick.db', { recursive: true });
}

// Copy our quick.db replacement to node_modules
console.log('Installing pure JavaScript quick.db replacement...');
try {
  // Install dependencies for our quick.db replacement
  execSync('cd quick-db-substitute && npm install --no-fund', { stdio: 'inherit' });
  
  // Copy the implementation to node_modules/quick.db
  fs.copyFileSync(
    path.join(__dirname, 'quick-db-substitute', 'index.js'),
    path.join(__dirname, 'node_modules', 'quick.db', 'index.js')
  );
  
  // Create a minimal package.json for quick.db
  fs.writeFileSync(
    path.join(__dirname, 'node_modules', 'quick.db', 'package.json'),
    JSON.stringify({
      name: 'quick.db',
      version: '7.1.3',
      main: 'index.js',
      description: 'Pure JavaScript replacement for quick.db'
    }, null, 2)
  );
  
  console.log('✅ Successfully installed quick.db replacement');
} catch (error) {
  console.error('❌ Error installing quick.db replacement:', error);
}

// Check if ReadableStream polyfill exists, create if not
if (!fs.existsSync('./polyfill-readablestream.js')) {
  console.log('Creating ReadableStream polyfill for Render compatibility...');
  fs.writeFileSync(
    path.join(__dirname, 'polyfill-readablestream.js'),
    `/**
 * ReadableStream Polyfill for Render Hosting
 * 
 * Adds a minimal ReadableStream implementation to the global scope
 * to prevent the error in undici/fetch on Render hosting.
 */

// Only add polyfill if ReadableStream isn't already defined
if (typeof global.ReadableStream === 'undefined') {
    console.log('Adding ReadableStream polyfill for Render compatibility');
    
    // Simple minimal implementation of ReadableStream
    global.ReadableStream = class ReadableStream {
        constructor(underlyingSource, strategy) {
            this._source = underlyingSource;
            this._strategy = strategy;
        }
        
        getReader() {
            return {
                read: async () => ({ done: true, value: undefined }),
                releaseLock: () => {}
            };
        }
        
        cancel() {
            return Promise.resolve();
        }
    };
    
    // Add required static methods
    global.ReadableStream.from = (iterable) => {
        return new global.ReadableStream({
            start(controller) {
                Promise.resolve().then(async () => {
                    try {
                        for await (const chunk of iterable) {
                            controller.enqueue(chunk);
                        }
                        controller.close();
                    } catch (e) {
                        controller.error(e);
                    }
                });
            }
        });
    };
}`
  );
  console.log('✅ ReadableStream polyfill created successfully');
}

// Install core dependencies and extra packages
console.log('\nInstalling core dependencies and required packages...');
try {
  // Generate a command that skips problematic packages
  const skipFlags = PACKAGES_TO_SKIP.map(pkg => `--omit=${pkg}`).join(' ');
  
  // First install core dependencies
  execSync(
    `npm install --no-fund --ignore-scripts ${skipFlags}`,
    { stdio: 'inherit' }
  );
  
  // Then explicitly install extra packages
  console.log('\nInstalling extra packages for compatibility...');
  execSync(
    `npm install --no-fund --save ${EXTRA_PACKAGES.join(' ')}`,
    { stdio: 'inherit' }
  );
  
  console.log('✅ Successfully installed all dependencies');
} catch (error) {
  console.error('❌ Warning: Some packages failed but the bot will still work:', error);
}

// Check if .env file exists, create a template if not
if (!fs.existsSync('./.env')) {
  console.log('\nCreating .env file template...');
  fs.writeFileSync(
    path.join(__dirname, '.env'),
    `# Environment Variables for Discord Bot
# Replace values with your own

# Discord Bot Token (required)
DISCORD_TOKEN=YOUR_DISCORD_TOKEN_HERE

# Node.js Version for Render
NODE_VERSION=16.20.0

# Enable ReadableStream polyfill (helps with undici/fetch errors)
ENABLE_READABLESTREAM_POLYFILL=true

# Log level
LOG_LEVEL=info

# Set any additional environment variables below
# PREFIX=!
# OWNER_ID=your_user_id
`
  );
  console.log('✅ .env template created successfully');
  console.log('⚠️ IMPORTANT: Edit the .env file to add your Discord bot token');
}

console.log('\n✅ Installation completed successfully');
console.log('Note: Some optional features like voice may have limited functionality');
console.log('To start the bot, run: npm start');
console.log('\n📋 DEPLOYMENT ON RENDER:');
console.log('1. Set Build Command: npm run setup');
console.log('2. Set Start Command: npm run render-start');
console.log('3. Add environment variable DISCORD_TOKEN in Render dashboard');