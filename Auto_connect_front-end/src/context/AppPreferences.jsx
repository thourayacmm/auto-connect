import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getPreferencesApi, updatePreferencesApi } from "../services/preferencesApi";
import { applyDomTranslations } from "../utils/autoTranslate";
import {
  CHILD_LEVEL_STORAGE_KEY,
  CHILD_PICTOGRAM_SIZE_STORAGE_KEY,
  CHILD_SUGGESTIONS_STORAGE_KEY,
  CHILD_THEME_STORAGE_KEY,
  CHILD_VOICE_STORAGE_KEY,
  GRID_STORAGE_KEY,
  LANGUAGE_STORAGE_KEY,
} from "../utils/constants";

const AppPreferencesContext = createContext(null);

const translations = {
  fr: {
    brandTagline: "CAA douce, accessible et evolutive",
    navLanguage: "Langue",
    navGrid: "Grille",
    navLogin: "Se connecter",
    modalLoginTitle: "Connexion",
    modalLanguageTitle: "Choisissez votre langue",
    modalLanguageSubtitle: "Choose your language",
    modalGridTitle: "Choisissez votre grille",
    modalGridSubtitle: "Choisissez votre taille de grille",
    gridApply: "Appliquer la grille",
    gridHelp: "La grille choisie sera appliquee aux interfaces enfant.",
    loginTitle: "Auto Connect",
    loginSubtitle: "Connecte-toi avec un compte cree dans l'application.",
    loginEmail: "Email",
    loginPassword: "Mot de passe",
    loginRoleSection: "Voir les comptes par role",
    loginAccountsFor: "Comptes disponibles pour",
    loginButton: "Connexion",
    loginError: "Compte introuvable. Verifie l'email et le mot de passe.",
    loginChildCodeError: "Code enfant incorrect. Verifie votre code.",
    navbarSubtitle: "Communication augmentee, douce et guidee",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
    closeWindow: "Fermer la fenetre",
    logout: "Deconnexion",
    logoutConfirmTitle: "Confirmation de deconnexion",
    logoutConfirmText:
      "Veux-tu vraiment te deconnecter ? Si tu confirmes, tu seras redirige vers la page d'accueil.",
    logoutStay: "Non, rester connecte",
    logoutLeave: "Oui, se deconnecter",
    welcomeTitle: "Bienvenue",
    welcomeText: "La connexion a bien reussi. Tu es maintenant connecte dans l'espace",
    continue: "Continuer",
    landingBadge: "Plateforme educative CAA pour enfants TSA",
    landingHero:
      "Auto Connect aide les enfants a communiquer avec des pictogrammes et l'intelligence artificielle",
    landingLead:
      "Une experience moderne pensee pour la demonstration, l'accompagnement familial et le suivi therapeutique.",
    landingDemo: "Demarrer la demo",
    landingServicesButton: "Voir les services",
    landingFeaturesTitle: "Fonctionnalites principales",
    landingFeaturesLead: "Un frontend pret pour brancher plus tard des API REST et JWT.",
    landingRolesTitle: "Des interfaces distinctes par role",
    landingRolesLead:
      "Chaque espace reflete les besoins de l'enfant, du parent, du therapeute et de l'administrateur.",
    landingAboutTitle: "A propos d'Auto Connect",
    landingAbout1:
      "Auto Connect est une plateforme web de communication alternative et augmentee, pensee pour aider les enfants ayant des troubles de la parole a s'exprimer avec des pictogrammes, des phrases vocalisees et des parcours progressifs.",
    landingAbout2:
      "Le frontend est organise pour offrir une experience differente selon les roles, avec une couche IA visible pour les recommandations et l'analyse.",
    landingServicesTitle: "Services",
    landingServicesLead: "Des outils clairs, doux et modulaires pour la demonstration du projet.",
    landingContactTitle: "Contact",
    footerAbout: "A propos",
    footerServices: "Services",
    footerContact: "Contact",
    childQuickHelpTitle: "Aide rapide",
    childQuickHelpText:
      "Clique sur les images pour construire ta phrase, puis appuie sur ecouter.",
    childSearchTitle: "Rechercher un pictogramme",
    childSearchPlaceholder: "Ex: manger, maman, maison...",
    roleAdmin: "Administrateur",
    roleTherapist: "Therapeute",
    roleParent: "Parent",
    roleChild: "Enfant",
    navDashboard: "Dashboard",
    navUsers: "Therapeute",
    navPermissions: "Permissions",
    navPictogramDatabase: "Base pictogrammes",
    navAccessRequests: "Demandes d'acces",
    navPatients: "Patients",
    navFollowedChildren: "Enfants suivis",
    navScenarios: "Scenarios",
    navLevels: "Niveaux",
    navPictograms: "Pictogrammes",
    navReports: "Rapports IA",
    navChildSession: "Session enfant",
    navProgress: "Progression",
    navChildHistory: "Historique",
    navSettings: "Parametres",
    navAssistant: "Assistant IA",
    navHome: "Accueil",
    navCommunicate: "Communiquer",
    navSearch: "Rechercher",
    navListen: "Ecouter",
    navTraining: "Scenarios",
    gridSmall: "Petite",
    gridMedium: "Moyenne",
    gridLarge: "Grande",
    gridSmallDesc: "Grille 4x4 pour un vocabulaire essentiel",
    gridMediumDesc: "Grille 7x5 recommandee pour la plupart des enfants",
    gridLargeDesc: "Grille 10x6 pour plus de vocabulaire visible",
    recommended: "Recommandee",
  },
  en: {
    brandTagline: "Gentle, accessible and evolving AAC",
    navLanguage: "Language",
    navGrid: "Grid",
    navLogin: "Log in",
    modalLoginTitle: "Login",
    modalLanguageTitle: "Choose your language",
    modalLanguageSubtitle: "Choose your language",
    modalGridTitle: "Choose your grid",
    modalGridSubtitle: "Choose your grid size",
    gridApply: "Apply selected grid",
    gridHelp: "The selected grid will be applied to child interfaces.",
    loginTitle: "Auto Connect",
    loginSubtitle: "Log in with an account created in the app.",
    loginEmail: "Email",
    loginPassword: "Password",
    loginRoleSection: "Browse accounts by role",
    loginAccountsFor: "Available accounts for",
    loginButton: "Log in",
    loginError: "Account not found. Check the email and password.",
    loginChildCodeError: "Incorrect child code. Please check your code.",
    navbarSubtitle: "Augmented communication, calm and guided",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    closeWindow: "Close window",
    logout: "Log out",
    logoutConfirmTitle: "Logout confirmation",
    logoutConfirmText:
      "Do you really want to log out? If you confirm, you will be redirected to the home page.",
    logoutStay: "No, stay connected",
    logoutLeave: "Yes, log out",
    welcomeTitle: "Welcome",
    welcomeText: "Login successful. You are now connected to the",
    continue: "Continue",
    landingBadge: "Educational AAC platform for autistic children",
    landingHero:
      "Auto Connect helps children communicate with pictograms and artificial intelligence",
    landingLead:
      "A modern experience designed for demo use, family support and therapeutic follow-up.",
    landingDemo: "Start demo",
    landingServicesButton: "View services",
    landingFeaturesTitle: "Key features",
    landingFeaturesLead: "A frontend ready for future REST API and JWT integration.",
    landingRolesTitle: "Distinct interfaces by role",
    landingRolesLead:
      "Each area reflects the needs of the child, parent, therapist and administrator.",
    landingAboutTitle: "About Auto Connect",
    landingAbout1:
      "Auto Connect is an augmentative and alternative communication web platform designed to help children with speech disorders express themselves with pictograms, spoken phrases and progressive learning journeys.",
    landingAbout2:
      "The frontend is organized to provide a different experience for each role, with a visible AI layer for recommendations and analysis.",
    landingServicesTitle: "Services",
    landingServicesLead: "Clear, calm and modular tools for the project demonstration.",
    landingContactTitle: "Contact",
    footerAbout: "About",
    footerServices: "Services",
    footerContact: "Contact",
    childQuickHelpTitle: "Quick help",
    childQuickHelpText: "Tap the images to build your sentence, then press listen.",
    childSearchTitle: "Search for a pictogram",
    childSearchPlaceholder: "Ex: eat, mom, home...",
    roleAdmin: "Administrator",
    roleTherapist: "Therapist",
    roleParent: "Parent",
    roleChild: "Child",
    navDashboard: "Dashboard",
    navUsers: "Therapist",
    navPermissions: "Permissions",
    navPictogramDatabase: "Pictogram database",
    navAccessRequests: "Access requests",
    navPatients: "Patients",
    navFollowedChildren: "Followed children",
    navScenarios: "Scenarios",
    navLevels: "Levels",
    navPictograms: "Pictograms",
    navReports: "AI reports",
    navChildSession: "Child session",
    navProgress: "Progress",
    navChildHistory: "History",
    navSettings: "Settings",
    navAssistant: "AI assistant",
    navHome: "Home",
    navCommunicate: "Communicate",
    navSearch: "Search",
    navListen: "Listen",
    navTraining: "Scenarios",
    gridSmall: "Small",
    gridMedium: "Medium",
    gridLarge: "Large",
    gridSmallDesc: "4x4 grid for essential vocabulary",
    gridMediumDesc: "7x5 grid recommended for most children",
    gridLargeDesc: "10x6 grid for more visible vocabulary",
    recommended: "Recommended",
  },
};

const gridOptions = {
  small: { childGridClass: "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4" },
  medium: { childGridClass: "grid grid-cols-3 gap-4 md:grid-cols-4 xl:grid-cols-5" },
  large: { childGridClass: "grid grid-cols-4 gap-3 md:grid-cols-5 xl:grid-cols-6" },
};

const childThemes = {
  sky: {
    name: "Bleu doux",
    boardClass: "bg-gradient-to-br from-sky-50 to-indigo-50",
    previewClass: "bg-sky-100",
  },
  mint: {
    name: "Vert calme",
    boardClass: "bg-gradient-to-br from-emerald-50 to-teal-50",
    previewClass: "bg-emerald-100",
  },
  peach: {
    name: "Peche",
    boardClass: "bg-gradient-to-br from-orange-50 to-rose-50",
    previewClass: "bg-orange-100",
  },
  lilac: {
    name: "Lavande",
    boardClass: "bg-gradient-to-br from-violet-50 to-fuchsia-50",
    previewClass: "bg-violet-100",
  },
};

const voiceOptions = {
  fr: { label: "Francais", lang: "fr-FR" },
  en: { label: "English", lang: "en-US" },
};

export function AppPreferencesProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => localStorage.getItem(LANGUAGE_STORAGE_KEY) || "fr",
  );
  const [gridSize, setGridSizeState] = useState(
    () => localStorage.getItem(GRID_STORAGE_KEY) || "medium",
  );
  const [childTheme, setChildThemeState] = useState(
    () => localStorage.getItem(CHILD_THEME_STORAGE_KEY) || "sky",
  );
  const [childVoice, setChildVoiceState] = useState(
    () => localStorage.getItem(CHILD_VOICE_STORAGE_KEY) || "fr",
  );
  const [childPictogramSize, setChildPictogramSizeState] = useState(
    () => localStorage.getItem(CHILD_PICTOGRAM_SIZE_STORAGE_KEY) || "4",
  );
  const [childSuggestions, setChildSuggestionsState] = useState(
    () => localStorage.getItem(CHILD_SUGGESTIONS_STORAGE_KEY) || "on",
  );
  const [childLevel, setChildLevelState] = useState(
    () => localStorage.getItem(CHILD_LEVEL_STORAGE_KEY) || "Debutant",
  );
  const [preferencesStatus, setPreferencesStatus] = useState("local");

  const applyPreferences = (preferences) => {
    if (!preferences) return;
    if (preferences.language) {
      setLanguageState(preferences.language);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, preferences.language);
    }
    if (preferences.gridSize) {
      setGridSizeState(preferences.gridSize);
      localStorage.setItem(GRID_STORAGE_KEY, preferences.gridSize);
    }
    if (preferences.childTheme) {
      setChildThemeState(preferences.childTheme);
      localStorage.setItem(CHILD_THEME_STORAGE_KEY, preferences.childTheme);
    }
    if (preferences.childVoice) {
      setChildVoiceState(preferences.childVoice);
      localStorage.setItem(CHILD_VOICE_STORAGE_KEY, preferences.childVoice);
    }
    if (preferences.childPictogramSize) {
      setChildPictogramSizeState(String(preferences.childPictogramSize));
      localStorage.setItem(CHILD_PICTOGRAM_SIZE_STORAGE_KEY, String(preferences.childPictogramSize));
    }
    if (preferences.childSuggestions) {
      setChildSuggestionsState(preferences.childSuggestions);
      localStorage.setItem(CHILD_SUGGESTIONS_STORAGE_KEY, preferences.childSuggestions);
    }
    if (preferences.childLevel) {
      setChildLevelState(preferences.childLevel);
      localStorage.setItem(CHILD_LEVEL_STORAGE_KEY, preferences.childLevel);
    }
  };

  useEffect(() => {
    getPreferencesApi()
      .then((preferences) => {
        applyPreferences(preferences);
        setPreferencesStatus("backend");
      })
      .catch(() => setPreferencesStatus("local"));
  }, []);

  useEffect(() => {
    const translate = () => applyDomTranslations(document.body, language);
    translate();

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(translate);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title", "alt"],
    });

    return () => observer.disconnect();
  }, [language]);

  const currentPreferences = () => ({
    language,
    gridSize,
    childTheme,
    childVoice,
    childPictogramSize,
    childSuggestions,
    childLevel,
  });

  const savePreferences = async () => {
    const preferences = await updatePreferencesApi(currentPreferences());
    applyPreferences(preferences);
    setPreferencesStatus("backend");
    return preferences;
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage: (next) => {
        setLanguageState(next);
        localStorage.setItem(LANGUAGE_STORAGE_KEY, next);
      },
      gridSize,
      setGridSize: (next) => {
        setGridSizeState(next);
        localStorage.setItem(GRID_STORAGE_KEY, next);
      },
      childTheme,
      setChildTheme: (next) => {
        setChildThemeState(next);
        localStorage.setItem(CHILD_THEME_STORAGE_KEY, next);
      },
      childVoice,
      setChildVoice: (next) => {
        setChildVoiceState(next);
        localStorage.setItem(CHILD_VOICE_STORAGE_KEY, next);
      },
      childPictogramSize,
      setChildPictogramSize: (next) => {
        setChildPictogramSizeState(next);
        localStorage.setItem(CHILD_PICTOGRAM_SIZE_STORAGE_KEY, next);
      },
      childSuggestions,
      setChildSuggestions: (next) => {
        setChildSuggestionsState(next);
        localStorage.setItem(CHILD_SUGGESTIONS_STORAGE_KEY, next);
      },
      childLevel,
      setChildLevel: (next) => {
        setChildLevelState(next);
        localStorage.setItem(CHILD_LEVEL_STORAGE_KEY, next);
      },
      savePreferences,
      preferencesStatus,
      t: (key) => translations[language]?.[key] || translations.fr[key] || key,
      gridOptions,
      childThemes,
      voiceOptions,
    }),
    [childLevel, childPictogramSize, childSuggestions, childTheme, childVoice, gridSize, language, preferencesStatus],
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);

  if (!context) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }

  return context;
}
