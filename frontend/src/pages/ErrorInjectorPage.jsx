import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Activity, 
  Flame, 
  Dice5, 
  Layers, 
  Binary, 
  Sliders
} from 'lucide-react';
import { simulateErrorInjectionApi, fetchErrorInjectionStatsApi } from '../services/api';

/**
 * Safely computes total bit length of a UTF-8 string in browser environments
 */
const getPayloadBitLength = (data) => {
  if (!data || typeof data !== 'string') return 0;
  try {
    return new TextEncoder().encode(data).length * 8;
  } catch {
    return data.length * 8;
  }
};

export const ErrorInjectorPage = () => {
  const [inputData, setInputData] = useState('HELLO');
  const [algorithm, setAlgorithm] = useState('CRC-32');
  const [errorType, setErrorType] = useState('SINGLE_BIT');
  const [bitCount, setBitCount] = useState(3);
  const [burstLength, setBurstLength] = useState(4);

  const [loading, setLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [stats, setStats] = useState(null);

  const totalBits = getPayloadBitLength(inputData);
  const maxBits = Math.max(1, totalBits);

  const loadStats = async () => {
    try {
      const res = await fetchErrorInjectionStatsApi();
      if (res && res.success) {
        setStats(res.stats);
      }
    } catch {
      // stats retrieval failure should not block simulation
    }
  };

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const handleModeChange = (newType) => {
    setErrorType(newType);
    setErrorMsg('');
  };

  const handleSimulate = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!inputData || inputData.trim() === '') {
      setErrorMsg('Please enter payload data to simulate error injection.');
      return;
    }

    const payloadBits = getPayloadBitLength(inputData);
    if (payloadBits === 0) {
      setErrorMsg('Payload contains 0 bits; cannot inject errors.');
      return;
    }

    const payload = {
      data: inputData,
      algorithm,
      errorType
    };

    if (errorType === 'MULTI_BIT') {
      const parsedBitCount = parseInt(bitCount, 10);
      if (isNaN(parsedBitCount) || parsedBitCount < 1) {
        setErrorMsg('Please enter a valid positive integer for bit count (minimum 1).');
        return;
      }
      if (parsedBitCount > payloadBits) {
        setErrorMsg(`Requested bit count (${parsedBitCount}) exceeds total payload size (${payloadBits} bits).`);
        return;
      }
      payload.bitCount = parsedBitCount;
    }

    if (errorType === 'BURST') {
      const parsedBurstLength = parseInt(burstLength, 10);
      if (isNaN(parsedBurstLength) || parsedBurstLength < 1) {
        setErrorMsg('Please enter a valid positive integer for burst length (minimum 1).');
        return;
      }
      if (parsedBurstLength > payloadBits) {
        setErrorMsg(`Requested burst length (${parsedBurstLength}) exceeds total payload size (${payloadBits} bits).`);
        return;
      }
      payload.burstLength = parsedBurstLength;
    }

    setLoading(true);
    try {
      const res = await simulateErrorInjectionApi(payload);
      if (res && res.success && res.data?.result) {
        setSimResult(res.data.result);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } else {
        setErrorMsg(res?.error || 'Simulation failed to produce a valid result.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Renders the binary string with highlighted changed bit positions
   */
  const renderHighlightedBinary = (binaryStr, changedPositions = []) => {
    if (!binaryStr) return null;
    
    const safePositions = Array.isArray(changedPositions) ? changedPositions : [];
    // binaryStr is space-separated 8-bit blocks e.g. "01001000 01000101"
    const bytes = binaryStr.trim().split(/\s+/);
    let globalBitIndex = 0;

    return (
      <div className="flex flex-wrap gap-2 font-mono text-xs">
        {bytes.map((byteStr, byteIdx) => {
          const charBits = byteStr.split('');
          return (
            <div key={byteIdx} className="bg-slate-950 px-2 py-1 rounded border border-slate-800 flex gap-0.5">
              {charBits.map((bit, bitIdxInByte) => {
                const currentGlobalPos = globalBitIndex++;
                const isChanged = safePositions.includes(currentGlobalPos);
                return (
                  <span
                    key={bitIdxInByte}
                    className={`px-0.5 rounded transition-all font-bold ${
                      isChanged
                        ? 'bg-rose-500 text-white font-extrabold animate-pulse ring-1 ring-rose-400'
                        : 'text-slate-300'
                    }`}
                    title={`Bit Pos: ${currentGlobalPos}${isChanged ? ' (MUTATED)' : ''}`}
                  >
                    {bit}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Welcome Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
              <Zap className="w-4 h-4 text-rose-400" />
              <span>Module 03 • Fully Operational Engine</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Error Injection Simulator</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Inject intentional bit flips (Single-Bit, Multi-Bit, Burst, Random) into transmitted frame streams to verify CRC error detection boundaries.
            </p>
          </div>

          {stats && (
            <div className="flex items-center gap-3 self-start md:self-auto">
              <div className="px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>Detection Rate: {stats.detectionRate}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Controls vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ================================================= */}
        {/* INPUT CONTROLS PANEL (Cols 1-5)                   */}
        {/* ================================================= */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-rose-400" />
                Error Injection Parameters
              </h3>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 font-mono">
                Noise Injector
              </span>
            </div>

            <form onSubmit={handleSimulate} className="space-y-4">
              {/* CRC Algorithm Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  CRC Polynomial Algorithm:
                </label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                >
                  <option value="CRC-32">CRC-32 (IEEE 802.3 • 32-Bit)</option>
                  <option value="CRC-16">CRC-16 (ARC / IBM • 16-Bit)</option>
                  <option value="CRC-8">CRC-8 (SMBus • 8-Bit)</option>
                </select>
              </div>

              {/* Data Payload Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Original Data Payload:
                  </label>
                  <span className="text-[10px] font-mono text-slate-400">
                    {totalBits} bits ({Math.ceil(totalBits / 8)} bytes)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Enter message stream..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors"
                />
              </div>

              {/* Error Injection Mode Radio/Dropdown Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Error Injection Mode:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'SINGLE_BIT', label: 'Single-Bit', desc: '1 Bit Flip', icon: Zap },
                    { type: 'MULTI_BIT', label: 'Multi-Bit', desc: 'Multiple Bits', icon: Layers },
                    { type: 'BURST', label: 'Burst Error', desc: 'Consecutive Bits', icon: Flame },
                    { type: 'RANDOM', label: 'Random Error', desc: 'Random Bit', icon: Dice5 }
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = errorType === mode.type;
                    return (
                      <button
                        key={mode.type}
                        type="button"
                        onClick={() => handleModeChange(mode.type)}
                        className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-rose-950/50 border-rose-500/60 text-white shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{mode.label}</span>
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-rose-400' : 'text-slate-500'}`} />
                        </div>
                        <span className="text-[10px] text-slate-500">{mode.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mode-Specific Parameters & Descriptions */}
              {errorType === 'SINGLE_BIT' && (
                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-[11px] text-slate-400 flex items-start gap-2">
                  <Zap className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>Flips bit 0 in the payload stream to evaluate single-bit error detection boundaries.</span>
                </div>
              )}

              {errorType === 'RANDOM' && (
                <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-lg text-[11px] text-slate-400 flex items-start gap-2">
                  <Dice5 className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>Uniformly selects a random bit position across all {totalBits} payload bits and inverts it.</span>
                </div>
              )}

              {errorType === 'MULTI_BIT' && (
                <div className="animate-fadeIn space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Number of Bits to Flip (bitCount):
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Max: {maxBits} bits
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={maxBits}
                    value={bitCount}
                    onChange={(e) => setBitCount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Min: 1 bit</span>
                    <span>Flips {Math.min(Number(bitCount) || 1, maxBits)} distinct distributed bits</span>
                  </div>
                </div>
              )}

              {errorType === 'BURST' && (
                <div className="animate-fadeIn space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      Consecutive Burst Length (burstLength):
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Max: {maxBits} bits
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={maxBits}
                    value={burstLength}
                    onChange={(e) => setBurstLength(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                  />
                  <div className="text-[10px] text-slate-500 flex justify-between">
                    <span>Min: 1 bit</span>
                    <span>Flips {Math.min(Number(burstLength) || 1, maxBits)} consecutive contiguous bits</span>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Injecting Bit Noise...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Inject Error & Simulate
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ================================================= */}
        {/* SIMULATION RESULTS & COMPARISON VIEW (Cols 6-12)  */}
        {/* ================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {loading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-rose-400 animate-spin" />
              <span className="font-semibold text-slate-300">Simulating Error Injection...</span>
              <span className="text-[11px] text-slate-500">Mutating bitstream and recalculating CRC on receiver frame.</span>
            </div>
          ) : simResult ? (
            <div className="space-y-6">
              
              {/* Status Header Badge */}
              <div className={`rounded-xl p-5 border shadow-lg ${
                simResult.errorDetected 
                  ? 'bg-rose-950/40 border-rose-500/40' 
                  : 'bg-emerald-950/40 border-emerald-500/40'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg border ${
                      simResult.errorDetected 
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {simResult.errorDetected ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className={`text-lg font-bold tracking-wide ${
                        simResult.errorDetected ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {simResult.status}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        {simResult.errorDetected 
                          ? 'CRC Mismatch detected. Recalculated receiver CRC does not match original CRC.'
                          : 'CRC values matched (Undetected corruption / collision).'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded font-mono">
                    {simResult.injectionId}
                  </span>
                </div>
              </div>

              {/* Before vs After Comparison Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-5">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Binary className="w-4 h-4 text-indigo-400" />
                  Original Payload vs Corrupted Payload Bit Comparison
                </h4>

                {/* Original Stream Card */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Original Data Stream:</span>
                    <span className="font-mono text-indigo-300 font-bold">"{simResult.data}"</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Original Transmitted CRC:</span>
                    <span className="font-mono text-emerald-400 font-bold">0x{simResult.originalCrc}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-500 block mb-1">Original 8-Bit Binary Stream:</span>
                    {renderHighlightedBinary(simResult.originalBinary, [])}
                  </div>
                </div>

                {/* Corrupted Stream Card */}
                <div className="bg-slate-950 border border-rose-500/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Received Payload (Post-Noise):</span>
                    <span className="font-mono text-rose-300 font-bold">"{simResult.receivedData}"</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Receiver Recalculated CRC:</span>
                    <span className="font-mono text-amber-400 font-bold">0x{simResult.calculatedCrc}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[11px] text-slate-500 block mb-1">
                      Corrupted Binary Stream (Mutated Bits Highlighted):
                    </span>
                    {renderHighlightedBinary(simResult.corruptedBinary, simResult.changedBitPositions || [])}
                  </div>
                </div>

                {/* Changed Bit Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                    <div className="text-[10px] text-slate-500 uppercase">Error Type</div>
                    <div className="font-bold text-rose-400 mt-1">{simResult.errorType}</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                    <div className="text-[10px] text-slate-500 uppercase">Bits Changed</div>
                    <div className="font-bold text-slate-200 mt-1">{simResult.changedBitCount ?? (simResult.changedBitPositions?.length || 0)} Bit(s)</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                    <div className="text-[10px] text-slate-500 uppercase">CRC Match</div>
                    <div className="font-bold text-slate-200 mt-1">{simResult.match ? 'YES' : 'NO'}</div>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                    <div className="text-[10px] text-slate-500 uppercase">Bit Positions</div>
                    <div className="font-bold text-slate-200 mt-1 truncate" title={(simResult.changedBitPositions || []).join(', ')}>
                      [{(simResult.changedBitPositions || []).join(', ')}]
                    </div>
                  </div>

                  {simResult.burstDetails && (
                    <div className="col-span-2 md:col-span-4 bg-slate-950 border border-amber-500/30 p-3 rounded-lg flex items-center justify-between">
                      <div className="text-[10px] text-amber-400 font-semibold uppercase">Burst Error Window</div>
                      <div className="font-bold text-slate-200 text-xs">
                        Bit {simResult.burstDetails.startPosition} → Bit {simResult.burstDetails.endPosition} ({simResult.burstDetails.burstLength} bits span)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-12 text-center text-xs flex flex-col items-center justify-center gap-3">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
              <span className="font-semibold text-rose-300">Simulation Error</span>
              <p className="text-slate-400 max-w-md">{errorMsg}</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-3">
              <Zap className="w-8 h-8 text-slate-700 animate-pulse" />
              <span>Select an error injection mode and click "Inject Error & Simulate" to test CRC detection.</span>
            </div>
          )}

        </div>

      </div>

      {/* Visual Pipeline Flow Indicator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-400" />
          End-to-End Error Injection & Verification Pipeline Flow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 text-center">
          {/* Step 1 */}
          <div className={`p-4 rounded-xl border ${simResult ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">1</div>
            <div className="text-xs font-bold">ORIGINAL DATA</div>
            <div className="text-[10px] opacity-75 mt-0.5">Payload Input</div>
          </div>

          {/* Step 2 */}
          <div className={`p-4 rounded-xl border ${simResult ? 'bg-blue-950/40 border-blue-500/40 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">2</div>
            <div className="text-xs font-bold">CRC GENERATED</div>
            <div className="text-[10px] opacity-75 mt-0.5">{simResult ? `0x${simResult.originalCrc}` : 'Pending'}</div>
          </div>

          {/* Step 3 */}
          <div className={`p-4 rounded-xl border ${simResult ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">3</div>
            <div className="text-xs font-bold">ERROR INJECTION</div>
            <div className="text-[10px] opacity-75 mt-0.5">{simResult ? simResult.errorType : errorType}</div>
          </div>

          {/* Step 4 */}
          <div className={`p-4 rounded-xl border ${simResult ? 'bg-amber-950/40 border-amber-500/40 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">4</div>
            <div className="text-xs font-bold">CORRUPTED DATA</div>
            <div className="text-[10px] opacity-75 mt-0.5 truncate">{simResult ? `"${simResult.receivedData}"` : 'Pending'}</div>
          </div>

          {/* Step 5 */}
          <div className={`p-4 rounded-xl border ${simResult ? 'bg-purple-950/40 border-purple-500/40 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">5</div>
            <div className="text-xs font-bold">RECEIVER CRC</div>
            <div className="text-[10px] opacity-75 mt-0.5">{simResult ? `0x${simResult.calculatedCrc}` : 'Pending'}</div>
          </div>

          {/* Step 6 */}
          <div className={`p-4 rounded-xl border ${simResult ? (simResult.errorDetected ? 'bg-rose-950/60 border-rose-500/60 text-rose-300' : 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300') : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">6</div>
            <div className="text-xs font-bold">RESULT</div>
            <div className="text-[10px] opacity-75 mt-0.5">{simResult ? simResult.status : 'Pending'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
