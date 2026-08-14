#!/usr/bin/env python3
"""
Telegram Bot Webhook Setup with ngrok
This script sets up ngrok and configures the Telegram webhook
"""

import subprocess
import sys
import time
import json
import requests
import os
from pathlib import Path

# Load environment variables
env_file = Path(__file__).parent / '.env'
env_vars = {}
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                env_vars[key] = value

BOT_TOKEN = env_vars.get('TELEGRAM_BOT_TOKEN', '8997860666:AAFDBI_XPK9D32fqx16k3O1iLz6_j6Cnp6Q')
SECRET_TOKEN = env_vars.get('TELEGRAM_SECRET_TOKEN', 'smarty-telegram-webhook-secret-2025')

def check_ngrok():
    """Check if ngrok is installed"""
    try:
        result = subprocess.run(['ngrok', 'version'], capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ ngrok is installed")
            return True
    except FileNotFoundError:
        pass
    
    print("❌ ngrok not found")
    print("\nInstall ngrok:")
    print("  Option 1: Download from https://ngrok.com/download")
    print("  Option 2: npm install -g ngrok")
    return False

def get_ngrok_url():
    """Get the public URL from ngrok API"""
    try:
        response = requests.get('http://localhost:4040/api/tunnels')
        if response.status_code == 200:
            data = response.json()
            tunnels = data.get('tunnels', [])
            if tunnels:
                return tunnels[0]['public_url']
    except:
        pass
    return None

def set_webhook(webhook_url):
    """Set the Telegram webhook"""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/setWebhook"
    
    data = {
        'url': webhook_url,
        'secret_token': SECRET_TOKEN,
        'allowed_updates': ['message', 'edited_message', 'callback_query']
    }
    
    response = requests.post(url, data=data)
    
    if response.status_code == 200:
        result = response.json()
        if result.get('ok'):
            print(f"✅ Webhook set successfully!")
            print(f"   URL: {webhook_url}")
            return True
        else:
            print(f"❌ Failed to set webhook: {result.get('description')}")
    else:
        print(f"❌ Failed to set webhook: HTTP {response.status_code}")
    
    return False

def get_webhook_info():
    """Get current webhook info"""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/getWebhookInfo"
    response = requests.get(url)
    
    if response.status_code == 200:
        result = response.json()
        if result.get('ok'):
            info = result.get('result', {})
            print("\n📊 Current Webhook Info:")
            print(f"   URL: {info.get('url', 'Not set')}")
            print(f"   Pending updates: {info.get('pending_update_count', 0)}")
            return info
    
    return None

def send_test_message(chat_id):
    """Send a test message"""
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    
    data = {
        'chat_id': chat_id,
        'text': '🤖 Telegram bot webhook is now active!\n\nSend me any message and I will respond.',
        'parse_mode': 'Markdown'
    }
    
    response = requests.post(url, data=data)
    
    if response.status_code == 200:
        result = response.json()
        if result.get('ok'):
            print("✅ Test message sent!")
            return True
    
    print("⚠️  Could not send test message")
    return False

def main():
    print("🚀 Telegram Bot Webhook Setup\n")
    
    # Check ngrok
    if not check_ngrok():
        sys.exit(1)
    
    # Get current webhook info
    print("\n📊 Checking current webhook status...")
    get_webhook_info()
    
    # Check if ngrok is already running
    print("\n🔍 Checking for running ngrok process...")
    ngrok_url = get_ngrok_url()
    
    if not ngrok_url:
        print("\n⚠️  ngrok is not running")
        print("\nPlease start ngrok in a separate terminal:")
        print("  ngrok http 3000")
        print("\nThen run this script again.")
        print("\nOr let me start it for you...")
        
        # Try to start ngrok automatically
        try:
            print("\n🚀 Starting ngrok...")
            ngrok_process = subprocess.Popen(
                ['ngrok', 'http', '3000'],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )
            
            # Wait for ngrok to start
            print("⏳ Waiting for ngrok to start...")
            for i in range(10):
                time.sleep(1)
                ngrok_url = get_ngrok_url()
                if ngrok_url:
                    break
            
            if not ngrok_url:
                print("❌ Could not get ngrok URL. Please start ngrok manually.")
                sys.exit(1)
                
        except Exception as e:
            print(f"❌ Could not start ngrok: {e}")
            print("Please start ngrok manually: ngrok http 3000")
            sys.exit(1)
    
    print(f"✅ ngrok URL: {ngrok_url}")
    
    # Set webhook
    webhook_url = f"{ngrok_url}/api/telegram/webhook"
    print(f"\n📡 Setting webhook to: {webhook_url}")
    
    if set_webhook(webhook_url):
        # Update .env
        print("\n💾 Updating .env file...")
        env_vars['TELEGRAM_WEBHOOK_URL'] = webhook_url
        
        with open(env_file, 'w') as f:
            for key, value in env_vars.items():
                f.write(f"{key}={value}\n")
        
        print("✅ .env updated")
        
        # Get updated webhook info
        print("\n📊 Updated webhook info:")
        get_webhook_info()
        
        # Send test message
        chat_id = env_vars.get('TELEGRAM_CHAT_ID')
        if chat_id:
            print("\n📤 Sending test message...")
            send_test_message(chat_id)
        
        print("\n✅ Setup complete!")
        print("\n📱 Testing instructions:")
        print("  1. Make sure server is running: npm run dev")
        print("  2. Send a message to @Smartyvibhavbot")
        print("  3. Check server console for logs")
        print("  4. View ngrok dashboard: http://localhost:4040")
        print("\n🎉 Bidirectional messaging is now active!")
    else:
        print("\n❌ Failed to set up webhook")
        sys.exit(1)

if __name__ == '__main__':
    main()
