#!/bin/bash

# Evidex Parachain Setup Script
# This script helps you set up a personalized parachain network for Evidex

set -e

echo "🚀 Setting up Evidex Parachain Network..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo -e "${YELLOW}Checking requirements...${NC}"
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
        exit 1
    fi
    
    if ! command -v rustc &> /dev/null; then
        echo -e "${RED}Rust is not installed. Please install Rust first.${NC}"
        echo "Visit: https://rustup.rs/"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All requirements met${NC}"
}

# Install Substrate dependencies
install_substrate_deps() {
    echo -e "${YELLOW}Installing Substrate dependencies...${NC}"
    
    # Install required Rust components
    rustup update stable
    rustup target add wasm32-unknown-unknown --toolchain stable
    
    # Install substrate toolchain
    curl https://getsubstrate.io -sSf | bash -s -- --fast
    
    echo -e "${GREEN}✓ Substrate dependencies installed${NC}"
}

# Create parachain directory structure
create_parachain_structure() {
    echo -e "${YELLOW}Creating parachain directory structure...${NC}"
    
    mkdir -p parachain/{scripts,chainspec,pallets/evidence,node,service}
    
    echo -e "${GREEN}✓ Directory structure created${NC}"
}

# Generate chainspec
generate_chainspec() {
    echo -e "${YELLOW}Generating chain specification...${NC}"
    
    # This will be implemented when we create the chainspec
    echo "Chain specification will be generated in the next step..."
}

# Main setup flow
main() {
    check_requirements
    install_substrate_deps
    create_parachain_structure
    generate_chainspec
    
    echo -e "${GREEN}🎉 Parachain setup completed!${NC}"
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Update your .env file with parachain configuration"
    echo "2. Run 'docker-compose -f docker-compose.parachain.yml up' to start the network"
    echo "3. Use the generated chainspec to bootstrap your parachain"
}

main "$@"
