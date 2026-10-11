import React, { useState, useMemo } from 'react';
import { FlaskConical, AlertTriangle, CheckCircle2, Info, ArrowRight, RefreshCw } from 'lucide-react';
import { dataService } from '../services/dataService';

interface SimulatorPageProps {
  language: 'en' | 'hi';
}

interface ComparisonResult {
  parameter: string;
  inputValue: number;
  threshold: string;
  passes: boolean;
  exceedanceAmount?: number;
  message: string;
  messageHi: string;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ language }) => {
  const [selectedGhat, setSelectedGhat] = useState<string>('');
  const [doValue, setDoValue] = useState<string>('');
  const [bodValue, setBodValue] = useState<string>('');
  const [phValue, setPhValue] = useState<string>('');
  const [showResults, setShowResults] = useState(false);

  const ghats = useMemo(() => {
    const rankings = dataService.getSiteRankings();
    return rankings.map((r) => r.site);
  }, []);

  const historicalData = useMemo(() => {
    if (!selectedGhat) return null;
    const measurements = dataService.getMeasurementsForSite(selectedGhat);

    const getStats = (param: string) => {
      const filtered = measurements.filter(
        (m) => m.parameter.toLowerCase() === param.toLowerCase() && m.numericValue !== null
      );
      if (filtered.length === 0) return null;
      const values = filtered.map((m) => m.numericValue!);
      return {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    };

    return {
      do: getStats('Dissolved oxygen'),
      bod: getStats('BOD'),
      ph: getStats('pH'),
    };
  }, [selectedGhat]);

  const comparisonResults = useMemo((): ComparisonResult[] => {
    if (!showResults) return [];

    const results: ComparisonResult[] = [];
    const doNum = parseFloat(doValue);
    const bodNum = parseFloat(bodValue);
    const phNum = parseFloat(phValue);

    if (!isNaN(doNum)) {
      const passes = doNum >= 5.0;
      const exceedance = passes ? 0 : 5.0 - doNum;
      results.push({
        parameter: 'Dissolved Oxygen',
        inputValue: doNum,
        threshold: '>= 5.0 mg/l',
        passes,
        exceedanceAmount: exceedance,
        message: passes
          ? `Meets CPCB Class B standard (${doNum.toFixed(2)} >= 5.0 mg/l)`
          : `Below minimum by ${exceedance.toFixed(2)} mg/l (${doNum.toFixed(2)} < 5.0 mg/l)`,
        messageHi: passes
          ? `CPCB Class B मानक पूरा (${doNum.toFixed(2)} >= 5.0 mg/l)`
          : `न्यूनतम से ${exceedance.toFixed(2)} mg/l कम (${doNum.toFixed(2)} < 5.0 mg/l)`,
      });
    }

    if (!isNaN(bodNum)) {
      const passes = bodNum <= 3.0;
      const exceedance = passes ? 0 : bodNum - 3.0;
      results.push({
        parameter: 'BOD',
        inputValue: bodNum,
        threshold: '<= 3.0 mg/l',
        passes,
        exceedanceAmount: exceedance,
        message: passes
          ? `Meets CPCB Class B standard (${bodNum.toFixed(2)} <= 3.0 mg/l)`
          : `Exceeds maximum by ${exceedance.toFixed(2)} mg/l (${bodNum.toFixed(2)} > 3.0 mg/l)`,
        messageHi: passes
          ? `CPCB Class B मानक पूरा (${bodNum.toFixed(2)} <= 3.0 mg/l)`
          : `अधिकतम से ${exceedance.toFixed(2)} mg/l अधिक (${bodNum.toFixed(2)} > 3.0 mg/l)`,
      });
    }

    if (!isNaN(phNum)) {
      const passes = phNum >= 6.5 && phNum <= 8.5;
      let exceedance = 0;
      let exceedanceType = '';
      if (phNum < 6.5) {
        exceedance = 6.5 - phNum;
        exceedanceType = 'below';
      } else if (phNum > 8.5) {
        exceedance = phNum - 8.5;
        exceedanceType = 'above';
      }
      results.push({
        parameter: 'pH',
        inputValue: phNum,
        threshold: '6.5 - 8.5',
        passes,
        exceedanceAmount: exceedance,
        message: passes
          ? `Meets CPCB Class B standard (${phNum.toFixed(2)} within 6.5-8.5)`
          : `Outside range by ${exceedance.toFixed(2)} (${phNum.toFixed(2)} is ${exceedanceType} limit)`,
        messageHi: passes
          ? `CPCB Class B मानक पूरा (${phNum.toFixed(2)} 6.5-8.5 के भीतर)`
          : `सीमा से ${exceedance.toFixed(2)} ${exceedanceType === 'below' ? 'नीचे' : 'ऊपर'} (${phNum.toFixed(2)})`,
      });
    }

    return results;
  }, [showResults, doValue, bodValue, phValue]);

  const overallStatus = useMemo(() => {
    if (comparisonResults.length === 0) return null;
    const allPass = comparisonResults.every((r) => r.passes);
    const anyFail = comparisonResults.some((r) => !r.passes);
    return { allPass, anyFail, totalParams: comparisonResults.length };
  }, [comparisonResults]);

  const handleAnalyze = () => {
    if (doValue || bodValue || phValue) {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setDoValue('');
    setBodValue('');
    setPhValue('');
    setShowResults(false);
  };

  const loadHistoricalAverage = () => {
    if (!historicalData) return;
    if (historicalData.do) setDoValue(historicalData.do.avg.toFixed(2));
    if (historicalData.bod) setBodValue(historicalData.bod.avg.toFixed(2));
    if (historicalData.ph) setPhValue(historicalData.ph.avg.toFixed(2));
    setShowResults(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-purple-100 rounded-xl">
            <FlaskConical className="w-6 h-6 text-purple-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {language === 'hi' ? 'क्या-अगर सिम्युलेटर' : 'What-If Simulator'}
            </h1>
            <p className="text-sm text-slate-500">
              {language === 'hi'
                ? 'काल्पनिक जल गुणवत्ता मान दर्ज करें और CPCB Class B मानकों से तुलना करें'
                : 'Enter hypothetical water quality values and compare against CPCB Class B standards'}
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">
            {language === 'hi' ? 'महत्वपूर्ण अस्वीकरण' : 'Important Disclaimer'}
          </p>
          <p className="text-xs text-amber-700">
            {language === 'hi'
              ? 'यह एक शैक्षिक उपकरण है। परिणाम काल्पनिक हैं और वर्तमान जल गुणवत्ता का प्रतिनिधित्व नहीं करते। वास्तविक निर्णयों के लिए आधिकारिक MPPCB रिपोर्ट देखें।'
              : 'This is an educational tool. Results are hypothetical and do not represent current water quality. Refer to official MPPCB reports for actual decisions.'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {language === 'hi' ? 'पैरामीटर मान दर्ज करें' : 'Enter Parameter Values'}
          </h2>

          {/* Ghat Selector */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {language === 'hi' ? 'घाट चुनें (वैकल्पिक)' : 'Select Ghat (Optional)'}
            </label>
            <select
              value={selectedGhat}
              onChange={(e) => {
                setSelectedGhat(e.target.value);
                setShowResults(false);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">{language === 'hi' ? '-- कोई घाट नहीं --' : '-- No Ghat Selected --'}</option>
              {ghats.map((ghat) => (
                <option key={ghat} value={ghat}>{ghat}</option>
              ))}
            </select>
            {selectedGhat && historicalData && (
              <button
                onClick={loadHistoricalAverage}
                className="mt-2 text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {language === 'hi' ? 'ऐतिहासिक औसत लोड करें' : 'Load historical averages'}
              </button>
            )}
          </div>

          {/* DO Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {language === 'hi' ? 'घुलित ऑक्सीजन (DO)' : 'Dissolved Oxygen (DO)'}
              <span className="text-slate-400 font-normal ml-1">mg/l</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={doValue}
                onChange={(e) => { setDoValue(e.target.value); setShowResults(false); }}
                placeholder="e.g., 4.5"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {language === 'hi' ? 'मानक: >= 5.0' : 'Standard: >= 5.0'}
              </span>
            </div>
            {historicalData?.do && (
              <p className="text-xs text-slate-400 mt-1">
                {language === 'hi' ? 'ऐतिहासिक औसत:' : 'Historical avg:'} {historicalData.do.avg.toFixed(2)} mg/l
              </p>
            )}
          </div>

          {/* BOD Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {language === 'hi' ? 'जैव रासायनिक ऑक्सीजन मांग (BOD)' : 'Biochemical Oxygen Demand (BOD)'}
              <span className="text-slate-400 font-normal ml-1">mg/l</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={bodValue}
                onChange={(e) => { setBodValue(e.target.value); setShowResults(false); }}
                placeholder="e.g., 3.5"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {language === 'hi' ? 'मानक: <= 3.0' : 'Standard: <= 3.0'}
              </span>
            </div>
            {historicalData?.bod && (
              <p className="text-xs text-slate-400 mt-1">
                {language === 'hi' ? 'ऐतिहासिक औसत:' : 'Historical avg:'} {historicalData.bod.avg.toFixed(2)} mg/l
              </p>
            )}
          </div>

          {/* pH Input */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {language === 'hi' ? 'पीएच (pH)' : 'pH Level'}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={phValue}
                onChange={(e) => { setPhValue(e.target.value); setShowResults(false); }}
                placeholder="e.g., 7.2"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {language === 'hi' ? 'मानक: 6.5-8.5' : 'Standard: 6.5-8.5'}
              </span>
            </div>
            {historicalData?.ph && (
              <p className="text-xs text-slate-400 mt-1">
                {language === 'hi' ? 'ऐतिहासिक औसत:' : 'Historical avg:'} {historicalData.ph.avg.toFixed(2)}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!doValue && !bodValue && !phValue}
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-medium text-sm hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <FlaskConical className="w-4 h-4" />
              {language === 'hi' ? 'विश्लेषण करें' : 'Analyze'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-200 transition-colors"
            >
              {language === 'hi' ? 'रीसेट' : 'Reset'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {language === 'hi' ? 'तुलना परिणाम' : 'Comparison Results'}
          </h2>

          {!showResults ? (
            <div className="text-center py-12">
              <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {language === 'hi'
                  ? 'परिणाम देखने के लिए मान दर्ज करें और "विश्लेषण करें" पर क्लिक करें'
                  : 'Enter values and click "Analyze" to see comparison results'}
              </p>
            </div>
          ) : (
            <>
              {/* Overall Status */}
              {overallStatus && (
                <div
                  className={`rounded-xl p-4 mb-4 ${
                    overallStatus.allPass
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-rose-50 border border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {overallStatus.allPass ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    )}
                    <span
                      className={`font-semibold ${
                        overallStatus.allPass ? 'text-green-800' : 'text-rose-800'
                      }`}
                    >
                      {overallStatus.allPass
                        ? language === 'hi'
                          ? 'सभी मानक पूर्ण'
                          : 'All Standards Met'
                        : language === 'hi'
                        ? 'कुछ मानक पूर्ण नहीं'
                        : 'Some Standards Not Met'}
                    </span>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      overallStatus.allPass ? 'text-green-700' : 'text-rose-700'
                    }`}
                  >
                    {comparisonResults.filter((r) => r.passes).length}/{overallStatus.totalParams}{' '}
                    {language === 'hi' ? 'पैरामीटर CPCB Class B मानक पूरा करते हैं' : 'parameters meet CPCB Class B standards'}
                  </p>
                </div>
              )}

              {/* Individual Results */}
              <div className="space-y-3">
                {comparisonResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 border ${
                      result.passes
                        ? 'bg-green-50/50 border-green-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">{result.parameter}</span>
                      {result.passes ? (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                          {language === 'hi' ? 'पास' : 'PASS'}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-rose-100 text-rose-700 rounded-full font-medium">
                          {language === 'hi' ? 'फेल' : 'FAIL'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <span className="font-mono">{result.inputValue.toFixed(2)}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-slate-500">{result.threshold}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {language === 'hi' ? result.messageHi : result.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* CPCB Reference */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  <span className="font-medium">{language === 'hi' ? 'संदर्भ:' : 'Reference:'}</span>{' '}
                  {language === 'hi'
                    ? 'CPCB Class B - बाहरी स्नान (संगठित) के लिए जल गुणवत्ता मानक'
                    : 'CPCB Class B - Water Quality Criteria for Outdoor Bathing (Organised)'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Threshold Reference Table */}
      <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">
          {language === 'hi' ? 'CPCB Class B मानक संदर्भ' : 'CPCB Class B Standards Reference'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-medium text-slate-600">
                  {language === 'hi' ? 'पैरामीटर' : 'Parameter'}
                </th>
                <th className="text-left py-2 font-medium text-slate-600">
                  {language === 'hi' ? 'मानक' : 'Standard'}
                </th>
                <th className="text-left py-2 font-medium text-slate-600">
                  {language === 'hi' ? 'विवरण' : 'Description'}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-800">{language === 'hi' ? 'घुलित ऑक्सीजन' : 'Dissolved Oxygen'}</td>
                <td className="py-2 font-mono text-teal-700">&gt;= 5.0 mg/l</td>
                <td className="py-2 text-slate-500 text-xs">
                  {language === 'hi' ? 'न्यूनतम स्तर जलीय जीवन के लिए आवश्यक' : 'Minimum level required for aquatic life'}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-800">{language === 'hi' ? 'बीओडी' : 'BOD'}</td>
                <td className="py-2 font-mono text-teal-700">&lt;= 3.0 mg/l</td>
                <td className="py-2 text-slate-500 text-xs">
                  {language === 'hi' ? 'कार्बनिक प्रदूषण का संकेतक' : 'Indicator of organic pollution level'}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-800">{language === 'hi' ? 'पीएच' : 'pH'}</td>
                <td className="py-2 font-mono text-teal-700">6.5 - 8.5</td>
                <td className="py-2 text-slate-500 text-xs">
                  {language === 'hi' ? 'अम्लता/क्षारीयता संतुलन' : 'Acidity/alkalinity balance'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
