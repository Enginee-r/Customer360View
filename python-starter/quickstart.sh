#!/bin/bash

# Customer 360 View - Quick Start Script
# This script sets up and runs the complete platform

set -e  # Exit on any error

echo "🚀 Customer 360° View - Quick Start"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python
echo -e "${BLUE}Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi
echo -e "${GREEN}✓ Python found${NC}"

# Check Node.js
echo -e "${BLUE}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"
echo ""

# Install Python dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"
pip install -r requirements.txt
echo -e "${GREEN}✓ Python dependencies installed${NC}"
echo ""

# Create data directories
echo -e "${BLUE}Creating data directories...${NC}"
mkdir -p data/bronze data/silver data/gold
echo -e "${GREEN}✓ Data directories created${NC}"
echo ""

# Generate sample data
echo -e "${BLUE}Generating sample data...${NC}"
python scripts/generate_sample_data.py
echo -e "${GREEN}✓ Sample data generated${NC}"
echo ""

# Run Gold layer aggregation
echo -e "${BLUE}Creating Gold layer analytics...${NC}"
python scripts/aggregate_gold.py
echo -e "${GREEN}✓ Gold layer created${NC}"
echo ""

# Install dashboard dependencies
echo -e "${BLUE}Installing dashboard dependencies...${NC}"
cd dashboard
npm install
cd ..
echo -e "${GREEN}✓ Dashboard dependencies installed${NC}"
echo ""

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "To start the platform:"
echo ""
echo -e "${YELLOW}Terminal 1 - Start API:${NC}"
echo "  cd api"
echo "  python app.py"
echo ""
echo -e "${YELLOW}Terminal 2 - Start Dashboard:${NC}"
echo "  cd dashboard"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "  - SETUP_GUIDE.md - Detailed setup instructions"
echo "  - PROJECT_STRUCTURE.md - Architecture overview"
echo "  - README.md - Project overview"
echo ""
