const localtunnel = await import('localtunnel');
import https from 'https';
import fs from 'fs';

const BOT_TOKEN = '8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q';
const SECRET_TOKEN = 'smarty-telegram-webhook-secret-2025';
const CHAT_ID = '1520574544';

const PORT = process.env.PORT || 3001;

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

console.log(`🚀 Creating HTTPS tunnel for port ${PORT}...\n`);

const tunnel = await localtunnel.default({ port: parseInt(PORT.toString()) });

console.log(`✅ Tunnel created: ${tunnel.url}`);
console.log(`📋 Public URL: ${tunnel.url}`);

const webhookUrl = `${tunnel.url}/api/telegram/webhook`;

console.log(`\n📡 Setting webhook to: ${webhookUrl}`);

const result = await telegramAPI('setWebhook', {
  url: webhookUrl,
  secret_token: SECRET_TOKEN,
  allowed_updates: JSON.stringify(['message', 'edited_message', 'callback_query'])
});

if (result.ok) {
  console.log('\n✅ Webhook set successfully!');

  // Update .env
  const envPath = '.env';
  let envContent = fs.readFileSync(envPath, 'utf-8');

  if (envContent.includes('TELEGRAM_WEBHOOK_URL=')) {
    envContent = envContent.replace(/TELEGRAM_WEBHOOK_URL=.*/, `TELEGRAM_WEBHOOK_URL=${webhookUrl}`);
  } else {
    envContent += `\nTELEGRAM_WEBHOOK_URL=${webhookUrl}`;
  }

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file updated');

  // Send test message
  await telegramAPI('sendMessage', {
    chat_id: CHAT_ID,
    text: '🚀 *Bot is Active on Port 3001!*\n\n✅ Webhook configured\n✅ Bidirectional messaging ready\n\nSend me a message!',
    parse_mode: 'Markdown'
  });

  console.log('✅ Test message sent to Telegram\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SETUP COMPLETE!\n');
  console.log('📱 Send "Hi" to @Smartyvibhavbot now!');
  console.log('📊 Watch server console for incoming messages');
  console.log('🔍 Check MongoDB for message logs\n');
  console.log(`📊 Tunnel URL: ${tunnel.url}`);
  console.log(`🔌 Server Port: ${PORT}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Get webhook info
  const info = await telegramAPI('getWebhookInfo');
  console.log('Webhook Status:');
  console.log(`  URL: ${info.result.url}`);
  console.log(`  Pending: ${info.result.pending_update_count}`);
  console.log('');

  // Test webhook endpoint
  console.log('Testing webhook endpoint...');
  try {
    const testResponse = await fetch(`http://localhost:${PORT}/api/telegram/webhook`);
    const testResult = await testResponse.json();
    console.log('✅ Webhook endpoint responding:', testResult.status);
  } catch (e) {
    console.log('⚠️  Webhook endpoint test:', e.message);
  }
  console.log('');

  console.log('Press Ctrl+C to stop tunnel...\n');

  // Keep running
  process.stdin.resume();

  process.on('SIGINT', () => {
    console.log('\n\n👋 Closing tunnel...');
    tunnel.close();
    console.log('✅ Goodbye!');
    process.exit(0);
  });
} else {
  console.error('\n❌ Failed to set webhook:', result.description);
  tunnel.close();
  process.exit(1);
}

tunnel.on('close', () => {
  console.log('\nTunnel closed');
});
