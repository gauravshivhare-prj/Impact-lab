import React from 'react';
import {
  Home,
  Map,
  BarChart2,
  Droplet,
  Search,
  Database,
  FileText,
  BookOpen,
  Calendar,
  Info,
  ShieldAlert,
  X,
} from 'lucide-react';

export type NavItemKey =
  | 'overview'
  | 'map'
  | 'priorities'
  | 'risk'
  | 'quality'
  | 'evidence'
  | 'data-quality'
  | 'briefings'
  | 'methodology';

interface SidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  language: 'en' | 'hi';
}

interface NavItemDef {
  key: NavItemKey;
  labelEn: string;
  labelHi: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItemDef[] = [
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
    labelEn: 'Ghat Priorities',
    labelHi: 'घाट प्राथमिकताएं',
    icon: BarChart2,
  },
  {
    key: 'risk',
    labelEn: 'Risk Screening',
    labelHi: 'जोखिम स्क्रीनिंग',
    icon: ShieldAlert,
  },
  {
    key: 'quality',
    labelEn: 'Water Quality',
    labelHi: 'जल गुणवत्ता',
    icon: Droplet,
  },
  {
    key: 'evidence',
    labelEn: 'Evidence Explorer',
    labelHi: 'प्रमाण अन्वेषक',
    icon: Search,
  },
  {
    key: 'data-quality',
    labelEn: 'Data Quality',
    labelHi: 'डेटा गुणवत्ता',
    icon: Database,
  },
  {
    key: 'briefings',
    labelEn: 'Briefing Reports',
    labelHi: 'ब्रीफिंग रिपोर्ट',
    icon: FileText,
  },
  {
    key: 'methodology',
    labelEn: 'Methodology',
    labelHi: 'कार्यप्रणाली',
    icon: BookOpen,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  mobileOpen,
  onCloseMobile,
  language,
}) => {
  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 w-[260px] select-none">
      {/* Brand Header */}
      <div className="px-6 py-6 flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {/* Dual Wave Logo */}
          <div className="mt-0.5">
            <svg
              viewBox="0 0 36 32"
              fill="none"
              className="w-8 h-7 text-teal-600"
            >
              <path
                d="M3 10C7.5 5.5 12.5 14.5 17 10C21.5 5.5 26.5 14.5 31 10"
                stroke="#0d9488"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M3 20C7.5 15.5 12.5 24.5 17 20C21.5 15.5 26.5 24.5 31 20"
                stroke="#0d9488"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight text-xl leading-tight">
              GhatWatch
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
              VISARJAN GHAT WATCH
            </p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              BMC · Bhopal
            </p>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="p-1 rounded text-slate-400 hover:text-slate-600 lg:hidden"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3.5 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.key;
          const label = language === 'hi' ? item.labelHi : item.labelEn;

          return (
            <button
              key={item.key}
              onClick={() => {
                onSelectTab(item.key);
                if (mobileOpen) onCloseMobile();
              }}
              className={`w-full flex items-center px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
                isActive
                  ? 'bg-[#e8f5f3] text-[#0f766e] font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-[18px] h-[18px] mr-3.5 flex-shrink-0 ${
                  isActive ? 'text-[#0f766e]' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Historical Data & Disclaimer */}
      <div className="p-5 border-t border-slate-100 space-y-4">
        {/* Historical Data Item */}
        <div className="flex items-start space-x-3">
          <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs leading-tight">
            <span className="font-semibold text-slate-800 block">
              Historical Data
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              2023 – 2025
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              MPPCB Reports
            </span>
          </div>
        </div>

        {/* Disclaimer Item */}
        <div className="flex items-start space-x-3 pt-1">
          <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-slate-400 leading-snug">
            This is a historical analysis tool. Results do not establish current water quality.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-50">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
