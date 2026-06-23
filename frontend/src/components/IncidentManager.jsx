import React from "react";
import { Eye, Trash2, Printer, CheckCircle, AlertTriangle } from "lucide-react";
import { generateCitationPDF } from "../utils/pdfGenerator";

export default function IncidentManager({
  incidents,
  onInspect,
  onUpdateStatus,
  onDelete,
  loading,
}) {
  const statusColors = {
    "Pending Review": "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Citation Issued": "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]",
    "Dismissed": "bg-slate-800 text-slate-400 border-slate-700",
    "Compliant": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };

  const handleDownloadPdf = async (e, inc) => {
    e.stopPropagation();
    try {
      await generateCitationPDF(inc);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mt-8">
      <h2 className="text-lg font-bold font-mono tracking-wide text-slate-200 mb-6 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          ENFORCEMENT MANAGEMENT DATABASE
        </span>
        <span className="text-xs font-mono text-slate-500 font-normal">
          Total Logs: {incidents.length}
        </span>
      </h2>

      {incidents.length === 0 ? (
        <div className="border border-slate-850 rounded-xl p-8 text-center text-slate-500 text-sm">
          No records discovered in SQLite database. Use the control panel to ingest test frames.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse bg-slate-950/30">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 font-mono text-xs text-slate-400 font-bold uppercase">
                <th className="px-5 py-4">Reference ID</th>
                <th className="px-5 py-4">Date / Time</th>
                <th className="px-5 py-4">Velocity</th>
                <th className="px-5 py-4">Verdict</th>
                <th className="px-5 py-4">Status / Action</th>
                <th className="px-5 py-4 text-right">Console Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm font-sans text-slate-300">
              {incidents.map((inc) => {
                const isViolation = inc.violation_status.is_violation;
                const formattedDate = new Date(inc.timestamp).toLocaleString();
                
                return (
                  <tr
                    key={inc.id}
                    className="hover:bg-slate-900/50 transition-colors duration-150 cursor-pointer group"
                    onClick={() => onInspect(inc)}
                  >
                    {/* ID */}
                    <td className="px-5 py-4 font-mono font-bold text-slate-200 group-hover:text-blue-400 transition-colors duration-150">
                      BUS-{inc.id}
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs font-mono text-slate-400">
                      {formattedDate}
                    </td>

                    {/* Speed */}
                    <td className="px-5 py-4 font-mono text-slate-300">
                      {inc.bus_speed_kmh.toFixed(1)} km/h
                    </td>

                    {/* Verdict */}
                    <td className="px-5 py-4">
                      {isViolation ? (
                        <span className="flex items-center gap-1.5 text-xs text-red-500 font-bold font-mono">
                          <AlertTriangle className="w-4 h-4" />
                          VIOLATION
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono">
                          <CheckCircle className="w-4 h-4" />
                          COMPLIANT
                        </span>
                      )}
                    </td>

                    {/* Action Status Dropdown */}
                    <td className="px-5 py-4">
                      {isViolation ? (
                        <select
                          value={inc.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onUpdateStatus(inc.id, e.target.value)}
                          className={`text-xs font-mono font-bold px-2 py-1 rounded border bg-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-700 cursor-pointer ${
                            statusColors[inc.status] || statusColors["Pending Review"]
                          }`}
                        >
                          <option value="Pending Review">Pending Review</option>
                          <option value="Citation Issued">Citation Issued</option>
                          <option value="Dismissed">Dismissed</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded border uppercase ${statusColors["Compliant"]}`}>
                          Compliant
                        </span>
                      )}
                    </td>

                    {/* Actions buttons */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        
                        {/* Inspect Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspect(inc);
                          }}
                          title="Inspect visual bounding boxes"
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all duration-200 cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* PDF Download (only for violation) */}
                        {isViolation && (
                          <button
                            onClick={(e) => handleDownloadPdf(e, inc)}
                            title="Generate PDF ticket"
                            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all duration-200 cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(inc.id);
                          }}
                          title="Purge record"
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-red-500 hover:border-red-500/30 transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
