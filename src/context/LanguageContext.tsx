"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface Translations {
  // Navigation
  home: string;
  recipes: string;
  add: string;
  account: string;
  
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
  
  // Home page
  welcome: string;
  goodLuck: string;
  
  // Recipes page
  totalRecipes: string;
  categories: string;
  totalIngredients: string;
  avgIngredients: string;
  searchPlaceholder: string;
  allCategories: string;
  noRecipesFound: string;
  tryAdjustingSearch: string;
  startAddingRecipe: string;
  addNewRecipe: string;
  
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
}

const translations: Record<string, Translations> = {
  nl: {
    // Navigation
    home: "Home",
    recipes: "Recepturen",
    add: "Toevoegen",
    account: "Account",
    
    // Common
    loading: "Laden...",
    save: "Opslaan",
    cancel: "Annuleren",
    edit: "Bewerken",
    delete: "Verwijderen",
    view: "Bekijken",
    back: "Terug",
    login: "Inloggen",
    logout: "Uitloggen",
    
    // Home page
    welcome: "Welkom,",
    goodLuck: "Veel succes met het creëren van magie!",
    
    // Recipes page
    totalRecipes: "Totaal Recepten",
    categories: "Categorieën",
    totalIngredients: "Totaal Ingrediënten",
    avgIngredients: "Gem. Ingrediënten/Recept",
    searchPlaceholder: "Zoek recepten of ingrediënten...",
    allCategories: "Alle Categorieën",
    noRecipesFound: "Geen recepten gevonden",
    tryAdjustingSearch: "Probeer uw zoek- of filtercriteria aan te passen",
    startAddingRecipe: "Begin met het toevoegen van uw eerste recept!",
    addNewRecipe: "Nieuw Recept Toevoegen",
    
    // Recipe form
    recipeName: "Recept Naam",
    recipeNameRequired: "Recept Naam *",
    imageUrl: "Afbeelding URL",
    batchSize: "Batch Grootte",
    servings: "Porties",
    ingredients: "Ingrediënten",
    instructions: "Instructies",
    addIngredient: "Toevoegen",
    quantity: "Hoeveelheid",
    ingredientName: "Naam ingrediënt",
    saveRecipe: "Recept Opslaan",
    cancelRecipe: "Annuleren",
    
    // Recipe detail
    batchSizeLabel: "Batch Grootte:",
    servingsLabel: "Porties:",
    ingredientsLabel: "Ingrediënten",
    instructionsLabel: "Instructies",
    editRecipe: "Recept Bewerken",
    printRecipe: "Recept Afdrukken",
    deleteRecipe: "Recept Verwijderen",
    noPhotoAvailable: "Geen foto beschikbaar",
    
    // Account page
    personalInformation: "Persoonlijke Informatie",
    companyInformation: "Bedrijfsinformatie",
    firstName: "Voornaam",
    lastName: "Achternaam",
    email: "E-mail",
    phone: "Telefoon",
    company: "Bedrijf",
    role: "Functie",
    changePhoto: "Foto Wijzigen",
    quickStats: "Snelle Statistieken",
    notifications: "Meldingen",
    preferences: "Voorkeuren",
    security: "Beveiliging",
    statistics: "Statistieken",
    profile: "Profiel",
    emailNotifications: "E-mail Meldingen",
    emailNotificationsDesc: "Ontvang meldingen via e-mail",
    pushNotifications: "Push Meldingen",
    pushNotificationsDesc: "Ontvang push meldingen in browser",
    weeklyDigest: "Wekelijks Overzicht",
    weeklyDigestDesc: "Ontvang een wekelijks overzicht van uw activiteit",
    theme: "Thema",
    units: "Eenheden",
    light: "Licht",
    dark: "Donker",
    auto: "Automatisch",
    metric: "Metrisch (kg, g, l, ml)",
    imperial: "Imperiaal (lb, oz, fl oz)",
    changePassword: "Wachtwoord Wijzigen",
    currentPassword: "Huidig Wachtwoord",
    newPassword: "Nieuw Wachtwoord",
    confirmPassword: "Bevestig Nieuw Wachtwoord",
    updatePassword: "Wachtwoord Bijwerken",
    twoFactorAuth: "Twee-Factor Authenticatie",
    enable2FA: "2FA Inschakelen",
    twoFactorAuthDesc: "Voeg een extra beveiligingslaag toe aan uw account",
    enable: "Inschakelen",
    dangerZone: "Gevarenzone",
    deleteAccount: "Account Verwijderen",
    deleteAccountDesc: "Permanent verwijderen van uw account en alle gegevens",
    recipeCategories: "Recept Categorieën",
    saveChanges: "Wijzigingen Opslaan",
    memberSince: "Lid sinds",
    language: "Taal",
    dutch: "Nederlands",
    english: "Engels",
  },
  en: {
    // Navigation
    home: "Home",
    recipes: "Recipes",
    add: "Add",
    account: "Account",
    
    // Common
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    view: "View",
    back: "Back",
    login: "Login",
    logout: "Logout",
    
    // Home page
    welcome: "Welcome,",
    goodLuck: "Good luck creating magic!",
    
    // Recipes page
    totalRecipes: "Total Recipes",
    categories: "Categories",
    totalIngredients: "Total Ingredients",
    avgIngredients: "Avg Ingredients/Recipe",
    searchPlaceholder: "Search recipes or ingredients...",
    allCategories: "All Categories",
    noRecipesFound: "No recipes found",
    tryAdjustingSearch: "Try adjusting your search or filter criteria",
    startAddingRecipe: "Start by adding your first recipe!",
    addNewRecipe: "Add New Recipe",
    
    // Recipe form
    recipeName: "Recipe Name",
    recipeNameRequired: "Recipe Name *",
    imageUrl: "Image URL",
    batchSize: "Batch Size",
    servings: "Servings",
    ingredients: "Ingredients",
    instructions: "Instructions",
    addIngredient: "Add",
    quantity: "Quantity",
    ingredientName: "Ingredient name",
    saveRecipe: "Save Recipe",
    cancelRecipe: "Cancel",
    
    // Recipe detail
    batchSizeLabel: "Batch Size:",
    servingsLabel: "Servings:",
    ingredientsLabel: "Ingredients",
    instructionsLabel: "Instructions",
    editRecipe: "Edit Recipe",
    printRecipe: "Print Recipe",
    deleteRecipe: "Delete Recipe",
    noPhotoAvailable: "No photo available",
    
    // Account page
    personalInformation: "Personal Information",
    companyInformation: "Company Information",
    firstName: "First Name",
    lastName: "Last Name",
    email: "Email",
    phone: "Phone",
    company: "Company",
    role: "Role",
    changePhoto: "Change Photo",
    quickStats: "Quick Stats",
    notifications: "Notifications",
    preferences: "Preferences",
    security: "Security",
    statistics: "Statistics",
    profile: "Profile",
    emailNotifications: "Email Notifications",
    emailNotificationsDesc: "Receive notifications via email",
    pushNotifications: "Push Notifications",
    pushNotificationsDesc: "Receive push notifications in browser",
    weeklyDigest: "Weekly Digest",
    weeklyDigestDesc: "Get a weekly summary of your activity",
    theme: "Theme",
    units: "Units",
    light: "Light",
    dark: "Dark",
    auto: "Auto",
    metric: "Metric (kg, g, l, ml)",
    imperial: "Imperial (lb, oz, fl oz)",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    updatePassword: "Update Password",
    twoFactorAuth: "Two-Factor Authentication",
    enable2FA: "Enable 2FA",
    twoFactorAuthDesc: "Add an extra layer of security to your account",
    enable: "Enable",
    dangerZone: "Danger Zone",
    deleteAccount: "Delete Account",
    deleteAccountDesc: "Permanently delete your account and all data",
    recipeCategories: "Recipe Categories",
    saveChanges: "Save Changes",
    memberSince: "Member since",
    language: "Language",
    dutch: "Dutch",
    english: "English",
  },
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState("nl"); // Default to Dutch
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load language from localStorage if available (only on client)
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem("language");
      if (savedLanguage && translations[savedLanguage]) {
        setLanguage(savedLanguage);
      }
    }
  }, []);

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem("language", lang);
    }
  };

  const t = translations[language] || translations.nl;

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
