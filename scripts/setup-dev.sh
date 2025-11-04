#!/bin/bash

# Development Setup Script
# This script helps you set up the app for development

echo "🚀 Gastro-Elite Development Setup"
echo "================================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Development Configuration
NODE_ENV=development

# Database Configuration
# For layout work without DB, set DEV_MODE_NO_DB=true
# DEV_MODE_NO_DB=true

# For PostgreSQL connection:
# DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# For local SQLite:
# DATABASE_URL="file:./prisma/dev.db"

# JWT Secret (change in production!)
JWT_SECRET="dev-secret-key-change-in-production"
EOF
    echo "✅ Created .env.local file"
    echo ""
fi

# Ask user what they want to do
echo "What would you like to do?"
echo "1) Work on layout only (no database required)"
echo "2) Set up full database connection"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "🎨 Setting up for layout development..."
    # Update .env.local to enable DEV_MODE_NO_DB
    if grep -q "DEV_MODE_NO_DB" .env.local; then
        sed -i '' 's/DEV_MODE_NO_DB=.*/DEV_MODE_NO_DB=true/' .env.local
    else
        echo "DEV_MODE_NO_DB=true" >> .env.local
    fi
    echo "✅ DEV_MODE_NO_DB enabled"
    echo ""
    echo "You can now run 'npm run dev' and work on layouts without database!"
    
elif [ "$choice" = "2" ]; then
    echo ""
    echo "🗄️  Setting up database connection..."
    
    # Disable DEV_MODE_NO_DB if it exists
    if grep -q "DEV_MODE_NO_DB" .env.local; then
        sed -i '' 's/DEV_MODE_NO_DB=.*/DEV_MODE_NO_DB=false/' .env.local
    fi
    
    read -p "Enter your DATABASE_URL (or press Enter to skip): " db_url
    
    if [ ! -z "$db_url" ]; then
        if grep -q "DATABASE_URL" .env.local; then
            sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$db_url\"|" .env.local
        else
            echo "DATABASE_URL=\"$db_url\"" >> .env.local
        fi
        echo "✅ DATABASE_URL updated"
    fi
    
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    
    echo ""
    echo "🔧 Generating Prisma client..."
    npx prisma generate
    
    echo ""
    echo "📊 Running database migrations..."
    npx prisma migrate dev
    
    echo ""
    echo "✅ Database setup complete!"
    echo ""
    echo "You can now run 'npm run dev'"
fi

echo ""
echo "✨ Setup complete!"

