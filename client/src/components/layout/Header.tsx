import React, { useState } from 'react';
import {
  Globe,
  Calendar,
  ChevronDown,
  Home,
  Map,
  BarChart2,
  Shield,
  Droplet,
  Search,
  FileText,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import type { NavItemKey } from './Sidebar';

interface HeaderProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  language: 'en' | 'hi';
  onToggleLanguage: () => void;
}

interface NavItemDef {
  key: NavItemKey;
  labelEn: string;
  labelHi: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOP_NAV_ITEMS: NavItemDef[] = [
  {
    key: 'overview',
    labelEn: 'Overview',
    labelHi: 'अवलोकन',
    icon: Home,
  },
  {
    key: 'map',
    labelEn: 'Ghat Map',
    labelHi: 'घाट मानचित्र',
    icon: Map,
  },
  {
    key: 'priorities',
    labelEn: 'Priorities',
    labelHi: 'प्राथमिकताएं',
    icon: BarChart2,
  },
  {
    key: 'risk',
    labelEn: 'Risk Screening',
    labelHi: 'जोखिम स्क्रीनिंग',
    icon: Shield,
  },
  {
    key: 'quality',
    labelEn: 'Water Quality',
    labelHi: 'जल गुणवत्ता',
    icon: Droplet,
  },
  {
    key: 'evidence',
    labelEn: 'Evidence',
    labelHi: 'साक्ष्य',
    icon: Search,
  },
  {
    key: 'briefings',
    labelEn: 'Reports',
    labelHi: 'रिपोर्ट्स',
    icon: FileText,
  },
  {
    key: 'methodology',
    labelEn: 'Methodology',
    labelHi: 'कार्यप्रणाली',
    icon: BookOpen,
  },
];

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  language,
  onToggleLanguage,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Brand Identity */}
        <div
          onClick={() => onSelectTab('overview')}
          className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group"
          title="Ghatरक्षक - Home Overview"
        >
          {/* Government of Madhya Pradesh / MPSeDC logo */}
          <img
            src="/images/mp-mpsedc-logo.jpg"
            alt="Government of Madhya Pradesh and MPSeDC"
            className="h-9 sm:h-10 w-auto object-contain"
            width={480}
            height={230}
          />
          <div>
            <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              Ghatरक्षक
            </div>
            <div className="text-[11px] text-slate-400 font-medium tracking-wide">
              BMC • Bhopal
            </div>
          </div>
        </div>

        {/* Center: Top Pill Navigation Bar (Desktop) */}
        <nav className="hidden lg:flex items-center bg-slate-100/90 p-1 rounded-full border border-slate-200/70 shadow-2xs">
          {TOP_NAV_ITEMS.map((item) => {
            const isActive =
              currentTab === item.key ||
              (item.key === 'briefings' && currentTab === 'briefings') ||
              (item.key === 'risk' && (currentTab === 'risk' || currentTab === 'data-quality'));

            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-800 border border-teal-200/90 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}

              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-500'}`} />
                <span>{language === 'hi' ? item.labelHi : item.labelEn}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Year selector & Language button */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Year Range Button */}
          <button
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 shadow-2xs transition-colors"
            title="Monitoring Period 2023–2025"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono">2023 – 2025</span>
            <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
          </button>

          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-2 shadow-2xs transition-colors"
            title="Switch Language"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (screens < lg) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {TOP_NAV_ITEMS.map((item) => {
            const isActive =
              currentTab === item.key ||
              (item.key === 'briefings' && currentTab === 'briefings') ||
              (item.key === 'risk' && (currentTab === 'risk' || currentTab === 'data-quality'));
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectTab(item.key);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 text-slate-500" />
                <span>{language === 'hi' ? item.labelHi : item.labelEn}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
