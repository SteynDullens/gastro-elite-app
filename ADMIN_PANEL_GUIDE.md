# 🔐 Admin Panel Gids - Database Beheer

## 📍 Waar vind je het Admin Panel?

Het Admin Panel is beschikbaar op:
- **URL**: `https://gastro-elite-app.vercel.app/admin`
- Of lokaal: `http://localhost:3000/admin`

## 🔑 Toegang tot het Admin Panel

Je moet ingelogd zijn met een **admin account** om toegang te krijgen.

### Standaard Admin Account
Als je nog geen admin account hebt, kun je er een aanmaken via de database of door een bestaand account admin rechten te geven.

## 📊 Functionaliteiten

### 1. **Gebruikers Beheren** (Users Tab)

In het Admin Panel kun je:

#### **Gebruikers Lijst Bekijken**
- Alle geregistreerde gebruikers
- Email adressen
- Account type (User, Business, Admin)
- Status (Active/Inactive)
- Aanmaakdatum

#### **Account Activeren/Deactiveren**
- Klik op de "Deactivate" knop om een account te deactiveren
- Klik op "Activate" om een gedeactiveerd account weer te activeren
- Gedeactiveerde accounts kunnen niet inloggen

#### **Wachtwoord Resetten**
- Klik op "Reset Password" knop
- Voer een nieuw wachtwoord in (minimaal 6 karakters)
- Het wachtwoord wordt direct gewijzigd

#### **Account Type Wijzigen**
- Gebruik de dropdown om het account type te wijzigen:
  - **User**: Standaard gebruiker
  - **Business**: Bedrijfsaccount
  - **Admin**: Administrator (heeft toegang tot admin panel)

#### **Account Verwijderen**
- Klik op de "Verwijder" knop (rood)
- Bevestig de verwijdering
- **LET OP**: Deze actie kan niet ongedaan worden gemaakt!
- Alle gerelateerde data wordt ook verwijderd:
  - Persoonlijke recepten
  - Bedrijfsgegevens (als eigenaar)
  - Bedrijfsrecepten (creator verwijzing wordt verwijderd)

### 2. **Business Applications** (Business Tab)

- Bekijk alle bedrijfsaccount aanvragen
- Goedkeuren of afwijzen van aanvragen
- Bekijk KvK documenten

### 3. **Error Logs** (Logs Tab)

- Bekijk alle systeem errors
- Debug informatie
- Gebruikers activiteit logs

## 🛠️ Stap-voor-stap Instructies

### Wachtwoord Resetten

1. Ga naar `/admin`
2. Log in met je admin account
3. Ga naar de "Users" tab
4. Zoek de gebruiker in de lijst
5. Klik op "Reset Password"
6. Voer het nieuwe wachtwoord in
7. Klik OK

### Account Verwijderen

1. Ga naar `/admin`
2. Log in met je admin account
3. Ga naar de "Users" tab
4. Zoek de gebruiker die je wilt verwijderen
5. Klik op de rode "Verwijder" knop
6. Bevestig de verwijdering in het popup venster
7. Het account wordt direct verwijderd

### Account Type Wijzigen

1. Ga naar `/admin`
2. Log in met je admin account
3. Ga naar de "Users" tab
4. Zoek de gebruiker
5. Gebruik de dropdown naast de gebruiker
6. Selecteer het nieuwe account type
7. De wijziging wordt direct doorgevoerd

## 🗄️ Directe Database Toegang

Als je directe database toegang nodig hebt:

### Database Credentials
- **Host**: `web0166.zxcs.nl` (of je Vercel Postgres database)
- **Database**: `u196042p358967_Gastroelite`
- **Port**: `3306` (MySQL) of `5432` (PostgreSQL voor Vercel)

### Database Tools
Je kunt database management tools gebruiken zoals:
- **phpMyAdmin** (voor MySQL)
- **pgAdmin** (voor PostgreSQL)
- **MySQL Workbench**
- **DBeaver** (voor beide)

### Belangrijke Tabellen
- `users` - Alle gebruikers accounts
- `companies` - Bedrijfsgegevens
- `personalRecipes` - Persoonlijke recepten
- `companyRecipes` - Bedrijfsrecepten
- `employeeInvitations` - Medewerker uitnodigingen

## ⚠️ Belangrijke Opmerkingen

1. **Admin Rechten**: Alleen accounts met `isAdmin: true` of `account_type: 'admin'` hebben toegang tot het admin panel

2. **Beveiliging**: 
   - Admin acties worden gelogd
   - Wachtwoorden worden gehashed opgeslagen (niet in plain text)
   - Verwijderingen zijn permanent

3. **Backup**: 
   - Maak regelmatig backups van je database
   - Vercel Postgres heeft automatische backups
   - Voor externe databases, gebruik je hosting provider backup tools

## 🔍 Troubleshooting

### "Access Denied" Melding
- Controleer of je account admin rechten heeft
- Log uit en log weer in
- Check de database of `isAdmin` of `account_type` correct is ingesteld

### Gebruikers Lijst Laadt Niet
- Check je internet verbinding
- Controleer de browser console voor errors (F12)
- Check of de API route `/api/admin/users` werkt

### Wachtwoord Reset Werkt Niet
- Controleer of het wachtwoord minimaal 6 karakters heeft
- Check de browser console voor errors
- Controleer of de API route `/api/admin/users` (PUT) werkt

## 📝 API Endpoints

Het Admin Panel gebruikt de volgende API endpoints:

- `GET /api/admin/users` - Haal alle gebruikers op
- `PUT /api/admin/users` - Update gebruiker (activate, reset password, change role)
- `DELETE /api/admin/delete-user?id={userId}` - Verwijder gebruiker
- `GET /api/admin/business-applications` - Haal business aanvragen op
- `GET /api/admin/error-logs` - Haal error logs op

## 🚀 Volgende Stappen

Na het bekijken van deze gids kun je:
1. Inloggen op het admin panel
2. Gebruikers beheren
3. Wachtwoorden resetten
4. Accounts verwijderen
5. Business aanvragen goedkeuren

Voor vragen of problemen, check de error logs in het admin panel of de browser console.

