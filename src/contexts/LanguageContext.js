import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Language translations
const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    tasks: 'Tasks',
    groups: 'Groups',
    settings: 'Settings',
    profile: 'Profile',
    
    // Settings
    applicationSettings: 'Application Settings',
    profileSettings: 'Profile Settings',
    privacySettings: 'Privacy Settings',
    notificationSettings: 'Notification Settings',
    securitySettings: 'Security Settings',
    theme: 'Theme',
    language: 'Language',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    saveChanges: 'Save Changes',
    settingsUpdatedSuccessfully: 'Settings updated successfully!',
    currentSettings: 'Current Settings',
    
    // Profile Settings
    fullName: 'Full Name',
    emailAddress: 'Email Address',
    
    // Privacy Settings
    profileVisibility: 'Profile Visibility',
    activityStatus: 'Activity Status',
    public: 'Public',
    private: 'Private',
    onlyFriends: 'Only Friends',
    showWhenActive: 'Show when active',
    hideMyActivity: 'Hide my activity',
    
    // Notification Settings
    emailNotifications: 'Email Notifications',
    inAppNotifications: 'In-App Notifications',
    allNotifications: 'All Notifications',
    onlyMentions: 'Only Mentions',
    onlyDirectMessages: 'Only Direct Messages',
    none: 'None',
    
    // Security Settings
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    changePassword: 'Change Password',
    passwordMismatch: 'New password and confirmation do not match',
    
    // Task Manager
    taskManager: 'Task Manager',
    createNewTask: 'Create New Task',
    taskTitle: 'Task Title',
    description: 'Description',
    dueDate: 'Due Date',
    priority: 'Priority',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    createTask: 'Create Task',
    
    // Dashboard Navigation
    overview: 'Overview',
    home: 'Home',
    chat: 'Chat',
    groupManagement: 'Group Management',
    taskManager: 'Task Manager',
    notes: 'Notes',
    videoChat: 'Video Chat',
    youtube: 'YouTube',
    notifications: 'Notifications',
    projectReport: 'Project Report',
    
    // Dashboard Content
    welcome: 'Welcome',
    recentActivity: 'Recent Activity',
    quickActions: 'Quick Actions',
    myGroups: 'My Groups',
    myTasks: 'My Tasks',
    upcomingEvents: 'Upcoming Events',
    
    // Group Management
    createGroup: 'Create Group',
    joinGroup: 'Join Group',
    groupName: 'Group Name',
    groupDescription: 'Group Description',
    members: 'Members',
    inviteMembers: 'Invite Members',
    
    // Task Manager (Extended)
    noTasks: 'No tasks available',
    taskCreated: 'Task created successfully',
    taskUpdated: 'Task updated successfully',
    taskDeleted: 'Task deleted successfully',
    taskTitleRequired: 'Task title is required',
    dueDateRequired: 'Due date is required',
    dueDatePastError: 'Due date cannot be in the past',
    enterTaskTitle: 'Enter task title',
    optionalDescription: 'Optional description...',
    creating: 'Creating...',
    due: 'Due',
    
    // Common
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    refresh: 'Refresh',
  },
  es: {
    // Navigation
    dashboard: 'Panel de Control',
    tasks: 'Tareas',
    groups: 'Grupos',
    settings: 'Configuración',
    profile: 'Perfil',
    
    // Settings
    applicationSettings: 'Configuración de Aplicación',
    profileSettings: 'Configuración de Perfil',
    privacySettings: 'Configuración de Privacidad',
    notificationSettings: 'Configuración de Notificaciones',
    securitySettings: 'Configuración de Seguridad',
    theme: 'Tema',
    language: 'Idioma',
    lightMode: 'Modo Claro',
    darkMode: 'Modo Oscuro',
    saveChanges: 'Guardar Cambios',
    settingsUpdatedSuccessfully: '¡Configuración actualizada exitosamente!',
    currentSettings: 'Configuración Actual',
    
    // Profile Settings
    fullName: 'Nombre Completo',
    emailAddress: 'Dirección de Correo',
    
    // Privacy Settings
    profileVisibility: 'Visibilidad del Perfil',
    activityStatus: 'Estado de Actividad',
    public: 'Público',
    private: 'Privado',
    onlyFriends: 'Solo Amigos',
    showWhenActive: 'Mostrar cuando esté activo',
    hideMyActivity: 'Ocultar mi actividad',
    
    // Notification Settings
    emailNotifications: 'Notificaciones por Correo',
    inAppNotifications: 'Notificaciones en la App',
    allNotifications: 'Todas las Notificaciones',
    onlyMentions: 'Solo Menciones',
    onlyDirectMessages: 'Solo Mensajes Directos',
    none: 'Ninguna',
    
    // Security Settings
    currentPassword: 'Contraseña Actual',
    newPassword: 'Nueva Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    changePassword: 'Cambiar Contraseña',
    passwordMismatch: 'La nueva contraseña y la confirmación no coinciden',
    
    // Task Manager
    taskManager: 'Gestor de Tareas',
    createNewTask: 'Crear Nueva Tarea',
    taskTitle: 'Título de Tarea',
    description: 'Descripción',
    dueDate: 'Fecha de Vencimiento',
    priority: 'Prioridad',
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    createTask: 'Crear Tarea',
    
    // Dashboard Navigation
    overview: 'Resumen',
    home: 'Inicio',
    chat: 'Chat',
    groupManagement: 'Gestión de Grupos',
    taskManager: 'Gestor de Tareas',
    notes: 'Notas',
    videoChat: 'Video Chat',
    youtube: 'YouTube',
    notifications: 'Notificaciones',
    projectReport: 'Reporte de Proyecto',
    
    // Dashboard Content
    welcome: 'Bienvenido',
    recentActivity: 'Actividad Reciente',
    quickActions: 'Acciones Rápidas',
    myGroups: 'Mis Grupos',
    myTasks: 'Mis Tareas',
    upcomingEvents: 'Próximos Eventos',
    
    // Group Management
    createGroup: 'Crear Grupo',
    joinGroup: 'Unirse al Grupo',
    groupName: 'Nombre del Grupo',
    groupDescription: 'Descripción del Grupo',
    members: 'Miembros',
    inviteMembers: 'Invitar Miembros',
    
    // Task Manager (Extended)
    noTasks: 'No hay tareas disponibles',
    taskCreated: 'Tarea creada exitosamente',
    taskUpdated: 'Tarea actualizada exitosamente',
    taskDeleted: 'Tarea eliminada exitosamente',
    taskTitleRequired: 'El título de la tarea es obligatorio',
    dueDateRequired: 'La fecha de vencimiento es obligatoria',
    dueDatePastError: 'La fecha de vencimiento no puede estar en el pasado',
    enterTaskTitle: 'Ingrese el título de la tarea',
    optionalDescription: 'Descripción opcional...',
    creating: 'Creando...',
    due: 'Vence',
    
    // Common
    loading: 'Cargando...',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar',
    delete: 'Eliminar',
    create: 'Crear',
    update: 'Actualizar',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    refresh: 'Actualizar',
  },
  fr: {
    // Navigation
    dashboard: 'Tableau de Bord',
    tasks: 'Tâches',
    groups: 'Groupes',
    settings: 'Paramètres',
    profile: 'Profil',
    
    // Settings
    applicationSettings: 'Paramètres d\'Application',
    profileSettings: 'Paramètres de Profil',
    privacySettings: 'Paramètres de Confidentialité',
    notificationSettings: 'Paramètres de Notification',
    securitySettings: 'Paramètres de Sécurité',
    theme: 'Thème',
    language: 'Langue',
    lightMode: 'Mode Clair',
    darkMode: 'Mode Sombre',
    saveChanges: 'Enregistrer les Modifications',
    settingsUpdatedSuccessfully: 'Paramètres mis à jour avec succès!',
    currentSettings: 'Paramètres Actuels',
    
    // Profile Settings
    fullName: 'Nom Complet',
    emailAddress: 'Adresse E-mail',
    
    // Privacy Settings
    profileVisibility: 'Visibilité du Profil',
    activityStatus: 'Statut d\'Activité',
    public: 'Public',
    private: 'Privé',
    onlyFriends: 'Amis Seulement',
    showWhenActive: 'Afficher quand actif',
    hideMyActivity: 'Masquer mon activité',
    
    // Notification Settings
    emailNotifications: 'Notifications E-mail',
    inAppNotifications: 'Notifications dans l\'App',
    allNotifications: 'Toutes les Notifications',
    onlyMentions: 'Mentions Seulement',
    onlyDirectMessages: 'Messages Directs Seulement',
    none: 'Aucune',
    
    // Security Settings
    currentPassword: 'Mot de Passe Actuel',
    newPassword: 'Nouveau Mot de Passe',
    confirmPassword: 'Confirmer le Mot de Passe',
    changePassword: 'Changer le Mot de Passe',
    passwordMismatch: 'Le nouveau mot de passe et la confirmation ne correspondent pas',
    
    // Task Manager
    taskManager: 'Gestionnaire de Tâches',
    createNewTask: 'Créer une Nouvelle Tâche',
    taskTitle: 'Titre de la Tâche',
    description: 'Description',
    dueDate: 'Date d\'Échéance',
    priority: 'Priorité',
    low: 'Faible',
    medium: 'Moyen',
    high: 'Élevé',
    createTask: 'Créer une Tâche',
    
    // Dashboard Navigation
    overview: 'Aperçu',
    home: 'Accueil',
    chat: 'Chat',
    groupManagement: 'Gestion de Groupe',
    taskManager: 'Gestionnaire de Tâches',
    notes: 'Notes',
    videoChat: 'Chat Vidéo',
    youtube: 'YouTube',
    notifications: 'Notifications',
    projectReport: 'Rapport de Projet',
    
    // Dashboard Content
    welcome: 'Bienvenue',
    recentActivity: 'Activité Récente',
    quickActions: 'Actions Rapides',
    myGroups: 'Mes Groupes',
    myTasks: 'Mes Tâches',
    upcomingEvents: 'Événements à Venir',
    
    // Group Management
    createGroup: 'Créer un Groupe',
    joinGroup: 'Rejoindre le Groupe',
    groupName: 'Nom du Groupe',
    groupDescription: 'Description du Groupe',
    members: 'Membres',
    inviteMembers: 'Inviter des Membres',
    
    // Task Manager (Extended)
    noTasks: 'Aucune tâche disponible',
    taskCreated: 'Tâche créée avec succès',
    taskUpdated: 'Tâche mise à jour avec succès',
    taskDeleted: 'Tâche supprimée avec succès',
    taskTitleRequired: 'Le titre de la tâche est obligatoire',
    dueDateRequired: 'La date d\'échéance est obligatoire',
    dueDatePastError: 'La date d\'échéance ne peut pas être dans le passé',
    enterTaskTitle: 'Entrez le titre de la tâche',
    optionalDescription: 'Description optionnelle...',
    creating: 'Création...',
    due: 'Échéance',
    
    // Common
    loading: 'Chargement...',
    save: 'Enregistrer',
    cancel: 'Annuler',
    edit: 'Modifier',
    delete: 'Supprimer',
    create: 'Créer',
    update: 'Mettre à jour',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    refresh: 'Actualiser',
  },
  de: {
    // Navigation
    dashboard: 'Dashboard',
    tasks: 'Aufgaben',
    groups: 'Gruppen',
    settings: 'Einstellungen',
    profile: 'Profil',
    
    // Settings
    applicationSettings: 'Anwendungseinstellungen',
    profileSettings: 'Profil-Einstellungen',
    privacySettings: 'Datenschutz-Einstellungen',
    notificationSettings: 'Benachrichtigungs-Einstellungen',
    securitySettings: 'Sicherheits-Einstellungen',
    theme: 'Design',
    language: 'Sprache',
    lightMode: 'Heller Modus',
    darkMode: 'Dunkler Modus',
    saveChanges: 'Änderungen Speichern',
    settingsUpdatedSuccessfully: 'Einstellungen erfolgreich aktualisiert!',
    currentSettings: 'Aktuelle Einstellungen',
    
    // Profile Settings
    fullName: 'Vollständiger Name',
    emailAddress: 'E-Mail-Adresse',
    
    // Privacy Settings
    profileVisibility: 'Profil-Sichtbarkeit',
    activityStatus: 'Aktivitätsstatus',
    public: 'Öffentlich',
    private: 'Privat',
    onlyFriends: 'Nur Freunde',
    showWhenActive: 'Anzeigen wenn aktiv',
    hideMyActivity: 'Meine Aktivität verbergen',
    
    // Notification Settings
    emailNotifications: 'E-Mail-Benachrichtigungen',
    inAppNotifications: 'In-App-Benachrichtigungen',
    allNotifications: 'Alle Benachrichtigungen',
    onlyMentions: 'Nur Erwähnungen',
    onlyDirectMessages: 'Nur Direktnachrichten',
    none: 'Keine',
    
    // Security Settings
    currentPassword: 'Aktuelles Passwort',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Passwort Bestätigen',
    changePassword: 'Passwort Ändern',
    passwordMismatch: 'Neues Passwort und Bestätigung stimmen nicht überein',
    
    // Task Manager
    taskManager: 'Aufgabenmanager',
    createNewTask: 'Neue Aufgabe Erstellen',
    taskTitle: 'Aufgabentitel',
    description: 'Beschreibung',
    dueDate: 'Fälligkeitsdatum',
    priority: 'Priorität',
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    createTask: 'Aufgabe Erstellen',
    
    // Dashboard Navigation
    overview: 'Übersicht',
    home: 'Startseite',
    chat: 'Chat',
    groupManagement: 'Gruppenverwaltung',
    taskManager: 'Aufgabenmanager',
    notes: 'Notizen',
    videoChat: 'Video-Chat',
    youtube: 'YouTube',
    notifications: 'Benachrichtigungen',
    projectReport: 'Projektbericht',
    
    // Dashboard Content
    welcome: 'Willkommen',
    recentActivity: 'Letzte Aktivität',
    quickActions: 'Schnellaktionen',
    myGroups: 'Meine Gruppen',
    myTasks: 'Meine Aufgaben',
    upcomingEvents: 'Bevorstehende Ereignisse',
    
    // Group Management
    createGroup: 'Gruppe Erstellen',
    joinGroup: 'Gruppe Beitreten',
    groupName: 'Gruppenname',
    groupDescription: 'Gruppenbeschreibung',
    members: 'Mitglieder',
    inviteMembers: 'Mitglieder Einladen',
    
    // Task Manager (Extended)
    noTasks: 'Keine Aufgaben verfügbar',
    taskCreated: 'Aufgabe erfolgreich erstellt',
    taskUpdated: 'Aufgabe erfolgreich aktualisiert',
    taskDeleted: 'Aufgabe erfolgreich gelöscht',
    taskTitleRequired: 'Aufgabentitel ist erforderlich',
    dueDateRequired: 'Fälligkeitsdatum ist erforderlich',
    dueDatePastError: 'Fälligkeitsdatum kann nicht in der Vergangenheit liegen',
    enterTaskTitle: 'Aufgabentitel eingeben',
    optionalDescription: 'Optionale Beschreibung...',
    creating: 'Erstellen...',
    due: 'Fällig',
    
    // Common
    loading: 'Laden...',
    save: 'Speichern',
    cancel: 'Abbrechen',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    create: 'Erstellen',
    update: 'Aktualisieren',
    search: 'Suchen',
    filter: 'Filtern',
    sort: 'Sortieren',
    refresh: 'Aktualisieren',
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);

  // Load language from user settings on app start
  useEffect(() => {
    const loadUserLanguage = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await api.get('/settings/application');
          const userLanguage = response.data.user?.application?.language || 'en';
          setLanguage(userLanguage);
          console.log('Loaded user language:', userLanguage);
        }
      } catch (error) {
        console.error('Error loading user language:', error);
        // Default to English if error
        setLanguage('en');
      } finally {
        setLoading(false);
      }
    };

    loadUserLanguage();
  }, []);

  const updateLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    console.log('Language updated to:', newLanguage);
  };

  const t = (key) => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      updateLanguage, 
      t, // translation function
      loading 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};