"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

interface Translations {
  // Navigation
  home: string;
  recipes: string;
  add: string;
  account: string;
  admin: string;
  
  // Common
  loading: string;
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  view: string;
  back: string;
  login: string;
  logout: string;
  close: string;
  search: string;
  new: string;
  pending: string;
  approved: string;
  rejected: string;
  settings: string;
  allRightsReserved: string;
  
  // Greetings
  goodMorning: string;
  goodAfternoon: string;
  goodEvening: string;
  
  // Home page
  welcome: string;
  goodLuck: string;
  quickActions: string;
  viewRecipes: string;
  newRecipe: string;
  managePanel: string;
  manageBusinessRecipes: string;
  businessApplications: string;
  forApproval: string;
  noOpenApplications: string;
  moreApplications: string;
  viewAllApplications: string;
  tipOfTheDay: string;
  tipContent: string;
  
  // Login page
  welcomeTitle: string;
  emailAddress: string;
  password: string;
  yourPassword: string;
  noAccount: string;
  register: string;
  processing: string;
  loginFailed: string;
  businessPendingApproval: string;
  businessRejected: string;
  tagline: string;
  
  // Recipes page
  totalRecipes: string;
  categories: string;
  totalIngredients: string;
  avgIngredients: string;
  searchPlaceholder: string;
  allCategories: string;
  multipleCategoriesHint: string;
  otherRecipesLetter: string;
  noRecipesFound: string;
  tryAdjustingSearch: string;
  startAddingRecipe: string;
  addNewRecipe: string;
  gridView: string;
  rowView: string;
  alphabeticalView: string;
  recipeViewShortGrid: string;
  recipeViewShortRow: string;
  recipeViewShortAz: string;
  switchView: string;
  filter: string;
  allRecipes: string;
  database: string;
  employeeInvitation: string;
  accept: string;
  decline: string;
  
  // Recipe form
  recipeName: string;
  recipeNameRequired: string;
  imageUrl: string;
  batchSize: string;
  servings: string;
  ingredients: string;
  instructions: string;
  addIngredient: string;
  quantity: string;
  ingredientName: string;
  saveRecipe: string;
  cancelRecipe: string;
  
  // Recipe detail
  batchSizeLabel: string;
  servingsLabel: string;
  ingredientsLabel: string;
  instructionsLabel: string;
  editRecipe: string;
  printRecipe: string;
  deleteRecipe: string;
  noPhotoAvailable: string;
  
  // Account page
  personalInformation: string;
  companyInformation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  changePhoto: string;
  quickStats: string;
  notifications: string;
  preferences: string;
  security: string;
  statistics: string;
  profile: string;
  emailNotifications: string;
  emailNotificationsDesc: string;
  pushNotifications: string;
  pushNotificationsDesc: string;
  weeklyDigest: string;
  weeklyDigestDesc: string;
  teamNotificationsTitle: string;
  teamNotificationsSubtitle: string;
  teamNotificationsEmpty: string;
  teamNotificationsMarkAllRead: string;
  theme: string;
  units: string;
  light: string;
  dark: string;
  auto: string;
  metric: string;
  imperial: string;
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  updatePassword: string;
  twoFactorAuth: string;
  enable2FA: string;
  twoFactorAuthDesc: string;
  enable: string;
  dangerZone: string;
  deleteAccount: string;
  deleteAccountDesc: string;
  recipeCategories: string;
  saveChanges: string;
  memberSince: string;
  language: string;
  dutch: string;
  english: string;
  editDetails: string;
  employees: string;
  availableLanguages: string;
  currentLanguage: string;
  allLanguages: string;
  searchResults: string;
  noLanguagesFound: string;
  searchLanguage: string;
  changeDetails: string;
  updatePersonalInfo: string;
  personalData: string;
  addressData: string;
  country: string;
  postalCode: string;
  street: string;
  city: string;
  selectCountry: string;
  saveChangesBtn: string;
  chooseStrongPassword: string;
  choosePreferredLanguage: string;
  loginToAccess: string;
  // Additional account page strings
  manageAccountSettings: string;
  enterEmailAddress: string;
  enterPassword: string;
  name: string;
  address: string;
  leaveEmptyPassword: string;
  confirmPasswordField: string;
  noEmployeesYet: string;
  addEmployeesToCollaborate: string;
  editProfilePhoto: string;
  zoom: string;
  accountInfo: string;
  adjustProfile: string;
  chooseLanguage: string;
  changePasswordShort: string;
  logoutFromAccount: string;
  netherlands: string;
  belgium: string;
  germany: string;
  france: string;
  addEmployee: string;
  remove: string;
  // Recipe page strings
  noRecipesYet: string;
  startAddingFirstRecipe: string;
  addFirstRecipe: string;
  manageRecipeCollection: string;
  loginToViewRecipes: string;
  createAccount: string;
  // Add recipe page strings
  addRecipe: string;
  createNewRecipes: string;
  loginToAddRecipes: string;
  fillDetailsToAdd: string;
  recipePhoto: string;
  pieces: string;
  persons: string;
  portion: string;
  selectCategories: string;
  done: string;
  newCategory: string;
  saveIn: string;
  personalDatabase: string;
  businessDatabase: string;
  personalDatabaseOnly: string;
  bothDatabases: string;
  chooseWhereToSave: string;
  preparationMethod: string;
  step: string;
  stepDescription: string;
  addStep: string;
  uploading: string;
  enterIngredientName: string;
  enterValidQuantity: string;
  saveFailed: string;
  uploadFailed: string;
  deleteCategory: string;
  editCategory: string;
  changeFailed: string;
  deleteFailed: string;
  confirmDelete: string;
  deleteRecipeConfirmation: string;
  recipeDeletedSuccessfully: string;
  deleting: string;
  privateAccount: string;
  // Category translations
  catVoorgerecht: string;
  catTussengerecht: string;
  catHoofdgerecht: string;
  catDessert: string;
  catGroentegarnituur: string;
  catVlees: string;
  catVis: string;
  catVegetarisch: string;
  catZetmeelgarnituur: string;
  catGebondenSauzen: string;
  catKoudeSauzen: string;
  catSoepen: string;
  catSalades: string;
  catBrood: string;
  catDranken: string;
  // File input
  chooseFile: string;
  noFileSelected: string;
  // Additional UI strings
  noPhoto: string;
  noNewApplications: string;
  noPersonalRecipesFound: string;
  noPendingApplications: string;
  enterEmployeeEmail: string;
  exampleEmail: string;
  examplePhone: string;
  examplePostalCode: string;
  exampleStreet: string;
  exampleCity: string;
  // App PIN (device lock)
  pinUnlockTitle: string;
  pinUnlockSubtitle: string;
  pinSetupQuestion: string;
  pinSetupDescription: string;
  pinEnterNew: string;
  pinConfirmLabel: string;
  pinMismatch: string;
  pinWrong: string;
  pinSkip: string;
  pinSetButton: string;
  pinDigitsHint: string;
  pinLogoutLink: string;
  pinContinueButton: string;
  pinSubmitUnlock: string;
  lockSetupTitle: string;
  lockSetupDescription: string;
  lockChooseBiometric: string;
  lockChooseBiometricHint: string;
  lockChoosePin: string;
  lockChoosePinHint: string;
  lockChoosePasswordOnly: string;
  lockChoosePasswordOnlyHint: string;
  lockBiometricUnavailable: string;
  lockBiometricSetupFailed: string;
  lockBiometricCancelled: string;
  lockUseBiometricUnlock: string;
  lockBiometricRegistering: string;
  lockUnlockBiometricSubtitle: string;
  lockBiometricFailed: string;
  lockStorageUnavailable: string;
  emailVerifiedLoginHint: string;
  lockSettingsSection: string;
  lockSettingsManageTitle: string;
  lockSettingsManageDescription: string;
  lockSettingsCurrentNone: string;
  lockSettingsCurrentBiometric: string;
  lockSettingsCurrentPin: string;
  lockSettingsCardHint: string;
  lockSetupButton: string;
  lockChangeButton: string;
  lockRemoveButton: string;
  lockRemoveConfirm: string;
}

// All available languages with their native names and flags
export const availableLanguages = [
  { code: 'nl', name: 'Nederlands', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱' },
];

const translations: Record<string, Translations> = {
  nl: {
    // Navigation
    home: "Home", recipes: "Recepturen", add: "Toevoegen", account: "Account", admin: "Admin",
    // Common
    loading: "Laden...", save: "Opslaan", cancel: "Annuleren", edit: "Bewerken",
    delete: "Verwijderen", view: "Bekijken", back: "Terug", login: "Inloggen", logout: "Uitloggen",
    close: "Sluiten", search: "Zoeken", new: "nieuw", pending: "In afwachting", approved: "Goedgekeurd",
    rejected: "Afgewezen", settings: "Instellingen", allRightsReserved: "Alle rechten voorbehouden",
    // Greetings
    goodMorning: "Goedemorgen", goodAfternoon: "Goedemiddag", goodEvening: "Goedenavond",
    // Home page
    welcome: "Welkom,", goodLuck: "Veel succes met het creëren van magie!",
    quickActions: "Snelle acties", viewRecipes: "Bekijk recepten", newRecipe: "Nieuw recept",
    managePanel: "Beheer paneel", manageBusinessRecipes: "Beheer uw bedrijfsrecepturen en medewerkers",
    businessApplications: "Bedrijfsaanvragen", forApproval: "Ter goedkeuring",
    noOpenApplications: "Geen openstaande aanvragen", moreApplications: "meer aanvragen",
    viewAllApplications: "Alle aanvragen bekijken", tipOfTheDay: "Tip van de dag",
    tipContent: "Gebruik categorieën om je recepten te organiseren. Dit maakt het makkelijker om specifieke recepten terug te vinden.",
    // Login page
    welcomeTitle: "WELKOM", emailAddress: "E-mailadres", password: "Wachtwoord", yourPassword: "Uw wachtwoord",
    noAccount: "Nog geen account?", register: "Registreren", processing: "Bezig...",
    loginFailed: "Inloggen mislukt. Controleer uw gegevens.",
    businessPendingApproval: "Even geduld alstublieft — uw bedrijfsregistratie moet worden goedgekeurd door Gastro-Elite. Dit kan tot 24 uur duren.",
    businessRejected: "Uw bedrijfsregistratie is afgewezen. Neem contact op met support voor meer informatie.",
    tagline: "De slimme cockpit voor recepturen, HACCP en planning",
    // Recipes
    totalRecipes: "Totaal Recepten", categories: "Categorieën", totalIngredients: "Totaal Ingrediënten",
    avgIngredients: "Gem. Ingrediënten/Recept", searchPlaceholder: "Zoek recepten of ingrediënten...",
    allCategories: "Alle Categorieën",
    multipleCategoriesHint: "Meerdere categorieën mogelijk (toon recepten in minstens één gekozen categorie).",
    otherRecipesLetter: "Overig",
    noRecipesFound: "Geen recepten gevonden",
    tryAdjustingSearch: "Probeer uw zoek- of filtercriteria aan te passen",
    startAddingRecipe: "Begin met het toevoegen van uw eerste recept!", addNewRecipe: "Nieuw Recept Toevoegen",
    filter: "Filter", allRecipes: "Alle recepten", database: "Database",
    gridView: "Rasterweergave", rowView: "Rijweergave", alphabeticalView: "Alfabetische weergave",
    recipeViewShortGrid: "Raster", recipeViewShortRow: "Rij", recipeViewShortAz: "A–Z",
    switchView: "Weergave wijzigen",
    employeeInvitation: "Uitnodiging ontvangen", accept: "Accepteren", decline: "Afwijzen",
    recipeName: "Recept Naam", recipeNameRequired: "Recept Naam *", imageUrl: "Afbeelding URL",
    batchSize: "Batch Grootte", servings: "Porties", ingredients: "Ingrediënten", instructions: "Instructies",
    addIngredient: "Toevoegen", quantity: "Hoeveelheid", ingredientName: "Naam ingrediënt",
    saveRecipe: "Recept Opslaan", cancelRecipe: "Annuleren",
    batchSizeLabel: "Batch Grootte:", servingsLabel: "Porties:", ingredientsLabel: "Ingrediënten",
    instructionsLabel: "Instructies", editRecipe: "Recept Bewerken", printRecipe: "Recept Afdrukken",
    deleteRecipe: "Recept Verwijderen", noPhotoAvailable: "Geen foto beschikbaar",
    // Account
    personalInformation: "Persoonlijke Informatie", companyInformation: "Bedrijfsinformatie",
    firstName: "Voornaam", lastName: "Achternaam", email: "E-mail", phone: "Telefoon",
    company: "Bedrijf", role: "Functie", changePhoto: "Foto Wijzigen", quickStats: "Snelle Statistieken",
    notifications: "Meldingen", preferences: "Voorkeuren", security: "Beveiliging",
    statistics: "Statistieken", profile: "Profiel", emailNotifications: "E-mail Meldingen",
    emailNotificationsDesc: "Ontvang meldingen via e-mail", pushNotifications: "Push Meldingen",
    pushNotificationsDesc: "Ontvang push meldingen in browser", weeklyDigest: "Wekelijks Overzicht",
    weeklyDigestDesc: "Ontvang een wekelijks overzicht van uw activiteit",
    teamNotificationsTitle: "Teammeldingen",
    teamNotificationsSubtitle: "Updates over je team",
    teamNotificationsEmpty: "Geen nieuwe meldingen",
    teamNotificationsMarkAllRead: "Alles gelezen",
    theme: "Thema", units: "Eenheden",
    light: "Licht", dark: "Donker", auto: "Automatisch", metric: "Metrisch (kg, g, l, ml)",
    imperial: "Imperiaal (lb, oz, fl oz)", changePassword: "Wachtwoord Wijzigen",
    currentPassword: "Huidig Wachtwoord", newPassword: "Nieuw Wachtwoord",
    confirmPassword: "Bevestig Nieuw Wachtwoord", updatePassword: "Wachtwoord Bijwerken",
    twoFactorAuth: "Twee-Factor Authenticatie", enable2FA: "2FA Inschakelen",
    twoFactorAuthDesc: "Voeg een extra beveiligingslaag toe aan uw account", enable: "Inschakelen",
    dangerZone: "Gevarenzone", deleteAccount: "Account Verwijderen",
    deleteAccountDesc: "Permanent verwijderen van uw account en alle gegevens",
    recipeCategories: "Recept Categorieën", saveChanges: "Wijzigingen Opslaan", memberSince: "Lid sinds",
    language: "Taal", dutch: "Nederlands", english: "Engels",
    editDetails: "Gegevens wijzigen", employees: "Medewerkers",
    availableLanguages: "talen beschikbaar", currentLanguage: "Huidige taal", allLanguages: "Alle talen",
    searchResults: "Zoekresultaten", noLanguagesFound: "Geen talen gevonden voor",
    searchLanguage: "Zoek een taal...", changeDetails: "Gegevens wijzigen",
    updatePersonalInfo: "Pas je persoonlijke gegevens aan", personalData: "Persoonlijke gegevens",
    addressData: "Adresgegevens", country: "Land", postalCode: "Postcode", street: "Straat en huisnummer",
    city: "Plaats", selectCountry: "Selecteer land", saveChangesBtn: "Wijzigingen opslaan",
    chooseStrongPassword: "Kies een sterk nieuw wachtwoord", choosePreferredLanguage: "Kies je voorkeurstaal",
    loginToAccess: "Log in om toegang te krijgen",
    manageAccountSettings: "Beheer uw account en instellingen", enterEmailAddress: "Voer uw e-mailadres in",
    enterPassword: "Voer uw wachtwoord in", name: "Naam", address: "Adres",
    leaveEmptyPassword: "Laat leeg als u uw wachtwoord niet wilt wijzigen",
    confirmPasswordField: "Bevestig wachtwoord", noEmployeesYet: "Nog geen medewerkers toegevoegd",
    addEmployeesToCollaborate: "Voeg medewerkers toe om samen te werken", editProfilePhoto: "Profielfoto bewerken",
    zoom: "Zoom", accountInfo: "Account informatie", adjustProfile: "Pas je profiel aan",
    chooseLanguage: "Kies je taal", changePasswordShort: "Wijzig wachtwoord", logoutFromAccount: "Log uit van je account",
    netherlands: "Nederland", belgium: "België", germany: "Duitsland", france: "Frankrijk",
    addEmployee: "Medewerker toevoegen", remove: "Verwijderen",
    noRecipesYet: "Er zijn nog geen recepturen toegevoegd",
    startAddingFirstRecipe: "Begin snel met het toevoegen van je eerste recept!",
    addFirstRecipe: "Eerste recept toevoegen", manageRecipeCollection: "Beheer uw receptencollectie",
    loginToViewRecipes: "Log in of maak een account aan om uw recepturen te bekijken.",
    createAccount: "Account aanmaken",
    addRecipe: "Recept toevoegen", createNewRecipes: "Maak nieuwe recepten aan",
    loginToAddRecipes: "Log in of maak een account aan om recepten toe te voegen.",
    fillDetailsToAdd: "Vul de gegevens in om een nieuwe receptuur toe te voegen.",
    recipePhoto: "Receptfoto", pieces: "stuks", persons: "personen", portion: "portie",
    selectCategories: "Selecteer categorieën", done: "Gereed", newCategory: "Nieuwe categorie...",
    saveIn: "Opslaan in", personalDatabase: "Persoonlijke database", businessDatabase: "Bedrijfsdatabase", personalDatabaseOnly: "Alleen persoonlijke database beschikbaar",
    bothDatabases: "Beide databases", chooseWhereToSave: "Kies waar je recept opgeslagen moet worden",
    preparationMethod: "Bereidingswijze", step: "Stap", stepDescription: "Omschrijving stap",
    addStep: "Stap toevoegen", uploading: "Bezig met uploaden...",
    enterIngredientName: "Voer een ingrediënt naam in", enterValidQuantity: "Voer een geldige hoeveelheid in",
    saveFailed: "Opslaan mislukt", uploadFailed: "Upload mislukt", deleteCategory: "Categorie verwijderen?",
    editCategory: "Bewerken", changeFailed: "Wijzigen mislukt", deleteFailed: "Verwijderen mislukt",
    confirmDelete: "Verwijderen bevestigen",
    deleteRecipeConfirmation: "Weet je zeker dat je dit recept wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.",
    recipeDeletedSuccessfully: "Recept succesvol verwijderd",
    deleting: "Verwijderen...",
    privateAccount: "Particulier account",
    catVoorgerecht: "Voorgerecht", catTussengerecht: "Tussengerecht", catHoofdgerecht: "Hoofdgerecht",
    catDessert: "Dessert", catGroentegarnituur: "Groentegarnituur", catVlees: "Vlees", catVis: "Vis",
    catVegetarisch: "Vegetarisch", catZetmeelgarnituur: "Zetmeelgarnituur", catGebondenSauzen: "Gebonden sauzen",
    catKoudeSauzen: "Koude sauzen", catSoepen: "Soepen", catSalades: "Salades", catBrood: "Brood", catDranken: "Dranken",
    chooseFile: "Kies bestand", noFileSelected: "Geen bestand geselecteerd",
    noPhoto: "Geen foto", noNewApplications: "Geen nieuwe aanvragen",
    noPersonalRecipesFound: "Geen persoonlijke recepten gevonden",
    noPendingApplications: "Geen openstaande bedrijfsaanvragen",
    enterEmployeeEmail: "Voer medewerker e-mailadres in", exampleEmail: "uw@email.nl",
    examplePhone: "+31 6 12345678", examplePostalCode: "1234 AB", exampleStreet: "Straatnaam 123", exampleCity: "Stad",
    pinUnlockTitle: "App vergrendeling",
    pinUnlockSubtitle: "Voer uw pincode in om verder te gaan.",
    pinSetupQuestion: "Wilt u een pincode instellen?",
    pinSetupDescription:
      "Op dit apparaat volstaat bij een volgende keer openen van de app uw pincode (u blijft ingelogd). Overslaan kan altijd.",
    pinEnterNew: "Kies een pincode (4–6 cijfers)",
    pinConfirmLabel: "Bevestig uw pincode",
    pinMismatch: "De pincodes komen niet overeen.",
    pinWrong: "Onjuiste pincode. Probeer het opnieuw.",
    pinSkip: "Nu overslaan",
    pinSetButton: "Pincode opslaan",
    pinDigitsHint: "Gebruik 4 tot 6 cijfers.",
    pinLogoutLink: "Uitloggen en ander account gebruiken",
    pinContinueButton: "Volgende",
    pinSubmitUnlock: "Ontgrendelen",
    lockSetupTitle: "Hoe wilt u de app vergrendelen?",
    lockSetupDescription:
      "Na het inloggen op dit apparaat kunt u sneller terug — kies Face ID / vingerafdruk (via uw telefoon) of een app-pincode. U kunt dit ook overslaan.",
    lockChooseBiometric: "Face ID / Touch ID / vingerafdruk",
    lockChooseBiometricHint: "Gebruikt de biometrie van uw iPhone of Android (systeemdialoog).",
    lockChoosePin: "App-pincode",
    lockChoosePinHint: "Eigen pincode voor Gastro-Elite op dit apparaat (4–6 cijfers).",
    lockChoosePasswordOnly: "Alleen wachtwoord",
    lockChoosePasswordOnlyHint: "Geen extra vergrendeling op dit apparaat.",
    lockBiometricUnavailable: "Biometrie is op dit apparaat niet beschikbaar. Kies een pincode of sla over.",
    lockBiometricSetupFailed: "Biometrie instellen mislukt. Probeer opnieuw of kies een pincode.",
    lockBiometricCancelled: "Geannuleerd. Kies een andere optie.",
    lockUseBiometricUnlock: "Ontgrendelen met Face ID / vingerafdruk",
    lockBiometricRegistering: "Volg de melding op uw scherm…",
    lockUnlockBiometricSubtitle: "Gebruik Face ID, Touch ID of uw vingerafdruk.",
    lockBiometricFailed: "Biometrie mislukt. Tik opnieuw om het te proberen.",
    lockStorageUnavailable:
      "Opslag op dit apparaat werkt niet (privé-modus of browser in e-mail/WhatsApp). Open https://gastro-elite-app.vercel.app in Safari of Chrome (geen privévenster) en stel het opnieuw in.",
    emailVerifiedLoginHint: "Uw e-mail is geverifieerd. Log in om verder te gaan.",
    lockSettingsSection: "App-vergrendeling",
    lockSettingsManageTitle: "Face ID / pincode voor deze app",
    lockSettingsManageDescription:
      "Bescherm snelle toegang op dit apparaat. U blijft ingelogd; bij openen vraagt de app om biometrie of uw app-pincode.",
    lockSettingsCurrentNone: "Niet ingesteld — alleen wachtwoord bij inloggen",
    lockSettingsCurrentBiometric: "Actief: Face ID / Touch ID / vingerafdruk",
    lockSettingsCurrentPin: "Actief: app-pincode",
    lockSettingsCardHint: "Tik om in te stellen of te wijzigen",
    lockSetupButton: "Instellen",
    lockChangeButton: "Wijzigen",
    lockRemoveButton: "Verwijderen",
    lockRemoveConfirm:
      "App-vergrendeling op dit apparaat verwijderen? U logt dan alleen nog in met e-mail en wachtwoord.",
  },
  en: {
    // Navigation
    home: "Home", recipes: "Recipes", add: "Add", account: "Account", admin: "Admin",
    // Common
    loading: "Loading...", save: "Save", cancel: "Cancel", edit: "Edit",
    delete: "Delete", view: "View", back: "Back", login: "Login", logout: "Logout",
    close: "Close", search: "Search", new: "new", pending: "Pending", approved: "Approved",
    rejected: "Rejected", settings: "Settings", allRightsReserved: "All rights reserved",
    // Greetings
    goodMorning: "Good morning", goodAfternoon: "Good afternoon", goodEvening: "Good evening",
    // Home page
    welcome: "Welcome,", goodLuck: "Good luck creating magic!",
    quickActions: "Quick actions", viewRecipes: "View recipes", newRecipe: "New recipe",
    managePanel: "Manage panel", manageBusinessRecipes: "Manage your business recipes and employees",
    businessApplications: "Business applications", forApproval: "For approval",
    noOpenApplications: "No open applications", moreApplications: "more applications",
    viewAllApplications: "View all applications", tipOfTheDay: "Tip of the day",
    tipContent: "Use categories to organize your recipes. This makes it easier to find specific recipes.",
    // Login page
    welcomeTitle: "WELCOME", emailAddress: "Email address", password: "Password", yourPassword: "Your password",
    noAccount: "Don't have an account?", register: "Register", processing: "Processing...",
    loginFailed: "Login failed. Please check your credentials.",
    businessPendingApproval: "Please wait — your business registration must be approved by Gastro-Elite. This may take up to 24 hours.",
    businessRejected: "Your business registration has been rejected. Please contact support for more information.",
    tagline: "The smart cockpit for recipes, HACCP and planning",
    // Recipes
    totalRecipes: "Total Recipes", categories: "Categories", totalIngredients: "Total Ingredients",
    avgIngredients: "Avg Ingredients/Recipe", searchPlaceholder: "Search recipes or ingredients...",
    allCategories: "All Categories",
    multipleCategoriesHint: "Select multiple categories (show recipes in at least one selected category).",
    otherRecipesLetter: "Other",
    noRecipesFound: "No recipes found",
    tryAdjustingSearch: "Try adjusting your search or filter criteria",
    gridView: "Grid View", rowView: "Row View", alphabeticalView: "Alphabetical View",
    recipeViewShortGrid: "Grid", recipeViewShortRow: "Rows", recipeViewShortAz: "A–Z",
    switchView: "Switch View",
    filter: "Filter", allRecipes: "All Recipes", database: "Database",
    employeeInvitation: "Invitation Received", accept: "Accept", decline: "Decline",
    startAddingRecipe: "Start by adding your first recipe!", addNewRecipe: "Add New Recipe",
    recipeName: "Recipe Name", recipeNameRequired: "Recipe Name *", imageUrl: "Image URL",
    batchSize: "Batch Size", servings: "Servings", ingredients: "Ingredients", instructions: "Instructions",
    addIngredient: "Add", quantity: "Quantity", ingredientName: "Ingredient name",
    saveRecipe: "Save Recipe", cancelRecipe: "Cancel",
    batchSizeLabel: "Batch Size:", servingsLabel: "Servings:", ingredientsLabel: "Ingredients",
    instructionsLabel: "Instructions", editRecipe: "Edit Recipe", printRecipe: "Print Recipe",
    deleteRecipe: "Delete Recipe", noPhotoAvailable: "No photo available",
    // Account
    personalInformation: "Personal Information", companyInformation: "Company Information",
    firstName: "First Name", lastName: "Last Name", email: "Email", phone: "Phone",
    company: "Company", role: "Role", changePhoto: "Change Photo", quickStats: "Quick Stats",
    notifications: "Notifications", preferences: "Preferences", security: "Security",
    statistics: "Statistics", profile: "Profile", emailNotifications: "Email Notifications",
    emailNotificationsDesc: "Receive notifications via email", pushNotifications: "Push Notifications",
    pushNotificationsDesc: "Receive push notifications in browser", weeklyDigest: "Weekly Digest",
    weeklyDigestDesc: "Get a weekly summary of your activity",
    teamNotificationsTitle: "Team notifications",
    teamNotificationsSubtitle: "Updates about your team",
    teamNotificationsEmpty: "No new notifications",
    teamNotificationsMarkAllRead: "Mark all as read",
    theme: "Theme", units: "Units",
    light: "Light", dark: "Dark", auto: "Auto", metric: "Metric (kg, g, l, ml)",
    imperial: "Imperial (lb, oz, fl oz)", changePassword: "Change Password",
    currentPassword: "Current Password", newPassword: "New Password",
    confirmPassword: "Confirm New Password", updatePassword: "Update Password",
    twoFactorAuth: "Two-Factor Authentication", enable2FA: "Enable 2FA",
    twoFactorAuthDesc: "Add an extra layer of security to your account", enable: "Enable",
    dangerZone: "Danger Zone", deleteAccount: "Delete Account",
    deleteAccountDesc: "Permanently delete your account and all data",
    recipeCategories: "Recipe Categories", saveChanges: "Save Changes", memberSince: "Member since",
    language: "Language", dutch: "Dutch", english: "English",
    editDetails: "Edit details", employees: "Employees",
    availableLanguages: "languages available", currentLanguage: "Current language", allLanguages: "All languages",
    searchResults: "Search results", noLanguagesFound: "No languages found for",
    searchLanguage: "Search language...", changeDetails: "Change details",
    updatePersonalInfo: "Update your personal information", personalData: "Personal data",
    addressData: "Address data", country: "Country", postalCode: "Postal code", street: "Street and number",
    city: "City", selectCountry: "Select country", saveChangesBtn: "Save changes",
    chooseStrongPassword: "Choose a strong new password", choosePreferredLanguage: "Choose your preferred language",
    loginToAccess: "Log in to access",
    manageAccountSettings: "Manage your account and settings", enterEmailAddress: "Enter your email address",
    enterPassword: "Enter your password", name: "Name", address: "Address",
    leaveEmptyPassword: "Leave empty if you don't want to change your password",
    confirmPasswordField: "Confirm password", noEmployeesYet: "No employees added yet",
    addEmployeesToCollaborate: "Add employees to collaborate", editProfilePhoto: "Edit profile photo",
    zoom: "Zoom", accountInfo: "Account information", adjustProfile: "Adjust your profile",
    chooseLanguage: "Choose your language", changePasswordShort: "Change password", logoutFromAccount: "Log out from your account",
    netherlands: "Netherlands", belgium: "Belgium", germany: "Germany", france: "France",
    addEmployee: "Add employee", remove: "Remove",
    noRecipesYet: "No recipes have been added yet",
    startAddingFirstRecipe: "Start by adding your first recipe!",
    addFirstRecipe: "Add first recipe", manageRecipeCollection: "Manage your recipe collection",
    loginToViewRecipes: "Log in or create an account to view your recipes.",
    createAccount: "Create account",
    addRecipe: "Add recipe", createNewRecipes: "Create new recipes",
    loginToAddRecipes: "Log in or create an account to add recipes.",
    fillDetailsToAdd: "Fill in the details to add a new recipe.",
    recipePhoto: "Recipe photo", pieces: "pieces", persons: "persons", portion: "portion",
    selectCategories: "Select categories", done: "Done", newCategory: "New category...",
    saveIn: "Save to", personalDatabase: "Personal database", businessDatabase: "Business database", personalDatabaseOnly: "Only personal database available",
    bothDatabases: "Both databases", chooseWhereToSave: "Choose where to save your recipe",
    preparationMethod: "Preparation method", step: "Step", stepDescription: "Step description",
    addStep: "Add step", uploading: "Uploading...",
    enterIngredientName: "Enter an ingredient name", enterValidQuantity: "Enter a valid quantity",
    saveFailed: "Save failed", uploadFailed: "Upload failed", deleteCategory: "Delete category?",
    editCategory: "Edit", changeFailed: "Change failed", deleteFailed: "Delete failed",
    confirmDelete: "Confirm Delete",
    deleteRecipeConfirmation: "Are you sure you want to delete this recipe? This action cannot be undone.",
    recipeDeletedSuccessfully: "Recipe deleted successfully",
    deleting: "Deleting...",
    privateAccount: "Private account",
    catVoorgerecht: "Starter", catTussengerecht: "Intermediate course", catHoofdgerecht: "Main course",
    catDessert: "Dessert", catGroentegarnituur: "Vegetable garnish", catVlees: "Meat", catVis: "Fish",
    catVegetarisch: "Vegetarian", catZetmeelgarnituur: "Starch garnish", catGebondenSauzen: "Thickened sauces",
    catKoudeSauzen: "Cold sauces", catSoepen: "Soups", catSalades: "Salads", catBrood: "Bread", catDranken: "Drinks",
    chooseFile: "Choose file", noFileSelected: "No file selected",
    noPhoto: "No photo", noNewApplications: "No new applications",
    noPersonalRecipesFound: "No personal recipes found",
    noPendingApplications: "No pending business applications",
    enterEmployeeEmail: "Enter employee email address", exampleEmail: "you@email.com",
    examplePhone: "+1 234 567 8900", examplePostalCode: "12345", exampleStreet: "Street Name 123", exampleCity: "City",
    pinUnlockTitle: "App lock",
    pinUnlockSubtitle: "Enter your PIN to continue.",
    pinSetupQuestion: "Would you like to set a PIN?",
    pinSetupDescription:
      "Next time you open the app on this device, your PIN is enough (you stay signed in). You can skip and set a PIN later.",
    pinEnterNew: "Choose a PIN (4–6 digits)",
    pinConfirmLabel: "Confirm your PIN",
    pinMismatch: "PINs do not match.",
    pinWrong: "Incorrect PIN. Try again.",
    pinSkip: "Skip for now",
    pinSetButton: "Save PIN",
    pinDigitsHint: "Use 4 to 6 digits.",
    pinLogoutLink: "Log out and use another account",
    pinContinueButton: "Continue",
    pinSubmitUnlock: "Unlock",
    lockSetupTitle: "How do you want to lock the app?",
    lockSetupDescription:
      "On this device you can unlock faster next time — choose Face ID / fingerprint (via your phone) or an app PIN. You can skip this step.",
    lockChooseBiometric: "Face ID / Touch ID / fingerprint",
    lockChooseBiometricHint: "Uses your iPhone or Android biometrics (system prompt).",
    lockChoosePin: "App PIN",
    lockChoosePinHint: "A PIN for Gastro-Elite on this device (4–6 digits).",
    lockChoosePasswordOnly: "Password only",
    lockChoosePasswordOnlyHint: "No extra lock on this device.",
    lockBiometricUnavailable: "Biometrics are not available on this device. Choose a PIN or skip.",
    lockBiometricSetupFailed: "Could not set up biometrics. Try again or choose a PIN.",
    lockBiometricCancelled: "Cancelled. Choose another option.",
    lockUseBiometricUnlock: "Unlock with Face ID / fingerprint",
    lockBiometricRegistering: "Follow the prompt on your screen…",
    lockUnlockBiometricSubtitle: "Use Face ID, Touch ID, or your fingerprint.",
    lockBiometricFailed: "Biometrics failed. Tap to try again.",
    lockStorageUnavailable:
      "Storage is blocked on this device (private mode or in-app browser). Open https://gastro-elite-app.vercel.app in Safari or Chrome (not private) and set up again.",
    emailVerifiedLoginHint: "Your email is verified. Sign in to continue.",
    lockSettingsSection: "App lock",
    lockSettingsManageTitle: "Face ID / PIN for this app",
    lockSettingsManageDescription:
      "Protect quick access on this device. You stay signed in; opening the app asks for biometrics or your app PIN.",
    lockSettingsCurrentNone: "Not set — password sign-in only",
    lockSettingsCurrentBiometric: "Active: Face ID / Touch ID / fingerprint",
    lockSettingsCurrentPin: "Active: app PIN",
    lockSettingsCardHint: "Tap to set up or change",
    lockSetupButton: "Set up",
    lockChangeButton: "Change",
    lockRemoveButton: "Remove",
    lockRemoveConfirm:
      "Remove app lock on this device? You will only sign in with email and password.",
  },
  de: {
    home: "Startseite", recipes: "Rezepte", add: "Hinzufügen", account: "Konto", admin: "Admin",
    loading: "Laden...", save: "Speichern", cancel: "Abbrechen", edit: "Bearbeiten",
    delete: "Löschen", view: "Ansehen", back: "Zurück", login: "Anmelden", logout: "Abmelden",
    close: "Schließen", search: "Suchen", new: "neu", pending: "Ausstehend", approved: "Genehmigt",
    rejected: "Abgelehnt", settings: "Einstellungen", allRightsReserved: "Alle Rechte vorbehalten",
    goodMorning: "Guten Morgen", goodAfternoon: "Guten Tag", goodEvening: "Guten Abend",
    welcome: "Willkommen,", goodLuck: "Viel Erfolg beim Zaubern!",
    quickActions: "Schnellaktionen", viewRecipes: "Rezepte ansehen", newRecipe: "Neues Rezept",
    managePanel: "Verwaltung", manageBusinessRecipes: "Verwalten Sie Ihre Geschäftsrezepte und Mitarbeiter",
    businessApplications: "Geschäftsanträge", forApproval: "Zur Genehmigung",
    noOpenApplications: "Keine offenen Anträge", moreApplications: "weitere Anträge",
    viewAllApplications: "Alle Anträge anzeigen", tipOfTheDay: "Tipp des Tages",
    tipContent: "Verwenden Sie Kategorien, um Ihre Rezepte zu organisieren. Das erleichtert das Finden bestimmter Rezepte.",
    welcomeTitle: "WILLKOMMEN", emailAddress: "E-Mail-Adresse", password: "Passwort", yourPassword: "Ihr Passwort",
    noAccount: "Noch kein Konto?", register: "Registrieren", processing: "Wird verarbeitet...",
    loginFailed: "Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Daten.",
    businessPendingApproval: "Bitte warten — Ihre Geschäftsregistrierung muss von Gastro-Elite genehmigt werden. Dies kann bis zu 24 Stunden dauern.",
    businessRejected: "Ihre Geschäftsregistrierung wurde abgelehnt. Bitte kontaktieren Sie den Support für weitere Informationen.",
    tagline: "Das smarte Cockpit für Rezepte, HACCP und Planung",
    totalRecipes: "Gesamtrezepte", categories: "Kategorien", totalIngredients: "Gesamtzutaten",
    avgIngredients: "Durchschn. Zutaten/Rezept", searchPlaceholder: "Rezepte oder Zutaten suchen...",
    allCategories: "Alle Kategorien",
    multipleCategoriesHint: "Mehrere Kategorien möglich (Rezepte in mindestens einer gewählten Kategorie).",
    otherRecipesLetter: "Sonstige",
    noRecipesFound: "Keine Rezepte gefunden",
    tryAdjustingSearch: "Versuchen Sie, Ihre Such- oder Filterkriterien anzupassen",
    gridView: "Rasteransicht", rowView: "Zeilenansicht", alphabeticalView: "Alphabetische Ansicht",
    recipeViewShortGrid: "Raster", recipeViewShortRow: "Zeilen", recipeViewShortAz: "A–Z",
    switchView: "Ansicht wechseln",
    filter: "Filter", allRecipes: "Alle Rezepte", database: "Datenbank",
    employeeInvitation: "Einladung erhalten", accept: "Annehmen", decline: "Ablehnen",
    startAddingRecipe: "Fügen Sie Ihr erstes Rezept hinzu!", addNewRecipe: "Neues Rezept hinzufügen",
    recipeName: "Rezeptname", recipeNameRequired: "Rezeptname *", imageUrl: "Bild-URL",
    batchSize: "Chargengröße", servings: "Portionen", ingredients: "Zutaten", instructions: "Anleitung",
    addIngredient: "Hinzufügen", quantity: "Menge", ingredientName: "Zutatenname",
    saveRecipe: "Rezept speichern", cancelRecipe: "Abbrechen",
    batchSizeLabel: "Chargengröße:", servingsLabel: "Portionen:", ingredientsLabel: "Zutaten",
    instructionsLabel: "Anleitung", editRecipe: "Rezept bearbeiten", printRecipe: "Rezept drucken",
    deleteRecipe: "Rezept löschen", noPhotoAvailable: "Kein Foto verfügbar",
    personalInformation: "Persönliche Informationen", companyInformation: "Unternehmensinformationen",
    firstName: "Vorname", lastName: "Nachname", email: "E-Mail", phone: "Telefon",
    company: "Unternehmen", role: "Position", changePhoto: "Foto ändern", quickStats: "Schnellstatistik",
    notifications: "Benachrichtigungen", preferences: "Einstellungen", security: "Sicherheit",
    statistics: "Statistiken", profile: "Profil", emailNotifications: "E-Mail-Benachrichtigungen",
    emailNotificationsDesc: "Benachrichtigungen per E-Mail erhalten", pushNotifications: "Push-Benachrichtigungen",
    pushNotificationsDesc: "Push-Benachrichtigungen im Browser erhalten", weeklyDigest: "Wöchentliche Zusammenfassung",
    weeklyDigestDesc: "Erhalten Sie eine wöchentliche Zusammenfassung Ihrer Aktivitäten",
    teamNotificationsTitle: "Team-Benachrichtigungen",
    teamNotificationsSubtitle: "Updates zu Ihrem Team",
    teamNotificationsEmpty: "Keine neuen Meldungen",
    teamNotificationsMarkAllRead: "Alle als gelesen markieren",
    theme: "Design", units: "Einheiten",
    light: "Hell", dark: "Dunkel", auto: "Automatisch", metric: "Metrisch (kg, g, l, ml)",
    imperial: "Imperial (lb, oz, fl oz)", changePassword: "Passwort ändern",
    currentPassword: "Aktuelles Passwort", newPassword: "Neues Passwort",
    confirmPassword: "Neues Passwort bestätigen", updatePassword: "Passwort aktualisieren",
    twoFactorAuth: "Zwei-Faktor-Authentifizierung", enable2FA: "2FA aktivieren",
    twoFactorAuthDesc: "Fügen Sie Ihrem Konto eine zusätzliche Sicherheitsebene hinzu", enable: "Aktivieren",
    dangerZone: "Gefahrenzone", deleteAccount: "Konto löschen",
    deleteAccountDesc: "Ihr Konto und alle Daten dauerhaft löschen",
    recipeCategories: "Rezeptkategorien", saveChanges: "Änderungen speichern", memberSince: "Mitglied seit",
    language: "Sprache", dutch: "Niederländisch", english: "Englisch",
    editDetails: "Details bearbeiten", employees: "Mitarbeiter",
    availableLanguages: "Sprachen verfügbar", currentLanguage: "Aktuelle Sprache", allLanguages: "Alle Sprachen",
    searchResults: "Suchergebnisse", noLanguagesFound: "Keine Sprachen gefunden für",
    searchLanguage: "Sprache suchen...", changeDetails: "Details ändern",
    updatePersonalInfo: "Persönliche Daten aktualisieren", personalData: "Persönliche Daten",
    addressData: "Adressdaten", country: "Land", postalCode: "Postleitzahl", street: "Straße und Hausnummer",
    city: "Stadt", selectCountry: "Land auswählen", saveChangesBtn: "Änderungen speichern",
    chooseStrongPassword: "Wählen Sie ein starkes neues Passwort", choosePreferredLanguage: "Wählen Sie Ihre bevorzugte Sprache",
    loginToAccess: "Melden Sie sich an für Zugang",
    manageAccountSettings: "Verwalten Sie Ihr Konto und Einstellungen", enterEmailAddress: "Geben Sie Ihre E-Mail-Adresse ein",
    enterPassword: "Geben Sie Ihr Passwort ein", name: "Name", address: "Adresse",
    leaveEmptyPassword: "Leer lassen, wenn Sie Ihr Passwort nicht ändern möchten",
    confirmPasswordField: "Passwort bestätigen", noEmployeesYet: "Noch keine Mitarbeiter hinzugefügt",
    addEmployeesToCollaborate: "Fügen Sie Mitarbeiter hinzu um zusammenzuarbeiten", editProfilePhoto: "Profilfoto bearbeiten",
    zoom: "Zoom", accountInfo: "Kontoinformationen", adjustProfile: "Profil anpassen",
    chooseLanguage: "Wählen Sie Ihre Sprache", changePasswordShort: "Passwort ändern", logoutFromAccount: "Von Ihrem Konto abmelden",
    netherlands: "Niederlande", belgium: "Belgien", germany: "Deutschland", france: "Frankreich",
    addEmployee: "Mitarbeiter hinzufügen", remove: "Entfernen",
    noRecipesYet: "Es wurden noch keine Rezepte hinzugefügt",
    startAddingFirstRecipe: "Beginnen Sie mit dem Hinzufügen Ihres ersten Rezepts!",
    addFirstRecipe: "Erstes Rezept hinzufügen", manageRecipeCollection: "Verwalten Sie Ihre Rezeptsammlung",
    loginToViewRecipes: "Melden Sie sich an oder erstellen Sie ein Konto, um Ihre Rezepte anzuzeigen.",
    createAccount: "Konto erstellen",
    addRecipe: "Rezept hinzufügen", createNewRecipes: "Neue Rezepte erstellen",
    loginToAddRecipes: "Melden Sie sich an oder erstellen Sie ein Konto, um Rezepte hinzuzufügen.",
    fillDetailsToAdd: "Füllen Sie die Details aus, um ein neues Rezept hinzuzufügen.",
    recipePhoto: "Rezeptfoto", pieces: "Stück", persons: "Personen", portion: "Portion",
    selectCategories: "Kategorien auswählen", done: "Fertig", newCategory: "Neue Kategorie...",
    saveIn: "Speichern in", personalDatabase: "Persönliche Datenbank", businessDatabase: "Geschäftsdatenbank", personalDatabaseOnly: "Nur persönliche Datenbank verfügbar",
    bothDatabases: "Beide Datenbanken", chooseWhereToSave: "Wählen Sie, wo Ihr Rezept gespeichert werden soll",
    preparationMethod: "Zubereitungsweise", step: "Schritt", stepDescription: "Schrittbeschreibung",
    addStep: "Schritt hinzufügen", uploading: "Hochladen...",
    enterIngredientName: "Geben Sie einen Zutatennamen ein", enterValidQuantity: "Geben Sie eine gültige Menge ein",
    saveFailed: "Speichern fehlgeschlagen", uploadFailed: "Upload fehlgeschlagen", deleteCategory: "Kategorie löschen?",
    editCategory: "Bearbeiten", changeFailed: "Änderung fehlgeschlagen", deleteFailed: "Löschen fehlgeschlagen",
    confirmDelete: "Löschen bestätigen",
    deleteRecipeConfirmation: "Sind Sie sicher, dass Sie dieses Rezept löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.",
    recipeDeletedSuccessfully: "Rezept erfolgreich gelöscht",
    deleting: "Löschen...",
    privateAccount: "Privates Konto",
    catVoorgerecht: "Vorspeise", catTussengerecht: "Zwischengang", catHoofdgerecht: "Hauptgericht",
    catDessert: "Dessert", catGroentegarnituur: "Gemüsebeilage", catVlees: "Fleisch", catVis: "Fisch",
    catVegetarisch: "Vegetarisch", catZetmeelgarnituur: "Stärkebeilage", catGebondenSauzen: "Gebundene Soßen",
    catKoudeSauzen: "Kalte Soßen", catSoepen: "Suppen", catSalades: "Salate", catBrood: "Brot", catDranken: "Getränke",
    chooseFile: "Datei auswählen", noFileSelected: "Keine Datei ausgewählt",
    noPhoto: "Kein Foto", noNewApplications: "Keine neuen Anträge",
    noPersonalRecipesFound: "Keine persönlichen Rezepte gefunden",
    noPendingApplications: "Keine ausstehenden Geschäftsanträge",
    enterEmployeeEmail: "Mitarbeiter-E-Mail eingeben", exampleEmail: "ihre@email.de",
    examplePhone: "+49 123 456789", examplePostalCode: "12345", exampleStreet: "Straßenname 123", exampleCity: "Stadt",
    pinUnlockTitle: "App-Sperre",
    pinUnlockSubtitle: "Geben Sie Ihre PIN ein, um fortzufahren.",
    pinSetupQuestion: "Möchten Sie eine PIN festlegen?",
    pinSetupDescription:
      "Beim nächsten Öffnen der App auf diesem Gerät genügt Ihre PIN (Sie bleiben angemeldet). Überspringen ist möglich.",
    pinEnterNew: "PIN wählen (4–6 Ziffern)",
    pinConfirmLabel: "PIN bestätigen",
    pinMismatch: "PINs stimmen nicht überein.",
    pinWrong: "Falsche PIN. Bitte erneut versuchen.",
    pinSkip: "Jetzt überspringen",
    pinSetButton: "PIN speichern",
    pinDigitsHint: "4 bis 6 Ziffern verwenden.",
    pinLogoutLink: "Abmelden und anderes Konto verwenden",
    pinContinueButton: "Weiter",
    pinSubmitUnlock: "Entsperren",
    lockSetupTitle: "Wie möchten Sie die App sperren?",
    lockSetupDescription: "Auf diesem Gerät können Sie beim nächsten Mal schneller entsperren — Face ID / Fingerabdruck oder App-PIN. Überspringen ist möglich.",
    lockChooseBiometric: "Face ID / Touch ID / Fingerabdruck",
    lockChooseBiometricHint: "Nutzt die Biometrie Ihres Geräts (Systemdialog).",
    lockChoosePin: "App-PIN",
    lockChoosePinHint: "Eigene PIN für Gastro-Elite (4–6 Ziffern).",
    lockChoosePasswordOnly: "Nur Passwort",
    lockChoosePasswordOnlyHint: "Keine zusätzliche Sperre auf diesem Gerät.",
    lockBiometricUnavailable: "Biometrie auf diesem Gerät nicht verfügbar.",
    lockBiometricSetupFailed: "Biometrie konnte nicht eingerichtet werden.",
    lockBiometricCancelled: "Abgebrochen.",
    lockUseBiometricUnlock: "Mit Face ID / Fingerabdruck entsperren",
    lockBiometricRegistering: "Folgen Sie der Meldung auf dem Bildschirm…",
    lockUnlockBiometricSubtitle: "Face ID, Touch ID oder Fingerabdruck verwenden.",
    lockBiometricFailed: "Biometrie fehlgeschlagen. Erneut tippen.",
    lockStorageUnavailable:
      "Speicher blockiert (Privatmodus/In-App-Browser). Öffnen Sie https://gastro-elite-app.vercel.app in Safari oder Chrome.",
    emailVerifiedLoginHint: "E-Mail bestätigt. Bitte anmelden.",
    lockSettingsSection: "App-Sperre",
    lockSettingsManageTitle: "Face ID / PIN für diese App",
    lockSettingsManageDescription: "Schnellzugriff auf diesem Gerät schützen.",
    lockSettingsCurrentNone: "Nicht eingerichtet",
    lockSettingsCurrentBiometric: "Aktiv: Face ID / Fingerabdruck",
    lockSettingsCurrentPin: "Aktiv: App-PIN",
    lockSettingsCardHint: "Tippen zum Einrichten oder Ändern",
    lockSetupButton: "Einrichten",
    lockChangeButton: "Ändern",
    lockRemoveButton: "Entfernen",
    lockRemoveConfirm: "App-Sperre auf diesem Gerät entfernen?",
  },
  fr: {
    home: "Accueil", recipes: "Recettes", add: "Ajouter", account: "Compte", admin: "Admin",
    loading: "Chargement...", save: "Enregistrer", cancel: "Annuler", edit: "Modifier",
    delete: "Supprimer", view: "Voir", back: "Retour", login: "Connexion", logout: "Déconnexion",
    close: "Fermer", search: "Rechercher", new: "nouveau", pending: "En attente", approved: "Approuvé",
    rejected: "Rejeté", settings: "Paramètres", allRightsReserved: "Tous droits réservés",
    goodMorning: "Bonjour", goodAfternoon: "Bon après-midi", goodEvening: "Bonsoir",
    welcome: "Bienvenue,", goodLuck: "Bonne chance pour créer de la magie!",
    quickActions: "Actions rapides", viewRecipes: "Voir les recettes", newRecipe: "Nouvelle recette",
    managePanel: "Panneau de gestion", manageBusinessRecipes: "Gérez vos recettes d'entreprise et employés",
    businessApplications: "Demandes d'entreprise", forApproval: "Pour approbation",
    noOpenApplications: "Aucune demande en cours", moreApplications: "plus de demandes",
    viewAllApplications: "Voir toutes les demandes", tipOfTheDay: "Conseil du jour",
    tipContent: "Utilisez des catégories pour organiser vos recettes. Cela facilite la recherche de recettes spécifiques.",
    welcomeTitle: "BIENVENUE", emailAddress: "Adresse e-mail", password: "Mot de passe", yourPassword: "Votre mot de passe",
    noAccount: "Pas encore de compte?", register: "S'inscrire", processing: "Traitement...",
    loginFailed: "Échec de la connexion. Veuillez vérifier vos identifiants.",
    businessPendingApproval: "Veuillez patienter — votre inscription d'entreprise doit être approuvée par Gastro-Elite. Cela peut prendre jusqu'à 24 heures.",
    businessRejected: "Votre inscription d'entreprise a été rejetée. Veuillez contacter le support pour plus d'informations.",
    tagline: "Le cockpit intelligent pour les recettes, HACCP et la planification",
    totalRecipes: "Total des recettes", categories: "Catégories", totalIngredients: "Total des ingrédients",
    avgIngredients: "Moy. ingrédients/recette", searchPlaceholder: "Rechercher des recettes ou des ingrédients...",
    allCategories: "Toutes les catégories",
    multipleCategoriesHint: "Plusieurs catégories possibles (recettes dans au moins une catégorie choisie).",
    otherRecipesLetter: "Autres",
    noRecipesFound: "Aucune recette trouvée",
    tryAdjustingSearch: "Essayez d'ajuster vos critères de recherche ou de filtre",
    gridView: "Vue en grille", rowView: "Vue en ligne", alphabeticalView: "Vue alphabétique",
    recipeViewShortGrid: "Grille", recipeViewShortRow: "Lignes", recipeViewShortAz: "A–Z",
    switchView: "Changer de vue",
    filter: "Filtre", allRecipes: "Toutes les recettes", database: "Base de données",
    employeeInvitation: "Invitation reçue", accept: "Accepter", decline: "Refuser",
    startAddingRecipe: "Commencez par ajouter votre première recette!", addNewRecipe: "Ajouter une nouvelle recette",
    recipeName: "Nom de la recette", recipeNameRequired: "Nom de la recette *", imageUrl: "URL de l'image",
    batchSize: "Taille du lot", servings: "Portions", ingredients: "Ingrédients", instructions: "Instructions",
    addIngredient: "Ajouter", quantity: "Quantité", ingredientName: "Nom de l'ingrédient",
    saveRecipe: "Enregistrer la recette", cancelRecipe: "Annuler",
    batchSizeLabel: "Taille du lot:", servingsLabel: "Portions:", ingredientsLabel: "Ingrédients",
    instructionsLabel: "Instructions", editRecipe: "Modifier la recette", printRecipe: "Imprimer la recette",
    deleteRecipe: "Supprimer la recette", noPhotoAvailable: "Pas de photo disponible",
    personalInformation: "Informations personnelles", companyInformation: "Informations sur l'entreprise",
    firstName: "Prénom", lastName: "Nom", email: "E-mail", phone: "Téléphone",
    company: "Entreprise", role: "Rôle", changePhoto: "Changer la photo", quickStats: "Statistiques rapides",
    notifications: "Notifications", preferences: "Préférences", security: "Sécurité",
    statistics: "Statistiques", profile: "Profil", emailNotifications: "Notifications par e-mail",
    emailNotificationsDesc: "Recevoir des notifications par e-mail", pushNotifications: "Notifications push",
    pushNotificationsDesc: "Recevoir des notifications push dans le navigateur", weeklyDigest: "Résumé hebdomadaire",
    weeklyDigestDesc: "Recevez un résumé hebdomadaire de votre activité",
    teamNotificationsTitle: "Notifications équipe",
    teamNotificationsSubtitle: "Actualités sur votre équipe",
    teamNotificationsEmpty: "Aucune nouvelle notification",
    teamNotificationsMarkAllRead: "Tout marquer comme lu",
    theme: "Thème", units: "Unités",
    light: "Clair", dark: "Sombre", auto: "Auto", metric: "Métrique (kg, g, l, ml)",
    imperial: "Impérial (lb, oz, fl oz)", changePassword: "Changer le mot de passe",
    currentPassword: "Mot de passe actuel", newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le nouveau mot de passe", updatePassword: "Mettre à jour le mot de passe",
    twoFactorAuth: "Authentification à deux facteurs", enable2FA: "Activer 2FA",
    twoFactorAuthDesc: "Ajoutez une couche de sécurité supplémentaire à votre compte", enable: "Activer",
    dangerZone: "Zone dangereuse", deleteAccount: "Supprimer le compte",
    deleteAccountDesc: "Supprimer définitivement votre compte et toutes les données",
    recipeCategories: "Catégories de recettes", saveChanges: "Enregistrer les modifications", memberSince: "Membre depuis",
    language: "Langue", dutch: "Néerlandais", english: "Anglais",
    editDetails: "Modifier les détails", employees: "Employés",
    availableLanguages: "langues disponibles", currentLanguage: "Langue actuelle", allLanguages: "Toutes les langues",
    searchResults: "Résultats de recherche", noLanguagesFound: "Aucune langue trouvée pour",
    searchLanguage: "Rechercher une langue...", changeDetails: "Modifier les détails",
    updatePersonalInfo: "Mettre à jour vos informations personnelles", personalData: "Données personnelles",
    addressData: "Données d'adresse", country: "Pays", postalCode: "Code postal", street: "Rue et numéro",
    city: "Ville", selectCountry: "Sélectionner le pays", saveChangesBtn: "Enregistrer les modifications",
    chooseStrongPassword: "Choisissez un nouveau mot de passe fort", choosePreferredLanguage: "Choisissez votre langue préférée",
    loginToAccess: "Connectez-vous pour accéder",
    manageAccountSettings: "Gérez votre compte et vos paramètres", enterEmailAddress: "Entrez votre adresse e-mail",
    enterPassword: "Entrez votre mot de passe", name: "Nom", address: "Adresse",
    leaveEmptyPassword: "Laissez vide si vous ne voulez pas changer votre mot de passe",
    confirmPasswordField: "Confirmer le mot de passe", noEmployeesYet: "Aucun employé ajouté pour le moment",
    addEmployeesToCollaborate: "Ajoutez des employés pour collaborer", editProfilePhoto: "Modifier la photo de profil",
    zoom: "Zoom", accountInfo: "Informations du compte", adjustProfile: "Ajuster votre profil",
    chooseLanguage: "Choisissez votre langue", changePasswordShort: "Changer le mot de passe", logoutFromAccount: "Se déconnecter de votre compte",
    netherlands: "Pays-Bas", belgium: "Belgique", germany: "Allemagne", france: "France",
    addEmployee: "Ajouter un employé", remove: "Supprimer",
    noRecipesYet: "Aucune recette n'a encore été ajoutée",
    startAddingFirstRecipe: "Commencez par ajouter votre première recette!",
    addFirstRecipe: "Ajouter la première recette", manageRecipeCollection: "Gérez votre collection de recettes",
    loginToViewRecipes: "Connectez-vous ou créez un compte pour voir vos recettes.",
    createAccount: "Créer un compte",
    addRecipe: "Ajouter une recette", createNewRecipes: "Créer de nouvelles recettes",
    loginToAddRecipes: "Connectez-vous ou créez un compte pour ajouter des recettes.",
    fillDetailsToAdd: "Remplissez les détails pour ajouter une nouvelle recette.",
    recipePhoto: "Photo de la recette", pieces: "pièces", persons: "personnes", portion: "portion",
    selectCategories: "Sélectionner les catégories", done: "Terminé", newCategory: "Nouvelle catégorie...",
    saveIn: "Enregistrer dans", personalDatabase: "Base de données personnelle", businessDatabase: "Base de données entreprise", personalDatabaseOnly: "Seule la base de données personnelle disponible",
    bothDatabases: "Les deux bases de données", chooseWhereToSave: "Choisissez où enregistrer votre recette",
    preparationMethod: "Méthode de préparation", step: "Étape", stepDescription: "Description de l'étape",
    addStep: "Ajouter une étape", uploading: "Téléchargement en cours...",
    enterIngredientName: "Entrez un nom d'ingrédient", enterValidQuantity: "Entrez une quantité valide",
    saveFailed: "Échec de l'enregistrement", uploadFailed: "Échec du téléchargement", deleteCategory: "Supprimer la catégorie?",
    editCategory: "Modifier", changeFailed: "Échec de la modification", deleteFailed: "Échec de la suppression",
    confirmDelete: "Confirmer la suppression",
    deleteRecipeConfirmation: "Êtes-vous sûr de vouloir supprimer cette recette ? Cette action ne peut pas être annulée.",
    recipeDeletedSuccessfully: "Recette supprimée avec succès",
    deleting: "Suppression...",
    privateAccount: "Compte particulier",
    catVoorgerecht: "Entrée", catTussengerecht: "Plat intermédiaire", catHoofdgerecht: "Plat principal",
    catDessert: "Dessert", catGroentegarnituur: "Garniture de légumes", catVlees: "Viande", catVis: "Poisson",
    catVegetarisch: "Végétarien", catZetmeelgarnituur: "Garniture de féculents", catGebondenSauzen: "Sauces liées",
    catKoudeSauzen: "Sauces froides", catSoepen: "Soupes", catSalades: "Salades", catBrood: "Pain", catDranken: "Boissons",
    chooseFile: "Choisir un fichier", noFileSelected: "Aucun fichier sélectionné",
    noPhoto: "Pas de photo", noNewApplications: "Aucune nouvelle demande",
    noPersonalRecipesFound: "Aucune recette personnelle trouvée",
    noPendingApplications: "Aucune demande d'entreprise en attente",
    enterEmployeeEmail: "Entrez l'e-mail de l'employé", exampleEmail: "vous@email.fr",
    examplePhone: "+33 6 12 34 56 78", examplePostalCode: "75000", exampleStreet: "Rue Exemple 123", exampleCity: "Ville",
    pinUnlockTitle: "Verrouillage de l’app",
    pinUnlockSubtitle: "Entrez votre code PIN pour continuer.",
    pinSetupQuestion: "Souhaitez-vous définir un code PIN ?",
    pinSetupDescription:
      "La prochaine fois sur cet appareil, votre PIN suffit (vous restez connecté). Vous pouvez ignorer pour l’instant.",
    pinEnterNew: "Choisissez un code PIN (4 à 6 chiffres)",
    pinConfirmLabel: "Confirmez votre code PIN",
    pinMismatch: "Les codes PIN ne correspondent pas.",
    pinWrong: "Code PIN incorrect. Réessayez.",
    pinSkip: "Passer pour l’instant",
    pinSetButton: "Enregistrer le PIN",
    pinDigitsHint: "Utilisez 4 à 6 chiffres.",
    pinLogoutLink: "Se déconnecter et utiliser un autre compte",
    pinContinueButton: "Suivant",
    pinSubmitUnlock: "Déverrouiller",
    lockSetupTitle: "Comment verrouiller l’app ?",
    lockSetupDescription: "Sur cet appareil, déverrouillez plus vite — Face ID / empreinte ou code PIN. Vous pouvez ignorer.",
    lockChooseBiometric: "Face ID / Touch ID / empreinte",
    lockChooseBiometricHint: "Utilise la biométrie du téléphone (dialogue système).",
    lockChoosePin: "Code PIN de l’app",
    lockChoosePinHint: "PIN Gastro-Elite sur cet appareil (4–6 chiffres).",
    lockChoosePasswordOnly: "Mot de passe uniquement",
    lockChoosePasswordOnlyHint: "Pas de verrouillage supplémentaire.",
    lockBiometricUnavailable: "Biométrie indisponible sur cet appareil.",
    lockBiometricSetupFailed: "Échec de la configuration biométrique.",
    lockBiometricCancelled: "Annulé.",
    lockUseBiometricUnlock: "Déverrouiller avec Face ID / empreinte",
    lockBiometricRegistering: "Suivez l’invite à l’écran…",
    lockUnlockBiometricSubtitle: "Utilisez Face ID, Touch ID ou votre empreinte.",
    lockBiometricFailed: "Échec biométrique. Réessayez.",
    lockStorageUnavailable:
      "Stockage bloqué (navigation privée / navigateur intégré). Ouvrez https://gastro-elite-app.vercel.app dans Safari ou Chrome.",
    emailVerifiedLoginHint: "E-mail vérifié. Connectez-vous pour continuer.",
    lockSettingsSection: "Verrouillage de l’app",
    lockSettingsManageTitle: "Face ID / code PIN",
    lockSettingsManageDescription: "Protégez l’accès rapide sur cet appareil.",
    lockSettingsCurrentNone: "Non configuré",
    lockSettingsCurrentBiometric: "Actif : Face ID / empreinte",
    lockSettingsCurrentPin: "Actif : code PIN",
    lockSettingsCardHint: "Appuyez pour configurer",
    lockSetupButton: "Configurer",
    lockChangeButton: "Modifier",
    lockRemoveButton: "Supprimer",
    lockRemoveConfirm: "Supprimer le verrouillage sur cet appareil ?",
  },
  es: {
    home: "Inicio", recipes: "Recetas", add: "Añadir", account: "Cuenta", admin: "Admin",
    loading: "Cargando...", save: "Guardar", cancel: "Cancelar", edit: "Editar",
    delete: "Eliminar", view: "Ver", back: "Volver", login: "Iniciar sesión", logout: "Cerrar sesión",
    close: "Cerrar", search: "Buscar", new: "nuevo", pending: "Pendiente", approved: "Aprobado",
    rejected: "Rechazado", settings: "Configuración", allRightsReserved: "Todos los derechos reservados",
    goodMorning: "Buenos días", goodAfternoon: "Buenas tardes", goodEvening: "Buenas noches",
    welcome: "Bienvenido,", goodLuck: "¡Buena suerte creando magia!",
    quickActions: "Acciones rápidas", viewRecipes: "Ver recetas", newRecipe: "Nueva receta",
    managePanel: "Panel de gestión", manageBusinessRecipes: "Gestione sus recetas de empresa y empleados",
    businessApplications: "Solicitudes de empresas", forApproval: "Para aprobación",
    noOpenApplications: "Sin solicitudes pendientes", moreApplications: "más solicitudes",
    viewAllApplications: "Ver todas las solicitudes", tipOfTheDay: "Consejo del día",
    tipContent: "Use categorías para organizar sus recetas. Esto facilita encontrar recetas específicas.",
    welcomeTitle: "BIENVENIDO", emailAddress: "Correo electrónico", password: "Contraseña", yourPassword: "Su contraseña",
    noAccount: "¿No tiene cuenta?", register: "Registrarse", processing: "Procesando...",
    loginFailed: "Error de inicio de sesión. Verifique sus credenciales.",
    businessPendingApproval: "Por favor espere — su registro de empresa debe ser aprobado por Gastro-Elite. Esto puede tardar hasta 24 horas.",
    businessRejected: "Su registro de empresa ha sido rechazado. Contacte a soporte para más información.",
    tagline: "La cabina inteligente para recetas, HACCP y planificación",
    totalRecipes: "Total de recetas", categories: "Categorías", totalIngredients: "Total de ingredientes",
    avgIngredients: "Prom. ingredientes/receta", searchPlaceholder: "Buscar recetas o ingredientes...",
    allCategories: "Todas las categorías",
    multipleCategoriesHint: "Varias categorías (mostrar recetas en al menos una categoría seleccionada).",
    otherRecipesLetter: "Otros",
    noRecipesFound: "No se encontraron recetas",
    tryAdjustingSearch: "Intente ajustar sus criterios de búsqueda o filtro",
    gridView: "Vista de cuadrícula", rowView: "Vista de filas", alphabeticalView: "Vista alfabética",
    recipeViewShortGrid: "Grilla", recipeViewShortRow: "Filas", recipeViewShortAz: "A–Z",
    switchView: "Cambiar vista",
    filter: "Filtro", allRecipes: "Todas las recetas", database: "Base de datos",
    employeeInvitation: "Invitación recibida", accept: "Aceptar", decline: "Rechazar",
    startAddingRecipe: "¡Comience agregando su primera receta!", addNewRecipe: "Añadir nueva receta",
    recipeName: "Nombre de la receta", recipeNameRequired: "Nombre de la receta *", imageUrl: "URL de la imagen",
    batchSize: "Tamaño del lote", servings: "Porciones", ingredients: "Ingredientes", instructions: "Instrucciones",
    addIngredient: "Añadir", quantity: "Cantidad", ingredientName: "Nombre del ingrediente",
    saveRecipe: "Guardar receta", cancelRecipe: "Cancelar",
    batchSizeLabel: "Tamaño del lote:", servingsLabel: "Porciones:", ingredientsLabel: "Ingredientes",
    instructionsLabel: "Instrucciones", editRecipe: "Editar receta", printRecipe: "Imprimir receta",
    deleteRecipe: "Eliminar receta", noPhotoAvailable: "No hay foto disponible",
    personalInformation: "Información personal", companyInformation: "Información de la empresa",
    firstName: "Nombre", lastName: "Apellido", email: "Correo electrónico", phone: "Teléfono",
    company: "Empresa", role: "Rol", changePhoto: "Cambiar foto", quickStats: "Estadísticas rápidas",
    notifications: "Notificaciones", preferences: "Preferencias", security: "Seguridad",
    statistics: "Estadísticas", profile: "Perfil", emailNotifications: "Notificaciones por correo",
    emailNotificationsDesc: "Recibir notificaciones por correo electrónico", pushNotifications: "Notificaciones push",
    pushNotificationsDesc: "Recibir notificaciones push en el navegador", weeklyDigest: "Resumen semanal",
    weeklyDigestDesc: "Reciba un resumen semanal de su actividad",
    teamNotificationsTitle: "Notificaciones del equipo",
    teamNotificationsSubtitle: "Novedades de tu equipo",
    teamNotificationsEmpty: "No hay notificaciones nuevas",
    teamNotificationsMarkAllRead: "Marcar todo como leído",
    theme: "Tema", units: "Unidades",
    light: "Claro", dark: "Oscuro", auto: "Auto", metric: "Métrico (kg, g, l, ml)",
    imperial: "Imperial (lb, oz, fl oz)", changePassword: "Cambiar contraseña",
    currentPassword: "Contraseña actual", newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar nueva contraseña", updatePassword: "Actualizar contraseña",
    twoFactorAuth: "Autenticación de dos factores", enable2FA: "Activar 2FA",
    twoFactorAuthDesc: "Añada una capa adicional de seguridad a su cuenta", enable: "Activar",
    dangerZone: "Zona de peligro", deleteAccount: "Eliminar cuenta",
    deleteAccountDesc: "Eliminar permanentemente su cuenta y todos los datos",
    recipeCategories: "Categorías de recetas", saveChanges: "Guardar cambios", memberSince: "Miembro desde",
    language: "Idioma", dutch: "Holandés", english: "Inglés",
    editDetails: "Editar detalles", employees: "Empleados",
    availableLanguages: "idiomas disponibles", currentLanguage: "Idioma actual", allLanguages: "Todos los idiomas",
    searchResults: "Resultados de búsqueda", noLanguagesFound: "No se encontraron idiomas para",
    searchLanguage: "Buscar idioma...", changeDetails: "Cambiar detalles",
    updatePersonalInfo: "Actualice su información personal", personalData: "Datos personales",
    addressData: "Datos de dirección", country: "País", postalCode: "Código postal", street: "Calle y número",
    city: "Ciudad", selectCountry: "Seleccionar país", saveChangesBtn: "Guardar cambios",
    chooseStrongPassword: "Elija una nueva contraseña segura", choosePreferredLanguage: "Elija su idioma preferido",
    loginToAccess: "Inicie sesión para acceder",
    manageAccountSettings: "Administre su cuenta y configuración", enterEmailAddress: "Ingrese su correo electrónico",
    enterPassword: "Ingrese su contraseña", name: "Nombre", address: "Dirección",
    leaveEmptyPassword: "Deje vacío si no desea cambiar su contraseña",
    confirmPasswordField: "Confirmar contraseña", noEmployeesYet: "Aún no hay empleados agregados",
    addEmployeesToCollaborate: "Agregue empleados para colaborar", editProfilePhoto: "Editar foto de perfil",
    zoom: "Zoom", accountInfo: "Información de la cuenta", adjustProfile: "Ajustar su perfil",
    chooseLanguage: "Elija su idioma", changePasswordShort: "Cambiar contraseña", logoutFromAccount: "Cerrar sesión de su cuenta",
    netherlands: "Países Bajos", belgium: "Bélgica", germany: "Alemania", france: "Francia",
    addEmployee: "Agregar empleado", remove: "Eliminar",
    noRecipesYet: "Aún no se han agregado recetas",
    startAddingFirstRecipe: "¡Empieza agregando tu primera receta!",
    addFirstRecipe: "Agregar primera receta", manageRecipeCollection: "Administra tu colección de recetas",
    loginToViewRecipes: "Inicia sesión o crea una cuenta para ver tus recetas.",
    createAccount: "Crear cuenta",
    addRecipe: "Agregar receta", createNewRecipes: "Crear nuevas recetas",
    loginToAddRecipes: "Inicia sesión o crea una cuenta para agregar recetas.",
    fillDetailsToAdd: "Completa los detalles para agregar una nueva receta.",
    recipePhoto: "Foto de la receta", pieces: "piezas", persons: "personas", portion: "porción",
    selectCategories: "Seleccionar categorías", done: "Listo", newCategory: "Nueva categoría...",
    saveIn: "Guardar en", personalDatabase: "Base de datos personal", businessDatabase: "Base de datos empresarial", personalDatabaseOnly: "Solo base de datos personal disponible",
    bothDatabases: "Ambas bases de datos", chooseWhereToSave: "Elige dónde guardar tu receta",
    preparationMethod: "Método de preparación", step: "Paso", stepDescription: "Descripción del paso",
    addStep: "Agregar paso", uploading: "Subiendo...",
    enterIngredientName: "Ingrese un nombre de ingrediente", enterValidQuantity: "Ingrese una cantidad válida",
    saveFailed: "Error al guardar", uploadFailed: "Error al subir", deleteCategory: "¿Eliminar categoría?",
    editCategory: "Editar", changeFailed: "Error al cambiar", deleteFailed: "Error al eliminar",
    confirmDelete: "Confirmar eliminación",
    deleteRecipeConfirmation: "¿Está seguro de que desea eliminar esta receta? Esta acción no se puede deshacer.",
    recipeDeletedSuccessfully: "Receta eliminada exitosamente",
    deleting: "Eliminando...",
    privateAccount: "Cuenta particular",
    catVoorgerecht: "Entrante", catTussengerecht: "Plato intermedio", catHoofdgerecht: "Plato principal",
    catDessert: "Postre", catGroentegarnituur: "Guarnición de verduras", catVlees: "Carne", catVis: "Pescado",
    catVegetarisch: "Vegetariano", catZetmeelgarnituur: "Guarnición de fécula", catGebondenSauzen: "Salsas espesas",
    catKoudeSauzen: "Salsas frías", catSoepen: "Sopas", catSalades: "Ensaladas", catBrood: "Pan", catDranken: "Bebidas",
    chooseFile: "Elegir archivo", noFileSelected: "Ningún archivo seleccionado",
    noPhoto: "Sin foto", noNewApplications: "Sin nuevas solicitudes",
    noPersonalRecipesFound: "No se encontraron recetas personales",
    noPendingApplications: "Sin solicitudes de empresa pendientes",
    enterEmployeeEmail: "Ingrese el correo del empleado", exampleEmail: "tu@email.es",
    examplePhone: "+34 612 345 678", examplePostalCode: "28001", exampleStreet: "Calle Ejemplo 123", exampleCity: "Ciudad",
    pinUnlockTitle: "Bloqueo de la app",
    pinUnlockSubtitle: "Introduce tu PIN para continuar.",
    pinSetupQuestion: "¿Quieres configurar un PIN?",
    pinSetupDescription:
      "La próxima vez que abras la app en este dispositivo bastará el PIN (sigues conectado). Puedes omitirlo.",
    pinEnterNew: "Elige un PIN (4–6 dígitos)",
    pinConfirmLabel: "Confirma tu PIN",
    pinMismatch: "Los PIN no coinciden.",
    pinWrong: "PIN incorrecto. Inténtalo de nuevo.",
    pinSkip: "Omitir por ahora",
    pinSetButton: "Guardar PIN",
    pinDigitsHint: "Usa de 4 a 6 dígitos.",
    pinLogoutLink: "Cerrar sesión y usar otra cuenta",
    pinContinueButton: "Siguiente",
    pinSubmitUnlock: "Desbloquear",
    lockSetupTitle: "¿Cómo quieres bloquear la app?",
    lockSetupDescription: "En este dispositivo desbloquea más rápido — Face ID / huella o PIN. Puedes omitir.",
    lockChooseBiometric: "Face ID / Touch ID / huella",
    lockChooseBiometricHint: "Usa la biometría del teléfono (diálogo del sistema).",
    lockChoosePin: "PIN de la app",
    lockChoosePinHint: "PIN de Gastro-Elite (4–6 dígitos).",
    lockChoosePasswordOnly: "Solo contraseña",
    lockChoosePasswordOnlyHint: "Sin bloqueo extra en este dispositivo.",
    lockBiometricUnavailable: "Biometría no disponible en este dispositivo.",
    lockBiometricSetupFailed: "No se pudo configurar la biometría.",
    lockBiometricCancelled: "Cancelado.",
    lockUseBiometricUnlock: "Desbloquear con Face ID / huella",
    lockBiometricRegistering: "Sigue el aviso en pantalla…",
    lockUnlockBiometricSubtitle: "Usa Face ID, Touch ID o huella.",
    lockBiometricFailed: "Biometría fallida. Toca para reintentar.",
    lockStorageUnavailable:
      "Almacenamiento bloqueado. Abra https://gastro-elite-app.vercel.app en Safari o Chrome (sin modo privado).",
    emailVerifiedLoginHint: "Correo verificado. Inicia sesión para continuar.",
    lockSettingsSection: "Bloqueo de la app",
    lockSettingsManageTitle: "Face ID / PIN",
    lockSettingsManageDescription: "Protege el acceso rápido en este dispositivo.",
    lockSettingsCurrentNone: "No configurado",
    lockSettingsCurrentBiometric: "Activo: Face ID / huella",
    lockSettingsCurrentPin: "Activo: PIN",
    lockSettingsCardHint: "Toca para configurar",
    lockSetupButton: "Configurar",
    lockChangeButton: "Cambiar",
    lockRemoveButton: "Eliminar",
    lockRemoveConfirm: "¿Eliminar el bloqueo en este dispositivo?",
  },
  it: {
    home: "Home", recipes: "Ricette", add: "Aggiungi", account: "Account", admin: "Admin",
    loading: "Caricamento...", save: "Salva", cancel: "Annulla", edit: "Modifica",
    delete: "Elimina", view: "Visualizza", back: "Indietro", login: "Accedi", logout: "Esci",
    close: "Chiudi", search: "Cerca", new: "nuovo", pending: "In attesa", approved: "Approvato",
    rejected: "Rifiutato", settings: "Impostazioni", allRightsReserved: "Tutti i diritti riservati",
    goodMorning: "Buongiorno", goodAfternoon: "Buon pomeriggio", goodEvening: "Buonasera",
    welcome: "Benvenuto,", goodLuck: "Buona fortuna nel creare magia!",
    quickActions: "Azioni rapide", viewRecipes: "Vedi ricette", newRecipe: "Nuova ricetta",
    managePanel: "Pannello di gestione", manageBusinessRecipes: "Gestisci le ricette aziendali e i dipendenti",
    businessApplications: "Richieste aziendali", forApproval: "Per approvazione",
    noOpenApplications: "Nessuna richiesta in sospeso", moreApplications: "altre richieste",
    viewAllApplications: "Visualizza tutte le richieste", tipOfTheDay: "Consiglio del giorno",
    tipContent: "Usa le categorie per organizzare le tue ricette. Questo rende più facile trovare ricette specifiche.",
    welcomeTitle: "BENVENUTO", emailAddress: "Indirizzo email", password: "Password", yourPassword: "La tua password",
    noAccount: "Non hai un account?", register: "Registrati", processing: "Elaborazione...",
    loginFailed: "Accesso fallito. Controlla le tue credenziali.",
    businessPendingApproval: "Attendere — la registrazione aziendale deve essere approvata da Gastro-Elite. Potrebbe richiedere fino a 24 ore.",
    businessRejected: "La registrazione aziendale è stata rifiutata. Contatta l'assistenza per maggiori informazioni.",
    tagline: "Il cockpit intelligente per ricette, HACCP e pianificazione",
    totalRecipes: "Totale ricette", categories: "Categorie", totalIngredients: "Totale ingredienti",
    avgIngredients: "Media ingredienti/ricetta", searchPlaceholder: "Cerca ricette o ingredienti...",
    allCategories: "Tutte le categorie",
    multipleCategoriesHint: "Più categorie (mostra ricette in almeno una categoria selezionata).",
    otherRecipesLetter: "Altro",
    noRecipesFound: "Nessuna ricetta trovata",
    tryAdjustingSearch: "Prova a modificare i criteri di ricerca o filtro",
    gridView: "Vista griglia", rowView: "Vista righe", alphabeticalView: "Vista alfabetica",
    recipeViewShortGrid: "Griglia", recipeViewShortRow: "Righe", recipeViewShortAz: "A–Z",
    switchView: "Cambia vista",
    filter: "Filtro", allRecipes: "Tutte le ricette", database: "Database",
    employeeInvitation: "Invito ricevuto", accept: "Accetta", decline: "Rifiuta",
    startAddingRecipe: "Inizia aggiungendo la tua prima ricetta!", addNewRecipe: "Aggiungi nuova ricetta",
    recipeName: "Nome ricetta", recipeNameRequired: "Nome ricetta *", imageUrl: "URL immagine",
    batchSize: "Dimensione lotto", servings: "Porzioni", ingredients: "Ingredienti", instructions: "Istruzioni",
    addIngredient: "Aggiungi", quantity: "Quantità", ingredientName: "Nome ingrediente",
    saveRecipe: "Salva ricetta", cancelRecipe: "Annulla",
    batchSizeLabel: "Dimensione lotto:", servingsLabel: "Porzioni:", ingredientsLabel: "Ingredienti",
    instructionsLabel: "Istruzioni", editRecipe: "Modifica ricetta", printRecipe: "Stampa ricetta",
    deleteRecipe: "Elimina ricetta", noPhotoAvailable: "Nessuna foto disponibile",
    personalInformation: "Informazioni personali", companyInformation: "Informazioni aziendali",
    firstName: "Nome", lastName: "Cognome", email: "Email", phone: "Telefono",
    company: "Azienda", role: "Ruolo", changePhoto: "Cambia foto", quickStats: "Statistiche rapide",
    notifications: "Notifiche", preferences: "Preferenze", security: "Sicurezza",
    statistics: "Statistiche", profile: "Profilo", emailNotifications: "Notifiche email",
    emailNotificationsDesc: "Ricevi notifiche via email", pushNotifications: "Notifiche push",
    pushNotificationsDesc: "Ricevi notifiche push nel browser", weeklyDigest: "Riepilogo settimanale",
    weeklyDigestDesc: "Ricevi un riepilogo settimanale della tua attività",
    teamNotificationsTitle: "Notifiche team",
    teamNotificationsSubtitle: "Aggiornamenti sul tuo team",
    teamNotificationsEmpty: "Nessuna nuova notifica",
    teamNotificationsMarkAllRead: "Segna tutto come letto",
    theme: "Tema", units: "Unità",
    light: "Chiaro", dark: "Scuro", auto: "Auto", metric: "Metrico (kg, g, l, ml)",
    imperial: "Imperiale (lb, oz, fl oz)", changePassword: "Cambia password",
    currentPassword: "Password attuale", newPassword: "Nuova password",
    confirmPassword: "Conferma nuova password", updatePassword: "Aggiorna password",
    twoFactorAuth: "Autenticazione a due fattori", enable2FA: "Abilita 2FA",
    twoFactorAuthDesc: "Aggiungi un ulteriore livello di sicurezza al tuo account", enable: "Abilita",
    dangerZone: "Zona pericolosa", deleteAccount: "Elimina account",
    deleteAccountDesc: "Elimina permanentemente il tuo account e tutti i dati",
    recipeCategories: "Categorie ricette", saveChanges: "Salva modifiche", memberSince: "Membro dal",
    language: "Lingua", dutch: "Olandese", english: "Inglese",
    editDetails: "Modifica dettagli", employees: "Dipendenti",
    availableLanguages: "lingue disponibili", currentLanguage: "Lingua attuale", allLanguages: "Tutte le lingue",
    searchResults: "Risultati di ricerca", noLanguagesFound: "Nessuna lingua trovata per",
    searchLanguage: "Cerca lingua...", changeDetails: "Modifica dettagli",
    updatePersonalInfo: "Aggiorna le tue informazioni personali", personalData: "Dati personali",
    addressData: "Dati indirizzo", country: "Paese", postalCode: "CAP", street: "Via e numero",
    city: "Città", selectCountry: "Seleziona paese", saveChangesBtn: "Salva modifiche",
    chooseStrongPassword: "Scegli una nuova password sicura", choosePreferredLanguage: "Scegli la tua lingua preferita",
    loginToAccess: "Accedi per accedere",
    manageAccountSettings: "Gestisci il tuo account e le impostazioni", enterEmailAddress: "Inserisci il tuo indirizzo email",
    enterPassword: "Inserisci la tua password", name: "Nome", address: "Indirizzo",
    leaveEmptyPassword: "Lascia vuoto se non vuoi cambiare la password",
    confirmPasswordField: "Conferma password", noEmployeesYet: "Nessun dipendente aggiunto ancora",
    addEmployeesToCollaborate: "Aggiungi dipendenti per collaborare", editProfilePhoto: "Modifica foto profilo",
    zoom: "Zoom", accountInfo: "Informazioni account", adjustProfile: "Modifica il tuo profilo",
    chooseLanguage: "Scegli la tua lingua", changePasswordShort: "Cambia password", logoutFromAccount: "Esci dal tuo account",
    netherlands: "Paesi Bassi", belgium: "Belgio", germany: "Germania", france: "Francia",
    addEmployee: "Aggiungi dipendente", remove: "Rimuovi",
    noRecipesYet: "Non sono ancora state aggiunte ricette",
    startAddingFirstRecipe: "Inizia aggiungendo la tua prima ricetta!",
    addFirstRecipe: "Aggiungi prima ricetta", manageRecipeCollection: "Gestisci la tua collezione di ricette",
    loginToViewRecipes: "Accedi o crea un account per vedere le tue ricette.",
    createAccount: "Crea account",
    addRecipe: "Aggiungi ricetta", createNewRecipes: "Crea nuove ricette",
    loginToAddRecipes: "Accedi o crea un account per aggiungere ricette.",
    fillDetailsToAdd: "Compila i dettagli per aggiungere una nuova ricetta.",
    recipePhoto: "Foto della ricetta", pieces: "pezzi", persons: "persone", portion: "porzione",
    selectCategories: "Seleziona categorie", done: "Fatto", newCategory: "Nuova categoria...",
    saveIn: "Salva in", personalDatabase: "Database personale", businessDatabase: "Database aziendale", personalDatabaseOnly: "Solo database personale disponibile",
    bothDatabases: "Entrambi i database", chooseWhereToSave: "Scegli dove salvare la tua ricetta",
    preparationMethod: "Metodo di preparazione", step: "Passo", stepDescription: "Descrizione del passo",
    addStep: "Aggiungi passo", uploading: "Caricamento in corso...",
    enterIngredientName: "Inserisci un nome ingrediente", enterValidQuantity: "Inserisci una quantità valida",
    saveFailed: "Salvataggio fallito", uploadFailed: "Caricamento fallito", deleteCategory: "Eliminare categoria?",
    editCategory: "Modifica", changeFailed: "Modifica fallita", deleteFailed: "Eliminazione fallita",
    confirmDelete: "Conferma eliminazione",
    deleteRecipeConfirmation: "Sei sicuro di voler eliminare questa ricetta? Questa azione non può essere annullata.",
    recipeDeletedSuccessfully: "Ricetta eliminata con successo",
    deleting: "Eliminazione...",
    privateAccount: "Account privato",
    catVoorgerecht: "Antipasto", catTussengerecht: "Piatto intermedio", catHoofdgerecht: "Piatto principale",
    catDessert: "Dessert", catGroentegarnituur: "Contorno di verdure", catVlees: "Carne", catVis: "Pesce",
    catVegetarisch: "Vegetariano", catZetmeelgarnituur: "Contorno di amidi", catGebondenSauzen: "Salse legate",
    catKoudeSauzen: "Salse fredde", catSoepen: "Zuppe", catSalades: "Insalate", catBrood: "Pane", catDranken: "Bevande",
    chooseFile: "Scegli file", noFileSelected: "Nessun file selezionato",
    noPhoto: "Nessuna foto", noNewApplications: "Nessuna nuova richiesta",
    noPersonalRecipesFound: "Nessuna ricetta personale trovata",
    noPendingApplications: "Nessuna richiesta aziendale in sospeso",
    enterEmployeeEmail: "Inserisci l'email del dipendente", exampleEmail: "tu@email.it",
    examplePhone: "+39 333 123 4567", examplePostalCode: "00100", exampleStreet: "Via Esempio 123", exampleCity: "Città",
    pinUnlockTitle: "Blocco app",
    pinUnlockSubtitle: "Inserisci il PIN per continuare.",
    pinSetupQuestion: "Vuoi impostare un PIN?",
    pinSetupDescription:
      "La prossima volta che apri l’app su questo dispositivo basta il PIN (resti connesso). Puoi saltare.",
    pinEnterNew: "Scegli un PIN (4–6 cifre)",
    pinConfirmLabel: "Conferma il PIN",
    pinMismatch: "I PIN non coincidono.",
    pinWrong: "PIN errato. Riprova.",
    pinSkip: "Salta per ora",
    pinSetButton: "Salva PIN",
    pinDigitsHint: "Usa da 4 a 6 cifre.",
    pinLogoutLink: "Esci e usa un altro account",
    pinContinueButton: "Avanti",
    pinSubmitUnlock: "Sblocca",
    lockSetupTitle: "Come vuoi bloccare l’app?",
    lockSetupDescription: "Su questo dispositivo sblocca più velocemente — Face ID / impronta o PIN. Puoi saltare.",
    lockChooseBiometric: "Face ID / Touch ID / impronta",
    lockChooseBiometricHint: "Usa la biometria del telefono (dialogo di sistema).",
    lockChoosePin: "PIN dell’app",
    lockChoosePinHint: "PIN Gastro-Elite (4–6 cifre).",
    lockChoosePasswordOnly: "Solo password",
    lockChoosePasswordOnlyHint: "Nessun blocco extra su questo dispositivo.",
    lockBiometricUnavailable: "Biometria non disponibile su questo dispositivo.",
    lockBiometricSetupFailed: "Impossibile configurare la biometria.",
    lockBiometricCancelled: "Annullato.",
    lockUseBiometricUnlock: "Sblocca con Face ID / impronta",
    lockBiometricRegistering: "Segui il messaggio sullo schermo…",
    lockUnlockBiometricSubtitle: "Usa Face ID, Touch ID o impronta.",
    lockBiometricFailed: "Biometria non riuscita. Tocca per riprovare.",
    lockStorageUnavailable:
      "Memoria bloccata. Apri https://gastro-elite-app.vercel.app in Safari o Chrome.",
    emailVerifiedLoginHint: "Email verificata. Accedi per continuare.",
    lockSettingsSection: "Blocco app",
    lockSettingsManageTitle: "Face ID / PIN",
    lockSettingsManageDescription: "Proteggi l’accesso rapido su questo dispositivo.",
    lockSettingsCurrentNone: "Non impostato",
    lockSettingsCurrentBiometric: "Attivo: Face ID / impronta",
    lockSettingsCurrentPin: "Attivo: PIN",
    lockSettingsCardHint: "Tocca per configurare",
    lockSetupButton: "Configura",
    lockChangeButton: "Modifica",
    lockRemoveButton: "Rimuovi",
    lockRemoveConfirm: "Rimuovere il blocco su questo dispositivo?",
  },
  pt: {
    home: "Início", recipes: "Receitas", add: "Adicionar", account: "Conta", admin: "Admin",
    loading: "Carregando...", save: "Salvar", cancel: "Cancelar", edit: "Editar",
    delete: "Excluir", view: "Ver", back: "Voltar", login: "Entrar", logout: "Sair",
    close: "Fechar", search: "Pesquisar", new: "novo", pending: "Pendente", approved: "Aprovado",
    rejected: "Rejeitado", settings: "Configurações", allRightsReserved: "Todos os direitos reservados",
    goodMorning: "Bom dia", goodAfternoon: "Boa tarde", goodEvening: "Boa noite",
    welcome: "Bem-vindo,", goodLuck: "Boa sorte criando magia!",
    quickActions: "Ações rápidas", viewRecipes: "Ver receitas", newRecipe: "Nova receita",
    managePanel: "Painel de gestão", manageBusinessRecipes: "Gerencie suas receitas empresariais e funcionários",
    businessApplications: "Solicitações de empresas", forApproval: "Para aprovação",
    noOpenApplications: "Sem solicitações pendentes", moreApplications: "mais solicitações",
    viewAllApplications: "Ver todas as solicitações", tipOfTheDay: "Dica do dia",
    tipContent: "Use categorias para organizar suas receitas. Isso facilita encontrar receitas específicas.",
    welcomeTitle: "BEM-VINDO", emailAddress: "Endereço de e-mail", password: "Senha", yourPassword: "Sua senha",
    noAccount: "Não tem conta?", register: "Registrar", processing: "Processando...",
    loginFailed: "Falha no login. Verifique suas credenciais.",
    businessPendingApproval: "Por favor aguarde — seu registro de empresa deve ser aprovado pela Gastro-Elite. Isso pode levar até 24 horas.",
    businessRejected: "Seu registro de empresa foi rejeitado. Entre em contato com o suporte para mais informações.",
    tagline: "O cockpit inteligente para receitas, HACCP e planejamento",
    totalRecipes: "Total de receitas", categories: "Categorias", totalIngredients: "Total de ingredientes",
    avgIngredients: "Méd. ingredientes/receita", searchPlaceholder: "Pesquisar receitas ou ingredientes...",
    allCategories: "Todas as categorias",
    multipleCategoriesHint: "Várias categorias (mostrar receitas em pelo menos uma categoria selecionada).",
    otherRecipesLetter: "Outros",
    noRecipesFound: "Nenhuma receita encontrada",
    gridView: "Vista em grade", rowView: "Vista em linhas", alphabeticalView: "Vista alfabética",
    recipeViewShortGrid: "Grade", recipeViewShortRow: "Linhas", recipeViewShortAz: "A–Z",
    switchView: "Mudar vista",
    filter: "Filtro", allRecipes: "Todas as receitas", database: "Base de dados",
    employeeInvitation: "Convite recebido", accept: "Aceitar", decline: "Recusar",
    tryAdjustingSearch: "Tente ajustar seus critérios de pesquisa ou filtro",
    startAddingRecipe: "Comece adicionando sua primeira receita!", addNewRecipe: "Adicionar nova receita",
    recipeName: "Nome da receita", recipeNameRequired: "Nome da receita *", imageUrl: "URL da imagem",
    batchSize: "Tamanho do lote", servings: "Porções", ingredients: "Ingredientes", instructions: "Instruções",
    addIngredient: "Adicionar", quantity: "Quantidade", ingredientName: "Nome do ingrediente",
    saveRecipe: "Salvar receita", cancelRecipe: "Cancelar",
    batchSizeLabel: "Tamanho do lote:", servingsLabel: "Porções:", ingredientsLabel: "Ingredientes",
    instructionsLabel: "Instruções", editRecipe: "Editar receita", printRecipe: "Imprimir receita",
    deleteRecipe: "Excluir receita", noPhotoAvailable: "Nenhuma foto disponível",
    personalInformation: "Informações pessoais", companyInformation: "Informações da empresa",
    firstName: "Nome", lastName: "Sobrenome", email: "E-mail", phone: "Telefone",
    company: "Empresa", role: "Função", changePhoto: "Alterar foto", quickStats: "Estatísticas rápidas",
    notifications: "Notificações", preferences: "Preferências", security: "Segurança",
    statistics: "Estatísticas", profile: "Perfil", emailNotifications: "Notificações por e-mail",
    emailNotificationsDesc: "Receber notificações por e-mail", pushNotifications: "Notificações push",
    pushNotificationsDesc: "Receber notificações push no navegador", weeklyDigest: "Resumo semanal",
    weeklyDigestDesc: "Receba um resumo semanal da sua atividade",
    teamNotificationsTitle: "Notificações da equipa",
    teamNotificationsSubtitle: "Atualizações sobre a sua equipa",
    teamNotificationsEmpty: "Sem notificações novas",
    teamNotificationsMarkAllRead: "Marcar todas como lidas",
    theme: "Tema", units: "Unidades",
    light: "Claro", dark: "Escuro", auto: "Auto", metric: "Métrico (kg, g, l, ml)",
    imperial: "Imperial (lb, oz, fl oz)", changePassword: "Alterar senha",
    currentPassword: "Senha atual", newPassword: "Nova senha",
    confirmPassword: "Confirmar nova senha", updatePassword: "Atualizar senha",
    twoFactorAuth: "Autenticação de dois fatores", enable2FA: "Ativar 2FA",
    twoFactorAuthDesc: "Adicione uma camada extra de segurança à sua conta", enable: "Ativar",
    dangerZone: "Zona de perigo", deleteAccount: "Excluir conta",
    deleteAccountDesc: "Excluir permanentemente sua conta e todos os dados",
    recipeCategories: "Categorias de receitas", saveChanges: "Salvar alterações", memberSince: "Membro desde",
    language: "Idioma", dutch: "Holandês", english: "Inglês",
    editDetails: "Editar detalhes", employees: "Funcionários",
    availableLanguages: "idiomas disponíveis", currentLanguage: "Idioma atual", allLanguages: "Todos os idiomas",
    searchResults: "Resultados da pesquisa", noLanguagesFound: "Nenhum idioma encontrado para",
    searchLanguage: "Pesquisar idioma...", changeDetails: "Alterar detalhes",
    updatePersonalInfo: "Atualize suas informações pessoais", personalData: "Dados pessoais",
    addressData: "Dados de endereço", country: "País", postalCode: "CEP", street: "Rua e número",
    city: "Cidade", selectCountry: "Selecionar país", saveChangesBtn: "Salvar alterações",
    chooseStrongPassword: "Escolha uma nova senha forte", choosePreferredLanguage: "Escolha seu idioma preferido",
    loginToAccess: "Entre para acessar",
    manageAccountSettings: "Gerencie sua conta e configurações", enterEmailAddress: "Digite seu endereço de e-mail",
    enterPassword: "Digite sua senha", name: "Nome", address: "Endereço",
    leaveEmptyPassword: "Deixe vazio se não quiser alterar sua senha",
    confirmPasswordField: "Confirmar senha", noEmployeesYet: "Nenhum funcionário adicionado ainda",
    addEmployeesToCollaborate: "Adicione funcionários para colaborar", editProfilePhoto: "Editar foto do perfil",
    zoom: "Zoom", accountInfo: "Informações da conta", adjustProfile: "Ajustar seu perfil",
    chooseLanguage: "Escolha seu idioma", changePasswordShort: "Alterar senha", logoutFromAccount: "Sair da sua conta",
    netherlands: "Países Baixos", belgium: "Bélgica", germany: "Alemanha", france: "França",
    addEmployee: "Adicionar funcionário", remove: "Remover",
    noRecipesYet: "Ainda não foram adicionadas receitas",
    startAddingFirstRecipe: "Comece adicionando sua primeira receita!",
    addFirstRecipe: "Adicionar primeira receita", manageRecipeCollection: "Gerencie sua coleção de receitas",
    loginToViewRecipes: "Faça login ou crie uma conta para ver suas receitas.",
    createAccount: "Criar conta",
    addRecipe: "Adicionar receita", createNewRecipes: "Criar novas receitas",
    loginToAddRecipes: "Faça login ou crie uma conta para adicionar receitas.",
    fillDetailsToAdd: "Preencha os detalhes para adicionar uma nova receita.",
    recipePhoto: "Foto da receita", pieces: "peças", persons: "pessoas", portion: "porção",
    selectCategories: "Selecionar categorias", done: "Pronto", newCategory: "Nova categoria...",
    saveIn: "Salvar em", personalDatabase: "Banco de dados pessoal", businessDatabase: "Banco de dados empresarial", personalDatabaseOnly: "Apenas banco de dados pessoal disponível",
    bothDatabases: "Ambos os bancos de dados", chooseWhereToSave: "Escolha onde salvar sua receita",
    preparationMethod: "Método de preparo", step: "Passo", stepDescription: "Descrição do passo",
    addStep: "Adicionar passo", uploading: "Enviando...",
    enterIngredientName: "Digite um nome de ingrediente", enterValidQuantity: "Digite uma quantidade válida",
    saveFailed: "Falha ao salvar", uploadFailed: "Falha no envio", deleteCategory: "Excluir categoria?",
    editCategory: "Editar", changeFailed: "Falha ao alterar", deleteFailed: "Falha ao excluir",
    confirmDelete: "Confirmar exclusão",
    deleteRecipeConfirmation: "Tem certeza de que deseja excluir esta receita? Esta ação não pode ser desfeita.",
    recipeDeletedSuccessfully: "Receita excluída com sucesso",
    deleting: "Excluindo...",
    privateAccount: "Conta particular",
    catVoorgerecht: "Entrada", catTussengerecht: "Prato intermédio", catHoofdgerecht: "Prato principal",
    catDessert: "Sobremesa", catGroentegarnituur: "Guarnição de legumes", catVlees: "Carne", catVis: "Peixe",
    catVegetarisch: "Vegetariano", catZetmeelgarnituur: "Guarnição de amido", catGebondenSauzen: "Molhos encorpados",
    catKoudeSauzen: "Molhos frios", catSoepen: "Sopas", catSalades: "Saladas", catBrood: "Pão", catDranken: "Bebidas",
    chooseFile: "Escolher arquivo", noFileSelected: "Nenhum arquivo selecionado",
    noPhoto: "Sem foto", noNewApplications: "Sem novas solicitações",
    noPersonalRecipesFound: "Nenhuma receita pessoal encontrada",
    noPendingApplications: "Sem solicitações de empresa pendentes",
    enterEmployeeEmail: "Digite o e-mail do funcionário", exampleEmail: "voce@email.pt",
    examplePhone: "+351 912 345 678", examplePostalCode: "1000-001", exampleStreet: "Rua Exemplo 123", exampleCity: "Cidade",
    pinUnlockTitle: "Bloqueio da app",
    pinUnlockSubtitle: "Introduza o PIN para continuar.",
    pinSetupQuestion: "Quer definir um PIN?",
    pinSetupDescription:
      "Da próxima vez neste dispositivo basta o PIN (continua ligado). Pode ignorar por agora.",
    pinEnterNew: "Escolha um PIN (4–6 dígitos)",
    pinConfirmLabel: "Confirme o PIN",
    pinMismatch: "Os PINs não coincidem.",
    pinWrong: "PIN incorreto. Tente novamente.",
    pinSkip: "Saltar por agora",
    pinSetButton: "Guardar PIN",
    pinDigitsHint: "Use 4 a 6 dígitos.",
    pinLogoutLink: "Terminar sessão e usar outra conta",
    pinContinueButton: "Seguinte",
    pinSubmitUnlock: "Desbloquear",
    lockSetupTitle: "Como quer bloquear a app?",
    lockSetupDescription: "Neste dispositivo desbloqueie mais rápido — Face ID / impressão digital ou PIN. Pode ignorar.",
    lockChooseBiometric: "Face ID / Touch ID / impressão digital",
    lockChooseBiometricHint: "Usa a biometria do telemóvel (diálogo do sistema).",
    lockChoosePin: "PIN da app",
    lockChoosePinHint: "PIN Gastro-Elite (4–6 dígitos).",
    lockChoosePasswordOnly: "Apenas palavra-passe",
    lockChoosePasswordOnlyHint: "Sem bloqueio extra neste dispositivo.",
    lockBiometricUnavailable: "Biometria indisponível neste dispositivo.",
    lockBiometricSetupFailed: "Não foi possível configurar a biometria.",
    lockBiometricCancelled: "Cancelado.",
    lockUseBiometricUnlock: "Desbloquear com Face ID / impressão digital",
    lockBiometricRegistering: "Siga o aviso no ecrã…",
    lockUnlockBiometricSubtitle: "Use Face ID, Touch ID ou impressão digital.",
    lockBiometricFailed: "Biometria falhou. Toque para tentar novamente.",
    lockStorageUnavailable:
      "Armazenamento bloqueado. Abra https://gastro-elite-app.vercel.app no Safari ou Chrome.",
    emailVerifiedLoginHint: "E-mail verificado. Inicie sessão para continuar.",
    lockSettingsSection: "Bloqueio da app",
    lockSettingsManageTitle: "Face ID / PIN",
    lockSettingsManageDescription: "Proteja o acesso rápido neste dispositivo.",
    lockSettingsCurrentNone: "Não configurado",
    lockSettingsCurrentBiometric: "Ativo: Face ID / impressão digital",
    lockSettingsCurrentPin: "Ativo: PIN",
    lockSettingsCardHint: "Toque para configurar",
    lockSetupButton: "Configurar",
    lockChangeButton: "Alterar",
    lockRemoveButton: "Remover",
    lockRemoveConfirm: "Remover o bloqueio neste dispositivo?",
  },
  sq: {
    home: "Ballina", recipes: "Recetat", add: "Shto", account: "Llogaria", admin: "Admin",
    loading: "Duke u ngarkuar...", save: "Ruaj", cancel: "Anulo", edit: "Ndrysho",
    delete: "Fshi", view: "Shiko", back: "Kthehu", login: "Hyr", logout: "Dil",
    close: "Mbyll", search: "Kërko", new: "e re", pending: "Në pritje", approved: "Aprovuar",
    rejected: "Refuzuar", settings: "Cilësimet", allRightsReserved: "Të gjitha të drejtat e rezervuara",
    goodMorning: "Mirëmëngjes", goodAfternoon: "Mirëdita", goodEvening: "Mirëmbrëma",
    welcome: "Mirësevini,", goodLuck: "Paç fat në krijimin e magjisë!",
    quickActions: "Veprime të shpejta", viewRecipes: "Shiko recetat", newRecipe: "Recetë e re",
    managePanel: "Paneli i menaxhimit", manageBusinessRecipes: "Menaxhoni recetat e biznesit dhe punonjësit",
    businessApplications: "Aplikimet e biznesit", forApproval: "Për miratim",
    noOpenApplications: "Nuk ka aplikime të hapura", moreApplications: "më shumë aplikime",
    viewAllApplications: "Shiko të gjitha aplikimet", tipOfTheDay: "Këshilla e ditës",
    tipContent: "Përdorni kategori për të organizuar recetat tuaja. Kjo e bën më të lehtë gjetjen e recetave specifike.",
    welcomeTitle: "MIRËSEVINI", emailAddress: "Adresa e emailit", password: "Fjalëkalimi", yourPassword: "Fjalëkalimi juaj",
    noAccount: "Nuk keni llogari?", register: "Regjistrohu", processing: "Duke përpunuar...",
    loginFailed: "Hyrja dështoi. Kontrolloni kredencialet tuaja.",
    businessPendingApproval: "Ju lutemi prisni — regjistrimi i biznesit tuaj duhet të aprovohet nga Gastro-Elite. Kjo mund të zgjasë deri në 24 orë.",
    businessRejected: "Regjistrimi i biznesit tuaj është refuzuar. Kontaktoni mbështetjen për më shumë informacion.",
    tagline: "Kabina inteligjente për recetat, HACCP dhe planifikimin",
    totalRecipes: "Totali i recetave", categories: "Kategoritë", totalIngredients: "Totali i përbërësve",
    avgIngredients: "Mes. përbërës/recetë", searchPlaceholder: "Kërko receta ose përbërës...",
    allCategories: "Të gjitha kategoritë",
    multipleCategoriesHint: "Shumë kategori (shfaq recetat në të paktën një kategori të zgjedhur).",
    otherRecipesLetter: "Të tjera",
    noRecipesFound: "Nuk u gjetën receta",
    tryAdjustingSearch: "Provoni të rregulloni kriteret e kërkimit ose filtrit",
    gridView: "Pamje grilë", rowView: "Pamje rreshtash", alphabeticalView: "Pamje alfabetike",
    recipeViewShortGrid: "Grilë", recipeViewShortRow: "Rreshta", recipeViewShortAz: "A–Z",
    switchView: "Ndrysho pamjen",
    filter: "Filtër", allRecipes: "Të gjitha recetat", database: "Bazë e të dhënave",
    employeeInvitation: "Ftesë e marrë", accept: "Prano", decline: "Refuzo",
    startAddingRecipe: "Filloni duke shtuar recetën tuaj të parë!", addNewRecipe: "Shto recetë të re",
    recipeName: "Emri i recetës", recipeNameRequired: "Emri i recetës *", imageUrl: "URL e imazhit",
    batchSize: "Madhësia e grupit", servings: "Porcione", ingredients: "Përbërësit", instructions: "Udhëzimet",
    addIngredient: "Shto", quantity: "Sasia", ingredientName: "Emri i përbërësit",
    saveRecipe: "Ruaj recetën", cancelRecipe: "Anulo",
    batchSizeLabel: "Madhësia e grupit:", servingsLabel: "Porcione:", ingredientsLabel: "Përbërësit",
    instructionsLabel: "Udhëzimet", editRecipe: "Ndrysho recetën", printRecipe: "Printo recetën",
    deleteRecipe: "Fshi recetën", noPhotoAvailable: "Nuk ka foto të disponueshme",
    personalInformation: "Informacioni personal", companyInformation: "Informacioni i kompanisë",
    firstName: "Emri", lastName: "Mbiemri", email: "Email", phone: "Telefoni",
    company: "Kompania", role: "Roli", changePhoto: "Ndrysho foton", quickStats: "Statistikat e shpejta",
    notifications: "Njoftimet", preferences: "Preferencat", security: "Siguria",
    statistics: "Statistikat", profile: "Profili", emailNotifications: "Njoftimet me email",
    emailNotificationsDesc: "Merr njoftimet me email", pushNotifications: "Njoftimet push",
    pushNotificationsDesc: "Merr njoftimet push në shfletues", weeklyDigest: "Përmbledhja javore",
    weeklyDigestDesc: "Merr një përmbledhje javore të aktivitetit tuaj",
    teamNotificationsTitle: "Njoftime për ekipin",
    teamNotificationsSubtitle: "Përditësime për ekipin tuaj",
    teamNotificationsEmpty: "Asnjë njoftim i ri",
    teamNotificationsMarkAllRead: "Shëno të gjitha si të lexuara",
    theme: "Tema", units: "Njësitë",
    light: "E lehtë", dark: "E errët", auto: "Auto", metric: "Metrike (kg, g, l, ml)",
    imperial: "Imperiale (lb, oz, fl oz)", changePassword: "Ndrysho fjalëkalimin",
    currentPassword: "Fjalëkalimi aktual", newPassword: "Fjalëkalimi i ri",
    confirmPassword: "Konfirmo fjalëkalimin e ri", updatePassword: "Përditëso fjalëkalimin",
    twoFactorAuth: "Autentifikimi me dy faktorë", enable2FA: "Aktivizo 2FA",
    twoFactorAuthDesc: "Shtoni një shtresë shtesë sigurie në llogarinë tuaj", enable: "Aktivizo",
    dangerZone: "Zona e rrezikshme", deleteAccount: "Fshi llogarinë",
    deleteAccountDesc: "Fshi përgjithmonë llogarinë tuaj dhe të gjitha të dhënat",
    recipeCategories: "Kategoritë e recetave", saveChanges: "Ruaj ndryshimet", memberSince: "Anëtar që nga",
    language: "Gjuha", dutch: "Holandisht", english: "Anglisht",
    editDetails: "Ndrysho detajet", employees: "Punonjësit",
    availableLanguages: "gjuhë të disponueshme", currentLanguage: "Gjuha aktuale", allLanguages: "Të gjitha gjuhët",
    searchResults: "Rezultatet e kërkimit", noLanguagesFound: "Nuk u gjetën gjuhë për",
    searchLanguage: "Kërko gjuhën...", changeDetails: "Ndrysho detajet",
    updatePersonalInfo: "Përditësoni informacionin tuaj personal", personalData: "Të dhënat personale",
    addressData: "Të dhënat e adresës", country: "Vendi", postalCode: "Kodi postar", street: "Rruga dhe numri",
    city: "Qyteti", selectCountry: "Zgjidhni vendin", saveChangesBtn: "Ruaj ndryshimet",
    chooseStrongPassword: "Zgjidhni një fjalëkalim të ri të fortë", choosePreferredLanguage: "Zgjidhni gjuhën tuaj të preferuar",
    loginToAccess: "Hyni për të aksesuar",
    manageAccountSettings: "Menaxhoni llogarinë dhe cilësimet tuaja", enterEmailAddress: "Vendosni adresën tuaj të emailit",
    enterPassword: "Vendosni fjalëkalimin tuaj", name: "Emri", address: "Adresa",
    leaveEmptyPassword: "Lini bosh nëse nuk dëshironi të ndryshoni fjalëkalimin",
    confirmPasswordField: "Konfirmo fjalëkalimin", noEmployeesYet: "Ende nuk janë shtuar punonjës",
    addEmployeesToCollaborate: "Shtoni punonjës për të bashkëpunuar", editProfilePhoto: "Ndrysho foton e profilit",
    zoom: "Zoom", accountInfo: "Informacioni i llogarisë", adjustProfile: "Rregulloni profilin tuaj",
    chooseLanguage: "Zgjidhni gjuhën tuaj", changePasswordShort: "Ndrysho fjalëkalimin", logoutFromAccount: "Dilni nga llogaria juaj",
    netherlands: "Holandë", belgium: "Belgjikë", germany: "Gjermani", france: "Francë",
    addEmployee: "Shto punonjës", remove: "Hiq",
    noRecipesYet: "Ende nuk janë shtuar receta",
    startAddingFirstRecipe: "Filloni duke shtuar recetën tuaj të parë!",
    addFirstRecipe: "Shto recetën e parë", manageRecipeCollection: "Menaxhoni koleksionin tuaj të recetave",
    loginToViewRecipes: "Hyni ose krijoni një llogari për të parë recetat tuaja.",
    createAccount: "Krijo llogari",
    addRecipe: "Shto recetë", createNewRecipes: "Krijo receta të reja",
    loginToAddRecipes: "Hyni ose krijoni një llogari për të shtuar receta.",
    fillDetailsToAdd: "Plotësoni detajet për të shtuar një recetë të re.",
    recipePhoto: "Foto e recetës", pieces: "copë", persons: "persona", portion: "porcion",
    selectCategories: "Zgjidh kategoritë", done: "U krye", newCategory: "Kategori e re...",
    saveIn: "Ruaj në", personalDatabase: "Baza e të dhënave personale", businessDatabase: "Baza e të dhënave të biznesit", personalDatabaseOnly: "Vetëm baza e të dhënave personale e disponueshme",
    bothDatabases: "Të dyja bazat e të dhënave", chooseWhereToSave: "Zgjidhni ku të ruani recetën tuaj",
    preparationMethod: "Metoda e përgatitjes", step: "Hapi", stepDescription: "Përshkrimi i hapit",
    addStep: "Shto hap", uploading: "Duke ngarkuar...",
    enterIngredientName: "Vendosni emrin e përbërësit", enterValidQuantity: "Vendosni një sasi të vlefshme",
    saveFailed: "Ruajtja dështoi", uploadFailed: "Ngarkimi dështoi", deleteCategory: "Fshij kategorinë?",
    editCategory: "Ndrysho", changeFailed: "Ndryshimi dështoi", deleteFailed: "Fshirja dështoi",
    confirmDelete: "Konfirmo fshirjen",
    deleteRecipeConfirmation: "Jeni të sigurt që dëshironi të fshini këtë recetë? Ky veprim nuk mund të zhbëhet.",
    recipeDeletedSuccessfully: "Receta u fshi me sukses",
    deleting: "Duke fshirë...",
    privateAccount: "Llogari private",
    catVoorgerecht: "Antipastë", catTussengerecht: "Pjatë e ndërmjetme", catHoofdgerecht: "Pjata kryesore",
    catDessert: "Ëmbëlsirë", catGroentegarnituur: "Garniturë perimesh", catVlees: "Mish", catVis: "Peshk",
    catVegetarisch: "Vegjetarian", catZetmeelgarnituur: "Garniturë niseshteje", catGebondenSauzen: "Salca të trasha",
    catKoudeSauzen: "Salca të ftohta", catSoepen: "Supa", catSalades: "Sallata", catBrood: "Bukë", catDranken: "Pije",
    chooseFile: "Zgjidh skedarin", noFileSelected: "Asnjë skedar i zgjedhur",
    noPhoto: "Pa foto", noNewApplications: "Asnjë aplikim i ri",
    noPersonalRecipesFound: "Asnjë recetë personale e gjetur",
    noPendingApplications: "Asnjë aplikim biznesi në pritje",
    enterEmployeeEmail: "Vendosni emailin e punonjësit", exampleEmail: "ti@email.al",
    examplePhone: "+355 69 123 4567", examplePostalCode: "1001", exampleStreet: "Rruga Shembull 123", exampleCity: "Qyteti",
    pinUnlockTitle: "Kyçja e aplikacionit",
    pinUnlockSubtitle: "Shkruani PIN-in për të vazhduar.",
    pinSetupQuestion: "Dëshironi të vendosni një PIN?",
    pinSetupDescription:
      "Herën tjetër që hapni aplikacionin në këtë pajisje mjafton PIN-i (mbani sesionin). Mund ta anashkaloni.",
    pinEnterNew: "Zgjidhni një PIN (4–6 shifra)",
    pinConfirmLabel: "Konfirmoni PIN-in",
    pinMismatch: "PIN-et nuk përputhen.",
    pinWrong: "PIN i gabuar. Provoni përsëri.",
    pinSkip: "Anashkalo tani",
    pinSetButton: "Ruaj PIN-in",
    pinDigitsHint: "Përdorni 4 deri në 6 shifra.",
    pinLogoutLink: "Dil dhe përdor një llogari tjetër",
    pinContinueButton: "Vazhdo",
    pinSubmitUnlock: "Zhblloko",
    lockSetupTitle: "Si dëshironi ta kyçni aplikacionin?",
    lockSetupDescription: "Në këtë pajisje shkyçni më shpejt — Face ID / gjurmë gishtash ose PIN. Mund ta anashkaloni.",
    lockChooseBiometric: "Face ID / Touch ID / gjurmë gishtash",
    lockChooseBiometricHint: "Përdor biometrinë e telefonit (dialogu i sistemit).",
    lockChoosePin: "PIN i aplikacionit",
    lockChoosePinHint: "PIN Gastro-Elite (4–6 shifra).",
    lockChoosePasswordOnly: "Vetëm fjalëkalimi",
    lockChoosePasswordOnlyHint: "Pa kyçje shtesë në këtë pajisje.",
    lockBiometricUnavailable: "Biometria nuk është e disponueshme në këtë pajisje.",
    lockBiometricSetupFailed: "Konfigurimi i biometrisë dështoi.",
    lockBiometricCancelled: "Anuluar.",
    lockUseBiometricUnlock: "Shkyç me Face ID / gjurmë gishtash",
    lockBiometricRegistering: "Ndiqni njoftimin në ekran…",
    lockUnlockBiometricSubtitle: "Përdorni Face ID, Touch ID ose gjurmën e gishtit.",
    lockBiometricFailed: "Biometria dështoi. Prekni për të provuar përsëri.",
    lockStorageUnavailable:
      "Ruajtja është bllokuar. Hapni https://gastro-elite-app.vercel.app në Safari ose Chrome.",
    emailVerifiedLoginHint: "Emaili u verifikua. Hyni për të vazhduar.",
    lockSettingsSection: "Kyçja e aplikacionit",
    lockSettingsManageTitle: "Face ID / PIN",
    lockSettingsManageDescription: "Mbro qasjen e shpejtë në këtë pajisje.",
    lockSettingsCurrentNone: "Nuk është vendosur",
    lockSettingsCurrentBiometric: "Aktiv: Face ID / gjurmë gishtash",
    lockSettingsCurrentPin: "Aktiv: PIN",
    lockSettingsCardHint: "Prekni për të konfiguruar",
    lockSetupButton: "Vendos",
    lockChangeButton: "Ndrysho",
    lockRemoveButton: "Hiq",
    lockRemoveConfirm: "Hiq kyçjen në këtë pajisje?",
  },
};

// Get translations with fallback to English for unsupported languages
const getTranslations = (lang: string): Translations => {
  if (translations[lang]) {
    return translations[lang];
  }
  // Fallback to English for languages without full translations
  return translations.en;
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const preferredLanguage = (user as { preferredLanguage?: string } | null)?.preferredLanguage;
  const [language, setLanguage] = useState("nl");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window === "undefined") return;
    if (preferredLanguage && translations[preferredLanguage]) {
      setLanguage(preferredLanguage);
      localStorage.setItem("language", preferredLanguage);
      return;
    }
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, [user?.id, preferredLanguage]);

  const persistLanguage = useCallback(async (lang: string) => {
    if (!user) return;
    try {
      await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ preferredLanguage: lang }),
      });
    } catch {
      /* ignore */
    }
  }, [user]);

  const handleSetLanguage = (lang: string) => {
    if (!translations[lang]) return;
    setLanguage(lang);
    if (isClient && typeof window !== "undefined") {
      localStorage.setItem("language", lang);
    }
    void persistLanguage(lang);
  };

  const t = getTranslations(language);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}