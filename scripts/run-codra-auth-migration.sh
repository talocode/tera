#!/bin/bash

# Codra Device Auth Migration Script
# This script runs the SQL migration to create the codra_device_auth_sessions table

echo "=== Codra Device Auth Migration ==="
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed."
    echo "Install it with: npm install -g supabase"
    exit 1
fi

# Check if we're in the Tera directory
if [ ! -f "supabase/config.toml" ]; then
    echo "Error: This script must be run from the Tera project root."
    echo "Usage: cd /root/projects/tera && ./scripts/run-codra-auth-migration.sh"
    exit 1
fi

# Check for Supabase credentials
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "Warning: Supabase credentials not found in environment."
    echo "Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    echo ""
    echo "Alternatively, you can run the SQL manually:"
    echo "1. Go to https://supabase.com/dashboard"
    echo "2. Select your project"
    echo "3. Go to SQL Editor"
    echo "4. Paste and run the SQL from:"
    echo "   migrations/20260619000000_create_codra_device_auth_sessions.sql"
    echo ""
fi

# Run the migration
echo "Running migration..."
supabase db push

echo ""
echo "Migration complete!"
echo ""
echo "Verify the table was created by running:"
echo "  supabase db diff --use-migra"
echo ""
