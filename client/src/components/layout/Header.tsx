import React, { useState, useRef, useEffect } from 'react';
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
  Check,
} from 'lucide-react';
import type { NavItemKey } from './Sidebar';

export interface YearOption {
  value: string;
  labelEn: string;
  labelHi: string;
  subEn: string;
  subHi: string;
  badgeEn?: string;
  badgeHi?: string;
}

export const YEAR_OPTIONS: YearOption[] = [
  {
    value: 'all',
    labelEn: '2023 – 2025',
    labelHi: '2023 – 2025',
    subEn: 'All monitoring years (Ganesh & Durga)',
    subHi: 'सभी निगरानी वर्ष (गणेश एवं दुर्गा)',
    badgeEn: 'All Years',
    badgeHi: 'सभी वर्ष',
  },
  {
    value: '2025',
    labelEn: '2025 Reports',
    labelHi: '2025 रिपोर्ट्स',
    subEn: 'Ganesh Visarjan monitoring dataset',
    subHi: 'गणेश विसर्जन निगरानी डेटा',
    badgeEn: 'Latest',
    badgeHi: 'नवीनतम',
  },
  {
    value: '2024',
    labelEn: '2024 Reports',
    labelHi: '2024 रिपोर्ट्स',
    subEn: 'Ganesh & Durga Visarjan monitoring',
    subHi: 'गणेश एवं दुर्गा विसर्जन निगरानी',
    badgeEn: 'Complete',
    badgeHi: 'पूर्ण',
  },
  {
    value: '2023',
    labelEn: '2023 Reports',
    labelHi: '2023 रिपोर्ट्स',
    subEn: 'Baseline monitoring dataset',
    subHi: 'आधारभूत (बेसलाइन) निगरानी डेटा',
    badgeEn: 'Baseline',
    badgeHi: 'बेसलाइन',
  },
];

interface HeaderProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  language: 'en' | 'hi';
  onToggleLanguage: () => void;
  selectedYear?: string;
  onSelectYear?: (year: string) => void;
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
  selectedYear,
  onSelectYear,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [internalSelectedYear, setInternalSelectedYear] = useState('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeYear = selectedYear ?? internalSelectedYear;
  const currentOption =
    YEAR_OPTIONS.find((opt) => opt.value === activeYear) || YEAR_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsYearDropdownOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsYearDropdownOpen(false);
      }
    };

    if (isYearDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isYearDropdownOpen]);

  const handleSelectYearOption = (val: string) => {
    setInternalSelectedYear(val);
    onSelectYear?.(val);
    setIsYearDropdownOpen(false);
  };

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
          {/* Year Range Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsYearDropdownOpen((prev) => !prev)}
              aria-haspopup="listbox"
              aria-expanded={isYearDropdownOpen}
              className={`flex items-center space-x-1.5 text-xs font-semibold rounded-xl px-3 py-2 shadow-2xs transition-all border ${
                isYearDropdownOpen
                  ? 'bg-teal-50/90 text-teal-900 border-teal-300 ring-2 ring-teal-500/20'
                  : 'text-slate-700 bg-white hover:bg-slate-50 border-slate-200/90'
              }`}
              title={
                language === 'hi'
                  ? `निगरानी अवधि: ${currentOption.labelHi}`
                  : `Monitoring Period: ${currentOption.labelEn}`
              }
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono">
                {language === 'hi' ? currentOption.labelHi : currentOption.labelEn}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 ml-0.5 transition-transform duration-200 ${
                  isYearDropdownOpen ? 'rotate-180 text-teal-600' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Popup */}
            {isYearDropdownOpen && (
              <div
                role="listbox"
                className="absolute right-0 top-full mt-1.5 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-900/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {language === 'hi' ? 'निगरानी अवधि' : 'Monitoring Period'}
                  </span>
                  <span className="text-[10px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                    MPPCB Data
                  </span>
                </div>

                <div className="p-1 space-y-0.5">
                  {YEAR_OPTIONS.map((opt) => {
                    const isSelected = opt.value === activeYear;
                    return (
                      <button
                        key={opt.value}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => handleSelectYearOption(opt.value)}
                        className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-start justify-between gap-2 ${
                          isSelected
                            ? 'bg-teal-50 text-teal-900 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold">
                              {language === 'hi' ? opt.labelHi : opt.labelEn}
                            </span>
                            {opt.badgeEn && (
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                  isSelected
                                    ? 'bg-teal-200/70 text-teal-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {language === 'hi' ? opt.badgeHi : opt.badgeEn}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                            {language === 'hi' ? opt.subHi : opt.subEn}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {language === 'hi'
                      ? 'आधिकारिक मध्य प्रदेश प्रदूषण नियंत्रण बोर्ड (MPPCB) विसर्जन रिपोर्ट'
                      : 'Official MPPCB Immersion Monitoring Reports'}
                  </p>
                </div>
              </div>
            )}
          </div>

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

          {/* Year Selector in mobile drawer */}
          <div className="pt-2 pb-1 border-t border-slate-100 mt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 px-1">
              {language === 'hi' ? 'निगरानी अवधि' : 'Monitoring Period'}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {YEAR_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    handleSelectYearOption(opt.value);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                    opt.value === activeYear
                      ? 'bg-teal-50 text-teal-900 border border-teal-200 font-semibold'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100 font-medium'
                  }`}
                >
                  {language === 'hi' ? opt.labelHi : opt.labelEn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

