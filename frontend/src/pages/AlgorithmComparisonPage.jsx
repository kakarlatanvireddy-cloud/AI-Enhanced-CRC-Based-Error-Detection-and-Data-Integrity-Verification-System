import React, { useState } from 'react';
import { 
  GitCompare, 
  Sparkles, 
  Cpu, 
  Copy, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  BarChart2, 
  BookOpen, 
  Info,
  ShieldAlert
} from 'lucide-react';
import { compareCrcAlgorithmsApi } from '../services/api';

export const AlgorithmComparisonPage = () => {
  const [inputData, setInputData] = useState('123456789');
  const [loading, setLoading] = useState(false);
  const [compareResult, setCompareResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedAlgo, setCopiedAlgo] = useState('');

  // Run Comparison
  const handleCompare = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (!inputData || inputData.trim() === '') {
      setErrorMsg('Please enter a data payload to compare algorithms.');
      return;
    }

    setLoading(true);
    const res = await compareCrcAlgorithmsApi(inputData);
    setLoading(false);

    if (res.success) {
      setCompareResult(res.data);
    } else {
      setErrorMsg(res.error);
    }
  };

  // Load Standard Test Vector ("123456789")
  const handleLoadTestVector = () => {
    setInputData('123456789');
    setErrorMsg('');
    setCompareResult(null);
  };

  // Copy CRC value to clipboard
  const handleCopyCrc = (algoName, crcVal) => {
    navigator.clipboard.writeText(crcVal);
    setCopiedAlgo(algoName);
    setTimeout(() => setCopiedAlgo(''), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
              <GitCompare className="w-4 h-4 text-purple-400" />
              <span>Module 04 • Fully Operational Benchmark</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">CRC Algorithm Comparison</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Comparative benchmark analyzing CRC-8, CRC-16, and CRC-32 polynomial parameters and calculated checksum values for identical payload streams.
            </p>
          </div>

          <button
            onClick={handleLoadTestVector}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-950/80 hover:bg-purple-900/80 border border-purple-700/50 text-purple-300 rounded-lg text-xs font-semibold transition-all self-start md:self-auto shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Load Test Vector ("123456789")
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <form onSubmit={handleCompare} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Data Payload for Algorithm Comparison:</span>
              <span className="text-[10px] text-slate-500 font-mono">
                ASCII Payload Input
              </span>
            </label>
            <textarea
              rows={3}
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="Enter text payload..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Executing Multi-Algorithm CRC Evaluation...
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4" />
                Compare CRC Algorithms
              </>
            )}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {compareResult && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Comparative Checksum Output Table
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="pb-3 px-4">Algorithm Standard</th>
                    <th className="pb-3 px-4 text-right">Bit Width</th>
                    <th className="pb-3 px-4">Generated CRC Value (Hex)</th>
                    <th className="pb-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {compareResult.results.map((row) => (
                    <tr key={row.algorithm} className="hover:bg-slate-950/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        {row.name}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-purple-400">
                        {row.width}-bit
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold text-sm tracking-wider">
                        0x{row.crc}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleCopyCrc(row.algorithm, row.crc)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-sans inline-flex items-center gap-1 transition-colors"
                        >
                          {copiedAlgo === row.algorithm ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Algorithm Info Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {compareResult.results.map((res) => (
              <div 
                key={res.algorithm} 
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <h4 className="text-sm font-bold text-slate-100">{res.algorithm}</h4>
                    <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded">
                      {res.width}-bit Checksum
                    </span>
                  </div>

                  {/* Generated CRC Display */}
                  <div className="bg-slate-950 border border-purple-500/30 rounded-lg p-3 text-center mb-4">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Calculated CRC</div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">0x{res.crc}</div>
                  </div>

                  {/* Parameter Details List */}
                  <div className="space-y-2 text-xs font-mono text-slate-300">
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-500">Polynomial:</span>
                      <span className="font-bold text-slate-200">{res.details.poly}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-500">Initial Value:</span>
                      <span className="font-bold text-slate-200">{res.details.init}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800/60 pb-1">
                      <span className="text-slate-500">Ref In / Out:</span>
                      <span className="font-bold text-slate-200">{String(res.details.refIn)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">XOR Out:</span>
                      <span className="font-bold text-slate-200">{res.details.xorOut}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Visual CRC Width Comparison Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              Visual CRC Checksum Width Scaling
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div>
                <div className="flex justify-between mb-1 text-slate-400 text-[11px]">
                  <span>CRC-8 (1 Byte Checksum)</span>
                  <span className="text-purple-400 font-bold">8 bits</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: '25%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 text-slate-400 text-[11px]">
                  <span>CRC-16 (2 Bytes Checksum)</span>
                  <span className="text-purple-400 font-bold">16 bits</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: '50%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 text-slate-400 text-[11px]">
                  <span>CRC-32 (4 Bytes Checksum)</span>
                  <span className="text-purple-400 font-bold">32 bits</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Educational Insights Box */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-md flex items-start gap-4">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg shrink-0 mt-0.5 border border-purple-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                What does the comparison show?
              </h4>
              <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside leading-relaxed">
                <li>All three algorithms process the identical payload stream (<code className="text-purple-300 bg-slate-950 px-1 py-0.5 rounded font-mono">"{compareResult.data}"</code>).</li>
                <li>Each algorithm produces a checksum value determined by its specific polynomial and reflection parameters.</li>
                <li>CRC width determines the size of the resulting checksum: CRC-8 produces an 8-bit checksum (1 byte), CRC-16 produces a 16-bit checksum (2 bytes), and CRC-32 produces a 32-bit checksum (4 bytes).</li>
                <li>Selecting a CRC polynomial represents a design trade-off between transmission byte overhead and mathematical error detection space across specific frame lengths.</li>
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
