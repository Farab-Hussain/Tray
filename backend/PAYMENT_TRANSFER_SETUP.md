# Payment Transfer Setup Guide

## Overview

This document explains how the payment transfer system works for automatically sending payments from admin to consultants after session completion.

## Payment Flow

1. **Student books consultant** → Payment is made to admin's Stripe account
2. **Payment is successful** → Booking status is set to "paid"
3. **Consultant completes session** → Booking status changes to "completed"
4. **Automatic transfer** → Payment is automatically transferred to consultant (minus platform fee)

## Setup Requirements

### 1. Environment Variables

Add these to your `.env` file:

```env
STRIPE_SECRET_KEY=sk_live_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Your Stripe webhook secret
FRONTEND_URL=https://yourdomain.com # Your frontend URL for Stripe Connect redirects (web)
MOBILE_RETURN_URL=tray://stripe/return # Deep link URL for mobile app return
MOBILE_REFRESH_URL=tray://stripe/refresh # Deep link URL for mobile app refresh
PLATFORM_FEE_PERCENT=10 # Platform commission percentage (default: 10%)
```

### 2. Stripe Connect Setup

Stripe Connect must be enabled in your Stripe dashboard:
- Go to Stripe Dashboard → Settings → Connect
- Enable Stripe Connect
- Configure your Connect settings

## Consultant Account Setup

### Step 1: Consultant Creates Stripe Account

Consultants need to set up their Stripe account to receive payments:

**Endpoint:** `POST /payment/connect/create-account`

**Authentication:** Required (consultant must be logged in)

**Response:**
```json
{
  "accountId": "acct_...",
  "onboardingUrl": "https://connect.stripe.com/...",
  "message": "Stripe account created successfully. Please complete onboarding."
}
```

The consultant will be redirected to Stripe's onboarding page to provide:
- Business information
- Bank account details
- Tax information

### Step 2: Check Account Status

**Endpoint:** `GET /payment/connect/account-status`

**Response:**
```json
{
  "hasAccount": true,
  "accountId": "acct_...",
  "status": {
    "detailsSubmitted": true,
    "chargesEnabled": true,
    "payoutsEnabled": true,
    "isComplete": true
  },
  "onboardingUrl": null // Only present if onboarding incomplete
}
```

## Automatic Payment Transfer

### How It Works

When a booking status is updated to "completed":

1. System checks if:
   - Payment status is "paid"
   - Payment hasn't been transferred yet
   - Consultant has a Stripe account
   - Consultant's Stripe account is fully set up

2. If all conditions are met:
   - Calculates platform fee (default: 10%)
   - Transfers remaining amount to consultant
   - Updates booking with transfer details

### Manual Transfer (Optional)

If you need to manually trigger a transfer:

**Endpoint:** `POST /payment/transfer`

**Body:**
```json
{
  "bookingId": "booking_123",
  "amount": 100.00,
  "description": "Payment for completed session"
}
```

**Response:**
```json
{
  "message": "Payment transferred successfully",
  "transferId": "tr_...",
  "amount": 90.00,
  "platformFee": 10.00,
  "bookingId": "booking_123"
}
```

## Database Schema

### Consultant Model Updates

Added fields to `consultant.model.ts`:
- `stripeAccountId`: Stripe Connect account ID
- `stripeAccountStatus`: 'pending' | 'active' | 'restricted' | 'disabled'
- `stripeAccountDetailsSubmitted`: Boolean
- `stripeOnboardingComplete`: Boolean

### Booking Model Updates

When payment is transferred, booking is updated with:
- `paymentTransferred`: Boolean
- `transferId`: Stripe transfer ID
- `transferAmount`: Amount transferred to consultant
- `platformFee`: Platform fee deducted
- `transferredAt`: Timestamp of transfer

## API Endpoints

### Payment Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/payment/create-payment-intent` | Create payment intent for booking | No |
| POST | `/payment/connect/create-account` | Create Stripe Connect account | Yes (Consultant) |
| GET | `/payment/connect/account-status` | Get Stripe account status | Yes (Consultant) |
| POST | `/payment/transfer` | Manually transfer payment | Yes |

### Booking Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/bookings/:bookingId/status` | Update booking status (auto-triggers transfer if completed) |

## Error Handling

### Common Errors

1. **NO_STRIPE_ACCOUNT**: Consultant hasn't set up Stripe account
   - Solution: Consultant must create Stripe Connect account first

2. **ACCOUNT_NOT_READY**: Consultant's Stripe account not fully set up
   - Solution: Consultant must complete Stripe onboarding

3. **TRANSFER_ERROR**: Transfer failed
   - Check Stripe logs for details
   - Verify consultant's account is active

## Frontend Integration

### For Consultants

1. **Account Setup Page**: 
   - Show button to create Stripe account
   - Display onboarding URL if account incomplete
   - Show account status

2. **Account Status Display**:
   - Show if account is set up
   - Display onboarding status
   - Provide link to complete onboarding if needed

### Example Integration

```typescript
// Create Stripe account
const createAccount = async () => {
  const response = await api.post('/payment/connect/create-account');
  if (response.data.onboardingUrl) {
    window.location.href = response.data.onboardingUrl;
  }
};

// Check account status
const checkStatus = async () => {
  const response = await api.get('/payment/connect/account-status');
  if (!response.data.status.isComplete) {
    // Show onboarding link
    return response.data.onboardingUrl;
  }
};
```

## Testing

### Test Mode

Use Stripe test mode:
- Test secret key: `sk_test_...`
- Test mode allows creating test accounts
- Test transfers won't actually move money

### Test Scenarios

1. ✅ Consultant creates account → Completes onboarding → Session completes → Transfer succeeds
2. ✅ Consultant creates account → Incomplete onboarding → Session completes → Transfer fails gracefully
3. ✅ No Stripe account → Session completes → Transfer fails with error message

## Security Considerations

1. **Authentication**: All endpoints require authentication
2. **Authorization**: Only consultants can create/check their own accounts
3. **Validation**: All transfers are validated before execution
4. **Error Handling**: Transfer errors don't break booking updates

## Support

For issues:
1. Check Stripe Dashboard → Connect → Accounts
2. Review server logs for transfer errors
3. Verify environment variables are set correctly
4. Ensure Stripe Connect is enabled in dashboard

