const localtunnel = require('localtunnel');

(async () => {
  const tunnel = await localtunnel({ port: 3001, subdomain: 'cold-oranges-yell' });
  
  console.log('🔓 Localtunnel is running!');
  console.log('📍 URL:', tunnel.url);
  console.log('🔥 Telegram webhook will work now!');
  console.log('');
  console.log('Press Ctrl+C to close tunnel');
  
  tunnel.on('close', () => {
    console.log('Tunnel closed');
  });
})();
