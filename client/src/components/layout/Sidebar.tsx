import React from 'react';
import {
  LayoutDashboard,
  AlertTriangle,
  Droplets,
  Search,
  Database,
  FileText,
  BookOpen,
  X,
} from 'lucide-react';

export type NavItemKey =
  | 'overview'
  | 'priorities'
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
    icon: LayoutDashboard,
  },
  {
    key: 'priorities',
    labelEn: 'Ghat Priorities',
    labelHi: 'घाट प्राथमिकताएं',
    icon: AlertTriangle,
  },
  {
    key: 'quality',
    labelEn: 'Water Quality',
    labelHi: 'जल गुणवत्ता',
    icon: Droplets,
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
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 select-none">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-700"></span>
            <span className="font-semibold text-slate-900 tracking-tight text-base">
              GhatWatch
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">
            {language === 'hi' ? 'विसर्जन घाट वॉच · बीएमसी' : 'Visarjan Ghat Watch · BMC'}
          </p>
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
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors text-left ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 mr-3 flex-shrink-0 ${
                  isActive ? 'text-teal-700' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Context Badge */}
      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="text-[11px] text-slate-500 leading-relaxed">
          <span className="font-medium text-slate-700 block mb-0.5">
            {language === 'hi' ? 'ऐतिहासिक रिकॉर्ड्स' : 'Historical Evidence'}
          </span>
          {language === 'hi'
            ? '2023–2025 · म.प्र. प्रदूषण नियंत्रण बोर्ड'
            : '2023–2025 · MPPCB Reports'}
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
