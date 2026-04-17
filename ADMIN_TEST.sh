#!/bin/bash

# Admin Dashboard System - Quick Start Guide
# This script helps test the admin dashboard system

echo "=== SecInsure Admin Dashboard - Quick Start ==="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

BACKEND_URL="http://192.168.1.33:8000"
FRONTEND_URL="http://localhost:5173"

# Function to print section headers
print_header() {
    echo -e "${BLUE}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if backend is running
check_backend() {
    print_header "Checking Backend Connection"
    if curl -s "$BACKEND_URL/health" > /dev/null; then
        print_success "Backend is running at $BACKEND_URL"
        return 0
    else
        print_error "Backend is not responding at $BACKEND_URL"
        print_warning "Make sure backend is running: cd backend && python -m uvicorn main:app --reload"
        return 1
    fi
}

# Test: Get Dashboard Stats
test_stats() {
    print_header "Test: Get Admin Stats"
    echo "Running: curl $BACKEND_URL/admin/stats"
    echo ""
    curl -s "$BACKEND_URL/admin/stats" | jq '.' 2>/dev/null || print_error "Failed to fetch stats"
    echo ""
}

# Test: List Claims
test_claims() {
    print_header "Test: List All Claims"
    echo "Running: curl $BACKEND_URL/admin/claims?page=1&limit=5"
    echo ""
    curl -s "$BACKEND_URL/admin/claims?page=1&limit=5" | jq '.' 2>/dev/null || print_error "Failed to fetch claims"
    echo ""
}

# Test: List Fraud Claims
test_fraud() {
    print_header "Test: List Fraud Claims"
    echo "Running: curl $BACKEND_URL/admin/fraud?page=1&limit=5"
    echo ""
    curl -s "$BACKEND_URL/admin/fraud?page=1&limit=5" | jq '.' 2>/dev/null || print_error "Failed to fetch fraud claims"
    echo ""
}

# Test: Get Analytics
test_analytics() {
    print_header "Test: Get Analytics Data"
    echo "Running: curl $BACKEND_URL/admin/analytics"
    echo ""
    curl -s "$BACKEND_URL/admin/analytics" | jq '.' 2>/dev/null || print_error "Failed to fetch analytics"
    echo ""
}

# Test: Get Predictions
test_predictions() {
    print_header "Test: Get Risk Predictions"
    echo "Running: curl $BACKEND_URL/admin/predictions"
    echo ""
    curl -s "$BACKEND_URL/admin/predictions" | jq '.' 2>/dev/null || print_error "Failed to fetch predictions"
    echo ""
}

# Test: Create Test Claim (Approved)
test_create_approved() {
    print_header "Test: Create Test Claim (Should be Approved)"
    
    CLAIM_DATA='{
      "user_id": "test-driver-'$(date +%s)'",
      "user_name": "Test Driver",
      "location": {"lat": 13.05, "lng": 80.15, "zone": "Chennai"},
      "disruption_type": "rain",
      "amount": 150.0
    }'
    
    echo "Creating claim..."
    echo "$CLAIM_DATA" | jq '.'
    echo ""
    
    RESULT=$(curl -s -X POST "$BACKEND_URL/admin/claims" \
      -H "Content-Type: application/json" \
      -d "$CLAIM_DATA")
    
    echo "$RESULT" | jq '.'
    
    CLAIM_ID=$(echo "$RESULT" | jq -r '.claim_id')
    echo "New Claim ID: $CLAIM_ID"
    echo ""
}

# Test: Create Fraud Claim (GPS Mismatch)
test_create_fraud_gps() {
    print_header "Test: Create Fraudulent Claim (GPS Mismatch)"
    
    CLAIM_DATA='{
      "user_id": "test-driver-fraud-'$(date +%s)'",
      "user_name": "Fraud Driver GPS",
      "location": {"lat": 28.6, "lng": 77.2, "zone": "Delhi"},
      "disruption_type": "rain",
      "amount": 200.0
    }'
    
    echo "Creating claim from Delhi zone (should fail for Chennai-based driver)..."
    echo "$CLAIM_DATA" | jq '.'
    echo ""
    
    RESULT=$(curl -s -X POST "$BACKEND_URL/admin/claims" \
      -H "Content-Type: application/json" \
      -d "$CLAIM_DATA")
    
    STATUS=$(echo "$RESULT" | jq -r '.status')
    if [ "$STATUS" = "fraud" ]; then
        print_success "Fraudulent claim detected as expected!"
    fi
    
    echo "$RESULT" | jq '.'
    echo ""
}

# Test: Process Payout
test_payout() {
    print_header "Test: Process Payout"
    print_warning "Note: This requires a valid approved claim ID"
    
    # Try to get an approved claim first
    CLAIMS=$(curl -s "$BACKEND_URL/admin/claims?status=approved&limit=1")
    CLAIM_ID=$(echo "$CLAIMS" | jq -r '.claims[0].id' 2>/dev/null)
    
    if [ "$CLAIM_ID" != "null" ] && [ -n "$CLAIM_ID" ]; then
        AMOUNT=$(echo "$CLAIMS" | jq -r '.claims[0].amount')
        
        echo "Processing payout for claim: $CLAIM_ID"
        echo "Amount: ₹$AMOUNT"
        echo ""
        
        RESULT=$(curl -s -X POST "$BACKEND_URL/admin/payout?claim_id=$CLAIM_ID&amount=$AMOUNT" \
          -H "Content-Type: application/json")
        
        echo "$RESULT" | jq '.'
    else
        print_warning "No approved claims found. Create an approved claim first."
    fi
    echo ""
}

# Test: Get Payout Summary
test_payout_summary() {
    print_header "Test: Get Today's Payout Summary"
    echo "Running: curl $BACKEND_URL/admin/payout-summary"
    echo ""
    curl -s "$BACKEND_URL/admin/payout-summary" | jq '.' 2>/dev/null || print_error "Failed to fetch payout summary"
    echo ""
}

# Menu
show_menu() {
    echo ""
    echo "=== Admin Dashboard API Tests ==="
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  check         - Check backend connection"
    echo "  stats         - Get admin stats"
    echo "  claims        - List all claims"
    echo "  fraud         - List fraud claims"
    echo "  analytics     - Get analytics data"
    echo "  predictions   - Get risk predictions"
    echo "  create-approved - Create approved test claim"
    echo "  create-fraud  - Create fraudulent claim (GPS mismatch)"
    echo "  payout        - Process payout for approved claim"
    echo "  payout-summary - Get today's payout summary"
    echo "  all           - Run all tests"
    echo ""
    echo "Examples:"
    echo "  $0 check"
    echo "  $0 stats"
    echo "  $0 all"
    echo ""
}

# Main execution
if [ $# -eq 0 ]; then
    show_menu
    exit 0
fi

# Check backend first
check_backend || exit 1

case "$1" in
    check)
        ;;
    stats)
        test_stats
        ;;
    claims)
        test_claims
        ;;
    fraud)
        test_fraud
        ;;
    analytics)
        test_analytics
        ;;
    predictions)
        test_predictions
        ;;
    create-approved)
        test_create_approved
        ;;
    create-fraud)
        test_create_fraud_gps
        ;;
    payout)
        test_payout
        ;;
    payout-summary)
        test_payout_summary
        ;;
    all)
        test_stats
        test_claims
        test_fraud
        test_analytics
        test_predictions
        test_create_approved
        test_create_fraud_gps
        test_payout_summary
        print_header "All tests completed!"
        ;;
    *)
        print_error "Unknown command: $1"
        show_menu
        exit 1
        ;;
esac

print_success "Test completed!"
