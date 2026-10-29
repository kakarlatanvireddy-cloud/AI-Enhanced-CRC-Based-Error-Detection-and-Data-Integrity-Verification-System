import React, { useState } from 'react';
import { 
  Radio, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Server, 
  Cpu, 
  ShieldCheck, 
  RefreshCw, 
  Activity,
  Layers,
  FileText,
  Clock,
  Zap
} from 'lucide-react';
import { sendTransmissionApi } from '../services/api';

export const TransmissionSimPage = () => {
  const [inputData, setInputData] = useState('HELLO TRANSMISSION');
  const [algorithm, setAlgorithm] = useState('CRC-32');
  const [loading, setLoading] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Transmission Trigger
  const handleTransmit = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!inputData || inputData.trim() === '') {
      setErrorMsg('Please enter a data payload to transmit.');
      return;
    }

    setLoading(true);
    const res = await sendTransmissionApi(inputData, algorithm);
    setLoading(false);

    if (res.success) {
      setTxResult(res.data.transmission);
    } else {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
              <Radio className="w-4 h-4 text-blue-400" />
              <span>Module 02 • Fully Operational Simulator</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Real-Time Transmission Simulator</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Simulate end-to-end digital packet streaming from Sender to Receiver across standard channels with real-time CRC verification.
            </p>
          </div>

          <div className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-medium self-start md:self-auto flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            <span>Channel: Clean Stream (Noise Injected in Mod 3)</span>
          </div>
        </div>
      </div>

      {/* Main Form & Interactive Flow Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ================================================= */}
        {/* SENDER PANEL (Cols 1-5)                           */}
        {/* ================================================= */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col justify-between">
          <div className="space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                Sender Node (Transmitter)
              </h3>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                TX Unit
              </span>
            </div>

            <form onSubmit={handleTransmit} className="space-y-4">
              {/* Algorithm Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  CRC Standard Polynomial:
                </label>
                <select
                  value={algorithm}
                  onChange={(e) => setAlgorithm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                >
                  <option value="CRC-32">CRC-32 (IEEE 802.3 • 32-Bit)</option>
                  <option value="CRC-16">CRC-16 (ARC / IBM • 16-Bit)</option>
                  <option value="CRC-8">CRC-8 (SMBus • 8-Bit)</option>
                </select>
              </div>

              {/* Data Input Text Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payload Stream to Transmit:
                </label>
                <textarea
                  rows={4}
                  value={inputData}
                  onChange={(e) => setInputData(e.target.value)}
                  placeholder="Enter message stream..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Transmit Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Streaming Digital Frame...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Transmit Data Frame
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sender Payload Details */}
          {txResult && (
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
              <div className="text-[11px] font-semibold text-slate-400">Sender Frame Payload:</div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 space-y-1">
                <div>Original Data: <span className="text-blue-300 font-bold">"{txResult.data}"</span></div>
                <div>Sender CRC: <span className="text-emerald-400 font-bold">0x{txResult.generatedCrc}</span></div>
                <div className="text-[10px] text-slate-500 truncate mt-1">Binary: {txResult.binaryData}</div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* RECEIVER PANEL & DETAILS (Cols 6-12)               */}
        {/* ================================================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Receiver Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Receiver Node (Verification)
              </h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                RX Unit
              </span>
            </div>

            {txResult ? (
              <div className="space-y-4">
                {/* Result Status Badge */}
                <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-400 tracking-wide">
                        VALID DATA (CRC MATCH)
                      </div>
                      <div className="text-xs text-emerald-300/80 mt-0.5">
                        Transmitted packet arrived intact. Calculated CRC matches expected CRC.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Receiver Breakdown Card */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs space-y-2 text-slate-300">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Received Payload:</span>
                    <span className="text-slate-100 font-bold">"{txResult.receivedData}"</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-slate-400">Transmitted CRC:</span>
                    <span className="text-indigo-400 font-bold">0x{txResult.transmittedCrc}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Receiver Calculated CRC:</span>
                    <span className="text-emerald-400 font-bold">0x{txResult.calculatedCrc}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <Radio className="w-8 h-8 text-slate-700 animate-pulse" />
                <span>Ready for transmission simulation. Enter a payload and click "Transmit Data".</span>
              </div>
            )}
          </div>

          {/* Transmission Metadata Details Card */}
          {txResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                Transmission Protocol Telemetry Details
              </h4>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase">Transmission ID</div>
                  <div className="font-bold text-indigo-400 mt-1">{txResult.transmissionId}</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase">Algorithm</div>
                  <div className="font-bold text-slate-200 mt-1">{txResult.algorithm}</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase">Payload Size</div>
                  <div className="font-bold text-slate-200 mt-1">{txResult.payloadSize} Bytes</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase">Status</div>
                  <div className="font-bold text-emerald-400 mt-1">{txResult.status}</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase">Error Detected</div>
                  <div className="font-bold text-emerald-400 mt-1">{txResult.errorDetected ? 'YES' : 'NO'}</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg">
                  <div className="text-[10px] text-slate-500 uppercase">Channel Noise</div>
                  <div className="font-bold text-slate-400 mt-1 truncate">0.00% (Clean)</div>
                </div>
              </div>

              <div className="mt-4 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-3 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Timestamp: {txResult.timestamp}
                </span>
                <span>Module 02 Telemetry Active</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Visual Pipeline Transmission Flow Indicator */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          End-to-End Transmission Pipeline Flow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
          {/* Step 1: Sender */}
          <div className={`p-4 rounded-xl border transition-all ${
            txResult ? 'bg-blue-950/40 border-blue-500/40 text-blue-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">1</div>
            <div className="text-xs font-bold">SENDER</div>
            <div className="text-[10px] opacity-75 mt-0.5">Payload Prepared</div>
          </div>

          {/* Step 2: CRC Generated */}
          <div className={`p-4 rounded-xl border transition-all ${
            txResult ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">2</div>
            <div className="text-xs font-bold">CRC GENERATED</div>
            <div className="text-[10px] opacity-75 mt-0.5">{txResult ? `0x${txResult.generatedCrc}` : 'Pending'}</div>
          </div>

          {/* Step 3: Channel Stream */}
          <div className={`p-4 rounded-xl border transition-all ${
            txResult ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">3</div>
            <div className="text-xs font-bold">CHANNEL STREAM</div>
            <div className="text-[10px] opacity-75 mt-0.5">Packet Transmitted</div>
          </div>

          {/* Step 4: Receiver */}
          <div className={`p-4 rounded-xl border transition-all ${
            txResult ? 'bg-teal-950/40 border-teal-500/40 text-teal-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">4</div>
            <div className="text-xs font-bold">RECEIVER</div>
            <div className="text-[10px] opacity-75 mt-0.5">Frame Ingested</div>
          </div>

          {/* Step 5: CRC Verified */}
          <div className={`p-4 rounded-xl border transition-all ${
            txResult ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
          }`}>
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 text-xs font-bold">5</div>
            <div className="text-xs font-bold">CRC VERIFIED</div>
            <div className="text-[10px] opacity-75 mt-0.5">{txResult ? 'Match Confirmed' : 'Pending'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
