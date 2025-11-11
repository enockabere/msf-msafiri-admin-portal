# Voucher Scanner System Documentation

## Overview
The Voucher Scanner System allows event administrators to create scanner accounts for voucher redemption and track participant voucher usage in real-time.

## Features

### 1. Scanner Management
- **Create Scanner Accounts**: Admins can create email-based scanner accounts
- **Auto User Creation**: If email doesn't exist, system creates new user with scanner role
- **Role Assignment**: Automatically assigns "voucher_scanner" role
- **Status Management**: Activate/deactivate scanner accounts
- **Event-Specific Access**: Scanners are tied to specific events

### 2. Participant Tracking
- **Real-time Balance**: View allocated vs redeemed vouchers
- **Over-redemption Detection**: Identify participants who exceed allocation
- **Redemption History**: Track when and where vouchers were redeemed
- **Scanner Attribution**: Know which scanner processed each redemption

### 3. Mobile Scanner Interface
- **Simple UI**: Mobile-friendly interface for scanners
- **Participant Lookup**: Search by participant ID
- **QR Code Ready**: Prepared for QR code scanning integration
- **Balance Display**: Shows allocated, used, and remaining vouchers
- **Warning System**: Alerts for over-redemptions

## Implementation

### Frontend Components

#### Admin Portal - Event Allocations (Enhanced)
**File**: `app/tenant/[slug]/events/EventAllocations.tsx`

**New Features Added**:
- Scanner management section in vouchers tab
- Participant redemption tracking table
- Over-redemption highlighting
- Scanner creation form

**Key Functions**:
```typescript
// Create scanner account
handleSubmitScanner()

// Toggle scanner status
handleToggleScannerStatus()

// Delete scanner
handleDeleteScanner()

// Fetch participant redemptions
fetchParticipantRedemptions()
```

#### Mobile Scanner App
**File**: `app/scanner/page.tsx`

**Features**:
- Participant ID input
- QR code scanning placeholder
- Balance display
- Voucher redemption button
- Over-redemption warnings

### Backend API Endpoints

#### Voucher Scanner Management
**File**: `app/api/v1/endpoints/voucher_scanners.py`

**Endpoints**:
- `POST /voucher-scanners` - Create scanner account
- `GET /voucher-scanners/event/{event_id}` - Get event scanners
- `PATCH /voucher-scanners/{scanner_id}/toggle-status` - Toggle status
- `DELETE /voucher-scanners/{scanner_id}` - Delete scanner

#### Voucher Redemption Tracking
**File**: `app/api/v1/endpoints/voucher_redemptions.py`

**Endpoints**:
- `GET /voucher-redemptions/event/{event_id}/participants` - Get participant data
- `POST /voucher-redemptions/redeem` - Redeem voucher
- `GET /voucher-redemptions/participant/{participant_id}/balance` - Get balance

### Database Schema

#### Updated Tables

**participant_voucher_redemptions**:
```sql
CREATE TABLE participant_voucher_redemptions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id),
    participant_id INTEGER NOT NULL REFERENCES users(id),
    redeemed_by INTEGER NOT NULL REFERENCES users(id),
    redeemed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**roles** (new role added):
```sql
INSERT INTO roles (name, description)
VALUES ('voucher_scanner', 'Can scan and redeem vouchers');
```

## Usage Workflow

### 1. Admin Setup
1. Go to Event Management → Event Details → Allocations → Vouchers
2. Create voucher allocation (vouchers per participant)
3. Click "Add Scanner" to create scanner account
4. Enter scanner email and name
5. System creates user account with scanner role

### 2. Scanner Access
1. Scanner logs in with created email account
2. Navigates to `/scanner?event_id=X&tenant_id=Y`
3. Enters participant ID or scans QR code
4. Reviews participant balance
5. Clicks "Redeem 1 Voucher" to process

### 3. Admin Monitoring
1. View "Participant Voucher Tracking" section
2. Monitor real-time redemption data
3. Identify over-redemptions (highlighted in red)
4. Track scanner activity and performance

## Key Benefits

### For Administrators
- **Real-time Monitoring**: See voucher usage as it happens
- **Over-redemption Detection**: Immediately identify issues
- **Scanner Management**: Control who can redeem vouchers
- **Audit Trail**: Complete history of all redemptions

### For Scanners
- **Simple Interface**: Easy-to-use mobile interface
- **Instant Feedback**: Immediate balance updates
- **Warning System**: Alerts for potential issues
- **Offline Ready**: Minimal data requirements

### For Participants
- **Fair Distribution**: Prevents voucher hoarding
- **Transparent Process**: Clear allocation and usage tracking
- **Quick Service**: Fast redemption process

## Security Features

### Access Control
- **Role-based Access**: Only scanner role can redeem
- **Event-specific**: Scanners limited to assigned events
- **Admin Oversight**: Full admin control over scanner accounts

### Audit Trail
- **Complete Logging**: Every redemption recorded
- **Scanner Attribution**: Know who processed each redemption
- **Timestamp Tracking**: Precise redemption times
- **Location Tracking**: Where vouchers were redeemed

## Technical Notes

### Database Setup
Run the table creation script:
```bash
cd /var/www/msafiri-visitor-api
python create_voucher_scanner_tables.py
```

### API Integration
All endpoints follow RESTful conventions and include:
- Proper error handling
- Authentication requirements
- Tenant isolation
- Input validation

### Mobile Compatibility
Scanner interface is optimized for:
- Touch interfaces
- Small screens
- Offline capability (future enhancement)
- Fast loading times

## Future Enhancements

### Planned Features
1. **QR Code Integration**: Camera-based QR scanning
2. **Offline Mode**: Work without internet connection
3. **Bulk Redemption**: Process multiple vouchers at once
4. **Analytics Dashboard**: Detailed usage statistics
5. **Push Notifications**: Real-time alerts for admins

### Integration Opportunities
1. **Mobile App**: Native mobile scanner app
2. **Hardware Scanners**: Barcode/QR scanner integration
3. **Payment Systems**: Link to payment processing
4. **Inventory Management**: Track physical voucher stock

## Troubleshooting

### Common Issues

**Scanner Can't Login**:
- Verify email was created correctly
- Check scanner role assignment
- Ensure account is active

**Participant Not Found**:
- Verify participant is confirmed for event
- Check participant ID accuracy
- Ensure event ID is correct

**Over-redemption Warnings**:
- Review participant allocation
- Check for duplicate redemptions
- Verify scanner training

### Support Contacts
- Technical Issues: Check server logs
- User Training: Refer to usage workflow
- Feature Requests: Document for future releases

## Deployment Checklist

### Backend Deployment
- [ ] Run database migration script
- [ ] Restart API service
- [ ] Verify new endpoints work
- [ ] Test scanner role creation

### Frontend Deployment
- [ ] Deploy admin portal updates
- [ ] Test scanner management UI
- [ ] Verify participant tracking
- [ ] Test mobile scanner interface

### User Training
- [ ] Train administrators on scanner management
- [ ] Train scanners on mobile interface
- [ ] Document troubleshooting procedures
- [ ] Set up monitoring alerts