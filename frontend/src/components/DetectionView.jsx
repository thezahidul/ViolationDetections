import React, { useEffect, useRef } from "react";
import { Camera, AlertCircle } from "lucide-react";

export default function DetectionView({
  frontFile,
  rearFile,
  frontImageUrl,
  rearImageUrl,
  frontDetections,
  rearDetections,
  hasRun,
}) {
  const frontCanvasRef = useRef(null);
  const rearCanvasRef = useRef(null);
  
  const frontImgRef = useRef(null);
  const rearImgRef = useRef(null);

  const drawOnCanvas = (canvas, img, detections) => {
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    
    const rect = canvas.parentNode.getBoundingClientRect();
    const displayWidth = rect.width || 500;
    
    // Set canvas dimensions based on image aspect ratio
    const displayHeight = img.naturalWidth 
      ? (img.naturalHeight / img.naturalWidth) * displayWidth 
      : (3 / 4) * displayWidth;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    
    // Draw the source frame
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

    // BBox scaling factor
    const scaleX = displayWidth / img.naturalWidth;
    const scaleY = displayHeight / img.naturalHeight;

    const classColors = {
      shelter: "#3B82F6", // blue
      seating: "#10B981", // green
      sign: "#F59E0B",    // amber
    };

    if (!detections || detections.length === 0) return;

    detections.forEach((det) => {
      const bbox = det.bbox; // [x1, y1, x2, y2]
      if (!bbox || bbox.length < 4) return;

      let xmin = bbox[0];
      let ymin = bbox[1];
      let w = bbox[2];
      let h = bbox[3];

      // Detect if bbox is xyxy or xywh format
      // In main.py we return box.xyxy[0].tolist() which is [xmin, ymin, xmax, ymax]
      // If xmax (bbox[2]) is greater than xmin (bbox[0]) and they are absolute pixel values:
      if (bbox[2] > bbox[0] && bbox[3] > bbox[1]) {
        w = bbox[2] - bbox[0];
        h = bbox[3] - bbox[1];
      }

      const scaledX = xmin * scaleX;
      const scaledY = ymin * scaleY;
      const scaledW = w * scaleX;
      const scaledH = h * scaleY;

      const color = classColors[det.class] || "#8B5CF6"; // purple for vehicle/other

      // Stroke Bounding Box
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.strokeRect(scaledX, scaledY, scaledW, scaledH);

      // Draw Label Badge background
      ctx.fillStyle = color;
      const labelText = `${det.class} (${Math.round(det.confidence * 100)}%)`;
      ctx.font = "bold 11px 'Fira Code', monospace";
      const textWidth = ctx.measureText(labelText).width;
      
      ctx.fillRect(scaledX, scaledY - 18, textWidth + 8, 18);

      // Draw Label Badge text
      ctx.fillStyle = "#ffffff";
      ctx.fillText(labelText, scaledX + 4, scaledY - 5);
    });
  };

  // Re-draw when file, image url, or detections change
  useEffect(() => {
    if (frontImgRef.current) {
      if (frontImgRef.current.complete) {
        drawOnCanvas(frontCanvasRef.current, frontImgRef.current, frontDetections);
      } else {
        frontImgRef.current.onload = () => {
          drawOnCanvas(frontCanvasRef.current, frontImgRef.current, frontDetections);
        };
      }
    }
  }, [frontFile, frontImageUrl, frontDetections]);

  useEffect(() => {
    if (rearImgRef.current) {
      if (rearImgRef.current.complete) {
        drawOnCanvas(rearCanvasRef.current, rearImgRef.current, rearDetections);
      } else {
        rearImgRef.current.onload = () => {
          drawOnCanvas(rearCanvasRef.current, rearImgRef.current, rearDetections);
        };
      }
    }
  }, [rearFile, rearImageUrl, rearDetections]);

  const frontSrc = frontFile ? URL.createObjectURL(frontFile) : frontImageUrl;
  const rearSrc = rearFile ? URL.createObjectURL(rearFile) : rearImageUrl;

  const classBadges = {
    shelter: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    seating: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    sign: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
      
      {/* Front Camera Canvas Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold font-mono tracking-wide text-slate-300 flex items-center gap-2">
            <Camera className="w-4.5 h-4.5 text-blue-500" />
            FRONT CAMERA STREAM
          </h3>
          <span className="text-[10px] font-bold font-mono text-slate-500 px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
            LENS ID: FL-01
          </span>
        </div>

        <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[220px]">
          {frontSrc ? (
            <>
              <canvas ref={frontCanvasRef} className="w-full h-auto block" />
              <img
                ref={frontImgRef}
                src={frontSrc}
                alt="Front Source"
                className="hidden"
                crossOrigin="anonymous"
              />
            </>
          ) : (
            <div className="text-slate-600 flex flex-col items-center">
              <Camera className="w-12 h-12 mb-2 text-slate-700" />
              <p className="text-xs font-semibold uppercase tracking-wider">Awaiting Front Camera Frame</p>
            </div>
          )}
        </div>

        {/* Detections Summary */}
        {hasRun && frontSrc && (
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-2">
              Detections:
            </h4>
            {frontDetections && frontDetections.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {frontDetections.map((det, idx) => (
                  <span
                    key={idx}
                    className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${
                      classBadges[det.class] || "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}
                  >
                    {det.class} ({Math.round(det.confidence * 100)}%)
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <AlertCircle className="w-3.5 h-3.5" />
                No infrastructure detected in front camera field of view.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rear Camera Canvas Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold font-mono tracking-wide text-slate-300 flex items-center gap-2">
            <Camera className="w-4.5 h-4.5 text-amber-500" />
            REAR CAMERA STREAM
          </h3>
          <span className="text-[10px] font-bold font-mono text-slate-500 px-2 py-0.5 bg-slate-950 rounded border border-slate-800">
            LENS ID: RL-02
          </span>
        </div>

        <div className="relative flex-1 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center min-h-[220px]">
          {rearSrc ? (
            <>
              <canvas ref={rearCanvasRef} className="w-full h-auto block" />
              <img
                ref={rearImgRef}
                src={rearSrc}
                alt="Rear Source"
                className="hidden"
                crossOrigin="anonymous"
              />
            </>
          ) : (
            <div className="text-slate-600 flex flex-col items-center">
              <Camera className="w-12 h-12 mb-2 text-slate-700" />
              <p className="text-xs font-semibold uppercase tracking-wider">Awaiting Rear Camera Frame</p>
            </div>
          )}
        </div>

        {/* Detections Summary */}
        {hasRun && rearSrc && (
          <div className="mt-4 pt-4 border-t border-slate-800/60">
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-2">
              Detections:
            </h4>
            {rearDetections && rearDetections.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {rearDetections.map((det, idx) => (
                  <span
                    key={idx}
                    className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${
                      classBadges[det.class] || "bg-purple-500/10 text-purple-400 border-purple-500/20"
                    }`}
                  >
                    {det.class} ({Math.round(det.confidence * 100)}%)
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <AlertCircle className="w-3.5 h-3.5" />
                No infrastructure detected in rear camera field of view.
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
