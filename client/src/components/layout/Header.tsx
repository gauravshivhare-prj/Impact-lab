import React from 'react';
import { Menu, Globe, Calendar } from 'lucide-react';
import type { NavItemKey } from './Sidebar';

interface HeaderProps {
  currentTab: NavItemKey;
  onOpenMobile: () => void;
  language: 'en' | 'hi';
  onToggleLanguage: () => void;
}

const PAGE_META: Record<NavItemKey, { titleEn: string; titleHi: string; subtitleEn: string; subtitleHi: string }> = {
  overview: {
    titleEn: 'Water Quality Overview',
    titleHi: 'जल गुणवत्ता अवलोकन',
    subtitleEn: "Historical evidence to support immersion planning across Bhopal's ghats.",
    subtitleHi: 'भोपाल के घाटों पर विसर्जन योजना के सहयोग हेतु ऐतिहासिक साक्ष्य।',
  },
  priorities: {
    titleEn: 'Ghat Priorities & Risk Assessment',
    titleHi: 'घाट प्राथमिकताएं एवं जोखिम मूल्यांकन',
    subtitleEn: 'Explainable prioritization of seven immersion sites based on empirical threshold exceedances.',
    subtitleHi: 'मानक उल्लंघनों के आधार पर सात विसर्जन स्थलों की पारदर्शी वरीयता सूची।',
  },
  quality: {
    titleEn: 'Water Quality & Site Inspection',
    titleHi: 'जल गुणवत्ता एवं स्थल निरीक्षण',
    subtitleEn: 'Parameter-level measurements compared against CPCB Class B bathing benchmarks.',
    subtitleHi: 'सीपीसीबी क्लास-बी स्नान मानकों के विरुद्ध घटक-वार परीक्षण परिणाम।',
  },
  evidence: {
    titleEn: 'Evidence Explorer',
    titleHi: 'प्रमाण अन्वेषक',
    subtitleEn: 'Granular reading records directly traceable to official MPPCB annual reports.',
    subtitleHi: 'म.प्र. प्रदूषण नियंत्रण बोर्ड की आधिकारिक रिपोर्टों से सत्यापित एकल परीक्षण रिकॉर्ड।',
  },
  'data-quality': {
    titleEn: 'Data Quality & Coverage Auditing',
    titleHi: 'डेटा गुणवत्ता एवं कवरेज ऑडिट',
    subtitleEn: 'Audit of missing entries, detection limits (BDL/ND), and site naming confidence.',
    subtitleHi: 'अप्राप्त नमूनों, मापन सीमाओं (BDL/ND) एवं स्थल नामकरण विश्वसनीयता का विश्लेषण।',
  },
  briefings: {
    titleEn: 'Operational Briefing Reports',
    titleHi: 'परिचालन ब्रीफिंग रिपोर्ट',
    subtitleEn: 'Bilingual decision-support briefs formatted for municipal executive leadership.',
    subtitleHi: 'नगर निगम अधिकारियों हेतु द्विभाषी (हिंदी/अंग्रेजी) परिचालन रिपोर्ट।',
  },
  methodology: {
    titleEn: 'Methodology & Regulatory Context',
    titleHi: 'कार्यप्रणाली एवं विनियामक संदर्भ',
    subtitleEn: 'Deterministic scoring rules, Class B standards, and National Green Tribunal context.',
    subtitleHi: 'नियम-आधारित स्कोरिंग, क्लास-बी मानक एवं राष्ट्रीय हरित अधिकरण (NGT) दिशा-निर्देश।',
  },
};

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenMobile,
  language,
  onToggleLanguage,
}) => {
  const meta = PAGE_META[currentTab];
  const title = language === 'hi' ? meta.titleHi : meta.titleEn;
  const subtitle = language === 'hi' ? meta.subtitleHi : meta.subtitleEn;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
      <div className="px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobile}
            className="p-1.5 -ml-1.5 rounded-md text-slate-500 hover:text-slate-800 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right contextual controls */}
        <div className="flex items-center space-x-3">
          {/* Historical Period Badge */}
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono">2023–2025</span>
          </div>

          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-2.5 py-1 rounded border border-slate-300 transition-colors"
            title="Switch language (English / हिन्दी)"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
