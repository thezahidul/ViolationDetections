import React, { useState } from "react";
import { AlertTriangle, CheckCircle, Printer } from "lucide-react";
import { generateCitationPDF } from "../utils/pdfGenerator";

export default function VerdictMonitor({ incident, hasRun }) {
  const [downloading, setDownloading] = useState(false);

  if (!hasRun) {
    return (
      <div className="border border-dashed border-slate-800 bg-slate-900/30 rounded-2xl p-8 text-center text-slate-500 font-sans tracking-wide">
        Awaiting live ingestion streams & pipeline execution...
      </div>
    );
  }

  const { violation_status, congestion_status } = incident;
  const isViolation = violation_status.is_violation;
  const isCongested = congestion_status.traffic_congestion_detected;

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await generateCitationPDF(incident);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  // State 1: VIOLATION DETECTED
  if (isViolation) {
    return (
      <div className="animate-flash-red border-2 border-red-500/80 rounded-2xl p-6 shadow-2xl shadow-red-500/10 mb-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex items-center md:items-start gap-4">
          <div className="p-3 bg-red-600 rounded-xl text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] flex-shrink-0 animate-bounce">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-mono tracking-wide text-red-500 m-0">
              🚨 INFRACTION VERDICT: VIOLATION LOGGED
            </h2>
            <p className="text-sm font-mono text-slate-200 mt-2 font-semibold">
              {violation_status.reason}
            </p>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              Status logged to central SQLite backend. Telemetry and frames archived.
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold px-6 py-3 rounded-xl cursor-pointer shadow-lg shadow-red-600/10 transition-all duration-200 w-full md:w-auto text-center justify-center hover:-translate-y-0.5"
        >
          {downloading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <Printer className="w-5 h-5" />
          )}
          🖨️ Generate Citation Ticket
        </button>
      </div>
    );
  }

  // State 2: COMPLIANT (Congestion Exemption)
  if (isCongested) {
    return (
      <div className="border-2 border-dashed border-amber-500 bg-slate-900/80 rounded-2xl p-6 shadow-xl mb-8 flex items-start gap-4">
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500 flex-shrink-0">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-mono tracking-wide text-amber-400 m-0">
            ✅ COMPLIANT — CONGESTION EXEMPTION
          </h2>
          <p className="text-sm font-sans text-slate-300 mt-2 font-semibold leading-relaxed">
            {violation_status.reason}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-sans">
            Surrounding traffic detected using pre-trained COCO object mapping. No violation recorded.
          </p>
        </div>
      </div>
    );
  }

  // State 3: COMPLIANT (Authorized Bus Stop Zone)
  return (
    <div className="border border-emerald-500 bg-emerald-950/15 rounded-2xl p-6 shadow-xl mb-8 flex items-start gap-4">
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 flex-shrink-0">
        <CheckCircle className="w-8 h-8" />
      </div>
      <div>
        <h2 className="text-xl font-bold font-mono tracking-wide text-emerald-400 m-0">
          ✅ COMPLIANT — AUTHORIZED COMMUTER ZONE
        </h2>
        <p className="text-sm font-sans text-slate-300 mt-2 font-semibold leading-relaxed">
          {violation_status.reason}
        </p>
        <p className="text-xs text-slate-500 mt-1 font-sans">
          Valid passenger infrastructure (shelter/seating/signs) detected within visual proximity bounds.
        </p>
      </div>
    </div>
  );
}
