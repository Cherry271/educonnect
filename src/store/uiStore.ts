import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";
export type Language = "en" | "fr";

export const translations = {
  en: {
    dashboard: "Dashboard",
    feed: "Social Feed",
    chat: "Chat",
    groups: "Academic Groups",
    assignments: "Assignments",
    calendar: "Calendar",
    aiTutor: "AI Tutor",
    analytics: "Analytics & Progress",
    settings: "Settings",
    admin: "Admin Console",
    parent: "Parent Portal",
    welcomeBack: "Welcome back",
    notifications: "Notifications",
    searchPlaceholder: "Search for topics, resources, or peers...",
    noNotifications: "No notifications yet.",
    accountSettings: "Account Settings",
    logoutSession: "Logout Session",
    loggedOutSuccess: "Logged out successfully",
    accessProhibited: "Access Prohibited",
    accessProhibitedDesc: "This page is not accessible under your current account role.",
    theme: "Theme",
    themeDesc: "EduConnect supports both light and dark modes",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    langRegion: "Language & Region",
    language: "Language",
    timezone: "Timezone",
    langDesc: "Set your preferred language and timezone",
    langNote: "Language and timezone preferences are saved locally and applied instantly.",
    displayDensity: "Display Density",
    densityDesc: "Adjust how compact or spacious the interface feels",
    compact: "Compact",
    compactDesc: "More content, less spacing",
    comfortable: "Comfortable",
    comfortableDesc: "Balanced spacing (default)",
    spacious: "Spacious",
    spaciousDesc: "Generous padding and whitespace",
    profileTab: "Profile Settings",
    securityTab: "Security Settings",
    notificationsTab: "Notifications Settings",
    appearanceTab: "Appearance",
    saveChanges: "Save Changes",
    saving: "Saving...",
    savedSuccess: "Settings saved successfully",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    passwordDesc: "Update your password to keep your account secure",
    notificationPreferences: "Notification Preferences",
    notificationDesc: "Choose what you want to be notified about",
    academicFeedUpToDate: "Your academic feed is up to date.",
    unreadNotification: "You have 1 unread notification.",
    unreadNotifications: "You have {count} unread notifications.",
  },
  fr: {
    dashboard: "Tableau de bord",
    feed: "Fil d'actualité",
    chat: "Discussion",
    groups: "Groupes académiques",
    assignments: "Devoirs",
    calendar: "Calendrier",
    aiTutor: "Tuteur IA",
    analytics: "Analyses & Progrès",
    settings: "Paramètres",
    admin: "Console d'administration",
    parent: "Portail parents",
    welcomeBack: "Bon retour",
    notifications: "Notifications",
    searchPlaceholder: "Rechercher des sujets, des ressources ou des pairs...",
    noNotifications: "Aucune notification pour le moment.",
    accountSettings: "Paramètres du compte",
    logoutSession: "Se déconnecter",
    loggedOutSuccess: "Déconnexion réussie",
    accessProhibited: "Accès interdit",
    accessProhibitedDesc: "Cette page n'est pas accessible avec le rôle actuel de votre compte.",
    theme: "Thème",
    themeDesc: "EduConnect prend en charge les modes clair et sombre",
    darkMode: "Mode sombre",
    lightMode: "Mode clair",
    langRegion: "Langue & Région",
    language: "Langue",
    timezone: "Fuseau horaire",
    langDesc: "Définissez votre langue et votre fuseau horaire préférés",
    langNote: "Les préférences de langue et de fuseau horaire sont enregistrées localement et appliquées instantanément.",
    displayDensity: "Densité d'affichage",
    densityDesc: "Ajustez la densité d'affichage de l'interface",
    compact: "Compact",
    compactDesc: "Plus de contenu, moins d'espace",
    comfortable: "Confortable",
    comfortableDesc: "Espacement équilibré (par défaut)",
    spacious: "Spacieux",
    spaciousDesc: "Espacement généreux",
    profileTab: "Paramètres du profil",
    securityTab: "Paramètres de sécurité",
    notificationsTab: "Paramètres de notifications",
    appearanceTab: "Apparence",
    saveChanges: "Enregistrer les modifications",
    saving: "Enregistrement...",
    savedSuccess: "Paramètres enregistrés avec succès",
    changePassword: "Modifier le mot de passe",
    currentPassword: "Mot de passe actuel",
    newPassword: "Nouveau mot de passe",
    confirmPassword: "Confirmer le mot de passe",
    passwordDesc: "Mettez à jour votre mot de passe pour sécuriser votre compte",
    notificationPreferences: "Préférences de notification",
    notificationDesc: "Choisissez ce dont vous souhaitez être notifié",
    academicFeedUpToDate: "Votre fil académique est à jour.",
    unreadNotification: "Vous avez 1 notification non lue.",
    unreadNotifications: "Vous avez {count} notifications non lues.",
  },
};

interface UIState {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "dark",
      language: "en",
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "light" ? "dark" : "light" })),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
    }),
    { name: "educonnect-ui-settings" }
  )
);

export function useTranslation() {
  const language = useUIStore((state) => state.language);
  const theme = useUIStore((state) => state.theme);
  const toggleTheme = useUIStore((state) => state.toggleTheme);
  const setTheme = useUIStore((state) => state.setTheme);
  const setLanguage = useUIStore((state) => state.setLanguage);

  const t = (key: keyof typeof translations.en, replacements?: Record<string, string | number>) => {
    let text = translations[language]?.[key] || translations.en[key] || String(key);
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return { t, language, theme, toggleTheme, setTheme, setLanguage };
}
