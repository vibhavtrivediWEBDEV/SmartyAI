#!/usr/bin/env node

/**
 * Complete Telegram Bot Setup with Local Tunnel
 * Uses localtunnel for HTTPS tunnel (no installation needed)
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...values] = line.split('=');
    envVars[key] = values.join('=');
  }
});

const BOT_TOKEN = envVars.TELEGRAM_BOT_TOKEN || '8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q';
const SECRET_TOKEN = envVars.TELEGRAM_SECRET_TOKEN || 'smarty-telegram-webhook-secret-2025';
const CHAT_ID = envVars.TELEGRAM_CHAT_ID || '1520574544';

console.log('🚀 Complete Telegram Bot Setup\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function telegramAPI(method, data = {}) {
  return new Promise((resolve, reject) => {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
    
    const postData = Object.keys(data)
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`)
      .join('&');
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function startServer() {
  console.log('📋 Step 1: Starting development server...\n');
  
  // Check if server is running
  try {
    await new Promise((resolve, reject) => {
      const req = https.request('https://localhost:3000', { rejectUnauthorized: false }, resolve);
      req.on('error', reject);
      req.end();
    });
    console.log('✅ Server already running on port 3000\n');
    return true;
  } catch {
    // Server not running, start it
    console.log('Starting npm run dev...');
    const server = spawn('npm', ['run', 'dev'], {
      cwd: __dirname,
      stdio: 'ignore',
      detached: true
    });
    server.unref();
    
    // Wait for server
    console.log('⏳ Waiting for server (up to 30 seconds)...');
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      try {
        await new Promise((resolve, reject) => {
          const req = https.request('https://localhost:3000', { rejectUnauthorized: false }, resolve);
          req.on('error', reject);
          req.setTimeout(1000, () => reject(new Error('timeout')));
          req.end();
        });
        console.log('✅ Server started!\n');
        return true;
      } catch {}
    }
    
    console.log('❌ Server failed to start after 30 seconds\n');
    return false;
  }
}

async function createTunnel() {
  console.log('📋 Step 2: Creating HTTPS tunnel...\n');
  
  // Install localtunnel if not present
  try {
    await execAsync('node -e "require(\'localtunnel\')"');
  } catch {
    console.log('Installing localtunnel...');
    await execAsync('npm install localtunnel --save-dev');
  }
  
  // Import localtunnel
  const localtunnel = (await import('localtunnel')).default;
  
  // Create tunnel
  const tunnel = await localtunnel({ port: 3000 });
  const tunnelUrl = tunnel.url;
  
  console.log(`✅ Tunnel created: ${tunnelUrl}\n`);
  
  tunnel.on('close', () => {
    console.log('\nTunnel closed');
  });
  
  return tunnel;
}

async function setWebhook(webhookUrl) {
  console.log('📋 Step 3: Setting Telegram webhook...\n');
  
  console.log(`Webhook URL: ${webhookUrl}`);
  console.log(`Secret token: ${SECRET_TOKEN}\n`);
  
  try {
    const result = await telegramAPI('setWebhook', {
      url: webhookUrl,
      secret_token: SECRET_TOKEN,
      allowed_updates: JSON.stringify(['message', 'edited_message', 'callback_query'])
    });
    
    if (result.ok) {
      console.log('✅ Webhook set successfully!\n');
      return true;
    } else {
      console.log(`❌ Failed: ${result.description}\n`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}\n`);
    return false;
  }
}

async function sendTestMessage() {
  console.log('📋 Step 4: Sending test message...\n');
  
  try {
    const message = `🤖 *Bot Active!*

✅ Webhook configured
✅ Bidirectional messaging enabled
✅ Ready for testing

Send me any message!`;

    const result = await telegramAPI('sendMessage', {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });
    
    if (result.ok) {
      console.log('✅ Test message sent to Telegram!\n');
    } else {
      console.log('⚠️  Could not send test message\n');
    }
  } catch (error) {
    console.log('⚠️  Could not send test message\n');
  }
}

async function getWebhookInfo() {
  console.log('📋 Step 5: Checking webhook status...\n');
  
  try {
    const result = await telegramAPI('getWebhookInfo');
    
    if (result.ok) {
      const info = result.result;
      console.log(`URL: ${info.url || 'Not set'}`);
      console.log(`Pending updates: ${info.pending_update_count}`);
      
      if (info.last_error_date) {
        const date = new Date(info.last_error_date * 1000);
        console.log(`Last error: ${info.last_error_message} (${date.toLocaleString()})`);
      }
      console.log('');
    }
  } catch (error) {
    console.log(`⚠️  Could not get webhook info: ${error.message}\n`);
  }
}

async function updateEnvFile(webhookUrl) {
  const envLines = envContent.split('\n').map(line => {
    if (line.startsWith('TELEGRAM_WEBHOOK_URL=')) {
      return `TELEGRAM_WEBHOOK_URL=${webhookUrl}`;
    }
    return line;
  });
  
  if (!envLines.some(l => l.startsWith('TELEGRAM_WEBHOOK_URL='))) {
    envLines.push(`TELEGRAM_WEBHOOK_URL=${webhookUrl}`);
  }
  
  fs.writeFileSync(envPath, envLines.join('\n'));
}

async function main() {
  try {
    // Step 1: Start server
    const serverStarted = await startServer();
    if (!serverStarted) {
      process.exit(1);
    }
    
    // Step 2: Create tunnel
    const tunnel = await createTunnel();
    const webhookUrl = `${tunnel.url}/api/telegram/webhook`;
    
    // Step 3: Set webhook
    const webhookSet = await setWebhook(webhookUrl);
    if (!webhookSet) {
      tunnel.close();
      process.exit(1);
    }
    
    // Update .env
    updateEnvFile(webhookUrl);
    console.log('✅ .env updated\n');
    
    // Step 4: Send test message
    await sendTestMessage();
    
    // Step 5: Get webhook info
    await getWebhookInfo();
    
    // Success!
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ SETUP COMPLETE!\n');
    console.log('📱 Bot: @Smartyvibhavbot');
    console.log(`🌐 Tunnel: ${tunnel.url}`);
    console.log(`🔗 Webhook: ${webhookUrl}\n`);
    console.log('🧪 Testing:');
    console.log('   1. Open Telegram');
    console.log('   2. Send "Hi" to @Smartyvibhavbot');
    console.log('   3. Watch terminal for logs');
    console.log('   4. Check MongoDB for messages\n');
    console.log('📊 Bidirectional messaging ACTIVE!');
    console.log('   Telegram → Server → AI → Telegram\n');
    console.log('Press Ctrl+C to stop\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n\n👋 Shutting down...');
      tunnel.close();
      process.exit(0);
    });
    
    // Keep running
    process.stdin.resume();
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
