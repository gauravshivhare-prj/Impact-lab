import React, { useState, useMemo } from 'react';
import {
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { dataService } from '../services/dataService';

interface SimulatorPageProps {
  language: 'en' | 'hi';
}

interface ParameterResult {
  parameter: string;
  parameterKey: string;
  unit: string;
  hypotheticalValue: number;
  benchmark: string | null;
  hypotheticalStatus: 'meets_benchmark' | 'exceeds_benchmark' | 'not_applicable';
  hypotheticalExplanation: string;
  baseline: {
    average: number;
    min: number;
    max: number;
    sampleCount: number;
    period: string;
  } | null;
  baselineStatus: string | null;
  changeFromBaseline: {
    absoluteChange: number;
    percentageChange: number | null;
    direction: 'increase' | 'decrease' | 'no_change';
  } | null;
}

interface SimulationResult {
  ghatId: string;
  ghatName: string;
  isHypothetical: boolean;
  results: ParameterResult[];
  overallSummary: {
    summary: string;
    totalChecked: number;
    meetingBenchmark: number;
    exceedingBenchmark: number;
    disclaimer: string;
  };
  benchmarkReference: {
    name: string;
    source: string;
    parameters: Record<string, string>;
  };
  limitations: string[];
}

async function runSimulation(
  ghatId: string,
  hypotheticalValues: { ph?: number; do?: number; bod?: number }
): Promise<SimulationResult> {
  const res = await fetch('/api/v1/simulations/water-quality', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ghatId, hypotheticalValues }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: { message: 'Simulation failed' } }));
    throw new Error(error.error?.message || 'Simulation failed');
  }

  const data = await res.json();
  return data.data;
}

export const SimulatorPage: React.FC<SimulatorPageProps> = ({ language }) => {
  const [selectedGhat, setSelectedGhat] = useState<string>('');
  const [doValue, setDoValue] = useState<string>('');
  const [bodValue, setBodValue] = useState<string>('');
  const [phValue, setPhValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const ghats = useMemo(() => {
    const rankings = dataService.getSiteRankings();
    return rankings.map((r) => ({ name: r.site, id: r.site.toLowerCase().replace(/[^a-z0-9]+/g, '-') }));
  }, []);

  const selectedGhatData = useMemo(() => {
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
        count: values.length,
      };
    };

    return {
      do: getStats('Dissolved oxygen'),
      bod: getStats('BOD'),
      ph: getStats('pH'),
    };
  }, [selectedGhat]);

  const handleAnalyze = async () => {
    if (!selectedGhat) {
      setError(language === 'hi' ? 'कृपया एक घाट चुनें' : 'Please select a ghat');
      return;
    }

    const hypotheticalValues: { ph?: number; do?: number; bod?: number } = {};
    if (doValue) hypotheticalValues.do = parseFloat(doValue);
    if (bodValue) hypotheticalValues.bod = parseFloat(bodValue);
    if (phValue) hypotheticalValues.ph = parseFloat(phValue);

    if (Object.keys(hypotheticalValues).length === 0) {
      setError(
        language === 'hi'
          ? 'कम से कम एक पैरामीटर मान दर्ज करें'
          : 'Enter at least one parameter value'
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const ghatId = selectedGhat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const simResult = await runSimulation(ghatId, hypotheticalValues);
      setResult(simResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : language === 'hi'
          ? 'सिमुलेशन विफल'
          : 'Simulation failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setDoValue('');
    setBodValue('');
    setPhValue('');
    setResult(null);
    setError(null);
  };

  const loadHistoricalAverage = () => {
    if (!selectedGhatData) return;
    if (selectedGhatData.do) setDoValue(selectedGhatData.do.avg.toFixed(2));
    if (selectedGhatData.bod) setBodValue(selectedGhatData.bod.avg.toFixed(2));
    if (selectedGhatData.ph) setPhValue(selectedGhatData.ph.avg.toFixed(2));
    setResult(null);
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

      {/* Important Disclaimer Banner */}
      <div className="bg-amber-50/90 backdrop-blur-sm border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-3 shadow-sm">
        <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">
            {language === 'hi' ? 'महत्वपूर्ण अस्वीकरण' : 'Important Disclaimer'}
          </p>
          <p className="text-xs text-amber-700">
            {language === 'hi'
              ? 'यह एक शैक्षिक उपकरण है। परिणाम काल्पनिक हैं और वर्तमान जल गुणवत्ता का प्रतिनिधित्व नहीं करते। बेंचमार्क चेक पास करना समग्र जल सुरक्षा की गारंटी नहीं देता। वास्तविक निर्णयों के लिए आधिकारिक MPPCB रिपोर्ट देखें।'
              : 'This is an educational tool. Results are hypothetical and do not represent current water quality. Passing benchmark checks does not guarantee overall water safety. Refer to official MPPCB reports for actual decisions.'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-md">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {language === 'hi' ? 'पैरामीटर मान दर्ज करें' : 'Enter Parameter Values'}
          </h2>

          {/* Ghat Selector */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {language === 'hi' ? 'घाट चुनें' : 'Select Ghat'} *
            </label>
            <select
              value={selectedGhat}
              onChange={(e) => {
                setSelectedGhat(e.target.value);
                setResult(null);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">
                {language === 'hi' ? '-- घाट चुनें --' : '-- Select a Ghat --'}
              </option>
              {ghats.map((ghat) => (
                <option key={ghat.id} value={ghat.name}>
                  {ghat.name}
                </option>
              ))}
            </select>
            {selectedGhat && selectedGhatData && (
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
                min="0"
                max="50"
                value={doValue}
                onChange={(e) => {
                  setDoValue(e.target.value);
                  setResult(null);
                }}
                placeholder="e.g., 4.5"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {language === 'hi' ? 'मानक: ≥ 5.0' : 'Standard: ≥ 5.0'}
              </span>
            </div>
            {selectedGhatData?.do && (
              <p className="text-xs text-slate-400 mt-1">
                {language === 'hi' ? 'ऐतिहासिक औसत:' : 'Historical avg:'}{' '}
                {selectedGhatData.do.avg.toFixed(2)} mg/l ({selectedGhatData.do.count} samples)
              </p>
            )}
          </div>

          {/* BOD Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {language === 'hi'
                ? 'जैव रासायनिक ऑक्सीजन मांग (BOD)'
                : 'Biochemical Oxygen Demand (BOD)'}
              <span className="text-slate-400 font-normal ml-1">mg/l</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={bodValue}
                onChange={(e) => {
                  setBodValue(e.target.value);
                  setResult(null);
                }}
                placeholder="e.g., 3.5"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {language === 'hi' ? 'मानक: ≤ 3.0' : 'Standard: ≤ 3.0'}
              </span>
            </div>
            {selectedGhatData?.bod && (
              <p className="text-xs text-slate-400 mt-1">
                {language === 'hi' ? 'ऐतिहासिक औसत:' : 'Historical avg:'}{' '}
                {selectedGhatData.bod.avg.toFixed(2)} mg/l ({selectedGhatData.bod.count} samples)
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
                min="0"
                max="14"
                value={phValue}
                onChange={(e) => {
                  setPhValue(e.target.value);
                  setResult(null);
                }}
                placeholder="e.g., 7.2"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">
                {language === 'hi' ? 'मानक: 6.5-8.5' : 'Standard: 6.5-8.5'}
              </span>
            </div>
            {selectedGhatData?.ph && (
              <p className="text-xs text-slate-400 mt-1">
                {language === 'hi' ? 'ऐतिहासिक औसत:' : 'Historical avg:'}{' '}
                {selectedGhatData.ph.avg.toFixed(2)} ({selectedGhatData.ph.count} samples)
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!selectedGhat || isLoading}
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl font-medium text-sm hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FlaskConical className="w-4 h-4" />
              )}
              {language === 'hi' ? 'सिमुलेट करें' : 'Simulate'}
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
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-md">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {language === 'hi' ? 'सिमुलेशन परिणाम' : 'Simulation Results'}
          </h2>

          {!result ? (
            <div className="text-center py-12">
              <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {language === 'hi'
                  ? 'परिणाम देखने के लिए घाट चुनें और मान दर्ज करें'
                  : 'Select a ghat and enter values to see simulation results'}
              </p>
            </div>
          ) : (
            <>
              {/* Ghat Name */}
              <div className="mb-4 pb-3 border-b border-slate-100">
                <p className="text-sm text-slate-500">
                  {language === 'hi' ? 'घाट:' : 'Ghat:'}{' '}
                  <span className="font-medium text-slate-900">{result.ghatName}</span>
                </p>
              </div>

              {/* Overall Status */}
              <div
                className={`rounded-xl p-4 mb-4 ${
                  result.overallSummary.exceedingBenchmark === 0
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-rose-50 border border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.overallSummary.exceedingBenchmark === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  )}
                  <span
                    className={`font-semibold ${
                      result.overallSummary.exceedingBenchmark === 0
                        ? 'text-green-800'
                        : 'text-rose-800'
                    }`}
                  >
                    {result.overallSummary.meetingBenchmark}/{result.overallSummary.totalChecked}{' '}
                    {language === 'hi' ? 'बेंचमार्क पूर्ण' : 'Meet Benchmarks'}
                  </span>
                </div>
                <p className="text-xs mt-1 text-slate-600">{result.overallSummary.summary}</p>
              </div>

              {/* Individual Results */}
              <div className="space-y-3">
                {result.results.map((r, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 border ${
                      r.hypotheticalStatus === 'meets_benchmark'
                        ? 'bg-green-50/50 border-green-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-900">{r.parameter}</span>
                      {r.hypotheticalStatus === 'meets_benchmark' ? (
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
                      <span className="font-mono">
                        {r.hypotheticalValue.toFixed(2)}
                        {r.unit && ` ${r.unit}`}
                      </span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-slate-500">{r.benchmark}</span>
                    </div>

                    {r.baseline && (
                      <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                        <span className="font-medium">Historical baseline:</span>{' '}
                        {r.baseline.average.toFixed(2)}
                        {r.unit && ` ${r.unit}`} ({r.baseline.period}, {r.baseline.sampleCount}{' '}
                        samples)
                        {r.changeFromBaseline && (
                          <span
                            className={`ml-2 ${
                              r.changeFromBaseline.direction === 'increase'
                                ? 'text-rose-600'
                                : r.changeFromBaseline.direction === 'decrease'
                                ? 'text-green-600'
                                : ''
                            }`}
                          >
                            ({r.changeFromBaseline.direction === 'increase' ? '+' : ''}
                            {r.changeFromBaseline.absoluteChange.toFixed(2)})
                          </span>
                        )}
                      </div>
                    )}

                    {!r.baseline && (
                      <p className="text-xs text-amber-600 mt-2">
                        {language === 'hi'
                          ? 'कोई वैध ऐतिहासिक बेसलाइन उपलब्ध नहीं'
                          : 'No valid historical baseline available'}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 mt-1">{r.hypotheticalExplanation}</p>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 italic">{result.overallSummary.disclaimer}</p>
              </div>

              {/* Reference */}
              <div className="mt-3 text-xs text-slate-400">
                <span className="font-medium">{language === 'hi' ? 'संदर्भ:' : 'Reference:'}</span>{' '}
                {result.benchmarkReference.name}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Threshold Reference Table */}
      <div className="mt-6 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-md">
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
                <td className="py-2 text-slate-800">
                  {language === 'hi' ? 'घुलित ऑक्सीजन' : 'Dissolved Oxygen'}
                </td>
                <td className="py-2 font-mono text-teal-700">&gt;= 5.0 mg/l</td>
                <td className="py-2 text-slate-500 text-xs">
                  {language === 'hi'
                    ? 'न्यूनतम स्तर जलीय जीवन के लिए आवश्यक'
                    : 'Minimum level required for aquatic life'}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 text-slate-800">{language === 'hi' ? 'बीओडी' : 'BOD'}</td>
                <td className="py-2 font-mono text-teal-700">&lt;= 3.0 mg/l</td>
                <td className="py-2 text-slate-500 text-xs">
                  {language === 'hi'
                    ? 'कार्बनिक प्रदूषण का संकेतक'
                    : 'Indicator of organic pollution level'}
                </td>
              </tr>
              <tr>
                <td className="py-2 text-slate-800">{language === 'hi' ? 'पीएच' : 'pH'}</td>
                <td className="py-2 font-mono text-teal-700">6.5 - 8.5</td>
                <td className="py-2 text-slate-500 text-xs">
                  {language === 'hi'
                    ? 'अम्लता/क्षारीयता संतुलन'
                    : 'Acidity/alkalinity balance'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
