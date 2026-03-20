# 🧪 EVIDEX Complete Application Testing Guide

## 👥 Test Scenarios: Admin + 2 Users

### 🎭 Test Characters:
- **👑 Admin**: `0x7014B1Ed9825905Ce8FD0D8744896Eab2C6DB6F3`
- **👤 User 1**: `0x1234567890123456789012345678901234567890`
- **👤 User 2**: `0x9876543210987654321098765432109876543210`

---

## 🚀 Phase 1: Admin Setup & Testing

### **Step 1: Admin Login**
1. **URL**: http://localhost:3000
2. **Click**: "Admin Login"
3. **Connect Wallet**: `0x7014B1Ed9825905Ce8FD0D8744896Eab2C6DB6F3`
4. **Sign Message**: Authenticate as admin

### **Step 2: Admin Dashboard Tests**
```bash
# Test Admin Stats API
curl -s http://localhost:3000/api/admin/stats | jq .

# Test Admin My-Evidence API  
curl -s http://localhost:3000/api/admin/my-evidence | jq .

# Test Debug Environment
curl -s http://localhost:3000/api/debug/env | jq .
```

### **Step 3: Admin Features to Test**
- [ ] **Analytics Dashboard**: View system statistics
- [ ] **Chain Management**: Enable/disable blockchains
- [ ] **User Management**: Monitor user activity
- [ ] **Evidence Overview**: View all uploaded evidence
- [ ] **Your Blocks**: View admin-generated blocks only

---

## 👥 Phase 2: User 1 Testing (Financial Evidence)

### **Step 1: User 1 Registration**
1. **URL**: http://localhost:3000
2. **Click**: "Create Account"
3. **Username**: `user1_financial`
4. **Password**: `test123456`
5. **Connect Wallet**: `0x1234567890123456789012345678901234567890`
6. **Sign Message**: Complete authentication

### **Step 2: User 1 - Upload Financial Evidence**
```bash
# Create test file
echo "Financial Contract - User 1 - $(date)" > /tmp/user1_financial.txt

# Upload via API (simulate form data)
curl -X POST http://localhost:3000/api/evidence/enhanced \
  -F "file=@/tmp/user1_financial.txt" \
  -F "evidenceType=financial" \
  -F "priority=high" \
  -F "chain=ethereum"
```

### **Step 3: User 1 - Upload Legal Evidence**
```bash
# Create legal document
echo "Legal Agreement - User 1 - $(date)" > /tmp/user1_legal.txt

# Upload legal evidence
curl -X POST http://localhost:3000/api/evidence/enhanced \
  -F "file=@/tmp/user1_legal.txt" \
  -F "evidenceType=legal" \
  -F "priority=high" \
  -F "chain=bitcoin"
```

### **Step 4: User 1 - Verification Tests**
```bash
# Get hash from upload response and verify
HASH="abc123" # Replace with actual hash

# Single chain verification
curl -s "http://localhost:3000/api/evidence/enhanced?hash=$HASH&chain=ethereum"

# Multi-chain verification
curl -s "http://localhost:3000/api/evidence/enhanced?hash=$HASH&verifyAll=true"
```

---

## 👥 Phase 3: User 2 Testing (General Evidence)

### **Step 1: User 2 Registration**
1. **URL**: http://localhost:3000
2. **Click**: "Create Account"
3. **Username**: `user2_general`
4. **Password**: `test123456`
5. **Connect Wallet**: `0x9876543210987654321098765432109876543210`
6. **Sign Message**: Complete authentication

### **Step 2: User 2 - Upload General Evidence**
```bash
# Create general document
echo "General Document - User 2 - $(date)" > /tmp/user2_general.txt

# Upload general evidence
curl -X POST http://localhost:3000/api/evidence/enhanced \
  -F "file=@/tmp/user2_general.txt" \
  -F "evidenceType=general" \
  -F "priority=low" \
  -F "chain=polkadot"
```

### **Step 3: User 2 - Upload Audit Evidence**
```bash
# Create audit document
echo "Audit Report - User 2 - $(date)" > /tmp/user2_audit.txt

# Upload audit evidence
curl -X POST http://localhost:3000/api/evidence/enhanced \
  -F "file=@/tmp/user2_audit.txt" \
  -F "evidenceType=audit" \
  -F "priority=medium" \
  -F "chain=polkadot"
```

---

## 🔍 Phase 4: Cross-User Verification Tests

### **Step 1: User 1 Verifies User 2's Evidence**
```bash
# User 1 tries to verify User 2's evidence
curl -s "http://localhost:3000/api/evidence/enhanced?hash=USER2_HASH&verifyAll=true"
```

### **Step 2: User 2 Verifies User 1's Evidence**
```bash
# User 2 tries to verify User 1's evidence
curl -s "http://localhost:3000/api/evidence/enhanced?hash=USER1_HASH&verifyAll=true"
```

### **Step 3: Admin Views All Evidence**
```bash
# Admin sees all evidence in the system
curl -s http://localhost:3000/api/admin/stats | jq '.latestEvidences'
```

---

## 🎯 Phase 5: Advanced Feature Tests

### **Step 1: Multi-Chain Anchoring Test**
Upload financial evidence and verify it gets anchored to:
- [ ] **Ethereum**: Primary financial proof
- [ ] **Polygon**: Backup financial proof
- [ ] **Polkadot**: Audit log

### **Step 2: Priority Routing Test**
Upload high-priority legal evidence and verify it gets anchored to:
- [ ] **Bitcoin**: Maximum immutability
- [ ] **Polkadot**: Legal compliance

### **Step 3: Error Handling Tests**
```bash
# Test with invalid file
curl -X POST http://localhost:3000/api/evidence/enhanced \
  -F "file=@/nonexistent.txt" \
  -F "evidenceType=financial"

# Test with no authentication
curl -X POST http://localhost:3000/api/evidence/enhanced \
  -F "file=@/tmp/test.txt"

# Test verification of non-existent hash
curl -s "http://localhost:3000/api/evidence/enhanced?hash=invalidhash&verifyAll=true"
```

---

## 📊 Phase 6: Admin Dashboard Verification

### **Step 1: Check Admin Statistics**
```bash
# Should show:
# - 3 users (admin + user1 + user2)
# - Multiple evidence records
# - Verification statistics
curl -s http://localhost:3000/api/admin/stats | jq .
```

### **Step 2: Check Admin's Personal Blocks**
```bash
# Should show only admin-generated evidence
curl -s http://localhost:3000/api/admin/my-evidence | jq .
```

### **Step 3: Verify Chain Management**
- [ ] **Ethereum**: Active for financial evidence
- [ ] **Polygon**: Active for backup financial
- [ ] **Polkadot**: Active for audit logs
- [ ] **Bitcoin**: Active for high-priority legal

---

## ✅ Success Criteria

### **Admin Tests:**
- [ ] ✅ Login successful with admin wallet
- [ ] ✅ Dashboard shows system statistics
- [ ] ✅ Can view only admin-generated blocks
- [ ] ✅ Chain management working
- [ ] ✅ User monitoring functional

### **User 1 Tests:**
- [ ] ✅ Registration successful
- [ ] ✅ Financial evidence uploaded to Ethereum + Polygon + Polkadot
- [ ] ✅ Legal evidence uploaded to Bitcoin + Polkadot
- [ ] ✅ Verification working on all chains
- [ ] ✅ Can verify other users' evidence

### **User 2 Tests:**
- [ ] ✅ Registration successful
- [ ] ✅ General evidence uploaded to Polkadot only
- [ ] ✅ Audit evidence uploaded to Polkadot
- [ ] ✅ Verification working
- [ ] ✅ Cost-effective routing working

### **Cross-Feature Tests:**
- [ ] ✅ Multi-chain anchoring working
- [ ] ✅ Priority-based routing working
- [ ] ✅ Cross-user verification working
- [ ] ✅ Error handling working
- [ ] ✅ IPFS integration working

---

## 🚨 Troubleshooting

### **Common Issues:**
1. **Auth Error**: Make sure wallet is connected and message signed
2. **Upload Error**: Check file size (<100MB) and format
3. **Chain Error**: Verify private keys are configured in .env
4. **Redis Error**: Ensure Redis is running
5. **Verification Error**: Check if evidence was actually uploaded

### **Debug Commands:**
```bash
# Check server logs
docker-compose logs -f web

# Check Redis connection
redis-cli ping

# Check database connection
docker-compose exec postgres psql -U evidex_user -d evidex -c "SELECT COUNT(*) FROM evidence;"

# Check environment variables
curl -s http://localhost:3000/api/debug/env | jq .
```

---

## 🎉 Test Completion

After successful testing, you should have:
1. **3 registered users** (admin + user1 + user2)
2. **Multiple evidence records** across different chains
3. **Verified multi-chain anchoring** working correctly
4. **Cross-user verification** functional
5. **Admin dashboard** showing complete system overview

**This comprehensive test validates the entire EVIDEX multi-chain evidence platform!**
