#!/bin/bash
# Exit immediately if a command exits with a non-zero status
set -e

echo "Building Docker images for sandboxed languages..."
docker build -t sandbox-python:3.10 -f pages/api/code/DockerFiles/Python/Dockerfile .
docker build -t sandbox-java:17 -f pages/api/code/DockerFiles/Java/Dockerfile .
docker build -t sandbox-node:18 -f pages/api/code/DockerFiles/JavaScript/Dockerfile .
docker build -t sandbox-c:latest -f pages/api/code/DockerFiles/C/Dockerfile .
docker build -t sandbox-cpp:latest -f pages/api/code/DockerFiles/Cpp/Dockerfile .
docker build -t sandbox-go:1.20 -f pages/api/code/DockerFiles/Go/Dockerfile .
docker build -t sandbox-ruby:3.2 -f pages/api/code/DockerFiles/Ruby/Dockerfile .
docker build -t sandbox-php:8.2 -f pages/api/code/DockerFiles/Php/Dockerfile .
docker build -t sandbox-rust:1.73 -f pages/api/code/DockerFiles/Rust/Dockerfile .
docker build -t sandbox-dart:stable -f pages/api/code/DockerFiles/Dart/Dockerfile .
echo "Docker images built successfully."

# Install dependencies
echo "Installing dependencies..."
npm install

npm install formidable

# Starting Next.js project
echo "Starting Next.js project..."
npm run build

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations to create tables
echo "Running migrations..."
npx prisma migrate dev --name init

# Verify if the User table exists by querying the database
echo "Verifying the User table..."
TABLE_EXISTS=$(sqlite3 ./prisma/dev.db "SELECT name FROM sqlite_master WHERE type='table' AND name='User';")

if [[ -z "$TABLE_EXISTS" ]]; then
    echo "Error: User table does not exist. Migration may have failed."
    exit 1
else
    echo "User table exists."
fi

# Check for required compilers and interpreters


echo "Checking required compilers/interpreters..."
REQUIRED_PROGRAMS=("gcc" "g++" "java" "python3" "node")
for PROGRAM in "${REQUIRED_PROGRAMS[@]}"; do
    if ! command -v $PROGRAM &> /dev/null; then
        echo "$PROGRAM not found. Please install it."
        exit 1
    fi
done
echo "All required compilers and interpreters are installed."

# Create an admin user in the database
echo "Creating admin user..."
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="adminpassword"
FIRST_NAME="Admin"
LAST_NAME="User"
ROLE="ADMIN"

# Generate a bcrypt password hash using Node.js

BCRYPT_SALT_ROUNDS=$(node -e "
  console.log(process.env.BCRYPT_SALT_ROUNDS);
")

PASSWORD_HASH=$(node -e "
   const bcrypt = require('bcrypt');
   console.log(bcrypt.hashSync('$ADMIN_PASSWORD', parseInt('$BCRYPT_SALT_ROUNDS')));
")

# Insert the admin user into the database using Prisma's SQL execute command
echo "Inserting admin user into the database..."
npx prisma db execute --url="file:./prisma/dev.db" --stdin <<EOF
INSERT INTO User (email, passwordHash, firstName, lastName, role, createdAt, updatedAt)
VALUES ('$ADMIN_EMAIL', '$PASSWORD_HASH', '$FIRST_NAME', '$LAST_NAME', '$ROLE', datetime('now'), datetime('now'));
EOF

echo "Admin user created with email: $ADMIN_EMAIL and role: $ROLE."
echo "Setup complete. Ready to start the application."
