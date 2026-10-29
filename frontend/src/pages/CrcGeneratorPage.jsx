import React, { useState } from 'react';
import { 
  Binary, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  FileCode,
  Info
} from 'lucide-react';
import { generateCrcApi, verifyCrcApi } from '../services/api';

export const CrcGeneratorPage = () => {
  // --- State for Generation ---
  const [inputData, setInputData] = useState('123456789');
  const [algorithm, setAlgorithm] = useState('CRC-32');
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [genError, setGenError] = useState('');
  const [copiedCrc, setCopiedCrc] = useState(false);

  // --- State for Verification ---
  const [rxData, setRxData] = useState('');
  const [rxAlgorithm, setRxAlgorithm] = useState('CRC-32');
  const [rxExpectedCrc, setRxExpectedCrc] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState('');

  // Handle CRC Generation
  const handleGenerate = async (e) => {
    e?.preventDefault();
    setGenError('');
    setGenResult(null);

    if (!inputData) {
      setGenError('Please enter data payload to generate CRC.');
      return;
    }

    setGenLoading(true);
    const res = await generateCrcApi(inputData, algorithm);
    setGenLoading(false);

    if (res.success) {
      setGenResult(res.data);
      // Auto-populate verification fields for seamless testing workflow
      setRxData(res.data.data);
      setRxAlgorithm(res.data.algorithm);
      setRxExpectedCrc(res.data.crc);
      setVerifyResult(null); // Reset previous verification result
    } else {
      setGenError(res.error);
    }
  };

  // Handle CRC Verification
  const handleVerify = async (e) => {
    e?.preventDefault();
    setVerifyError('');
    setVerifyResult(null);

    if (!rxData) {
      setVerifyError('Please enter received data payload.');
      return;
    }

    if (!rxExpectedCrc) {
      setVerifyError('Please enter the expected CRC value.');
      return;
    }

    setVerifyLoading(true);
    const res = await verifyCrcApi(rxData, rxAlgorithm, rxExpectedCrc);
    setVerifyLoading(false);

    if (res.success) {
      setVerifyResult(res.data);
    } else {
      setVerifyError(res.error);
    }
  };

  // Load Standard Test Vector ("123456789" -> CRC-32)
  const handleLoadTestVector = () => {
    setInputData('123456789');
    setAlgorithm('CRC-32');
    setGenResult(null);
    setGenError('');
  };

  // Copy CRC to clipboard
  const handleCopyCrc = () => {
    if (genResult?.crc) {
      navigator.clipboard.writeText(genResult.crc);
      setCopiedCrc(true);
      setTimeout(() => setCopiedCrc(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
              <Binary className="w-4 h-4 text-indigo-400" />
              <span>Module 01 • Fully Operational Engine</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">CRC Generator & Verifier</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Mathematical bitwise polynomial division engine supporting standard CRC-8, CRC-16, and CRC-32 algorithms.
            </p>
          </div>

          <button
            onClick={handleLoadTestVector}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 rounded-lg text-xs font-semibold transition-all self-start md:self-auto shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Load Test Vector ("123456789")
          </button>
        </div>
      </div>

      {/* Main Grid: Generation & Verification side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ================================================= */}
        {/* SECTION 1: CRC GENERATION                          */}
        {/* ================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                1. CRC Generation Engine
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                Transmitter Side
              </span>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Algorithm Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select CRC Algorithm:
                </label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="CRC-32">CRC-32 (IEEE 802.3 • Poly 0x04C11DB7)</option>
                  <option value="CRC-16">CRC-16 (ARC / IBM • Poly 0x8005)</option>
                  <option value="CRC-8">CRC-8 (SMBus • Poly 0x07)</option>
                </select>
              </div>

              {/* Payload Data Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Data Payload Input:
                </label>
                <textarea
                  rows={4}
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Enter text string to encode..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Error Banner */}
              {genError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{genError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={genLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {genLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Computing Polynomial Checksum...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    Generate CRC Checksum
                  </>
                )}
              </button>
            </form>

            {/* Generated Output Display */}
            {genResult && (
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    CRC Generated Successfully
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
                    {genResult.algorithm}
                  </span>
                </div>

                {/* Generated Checksum Card */}
                <div className="bg-slate-950 border border-indigo-500/30 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Generated CRC Hex Value
                    </div>
                    <div className="text-xl font-bold font-mono text-indigo-400 mt-0.5 tracking-wider">
                      0x{genResult.crc}
                    </div>
                  </div>
                  <button
                    onClick={handleCopyCrc}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                    title="Copy CRC"
                  >
                    {copiedCrc ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-[11px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Binary Payload Representation */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    Binary Stream Representation (ASCII 8-Bit Blocks):
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-nowrap">
                    {genResult.binaryData}
                  </div>
                </div>

                {/* Polynomial Parameters Breakdown */}
                {genResult.details && (
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-[11px] text-slate-400 grid grid-cols-2 gap-2 font-mono">
                    <div>Poly: <span className="text-slate-200">{genResult.details.poly}</span></div>
                    <div>Init: <span className="text-slate-200">{genResult.details.init}</span></div>
                    <div>Ref In/Out: <span className="text-slate-200">{String(genResult.details.refIn)}</span></div>
                    <div>XOR Out: <span className="text-slate-200">{genResult.details.xorOut}</span></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ================================================= */}
        {/* SECTION 2: CRC VERIFICATION                        */}
        {/* ================================================= */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                2. CRC Verification Engine
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                Receiver Side
              </span>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              {/* Algorithm Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Algorithm to Verify:
                </label>
                <select
                  value={rxAlgorithm}
                  onChange={(e) => setRxAlgorithm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="CRC-32">CRC-32 (IEEE 802.3)</option>
                  <option value="CRC-16">CRC-16 (ARC / IBM)</option>
                  <option value="CRC-8">CRC-8 (SMBus)</option>
                </select>
              </div>

              {/* Received Data Input (Editable to simulate corruption) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Received Data Payload:</span>
                  <span className="text-[10px] text-amber-400 font-normal">
                    (Edit character to test error detection)
                  </span>
                </label>
                <textarea
                  rows={3}
                  value={rxData}
                  onChange={(e) => setRxData(e.target.value)}
                  placeholder="Enter received data stream..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>

              {/* Expected CRC Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Expected CRC Checksum (Hex):
                </label>
                <input
                  type="text"
                  value={rxExpectedCrc}
                  onChange={(e) => setRxExpectedCrc(e.target.value)}
                  placeholder="e.g. CBF43926"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors uppercase"
                />
              </div>

              {/* Error Banner */}
              {verifyError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              {/* Verify Button */}
              <button
                type="submit"
                disabled={verifyLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {verifyLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Validating Payload Integrity...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Verify Payload Integrity
                  </>
                )}
              </button>
            </form>

            {/* Verification Result Display */}
            {verifyResult && (
              <div className="mt-6 pt-6 border-t border-slate-800 space-y-4 animate-fadeIn">
                {verifyResult.match ? (
                  // VALID DATA RESULT
                  <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-emerald-400 tracking-wide">
                          VALID DATA
                        </div>
                        <div className="text-xs text-emerald-300/80 mt-0.5">
                          Payload integrity verified. No bit errors detected.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-800/40 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>Calculated: <span className="text-emerald-300 font-bold">0x{verifyResult.calculatedCrc}</span></div>
                      <div>Expected: <span className="text-emerald-300 font-bold">0x{verifyResult.expectedCrc}</span></div>
                    </div>
                  </div>
                ) : (
                  // ERROR DETECTED RESULT
                  <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                        <AlertTriangle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-rose-400 tracking-wide">
                          ERROR DETECTED
                        </div>
                        <div className="text-xs text-rose-300/80 mt-0.5">
                          Checksum mismatch! Data corruption detected during transmission.
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-rose-800/40 grid grid-cols-2 gap-2 text-xs font-mono">
                      <div>Calculated: <span className="text-rose-400 font-bold">0x{verifyResult.calculatedCrc}</span></div>
                      <div>Expected: <span className="text-amber-400 font-bold">0x{verifyResult.expectedCrc}</span></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Information Box on Standard Test Vectors */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0 mt-0.5">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-200">Standard Test Vector Validation:</span> Entering data payload <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">"123456789"</code> with algorithm <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">CRC-32</code> evaluates to the exact IEEE 802.3 standard checksum <code className="text-indigo-300 bg-slate-950 px-1.5 py-0.5 rounded font-mono">CBF43926</code>. 
        </div>
      </div>
    </div>
  );
};
