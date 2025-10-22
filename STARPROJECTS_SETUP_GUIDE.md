# starprojects.nl Email Setup Guide

## ✅ Configuration Added

Your `.env.local` file has been updated with the email configuration for starprojects.nl.

## 🔧 Next Steps to Complete Setup

### 1. **Update Email Password**
You need to replace `your-email-password` in your `.env.local` file with the actual password for `noreply@starprojects.nl`.

Edit your `.env.local` file and change:
```
SMTP_PASS=your-email-password
```
to:
```
SMTP_PASS=your-actual-password
```

### 2. **Common SMTP Settings for Domain Email Hosting**

If `smtp.starprojects.nl` doesn't work, try these common alternatives:

#### Option A: Standard SMTP
```
SMTP_HOST=smtp.starprojects.nl
SMTP_PORT=587
```

#### Option B: Alternative SMTP
```
SMTP_HOST=mail.starprojects.nl
SMTP_PORT=587
```

#### Option C: Secure SMTP
```
SMTP_HOST=smtp.starprojects.nl
SMTP_PORT=465
```

### 3. **Test Your Configuration**

After updating the password, restart your development server and test:

```bash
# Restart the development server
npm run dev

# In another terminal, test email configuration
curl -X POST http://localhost:3000/api/test-email
```

### 4. **Email Addresses Setup**

Make sure these email addresses exist on your starprojects.nl domain:
- ✅ `noreply@starprojects.nl` - For sending emails
- ✅ `admin@starprojects.nl` - For receiving admin notifications

### 5. **DNS Configuration (Recommended)**

For better email deliverability, add these DNS records to starprojects.nl:

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:starprojects.nl ~all
```

#### DKIM Record
```
Type: TXT
Name: default._domainkey
Value: (provided by your email hosting provider)
```

### 6. **Testing the Full Email Flow**

Once configured, test the complete email system:

1. **Register a new business account**
2. **Check admin@starprojects.nl** for the business registration notification
3. **Check the user's email** for the verification email
4. **Use the admin panel** to approve/reject the business account
5. **Check emails** for approval/rejection notifications

## 🚨 Troubleshooting

### If SMTP connection fails:

1. **Check SMTP host**: Try `mail.starprojects.nl` instead of `smtp.starprojects.nl`
2. **Check port**: Try port `465` for SSL or `25` for unencrypted
3. **Check credentials**: Verify the email address and password
4. **Check firewall**: Ensure port 587/465 is not blocked

### Common Error Messages:

- **"Authentication failed"**: Wrong email/password
- **"Connection timeout"**: Wrong SMTP host or port
- **"Connection refused"**: Firewall blocking or wrong port

## 📧 Email Templates Preview

Once working, emails will be sent:
- **From**: `Gastro-Elite <noreply@starprojects.nl>`
- **To Admin**: `admin@starprojects.nl`
- **Subject**: Professional email subjects with Gastro-Elite branding

## 🎯 Ready to Test

After updating the password in `.env.local`:

1. Restart your development server
2. Run the email test command
3. Register a test account
4. Check your emails!

Let me know if you need help with any of these steps!
