import React from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

export default function TrafficContextPanel({
  congestionDetected,
  frontVerified,
  rearVerified,
  hasRun,
}) {
  if (!hasRun) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl mb-8">
      <h3 className="text-xs font-bold font-mono tracking-wider text-slate-400 uppercase mb-4 flex items-center gap-1.5">
        <Info className="w-4 h-4 text-sky-400" />
        Intelligent Traffic Context Analytics
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Congestion Status Card */}
        <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block">
            CONGESTION FILTER
          </span>
          {congestionDetected ? (
            <div className="flex items-center gap-3 animate-pulse border border-amber-500/25 bg-amber-500/5 rounded-lg px-3 py-2 text-amber-500">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs font-semibold leading-tight">
                Traffic Congestion Active<br />
                <span className="text-[10px] opacity-70 font-mono">Enforcement Suspended</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 border border-emerald-500/25 bg-emerald-500/5 rounded-lg px-3 py-2 text-emerald-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs font-semibold leading-tight">
                Traffic Flow Normal<br />
                <span className="text-[10px] opacity-70 font-mono">Enforcement Active</span>
              </div>
            </div>
          )}
        </div>

        {/* Front Infrastructure Verification */}
        <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block">
            FRONT ZONE CONTEXT
          </span>
          {frontVerified ? (
            <div className="flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/5 rounded-lg px-3 py-2 text-emerald-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs font-semibold leading-tight">
                Front Infrastructure<br />
                <span className="text-[10px] font-bold font-mono">VERIFIED</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 border border-red-500/20 bg-red-500/5 rounded-lg px-3 py-2 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs font-semibold leading-tight">
                Front Infrastructure<br />
                <span className="text-[10px] font-bold font-mono">UNVERIFIED</span>
              </div>
            </div>
          )}
        </div>

        {/* Rear Infrastructure Verification */}
        <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-4 flex flex-col justify-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2 block">
            REAR ZONE CONTEXT
          </span>
          {rearVerified ? (
            <div className="flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/5 rounded-lg px-3 py-2 text-emerald-400">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs font-semibold leading-tight">
                Rear Infrastructure<br />
                <span className="text-[10px] font-bold font-mono">VERIFIED</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 border border-red-500/20 bg-red-500/5 rounded-lg px-3 py-2 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs font-semibold leading-tight">
                Rear Infrastructure<br />
                <span className="text-[10px] font-bold font-mono">UNVERIFIED</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
