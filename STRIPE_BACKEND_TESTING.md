# Stripe Connect Backend Implementation - Testing Guide

## Quick Start Testing

### 1. Environment Setup Verification
```bash
# Check if Stripe environment variables are set
node -e "
require('dotenv').config();
console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set ✓' : 'Missing ✗');
console.log('STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? 'Set ✓' : 'Missing ✗');
console.log('STRIPE_WEBHOOK_SECRET:', process.env.STRIPE_WEBHOOK_SECRET ? 'Set ✓' : 'Missing ✗');
console.log('STRIPE_COMMISSION_PERCENT:', process.env.STRIPE_COMMISSION_PERCENT || 'Using default: 10');
console.log('STRIPE_PAYOUT_HOLD_DAYS:', process.env.STRIPE_PAYOUT_HOLD_DAYS || 'Using default: 14');
"
```

### 2. Test Stripe Configuration
```bash
# Start your server first: npm start
# Then test the health endpoint
curl -X GET http://localhost:5000/api/health \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 3. Test Lawyer Onboarding Flow
```javascript
// 1. Create Stripe Connect Account
POST /api/stripe-connect/create-account
Headers: { "Authorization": "Bearer LAWYER_JWT_TOKEN" }
Body: {
  "email": "lawyer@example.com",
  "country": "US",
  "businessType": "individual"
}

// 2. Complete onboarding
POST /api/stripe-connect/complete-onboarding
Headers: { "Authorization": "Bearer LAWYER_JWT_TOKEN" }

// 3. Check account status
GET /api/stripe-connect/account-status
Headers: { "Authorization": "Bearer LAWYER_JWT_TOKEN" }
```

### 4. Test Order Creation & Payment Flow
```javascript
// 1. Create order (client)
POST /api/orders/create
Headers: { "Authorization": "Bearer CLIENT_JWT_TOKEN" }
Body: {
  "lawyerId": "LAWYER_MONGO_ID",
  "serviceType": "consultation",
  "amount": 5000,
  "currency": "inr",
  "description": "Legal consultation for contract review"
}

// 2. Pay for order (client)
POST /api/orders/ORDER_ID/pay
Headers: { "Authorization": "Bearer CLIENT_JWT_TOKEN" }
Body: {
  "paymentMethodId": "pm_card_visa" // Test payment method
}

// 3. Upload deliverable (lawyer)
POST /api/deliverables/ORDER_ID/upload
Headers: { 
  "Authorization": "Bearer LAWYER_JWT_TOKEN",
  "Content-Type": "multipart/form-data"
}
Body: FormData with file and description

// 4. Accept deliverable (client)
POST /api/deliverables/DELIVERABLE_ID/accept
Headers: { "Authorization": "Bearer CLIENT_JWT_TOKEN" }
Body: {
  "acceptanceNotes": "Work completed satisfactorily"
}
```

## API Endpoints Overview

### Stripe Connect Routes (`/api/stripe-connect/`)
- `POST /create-account` - Create Stripe Connect account for lawyer
- `POST /complete-onboarding` - Complete Stripe onboarding process
- `GET /account-status` - Get lawyer's Stripe account status
- `GET /onboarding-link` - Get fresh onboarding link
- `POST /payout` - Request payout (admin only)

### Orders Routes (`/api/orders/`)
- `POST /create` - Create new order
- `GET /` - Get user's orders (filtered by role)
- `GET /:orderId` - Get specific order details
- `POST /:orderId/pay` - Pay for order
- `POST /:orderId/release-funds` - Release escrowed funds
- `POST /:orderId/cancel` - Cancel order
- `POST /:orderId/dispute` - Create dispute
- `POST /:orderId/refund` - Process refund

### Deliverables Routes (`/api/deliverables/`)
- `POST /:orderId/upload` - Upload deliverable file
- `GET /:orderId` - Get order deliverables
- `POST /:deliverableId/accept` - Accept deliverable
- `POST /:deliverableId/reject` - Reject deliverable
- `GET /:deliverableId/download` - Download deliverable
- `DELETE /:deliverableId` - Delete deliverable

### Webhook Route (`/api/webhook/`)
- `POST /stripe` - Handle Stripe webhook events

## Environment Variables Required

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional Stripe Settings
STRIPE_COMMISSION_PERCENT=10
STRIPE_PAYOUT_HOLD_DAYS=14
```

## Database Models Created

1. **Order** - Tracks payment orders and escrow status
2. **Deliverable** - Manages file uploads and acceptance
3. **Payout** - Tracks Stripe transfers to lawyers
4. **User** (extended) - Added Stripe account fields

## Error Handling

All endpoints include comprehensive error handling for:
- Stripe API errors
- Validation errors
- Authentication/authorization errors
- Database errors
- File upload errors

## Next Steps for Frontend Integration

1. Install Stripe React packages
2. Create payment components using Stripe Elements
3. Build lawyer onboarding flow UI
4. Create order management dashboard
5. Implement file upload/download UI

## Testing Checklist

- [ ] Environment variables configured
- [ ] Server starts without errors
- [ ] Stripe configuration health check passes
- [ ] Lawyer can create Stripe account
- [ ] Client can create and pay for orders
- [ ] File upload/download works
- [ ] Webhook handles Stripe events
- [ ] Funds release after deliverable acceptance
- [ ] Dispute and refund flows work