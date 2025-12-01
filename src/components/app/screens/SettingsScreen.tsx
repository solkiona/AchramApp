// src/components/app/screens/SettingsScreen.tsx
import { ChevronLeft, Shield, User, CreditCard, Bell, Globe, HelpCircle, LogOut, ChevronRight } from 'lucide-react';

export default function SettingsScreen({ onBack, onShowProfile, onShowSecurity, onShowPayment, onShowNotifications, onShowLanguage, onShowHelp, onLogout }: { onBack: () => void; onShowProfile: () => void; onShowSecurity: () => void; onShowPayment: () => void; onShowNotifications: () => void; onShowLanguage: () => void; onShowHelp: () => void; onLogout: () => void }) {
  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col">
      {/* Header */}
      <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center">
        <button onClick={onBack} className="mr-4">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Account */}
        <div className="bg-achrams-bg-secondary rounded-xl border border-achrams-border">
          <h3 className="text-lg font-semibold px-4 py-3 text-achrams-text-primary">Account</h3>
          <button
            onClick={onShowProfile}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-achrams-bg-primary border-b border-achrams-border text-left"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-achrams-text-secondary" />
              <span>Edit Profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
          </button>
          <button
            onClick={onShowSecurity}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-achrams-bg-primary border-b border-achrams-border text-left"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-achrams-text-secondary" />
              <span>Security</span>
            </div>
            <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
          </button>
          <button
            onClick={onShowPayment}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-achrams-bg-primary text-left"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-achrams-text-secondary" />
              <span>Payment Methods</span>
            </div>
            <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
          </button>
        </div>

        {/* Preferences */}
        <div className="bg-achrams-bg-secondary rounded-xl border border-achrams-border">
          <h3 className="text-lg font-semibold px-4 py-3 text-achrams-text-primary">Preferences</h3>
          <button
            onClick={onShowNotifications}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-achrams-bg-primary border-b border-achrams-border text-left"
          >
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-achrams-text-secondary" />
              <span>Notifications</span>
            </div>
            <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
          </button>
          <button
            onClick={onShowLanguage}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-achrams-bg-primary text-left"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-achrams-text-secondary" />
              <span>Language</span>
            </div>
            <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
          </button>
        </div>

        {/* Support */}
        <div className="bg-achrams-bg-secondary rounded-xl border border-achrams-border">
          <h3 className="text-lg font-semibold px-4 py-3 text-achrams-text-primary">Support</h3>
          <button
            onClick={onShowHelp}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-achrams-bg-primary border-b border-achrams-border text-left"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-achrams-text-secondary" />
              <span>Help Center</span>
            </div>
            <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-red-50 text-left text-red-600"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5" />
              <span>Log Out</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}