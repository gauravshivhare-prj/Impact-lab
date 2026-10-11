import React from 'react';
import { Menu, Globe, Calendar, ChevronDown } from 'lucide-react';
import type { NavItemKey } from './Sidebar';

interface HeaderProps {
  currentTab: NavItemKey;
  onOpenMobile: () => void;
  language: 'en' | 'hi';
  onToggleLanguage: () => void;
}

const PAGE_META: Record<
  NavItemKey,
  { titleEn: string; titleHi: string; subtitleEn: string; subtitleHi: string }
> = {
  overview: {
    titleEn: 'Water Quality Overview',
    titleHi: 'जल गुणवत्ता अवलोकन',
    subtitleEn: "Historical evidence to support immersion planning across Bhopal's ghats.",
    subtitleHi: 'भोपाल के घाटों पर विसर्जन योजना के सहयोग हेतु ऐतिहासिक साक्ष्य।',
  },
  map: {
    titleEn: 'Ghat Geospatial Map & Locations',
    titleHi: 'घाट भू-स्थानिक मानचित्र एवं अवस्थिति',
    subtitleEn: 'Verified GPS coordinates, immersion infrastructure, and NGT regulatory containment layers.',
    subtitleHi: 'सत्यापित जीपीएस निर्देशांक, विसर्जन अधोसंरचना एवं एनजीटी विनियामक नियंत्रण स्तर।',
  },
  priorities: {
    titleEn: 'Ghat Priorities & Risk Assessment',
    titleHi: 'घाट प्राथमिकताएं एवं जोखिम मूल्यांकन',
    subtitleEn: 'Explainable prioritization of seven immersion sites based on empirical threshold exceedances.',
    subtitleHi: 'मानक उल्लंघनों के आधार पर सात विसर्जन स्थलों की पारदर्शी वरीयता सूची।',
  },
  risk: {
    titleEn: 'CPCB Risk Screening',
    titleHi: 'सीपीसीबी जोखिम स्क्रीनिंग',
    subtitleEn: 'Per-ghat screening of pH, dissolved oxygen and BOD, computed by the Python risk engine.',
    subtitleHi: 'पीएच, घुलित ऑक्सीजन और बीओडी की घाट-वार स्क्रीनिंग, पायथन जोखिम इंजन द्वारा।',
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
    <header className="px-6 sm:px-8 lg:px-10 pt-7 pb-4 bg-transparent">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start space-x-3">
          <button
            onClick={onOpenMobile}
            className="p-1.5 -ml-1.5 mt-1 rounded-md text-slate-500 hover:text-slate-800 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-[27px] font-bold text-slate-900 tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Right contextual controls matching screenshot */}
        <div className="flex items-center space-x-2.5 flex-shrink-0 self-start sm:self-center">
          {/* Historical Period Dropdown */}
          <button
            className="flex items-center space-x-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/90 shadow-2xs transition-colors"
            title="Monitoring Period"
          >
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono">2023 – 2025</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/90 shadow-2xs transition-colors"
            title="Switch language (English / हिंदी)"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
