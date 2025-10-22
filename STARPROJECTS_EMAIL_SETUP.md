# Email Configuration for starprojects.nl Domain

## Quick Setup Guide

### 1. Create Environment File
Create a `.env` file in your project root with the following configuration:

```env
# Database Configuration
DATABASE_URL="file:./dev.db"

# Email Configuration for starprojects.nl
SMTP_HOST=smtp.starprojects.nl
SMTP_PORT=587
SMTP_USER=noreply@starprojects.nl
SMTP_PASS=your-email-password

# Admin Configuration
ADMIN_EMAIL=admin@starprojects.nl

# App Configuration
APP_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-jwt-secret-key-here
```

### 2. Email Provider Options for starprojects.nl

#### Option A: Use Your Domain's Email Hosting
If you have email hosting set up for starprojects.nl:

```env
SMTP_HOST=smtp.starprojects.nl
SMTP_PORT=587
SMTP_USER=noreply@starprojects.nl
SMTP_PASS=your-email-password
ADMIN_EMAIL=admin@starprojects.nl
```

#### Option B: Use Gmail with Custom Domain (Recommended)
If you want to use Gmail but send emails from your domain:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
ADMIN_EMAIL=admin@starprojects.nl
```

**Note:** You'll need to configure Gmail to send emails from starprojects.nl domain.

#### Option C: Use a Third-Party Email Service
For better deliverability, consider using services like:

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
ADMIN_EMAIL=admin@starprojects.nl
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.starprojects.nl
SMTP_PASS=your-mailgun-password
ADMIN_EMAIL=admin@starprojects.nl
```

### 3. DNS Configuration (Required for Custom Domain)

To send emails from starprojects.nl, you need these DNS records:

#### SPF Record
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
```

#### DKIM Record
```
Type: CNAME
Name: google._domainkey
Value: google._domainkey.your-provider.com
```

#### DMARC Record
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@starprojects.nl
```

### 4. Testing Your Configuration

After setting up your `.env` file, test the configuration:

```bash
# Test email configuration
curl -X POST http://localhost:3000/api/test-email

# Send test email
curl -X POST http://localhost:3000/api/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@example.com"}'
```

### 5. Production Configuration

When deploying to production, update:

```env
APP_URL=https://starprojects.nl
```

## Email Templates

The system will send emails from:
- **From Address**: `Gastro-Elite <noreply@starprojects.nl>`
- **Admin Notifications**: `admin@starprojects.nl`

## Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - Check SMTP credentials
   - Ensure 2FA is enabled if using Gmail
   - Use app passwords, not regular passwords

2. **Connection Timeout**
   - Verify SMTP host and port
   - Check firewall settings
   - Try different ports (465 for SSL, 587 for TLS)

3. **Emails Going to Spam**
   - Set up SPF, DKIM, and DMARC records
   - Use a dedicated IP address
   - Warm up your sending reputation

### Testing Commands:

```bash
# Check if server is running
curl http://localhost:3000/api/test-email

# Test with verbose output
curl -v -X POST http://localhost:3000/api/test-email

# Check environment variables (in production)
echo $SMTP_HOST
echo $SMTP_USER
```

## Next Steps

1. Set up your `.env` file with the appropriate SMTP settings
2. Configure DNS records for starprojects.nl
3. Test the email configuration
4. Register a test business account to verify the full email flow
5. Monitor email delivery and adjust settings as needed

## Support

If you need help with:
- DNS configuration
- Email provider setup
- SMTP authentication
- Email deliverability

Please provide your preferred email provider details, and I can help you configure the specific settings.
