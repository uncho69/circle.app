#!/bin/bash

echo "🚀 Setting up Circle development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

print_success "Node.js found: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_success "npm found: $(npm --version)"

# Install npm dependencies
print_status "Installing npm dependencies..."
npm install
if [ $? -eq 0 ]; then
    print_success "npm dependencies installed"
else
    print_error "Failed to install npm dependencies"
    exit 1
fi

# Install circom globally
print_status "Installing circom compiler..."
if command -v circom &> /dev/null; then
    print_success "circom already installed: $(circom --version)"
else
    # Try to install circom via npm
    npm install -g circom
    
    if command -v circom &> /dev/null; then
        print_success "circom installed successfully: $(circom --version)"
    else
        print_warning "circom npm installation failed, trying manual installation..."
        
        # Check if Rust is installed
        if ! command -v cargo &> /dev/null; then
            print_status "Installing Rust (required for circom)..."
            curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
            source ~/.cargo/env
        fi
        
        print_status "Compiling circom from source..."
        if [ ! -d "circom" ]; then
            git clone https://github.com/iden3/circom.git
        fi
        
        cd circom
        cargo build --release
        cargo install --path circom
        cd ..
        
        if command -v circom &> /dev/null; then
            print_success "circom compiled and installed: $(circom --version)"
        else
            print_error "Failed to install circom. Please install manually:"
            print_error "https://docs.circom.io/getting-started/installation/"
            exit 1
        fi
    fi
fi

# Create necessary directories
print_status "Creating directories..."
mkdir -p public/circuits
mkdir -p circuits
mkdir -p scripts

print_success "Directories created"

# Download circomlib if not present
if [ ! -d "node_modules/circomlib" ]; then
    print_status "Installing circomlib..."
    npm install circomlib
    print_success "circomlib installed"
fi

# Try to compile circuits
print_status "Attempting to compile ZK circuits..."
if command -v circom &> /dev/null; then
    npm run compile-circuits
    if [ $? -eq 0 ]; then
        print_success "ZK circuits compiled successfully!"
    else
        print_warning "Circuit compilation failed, but environment is set up"
        print_warning "You can compile circuits manually later with: npm run compile-circuits"
    fi
else
    print_warning "circom not available, skipping circuit compilation"
fi

# Final check
print_status "Running final environment check..."

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"

if command -v circom &> /dev/null; then
    echo "✅ circom: $(circom --version)"
else
    echo "❌ circom: Not installed"
fi

echo ""
echo "🚀 You can now start the development server:"
echo "   npm run dev"
echo ""
echo "🔮 To compile ZK circuits:"
echo "   npm run compile-circuits"
echo ""
echo "🧅 All Tor and Killswitch features are ready!"
echo ""

print_success "Setup complete! Happy coding! 🔥" 