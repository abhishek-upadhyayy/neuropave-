'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AppSidebar } from '@/components/app-sidebar';
import { TopBar } from '@/components/top-bar';
import {
  Brain, ArrowLeft, Zap, Thermometer, Droplets, Layers,
  TrendingUp, AlertTriangle, CheckCircle, RotateCcw, Gauge,
  Clock, MapPin, ChevronRight,
} from 'lucide-react';

// XGBoost feature definitions with realistic ranges for road health prediction
const features = [
  {
    id: 'vibration',
    label: 'Vibration Level',
    unit: 'm/s²',
    min: 0,
    max: 5,
    step: 0.01,
    default: 0.8,
    icon: Layers,
    color: '#3b82f6',
    description: 'Peak vertical acceleration measured at pavement surface',
    category: 'sensor',
  },
  {
    id: 'strain',
    label: 'Strain Level',
    unit: 'µε',
    min: 0,
    max: 500,
    step: 1,
    default: 145,
    icon: Zap,
    color: '#22c55e',
    description: 'Horizontal tensile strain at the bottom of asphalt layer',
    category: 'sensor',
  },
  {
    id: 'temperature',
    label: 'Surface Temperature',
    unit: '°C',
    min: -20,
    max: 65,
    step: 0.5,
    default: 38,
    icon: Thermometer,
    color: '#f59e0b',
    description: 'Road surface temperature from embedded thermocouple',
    category: 'sensor',
  },
  {
    id: 'humidity',
    label: 'Moisture Content',
    unit: '%',
    min: 0,
    max: 100,
    step: 1,
    default: 42,
    icon: Droplets,
    color: '#8b5cf6',
    description: 'Subgrade moisture content from capacitive sensor',
    category: 'sensor',
  },
  {
    id: 'traffic_load',
    label: 'Traffic Load (AADT)',
    unit: 'vehicles/day',
    min: 500,
    max: 80000,
    step: 100,
    default: 25000,
    icon: TrendingUp,
    color: '#ec4899',
    description: 'Average Annual Daily Traffic count',
    category: 'traffic',
  },
  {
    id: 'pavement_age',
    label: 'Pavement Age',
    unit: 'years',
    min: 0,
    max: 40,
    step: 0.5,
    default: 8,
    icon: Clock,
    color: '#6366f1',
    description: 'Years since last major resurfacing or reconstruction',
    category: 'infrastructure',
  },
  {
    id: 'layer_thickness',
    label: 'Asphalt Thickness',
    unit: 'mm',
    min: 50,
    max: 400,
    step: 5,
    default: 180,
    icon: Layers,
    color: '#14b8a6',
    description: 'Total asphalt concrete layer thickness from GPR',
    category: 'infrastructure',
  },
  {
    id: 'deflection',
    label: 'FWD Deflection',
    unit: 'µm',
    min: 50,
    max: 1200,
    step: 10,
    default: 350,
    icon: Gauge,
    color: '#f43f5e',
    description: 'Falling Weight Deflectometer center deflection (D0)',
    category: 'infrastructure',
  },
];

// Simulated XGBoost model — produces realistic-looking results
function simulateXGBoostPrediction(inputs: Record<string, number>) {
  // Weighted feature contributions (mimics SHAP values)
  const weights: Record<string, number> = {
    vibration: 0.22,
    strain: 0.18,
    temperature: 0.08,
    humidity: 0.07,
    traffic_load: 0.15,
    pavement_age: 0.14,
    layer_thickness: -0.09,
    deflection: 0.12,
  };

  // Normalize each input to 0-1 range
  const normed: Record<string, number> = {};
  features.forEach(f => {
    normed[f.id] = (inputs[f.id] - f.min) / (f.max - f.min);
  });

  // Compute raw score (logistic-like)
  let rawScore = -1.2; // bias
  Object.keys(weights).forEach(key => {
    rawScore += weights[key] * normed[key] * 4;
  });

  // Add non-linear interaction terms
  rawScore += normed.vibration * normed.strain * 0.8;
  rawScore += normed.pavement_age * normed.deflection * 0.6;
  rawScore -= normed.layer_thickness * (1 - normed.deflection) * 0.5;

  // Sigmoid
  const failureProbability = Math.min(0.99, Math.max(0.01, 1 / (1 + Math.exp(-rawScore))));

  // Remaining useful life estimation
  const remainingLife = Math.max(1, Math.round((1 - failureProbability) * 36));

  // Confidence based on how balanced the features are
  const featureVariance = Object.values(normed).reduce((sum, v) => sum + Math.pow(v - 0.5, 2), 0) / Object.keys(normed).length;
  const confidence = Math.min(0.98, Math.max(0.75, 0.92 - featureVariance * 0.3));

  // Feature importances (SHAP-like)
  const shapValues: Record<string, number> = {};
  Object.keys(weights).forEach(key => {
    shapValues[key] = weights[key] * (normed[key] - 0.5) * 2;
  });
  shapValues.vibration += normed.vibration * normed.strain * 0.4;
  shapValues.strain += normed.vibration * normed.strain * 0.4;
  shapValues.pavement_age += normed.pavement_age * normed.deflection * 0.3;
  shapValues.deflection += normed.pavement_age * normed.deflection * 0.3;

  // Risk classification
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  if (failureProbability < 0.25) riskLevel = 'low';
  else if (failureProbability < 0.50) riskLevel = 'moderate';
  else if (failureProbability < 0.75) riskLevel = 'high';
  else riskLevel = 'critical';

  return {
    failureProbability: Math.round(failureProbability * 1000) / 10,
    remainingLife,
    confidence: Math.round(confidence * 100),
    riskLevel,
    shapValues,
  };
}

type PredictionResult = ReturnType<typeof simulateXGBoostPrediction>;

export default function RunPredictionPage() {
  const [inputs, setInputs] = useState<Record<string, number>>(() => {
    const defaults: Record<string, number> = {};
    features.forEach(f => { defaults[f.id] = f.default; });
    return defaults;
  });
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const updateInput = (id: string, value: number) => {
    setInputs(prev => ({ ...prev, [id]: value }));
    setResult(null); // Clear old result when inputs change
  };

  const resetInputs = () => {
    const defaults: Record<string, number> = {};
    features.forEach(f => { defaults[f.id] = f.default; });
    setInputs(defaults);
    setResult(null);
  };

  const runPrediction = async () => {
    setIsRunning(true);
    // Simulate model inference delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    const prediction = simulateXGBoostPrediction(inputs);
    setResult(prediction);
    setIsRunning(false);
  };

  // Sort SHAP values for display
  const sortedShap = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.shapValues)
      .map(([key, value]) => ({
        key,
        label: features.find(f => f.id === key)?.label || key,
        color: features.find(f => f.id === key)?.color || '#888',
        value,
        absValue: Math.abs(value),
      }))
      .sort((a, b) => b.absValue - a.absValue);
  }, [result]);

  const riskColors: Record<string, { bg: string; text: string; border: string; glow: string }> = {
    low: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/25', glow: 'rgba(34,197,94,0.15)' },
    moderate: { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/25', glow: 'rgba(245,158,11,0.15)' },
    high: { bg: 'bg-orange-500/10', text: 'text-orange-300', border: 'border-orange-500/25', glow: 'rgba(249,115,22,0.15)' },
    critical: { bg: 'bg-rose-500/10', text: 'text-rose-300', border: 'border-rose-500/25', glow: 'rgba(244,63,94,0.15)' },
  };

  const groupedFeatures = {
    'Sensor Readings': features.filter(f => f.category === 'sensor'),
    'Traffic Data': features.filter(f => f.category === 'traffic'),
    'Infrastructure Properties': features.filter(f => f.category === 'infrastructure'),
  };

  return (
    <div className="flex min-h-screen bg-[#050505]">
      <AppSidebar />
      <div className="flex-1 ml-[var(--app-sidebar-width)] transition-[margin] duration-300 ease-in-out flex flex-col min-h-screen">
        <TopBar />

        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Breadcrumb + Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-white/30">
              <Link href="/predictions" className="hover:text-white/60 transition-colors">Predictions</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/60">Run Prediction</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/15 to-blue-500/15 border border-emerald-500/20">
                  <Brain className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-white/90 tracking-tight">XGBoost Prediction Engine</h1>
                  <p className="text-xs text-white/30">Manually input sensor data for road health failure prediction</p>
                </div>
              </div>
              <Link href="/predictions">
                <button className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white/40 hover:text-white/70 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] rounded-xl transition-all">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              </Link>
            </div>
          </div>

          {/* Model info banner */}
          <div className="relative overflow-hidden rounded-2xl p-5 border border-white/[0.06]" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(16,185,129,0.04) 50%, rgba(59,130,246,0.06) 100%)' }}>
            <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="relative flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/15 border border-indigo-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full shadow-[0_0_4px_rgba(99,102,241,0.6)]" />
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">XGBoost v2.1</span>
              </div>
              <span className="text-xs text-white/35">Gradient Boosted Decision Trees · 500 estimators · max_depth=8 · learning_rate=0.05</span>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
            {/* Input Form */}
            <div className="space-y-5">
              {Object.entries(groupedFeatures).map(([groupName, groupFeatures]) => (
                <div key={groupName} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-white/[0.04]">
                    <h2 className="text-sm font-bold text-white/70">{groupName}</h2>
                  </div>
                  <div className="p-5 space-y-5">
                    {groupFeatures.map(feature => {
                      const Icon = feature.icon;
                      const normalizedValue = (inputs[feature.id] - feature.min) / (feature.max - feature.min);
                      return (
                        <div key={feature.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg" style={{ backgroundColor: feature.color + '15', border: `1px solid ${feature.color}25` }}>
                                <Icon className="w-3.5 h-3.5" style={{ color: feature.color }} />
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-white/75">{feature.label}</span>
                                <p className="text-[10px] text-white/25">{feature.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={inputs[feature.id]}
                                min={feature.min}
                                max={feature.max}
                                step={feature.step}
                                onChange={(e) => updateInput(feature.id, Number(e.target.value))}
                                className="w-24 px-3 py-1.5 text-right text-xs font-bold text-white/80 bg-white/[0.04] border border-white/[0.08] rounded-lg focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 tabular-nums transition-colors"
                              />
                              <span className="text-[10px] text-white/25 font-medium w-16">{feature.unit}</span>
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              type="range"
                              min={feature.min}
                              max={feature.max}
                              step={feature.step}
                              value={inputs[feature.id]}
                              onChange={(e) => updateInput(feature.id, Number(e.target.value))}
                              className="w-full h-1.5 rounded-full appearance-none cursor-pointer transition-all"
                              style={{
                                background: `linear-gradient(to right, ${feature.color} 0%, ${feature.color} ${normalizedValue * 100}%, rgba(255,255,255,0.06) ${normalizedValue * 100}%, rgba(255,255,255,0.06) 100%)`,
                              }}
                            />
                            <div className="flex justify-between mt-1 text-[9px] text-white/15 font-mono">
                              <span>{feature.min}</span>
                              <span>{feature.max} {feature.unit}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={runPrediction}
                  disabled={isRunning}
                  className="flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: isRunning
                      ? 'rgba(99,102,241,0.15)'
                      : 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(99,102,241,0.2) 100%)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: 'rgba(255,255,255,0.9)',
                    boxShadow: isRunning ? 'none' : '0 0 30px rgba(16,185,129,0.1)',
                  }}
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-emerald-400 rounded-full animate-spin" />
                      Running XGBoost Inference...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 text-emerald-400" />
                      Run Prediction
                    </>
                  )}
                </button>
                <button
                  onClick={resetInputs}
                  className="flex items-center gap-2 px-4 py-3.5 rounded-xl text-xs font-medium text-white/40 hover:text-white/70 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            </div>

            {/* Results Panel */}
            <div className="space-y-4">
              {!result && !isRunning && (
                <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-7 h-7 text-white/15" />
                  </div>
                  <p className="text-sm font-semibold text-white/40 mb-1">No Prediction Yet</p>
                  <p className="text-xs text-white/20 max-w-xs mx-auto">Adjust the input parameters on the left and click "Run Prediction" to generate an XGBoost failure forecast.</p>
                </div>
              )}

              {isRunning && (
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-10 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Brain className="w-7 h-7 text-indigo-400" />
                  </div>
                  <p className="text-sm font-semibold text-white/60 mb-1">Running Inference...</p>
                  <p className="text-xs text-white/25">Processing 500 tree estimators</p>
                  <div className="mt-4 h-1.5 bg-white/[0.04] rounded-full overflow-hidden max-w-xs mx-auto">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full animate-shimmer" style={{ width: '70%' }} />
                  </div>
                </div>
              )}

              {result && (
                <>
                  {/* Risk Score Card */}
                  <div
                    className="rounded-2xl border p-6 space-y-4"
                    style={{
                      background: `linear-gradient(135deg, ${riskColors[result.riskLevel].glow}, transparent)`,
                      borderColor: `rgba(255,255,255,0.06)`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${riskColors[result.riskLevel].text}`} />
                        <span className="text-[10px] uppercase tracking-[0.14em] text-white/30 font-bold">Failure Probability</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${riskColors[result.riskLevel].bg} ${riskColors[result.riskLevel].text} ${riskColors[result.riskLevel].border}`}>
                        {result.riskLevel}
                      </span>
                    </div>
                    <div className="text-center py-4">
                      <p className={`text-5xl font-extrabold tabular-nums ${riskColors[result.riskLevel].text}`}>
                        {result.failureProbability}%
                      </p>
                      <p className="text-[10px] text-white/25 mt-1 uppercase tracking-wider font-bold">30-Day Failure Risk</p>
                    </div>
                    <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${result.failureProbability}%`,
                          background: result.riskLevel === 'critical'
                            ? 'linear-gradient(90deg, #f43f5e, #ef4444)'
                            : result.riskLevel === 'high'
                              ? 'linear-gradient(90deg, #f97316, #f59e0b)'
                              : result.riskLevel === 'moderate'
                                ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                                : 'linear-gradient(90deg, #22c55e, #10b981)',
                          boxShadow: `0 0 12px ${riskColors[result.riskLevel].glow}`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                      <p className="text-2xl font-extrabold text-indigo-300 tabular-nums">{result.remainingLife}</p>
                      <p className="text-[9px] text-white/20 uppercase tracking-wider font-bold mt-0.5">Months RUL</p>
                      <p className="text-[10px] text-white/30 mt-1">Remaining Useful Life</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-center">
                      <p className="text-2xl font-extrabold text-emerald-300 tabular-nums">{result.confidence}%</p>
                      <p className="text-[9px] text-white/20 uppercase tracking-wider font-bold mt-0.5">Confidence</p>
                      <p className="text-[10px] text-white/30 mt-1">Model Certainty</p>
                    </div>
                  </div>

                  {/* SHAP Feature Importance */}
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-white/[0.04]">
                      <h3 className="text-sm font-bold text-white/70">Feature Contributions (SHAP)</h3>
                      <p className="text-[10px] text-white/25 mt-0.5">Impact of each feature on the prediction</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {sortedShap.map(({ key, label, color, value, absValue }) => {
                        const maxAbs = Math.max(...sortedShap.map(s => s.absValue));
                        const barWidth = (absValue / maxAbs) * 100;
                        const isPositive = value > 0;
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/60 font-medium">{label}</span>
                              <span className={`text-xs font-bold tabular-nums ${isPositive ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {isPositive ? '+' : ''}{(value * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700 ease-out"
                                style={{
                                  width: `${barWidth}%`,
                                  backgroundColor: isPositive ? '#f43f5e' : '#22c55e',
                                  boxShadow: `0 0 6px ${isPositive ? 'rgba(244,63,94,0.3)' : 'rgba(34,197,94,0.3)'}`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-white/20">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-rose-500/60" />
                        <span>Increases risk</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
                        <span>Decreases risk</span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                    <h3 className="text-sm font-bold text-white/70 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Recommendation
                    </h3>
                    <p className="text-xs text-white/45 leading-relaxed">
                      {result.riskLevel === 'critical'
                        ? 'URGENT: Immediate inspection and repair recommended. High probability of structural failure within 30 days. Deploy maintenance crew and restrict heavy vehicle access until assessment is complete.'
                        : result.riskLevel === 'high'
                          ? 'Schedule priority inspection within the next 2 weeks. Consider preventive surface treatment (micro-surfacing or chip seal) to extend pavement life. Monitor vibration and strain sensors closely.'
                          : result.riskLevel === 'moderate'
                            ? 'Add to routine maintenance schedule. Consider scheduling preventive maintenance within the next 3-6 months. Continue regular monitoring at current frequency.'
                            : 'Pavement is in good condition. Maintain current monitoring schedule. No immediate action required. Next full assessment recommended in 12 months.'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
