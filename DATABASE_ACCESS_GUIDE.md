# 📊 Database Toegang Gids

## 🎯 Waar staat je database?

Je database staat op **Prisma Data Platform** (PostgreSQL):
- **Host**: `db.prisma.io:5432`
- **Type**: PostgreSQL
- **Provider**: Prisma Cloud

## 🔍 Database Toegang Methoden

### Methode 1: Prisma Studio (Aanbevolen - Visueel)

**Start Prisma Studio:**
```bash
npx prisma studio
```

Dit opent een web interface op `http://localhost:5555` waar je:
- ✅ Alle tabellen kunt bekijken
- ✅ Data kunt bekijken en bewerken
- ✅ Gebruikers, bedrijven en recepturen kunt beheren
- ✅ Directe database queries kunt uitvoeren

**Voordelen:**
- Visueel en gebruiksvriendelijk
- Geen SQL kennis nodig
- Perfect voor data management

### Methode 2: Vercel Dashboard

1. Ga naar [vercel.com](https://vercel.com)
2. Log in op je account
3. Selecteer je project: `gastro-elite-app`
4. Ga naar **Storage** tab
5. Klik op je database (als je Vercel Postgres gebruikt)

**Hier kun je:**
- Database connection string bekijken
- Database statistieken zien
- Backups maken
- Database beheren

### Methode 3: Prisma Data Platform Dashboard

Als je Prisma Cloud gebruikt:
1. Ga naar [cloud.prisma.io](https://cloud.prisma.io)
2. Log in met je Prisma account
3. Selecteer je project
4. Bekijk database details en connection string

### Methode 4: Via Code (Admin Panel)

Je hebt nu een volledig admin panel in je app:
- **URL**: `https://gastro-elite-app.vercel.app/admin`
- **Features**:
  - Dashboard met statistieken
  - Gebruikersbeheer
  - Bedrijfsaanvragen
  - Backup & Export
  - Recovery & Audit Logs

### Methode 5: Direct Database Access (Geavanceerd)

**Via Prisma CLI:**
```bash
# Database status bekijken
npx prisma migrate status

# Database schema bekijken
npx prisma db pull

# Database seeden (als je een seed script hebt)
npx prisma db seed
```

**Via PostgreSQL Client:**
Als je een PostgreSQL client hebt (bijv. pgAdmin, DBeaver, TablePlus):
- Gebruik de `DATABASE_URL` uit je environment variables
- Connect met de credentials uit de connection string

## 📋 Database Tabellen Overzicht

Je database bevat de volgende tabellen:

### Core Tabellen:
- **User** - Alle gebruikers
- **Company** - Bedrijven
- **CompanyMembership** - Gebruiker-bedrijf relaties
- **EmployeeInvitation** - Uitnodigingen

### Recepturen:
- **PersonalRecipe** - Persoonlijke recepturen
- **CompanyRecipe** - Bedrijfsrecepturen
- **PersonalIngredient** - Ingrediënten voor persoonlijke recepturen
- **CompanyIngredient** - Ingrediënten voor bedrijfsrecepturen
- **Category** - Categorieën

### System:
- **AuditLog** - Alle belangrijke acties (nieuw!)
- **ErrorLog** - Foutmeldingen (als je die hebt)

## 🔐 Database Credentials

Je database credentials staan in:
- **Lokaal**: `.env.local` bestand (niet in Git!)
- **Vercel**: Environment Variables in Vercel Dashboard
- **Format**: `DATABASE_URL="postgresql://user:password@host:port/database?schema=public"`

## 💡 Aanbevolen Werkwijze

### Voor Dagelijks Gebruik:
1. **Admin Panel** (`/admin`) - Voor gebruikersbeheer en statistieken
2. **Prisma Studio** - Voor directe data inspectie en bewerking

### Voor Backups:
1. **Admin Panel → Backup & Export** - Download JSON backups
2. **Vercel Dashboard → Storage** - Maak database backups

### Voor Data Recovery:
1. **Admin Panel → Recovery & Audit** - Bekijk en herstel verwijderde items
2. **Audit Logs** - Bekijk alle acties voor traceability

## 🚨 Belangrijk

- **Nooit** database credentials committen naar Git
- Gebruik altijd environment variables
- Maak regelmatig backups via Admin Panel
- Soft delete betekent dat data niet permanent verwijderd wordt
- Alle verwijderingen kunnen worden teruggezet via Recovery tab

## 📞 Hulp Nodig?

Als je problemen hebt met database toegang:
1. Check je `DATABASE_URL` environment variable
2. Controleer of je database actief is in Vercel/Prisma dashboard
3. Test connectie met `npx prisma studio`
4. Check Vercel logs voor database errors

