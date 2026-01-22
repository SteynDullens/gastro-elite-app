# ✅ Post-Deployment Checklist

Na het redeployen van je app, controleer het volgende:

## 🔍 Basis Checks

### 1. App is Live
- [ ] Ga naar je Vercel dashboard: [https://vercel.com/dashboard](https://vercel.com/dashboard)
- [ ] Check of de deployment status "Ready" of "Success" is
- [ ] Open je app URL:
  - `https://gastro-elite-app.vercel.app`
  - Of: `https://gastro-elite-app-steyn-dullens-projects.vercel.app`

### 2. Homepage Laadt
- [ ] Open je app in de browser
- [ ] Controleer of de homepage correct laadt
- [ ] Check of er geen console errors zijn (F12 → Console)

### 3. Environment Variables
Ga naar Vercel Dashboard → Settings → Environment Variables en controleer:

- [ ] `DATABASE_URL` - Is ingesteld en correct
- [ ] `JWT_SECRET` - Is ingesteld
- [ ] `SMTP_HOST` - Email configuratie
- [ ] `SMTP_PORT` - Email configuratie
- [ ] `SMTP_USER` - Email configuratie
- [ ] `SMTP_PASS` - Email configuratie
- [ ] `ADMIN_EMAIL` - Admin email
- [ ] `APP_URL` - Moet je productie URL zijn (bijv. `https://gastro-elite-app.vercel.app`)

**⚠️ Belangrijk**: Update `APP_URL` naar je productie URL als dit nog niet is gedaan!

## 🧪 Functionaliteit Tests

### 4. Authenticatie
- [ ] Login werkt
- [ ] Registratie werkt
- [ ] Logout werkt

### 5. Database Connectie
- [ ] Check of data wordt geladen (bijv. recepten)
- [ ] Probeer een nieuw recept toe te voegen
- [ ] Check of bestaande data zichtbaar is

### 6. Email Functionaliteit
- [ ] Probeer een nieuw account te registreren
- [ ] Check of verificatie emails worden verzonden
- [ ] Test "Forgot Password" functionaliteit

### 7. Recepten Functionaliteit
- [ ] Recepten worden geladen
- [ ] Nieuw recept toevoegen werkt
- [ ] Recept bewerken werkt
- [ ] Recept verwijderen werkt

## 🐛 Troubleshooting

### Als de app niet laadt:

1. **Check Build Logs**
   - Ga naar Vercel Dashboard → Deployments
   - Klik op de laatste deployment
   - Bekijk de "Build Logs" voor errors

2. **Check Runtime Logs**
   - Ga naar Vercel Dashboard → Deployments
   - Klik op de laatste deployment
   - Bekijk de "Runtime Logs" voor runtime errors

3. **Database Connectie Problemen**
   - Check of `DATABASE_URL` correct is ingesteld
   - Controleer of je database toegankelijk is vanaf Vercel servers
   - Check firewall/IP whitelist instellingen

4. **Environment Variables**
   - Zorg dat alle environment variables zijn ingesteld
   - Check of `APP_URL` je productie URL is (niet localhost!)

## 📝 Belangrijke URLs

- **Vercel Dashboard**: [https://vercel.com/dashboard](https://vercel.com/dashboard)
- **Project Settings**: [https://vercel.com/dashboard](https://vercel.com/dashboard) → Selecteer project → Settings
- **Deployments**: [https://vercel.com/dashboard](https://vercel.com/dashboard) → Selecteer project → Deployments
- **Environment Variables**: Settings → Environment Variables

## ✅ Alles Werkt?

Als alles werkt:
- [ ] App laadt correct
- [ ] Database connectie werkt
- [ ] Authenticatie werkt
- [ ] Recepten functionaliteit werkt
- [ ] Email functionaliteit werkt

**Gefeliciteerd! Je app is live! 🎉**

## 🔄 Volgende Stappen

1. **Custom Domain** (optioneel)
   - Ga naar Settings → Domains
   - Voeg je eigen domain toe (bijv. gastro-elite.com)

2. **Monitoring Setup**
   - Overweeg monitoring tools zoals Sentry voor error tracking
   - Check Vercel Analytics voor performance metrics

3. **Backup Database**
   - Zorg voor regelmatige backups van je database
   - Vercel Postgres heeft automatische backups

4. **Performance Optimization**
   - Check Vercel Analytics voor slow pages
   - Optimaliseer images en assets
   - Overweeg caching strategieën

