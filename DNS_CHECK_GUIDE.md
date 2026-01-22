# DNS Records Controleren voor gastro-elite.com

## 🌐 Online Tools (Makkelijkste Methode)

### 1. **MXToolbox** (Aanbevolen)
Ga naar: https://mxtoolbox.com/

**SPF Record Checken:**
1. Ga naar: https://mxtoolbox.com/spf.aspx
2. Voer in: `gastro-elite.com`
3. Klik op "SPF Record Lookup"
4. Check of je een SPF record ziet met `mail.zxcs.nl` of `include:mail.zxcs.nl`

**DMARC Record Checken:**
1. Ga naar: https://mxtoolbox.com/dmarc.aspx
2. Voer in: `gastro-elite.com`
3. Klik op "DMARC Record Lookup"
4. Check of je een DMARC record ziet

**All-in-One Check:**
1. Ga naar: https://mxtoolbox.com/SuperTool.aspx
2. Voer in: `gastro-elite.com`
3. Select "TXT" in de dropdown
4. Klik op "Lookup"
5. Bekijk alle TXT records (SPF en DMARC staan hierin)

### 2. **DNS Checker**
Ga naar: https://dnschecker.org/

1. Voer in: `gastro-elite.com`
2. Select "TXT" record type
3. Klik op "Search"
4. Bekijk alle TXT records wereldwijd

### 3. **Google Admin Toolbox**
Ga naar: https://toolbox.googleapps.com/apps/checkmx/check

1. Voer in: `gastro-elite.com`
2. Klik op "Check MX"
3. Bekijk MX records en DNS configuratie

## 📋 Wat je moet zien:

### ✅ SPF Record (moet aanwezig zijn)
```
Type: TXT
Name: @ (of gastro-elite.com)
Value: v=spf1 include:mail.zxcs.nl ~all
```
OF
```
v=spf1 a mx include:mail.zxcs.nl ~all
```

### ✅ DMARC Record (aanbevolen)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:admin@gastro-elite.com
```

### ⚠️ DKIM Record (vraag je email provider)
Dit wordt meestal door je email provider (mail.zxcs.nl) geconfigureerd.
Contacteer hen voor de DKIM key.

## 🔧 Methode 2: Command Line (Windows)

Open PowerShell of Command Prompt:

```powershell
# Check SPF/TXT records
nslookup -type=TXT gastro-elite.com

# Check DMARC
nslookup -type=TXT _dmarc.gastro-elite.com

# Check MX records
nslookup -type=MX gastro-elite.com
```

## 🔧 Methode 3: Script (Automatisch)

Run het script dat ik heb gemaakt:

```bash
node scripts/check-dns-records.js gastro-elite.com
```

Dit script checkt automatisch:
- ✅ SPF records
- ✅ DMARC records  
- ✅ MX records
- En geeft suggesties voor wat je moet toevoegen

## 📝 Wat te doen als records ontbreken:

### Als SPF Record ontbreekt:
1. Log in op je DNS provider (waar je gastro-elite.com hebt geregistreerd)
2. Voeg een TXT record toe:
   - **Name:** `@` (of leeg laten)
   - **Type:** `TXT`
   - **Value:** `v=spf1 include:mail.zxcs.nl ~all`
3. Wacht 15 minuten tot 48 uur (DNS propagation)

### Als DMARC Record ontbreekt:
1. Log in op je DNS provider
2. Voeg een TXT record toe:
   - **Name:** `_dmarc`
   - **Type:** `TXT`
   - **Value:** `v=DMARC1; p=quarantine; rua=mailto:admin@gastro-elite.com`
3. Wacht 15 minuten tot 48 uur

## ⚠️ Belangrijk:

- DNS wijzigingen kunnen 15 minuten tot 48 uur duren om te propageren
- Test altijd na het toevoegen van records met de online tools
- Als je niet zeker bent van je DNS provider, check waar je gastro-elite.com hebt geregistreerd

## 🆘 Hulp nodig?

Als je niet weet waar je DNS records kunt aanpassen:
1. Check waar je `gastro-elite.com` hebt geregistreerd (bijv. TransIP, Hostnet, etc.)
2. Log in op die provider
3. Zoek naar "DNS Management" of "DNS Records"
4. Voeg de records toe zoals hierboven beschreven

