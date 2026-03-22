import React, { useState, useEffect } from 'react';

function App() {
  const [incidents, setIncidents] = useState([]);
  const [resolvedIncidents, setResolvedIncidents] = useState([]); 
  const [loading, setLoading] = useState(true);
  
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [manualResolution, setManualResolution] = useState("");

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/incidents');
        const data = await response.json();
        setIncidents(data);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch initial incidents:", err); // FIXED: Used 'err'
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  const handleTriggerAI = async (incident) => {
    setSelectedIncident(incident);
    setIsAnalyzing(true);
    setAiResult(null);
    setIsOverrideMode(false);

    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error_log: incident.error_log }),
      });
      const analysisData = await response.json();
      setTimeout(() => { setIsAnalyzing(false); setAiResult(analysisData); }, 1500);
    } catch (err) {
      console.error("AI Analysis failed:", err); // FIXED: Used 'err'
      setIsAnalyzing(false);
    }
  };

  const closeAnalysis = () => {
    setSelectedIncident(null);
    setAiResult(null);
    setIsOverrideMode(false);
    setManualResolution("");
  };

  const handleApproveFix = async () => {
    try {
      await fetch(`http://localhost:8000/api/incidents/${selectedIncident.id}/resolve`, { method: 'PUT' });
      setResolvedIncidents([{...selectedIncident, resolvedAt: new Date().toLocaleTimeString()}, ...resolvedIncidents]);
      setIncidents(prev => prev.filter(inc => inc.id !== selectedIncident.id));
      closeAnalysis();
    } catch (err) {
      console.error("Resolution failed:", err);
    }
  };

  const handleTeachAI = async () => {
    try {
      await fetch(`http://localhost:8000/api/incidents/${selectedIncident.id}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error_log: selectedIncident.error_log, 
          new_resolution: manualResolution 
        }),
      });
      setResolvedIncidents([{...selectedIncident, resolvedAt: new Date().toLocaleTimeString(), note: "Manual Override"}, ...resolvedIncidents]);
      setIncidents(prev => prev.filter(inc => inc.id !== selectedIncident.id));
      closeAnalysis();
    } catch (err) {
      console.error("Failed to teach AI:", err);
    }
  };

  const handleRollback = async (incidentToRollback) => {
    try {
      await fetch(`http://localhost:8000/api/incidents/${incidentToRollback.id}/rollback`, { method: 'PUT' });
      setResolvedIncidents(prev => prev.filter(inc => inc.id !== incidentToRollback.id));
      setIncidents([{...incidentToRollback, status: "Rolled Back"}, ...incidents]);
    } catch (err) {
      console.error("Rollback failed:", err);
    }
  };

  const formatConfidence = (confString) => {
    const num = parseFloat(confString);
    return isNaN(num) ? "0%" : `${num.toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen p-8 bg-slate-950 text-white font-sans">
      <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">ResolveX <span className="text-emerald-500">AI</span></h1>
          <p className="text-slate-400">Enterprise Incident Command Center</p>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="max-w-5xl mx-auto mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg border-t-4 border-t-emerald-500">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">MTTR Reduction</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-white">85<span className="text-xl">%</span></h3>
            <p className="text-emerald-400 text-sm font-medium mb-1">↓ from 4 hrs to 2 mins</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg border-t-4 border-t-blue-500">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">L1 Tickets Deflected</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-white">420</h3>
            <p className="text-blue-400 text-sm font-medium mb-1">This Week</p>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg border-t-4 border-t-purple-500">
          <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-1">Est. Cost Saved</p>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-white"><span className="text-xl">$</span>12.5<span className="text-xl">k</span></h3>
            <p className="text-purple-400 text-sm font-medium mb-1">Monthly</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 border-b border-slate-800 pb-2">Active & Predicted Alerts</h2>
        
        {/* FIXED: Using 'loading' state here */}
        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse border border-slate-800 rounded-xl bg-slate-900">
            Scanning enterprise systems for anomalies...
          </div>
        ) : (
          <div className="grid gap-4 mb-10">
            {incidents.map((incident) => (
              <div key={incident.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-slate-800">{incident.id}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wider ${incident.severity === 'Warning' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {incident.severity}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-slate-100">{incident.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">Status: {incident.status}</p>
                </div>
                <button onClick={() => handleTriggerAI(incident)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium cursor-pointer">
                  Trigger AI Copilot
                </button>
              </div>
            ))}
          </div>
        )}

        {resolvedIncidents.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-4 border-b border-slate-800 pb-2 text-slate-300">Execution Audit Trail</h2>
            <div className="grid gap-4">
              {resolvedIncidents.map((incident, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between opacity-80">
                  <div>
                    <span className="text-emerald-400 font-bold text-sm mr-2">✓ Resolved at {incident.resolvedAt}</span>
                    <span className="text-slate-300">{incident.id} - {incident.title} {incident.note && `(${incident.note})`}</span>
                  </div>
                  <button onClick={() => handleRollback(incident)} className="bg-red-900/30 hover:bg-red-900/60 text-red-400 border border-red-900 px-4 py-1 rounded-lg text-sm transition-colors cursor-pointer">
                    Emergency Rollback
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODAL */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
              <h3 className="text-xl font-bold"><span className="text-emerald-400">⚡ AI Copilot</span> | {selectedIncident.id}</h3>
              <button onClick={closeAnalysis} className="text-slate-400 hover:text-white text-2xl cursor-pointer">&times;</button>
            </div>

            <div className="p-8 min-h-[300px]">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-300 animate-pulse">Running semantic vector search...</p>
                </div>
              ) : isOverrideMode ? (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <p className="text-slate-300">Enter the manual L2 remediation script. The AI will learn this resolution for future identical incidents.</p>
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-4 text-emerald-400 font-mono text-sm focus:outline-none focus:border-emerald-500"
                    rows="4"
                    placeholder="e.g., Increase disk volume by 50GB and clear /tmp/logs directory..."
                    value={manualResolution}
                    onChange={(e) => setManualResolution(e.target.value)}
                  ></textarea>
                </div>
              ) : aiResult && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Root Cause Analysis</p>
                    <p className="text-slate-300">{aiResult.rootCause}</p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex-1">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Confidence</p>
                      <p className="text-emerald-400 font-bold text-2xl">{formatConfidence(aiResult.confidence)}</p>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex-1">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">MTTR Saved</p>
                      <p className="text-emerald-400 font-bold text-2xl">{aiResult.estimatedTimeSaved}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-900/20 p-4 rounded-lg border border-emerald-500/30">
                    <p className="text-xs text-emerald-500 uppercase font-bold tracking-wider mb-2">Recommended Fix</p>
                    <code className="text-emerald-300 block font-mono text-sm bg-black/40 p-3 rounded">{aiResult.recommendedAction}</code>
                  </div>
                </div>
              )}
            </div>

            {!isAnalyzing && (
              <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-4">
                {isOverrideMode ? (
                  <>
                    <button onClick={() => setIsOverrideMode(false)} className="px-6 py-2 rounded-lg font-medium text-slate-400 cursor-pointer">Cancel</button>
                    <button onClick={handleTeachAI} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(37,99,235,0.3)] cursor-pointer">
                      Save, Teach AI & Resolve
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsOverrideMode(true)} className="px-6 py-2 rounded-lg font-medium text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer">
                      Reject & Teach AI
                    </button>
                    <button onClick={handleApproveFix} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-medium shadow-[0_0_15px_rgba(5,150,105,0.3)] cursor-pointer">
                      Approve & Execute Fix
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;