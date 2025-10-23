# Email Configuration Setup

To enable business account notifications and email verification, you need to configure email settings.

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Admin Configuration
ADMIN_EMAIL=admin@gastro-elite.com

# App Configuration
APP_URL=http://localhost:3000
```

## Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password as `SMTP_PASS`

## Other Email Providers

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### Custom SMTP
```env
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## Features Enabled

Once configured, the system will:

1. **Business Account Registration**:
   - Send detailed business information to admin email
   - Include KvK document as attachment
   - Send confirmation email to business user

2. **Personal Account Registration**:
   - Send welcome email with verification link
   - Include account details confirmation

3. **Email Verification**:
   - 24-hour expiry on verification links
   - Secure token-based verification
   - Automatic account activation

## Testing

To test email functionality:

1. Configure the environment variables
2. Restart the development server
3. Try registering a new account
4. Check your email for notifications

## Troubleshooting

- **Authentication failed**: Check your email credentials and app password
- **Connection timeout**: Verify SMTP host and port settings
- **Emails not sending**: Check spam folder and email provider settings




