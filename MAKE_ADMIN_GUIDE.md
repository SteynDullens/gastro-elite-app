# 🔐 Admin Rechten Toekennen - Gids

## Probleem
Je krijgt "Access Denied - Admin access required" omdat je account geen admin rechten heeft.

## Oplossing: Admin Rechten Toekennen

### Optie 1: Via Script (Aanbevolen)

#### Stap 1: Bekijk alle gebruikers
```bash
node scripts/make-admin.js --list
```

Dit toont alle gebruikers met hun email en admin status.

#### Stap 2: Geef admin rechten aan een gebruiker
```bash
node scripts/make-admin.js <email-adres>
```

**Voorbeeld:**
```bash
node scripts/make-admin.js steyn@example.com
```

#### Stap 3: Controleer admin gebruikers
```bash
node scripts/make-admin.js --list-admin
```

### Optie 2: Via Database Direct

Als je directe database toegang hebt:

#### Voor PostgreSQL (Vercel):
```sql
UPDATE "User" 
SET "isAdmin" = true 
WHERE email = 'jouw-email@example.com';
```

#### Voor MySQL:
```sql
UPDATE users 
SET isAdmin = 1 
WHERE email = 'jouw-email@example.com';
```

### Optie 3: Via Prisma Studio

1. Installeer Prisma Studio (als je het nog niet hebt):
```bash
npx prisma studio
```

2. Open de browser op `http://localhost:5555`
3. Ga naar de `User` tabel
4. Zoek je gebruiker
5. Zet `isAdmin` op `true`
6. Sla op

## Na het toekennen van admin rechten

1. **Log uit en log weer in**
   - Dit is belangrijk zodat je nieuwe admin status wordt geladen

2. **Ga naar het Admin Panel**
   - URL: `https://gastro-elite-app.vercel.app/admin`
   - Of lokaal: `http://localhost:3000/admin`

3. **Je zou nu toegang moeten hebben!**

## Troubleshooting

### Script werkt niet

**Fout: "Cannot find module '@prisma/client'"**
```bash
npm install
npx prisma generate
```

**Fout: "Database connection failed"**
- Check je `.env.local` bestand
- Zorg dat `DATABASE_URL` correct is ingesteld

### Admin rechten werken nog steeds niet

1. **Log uit en log weer in**
   - De JWT token moet worden vernieuwd met je nieuwe admin status

2. **Check de database**
   - Controleer of `isAdmin` echt `true` is in de database

3. **Clear browser cache**
   - Soms worden oude tokens gecached

4. **Check de browser console**
   - Open F12 → Console
   - Kijk voor errors

### "Cannot find user"

- Gebruik `--list` om alle gebruikers te zien
- Controleer of je het juiste email adres gebruikt
- Email is case-insensitive, maar gebruik het exacte email adres

## Veiligheid

⚠️ **Belangrijk:**
- Geef alleen admin rechten aan vertrouwde gebruikers
- Admin accounts hebben volledige toegang tot alle gebruikersdata
- Admin accounts kunnen andere accounts verwijderen

## Hulp Nodig?

Als je problemen hebt:
1. Check de error message in de terminal
2. Controleer de database connectie
3. Zorg dat je de juiste email gebruikt
4. Log uit en log weer in na het toekennen van admin rechten

