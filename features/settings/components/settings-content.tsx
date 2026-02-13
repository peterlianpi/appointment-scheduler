"use client";

import { Separator } from "@/components/ui/separator";
import {
  useSettings,
  ProfileSettings,
  SecuritySettings,
  ActiveSessions,
  PreferencesSettings,
  AppointmentSettings,
  EmailSettings,
} from "@/features/settings";

export function SettingsContent() {
  const {
    sessions,
    isLoadingSessions,
    isLoadingPrefs,
    localPrefs,
    defaultDuration,
    bufferTime,
    isRefreshing,
    isSaving,
    isSavingProfile,
    isSavingAppointment,
    fullName,
    email,
    setFullName,
    setEmail,
    setDefaultDuration,
    setBufferTime,
    handlePreferenceChange,
    handleSavePreferences,
    handleSaveProfile,
    handleSaveAppointmentSettings,
    handleRefresh,
    handleSignOutAll,
    signOutSession,
  } = useSettings();

  return (
    <div className="p-0">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Separator />

        {/* Profile Settings */}
        <ProfileSettings
          fullName={fullName}
          email={email}
          isLoadingSession={false}
          isSavingProfile={isSavingProfile}
          onFullNameChange={setFullName}
          onEmailChange={setEmail}
          onSave={handleSaveProfile}
        />

        {/* Security Settings */}
        <SecuritySettings />

        {/* Active Sessions */}
        <ActiveSessions
          sessions={sessions}
          isLoadingSessions={isLoadingSessions}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onSignOutSession={signOutSession}
          onSignOutAll={handleSignOutAll}
        />

        {/* Notification Settings */}
        <PreferencesSettings
          localPrefs={localPrefs}
          isLoadingPrefs={isLoadingPrefs}
          isSaving={isSaving}
          onPreferenceChange={handlePreferenceChange}
          onSave={handleSavePreferences}
        />

        {/* Appointment Settings */}
        <AppointmentSettings
          defaultDuration={defaultDuration}
          bufferTime={bufferTime}
          isSavingAppointment={isSavingAppointment}
          onDefaultDurationChange={setDefaultDuration}
          onBufferTimeChange={setBufferTime}
          onSave={handleSaveAppointmentSettings}
        />

        {/* Email Settings */}
        <EmailSettings />
      </div>
    </div>
  );
}
