#!/usr/bin/env python3
"""Send apology email to all Tera users from Supabase."""

import os
import json
import requests
import time

# Load env
env = {}
with open('/workspace/projects/tera/.env') as f:
    for line in f:
        if '=' in line and not line.startswith('#'):
            k, v = line.strip().split('=', 1)
            env[k] = v

SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL']
SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY']
RESEND_KEY = env.get('RESEND_API_KEY', '')
RESEND_FROM = env.get('RESEND_FROM_EMAIL', 'TeraAI <updates@updates.teraai.chat>')
RESEND_REPLY_TO = env.get('RESEND_REPLY_TO_EMAIL', 'teraaiguide@gmail.com')

# Email HTML
EMAIL_HTML = open('/workspace/projects/tera/email-draft/apology-email.html').read()

def get_all_user_emails():
    """Fetch all user emails from Supabase."""
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json'
    }
    
    # Query auth.users for emails
    # Using the auth admin API or users table
    url = f'{SUPABASE_URL}/rest/v1/users'
    params = {
        'select': 'email',
        'email': 'not.is.null',
        'limit': 1000
    }
    
    resp = requests.get(url, headers=headers, params=params)
    if resp.status_code == 200:
        data = resp.json()
        emails = [u['email'] for u in data if u.get('email')]
        return list(set(emails))  # deduplicate
    
    # Try auth admin endpoint
    print(f"users table returned {resp.status_code}: {resp.text[:200]}")
    return []

def send_email(to_email):
    """Send apology email via Resend."""
    headers = {
        'Authorization': f'Bearer {RESEND_KEY}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'from': RESEND_FROM,
        'to': [to_email],
        'subject': "We're experiencing downtime — Tera",
        'html': EMAIL_HTML,
        'reply_to': RESEND_REPLY_TO
    }
    
    resp = requests.post('https://api.resend.com/emails', headers=headers, json=payload)
    return resp.status_code, resp.json()

def main():
    print("Fetching user emails from Supabase...")
    emails = get_all_user_emails()
    print(f"Found {len(emails)} unique emails")
    
    if not emails:
        print("No emails found. Check Supabase table structure.")
        return
    
    print(f"\nSending to: {emails[:5]}{'...' if len(emails) > 5 else ''}")
    print()
    
    sent = 0
    failed = 0
    
    for email in emails:
        try:
            status, result = send_email(email)
            if status == 200:
                sent += 1
                print(f"  ✅ {email}")
            else:
                failed += 1
                print(f"  ❌ {email}: {result.get('message', 'unknown error')}")
            time.sleep(0.5)  # rate limit
        except Exception as e:
            failed += 1
            print(f"  ❌ {email}: {e}")
    
    print(f"\nDone! Sent: {sent}, Failed: {failed}")

if __name__ == '__main__':
    main()
