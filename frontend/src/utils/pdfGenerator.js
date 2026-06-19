import { jsPDF } from "jspdf";

/**
 * Helper to fetch image from URL and convert it to Base64
 */
const getBase64ImageFromUrl = async (imageUrl) => {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load image for PDF:", error);
    return null;
  }
};

/**
 * Generates and downloads a system citation PDF
 */
export const generateCitationPDF = async (incident) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = margin;

  // Header Title Panel (Red Theme for Violation)
  doc.setFillColor(220, 38, 38); // red-600
  doc.rect(margin, y, pageWidth - (margin * 2), 22, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SMART TRAFFIC ENFORCEMENT SYSTEM", margin + 5, y + 9);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("OFFICIAL BUS STOP VIOLATION CITATION", margin + 5, y + 16);
  
  y += 30;

  // Citation Metadata Info Panel
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CITATION METADATA", margin, y);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const textLeft = margin + 5;
  const textRight = pageWidth / 2 + 5;
  
  const formattedDate = new Date(incident.timestamp).toLocaleString();
  const refId = `BUS-${incident.id}-${Math.floor(1000 + Math.random() * 9000)}`;

  doc.text(`Reference ID: ${refId}`, textLeft, y);
  doc.text(`Recorded Date: ${formattedDate}`, textRight, y);
  
  y += 6;
  doc.text(`Vehicle Speed: ${incident.bus_speed_kmh} km/h`, textLeft, y);
  doc.text(`Enforcement Status: ${incident.status}`, textRight, y);
  
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("VIOLATION REASON & FINDINGS:", margin, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  const splitReason = doc.splitTextToSize(incident.violation_status.reason, pageWidth - (margin * 2) - 4);
  doc.text(splitReason, margin + 2, y);
  
  y += (splitReason.length * 5) + 8;

  // Detections Summary Table
  doc.setFont("helvetica", "bold");
  doc.text("AI CAMERA TARGET DETECTION SUMMARY", margin, y);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 8;

  const fDetections = incident.infrastructure_detections_front || [];
  const rDetections = incident.infrastructure_detections_rear || [];
  const fLabels = fDetections.map(d => `${d.class} (${Math.round(d.confidence * 100)}%)`).join(", ") || "None Detected";
  const rLabels = rDetections.map(d => `${d.class} (${Math.round(d.confidence * 100)}%)`).join(", ") || "None Detected";

  doc.setFont("helvetica", "bold");
  doc.text("Front View Detections:", textLeft, y);
  doc.setFont("helvetica", "normal");
  doc.text(fLabels, textLeft + 45, y);
  
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Rear View Detections:", textLeft, y);
  doc.setFont("helvetica", "normal");
  doc.text(rLabels, textLeft + 45, y);

  y += 12;

  // Visual Evidence Panel (Images)
  doc.setFont("helvetica", "bold");
  doc.text("VISUAL OPTICAL EVIDENCE", margin, y);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 8;

  // Load front and rear images
  const frontBase64 = incident.front_image_url ? await getBase64ImageFromUrl(incident.front_image_url) : null;
  const rearBase64 = incident.rear_image_url ? await getBase64ImageFromUrl(incident.rear_image_url) : null;

  const imgWidth = (pageWidth - (margin * 2) - 10) / 2; // Split page width
  const imgHeight = (imgWidth * 3) / 4; // 4:3 aspect ratio

  if (frontBase64) {
    try {
      doc.addImage(frontBase64, "JPEG", margin, y, imgWidth, imgHeight);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("LENS NODE: FRONT CAMERA", margin + 2, y + imgHeight + 4);
    } catch (e) {
      console.error(e);
      doc.text("[Front image render failed]", margin + 5, y + 10);
    }
  } else {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, imgWidth, imgHeight, "F");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.text("No Front Camera Frame", margin + 10, y + 15);
  }

  if (rearBase64) {
    try {
      doc.addImage(rearBase64, "JPEG", margin + imgWidth + 10, y, imgWidth, imgHeight);
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("LENS NODE: REAR CAMERA", margin + imgWidth + 12, y + imgHeight + 4);
    } catch (e) {
      console.error(e);
      doc.text("[Rear image render failed]", margin + imgWidth + 15, y + 10);
    }
  } else {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin + imgWidth + 10, y, imgWidth, imgHeight, "F");
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(9);
    doc.text("No Rear Camera Frame", margin + imgWidth + 20, y + 15);
  }

  // Footer Citation Notice
  doc.setTextColor(71, 85, 105);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(
    `smart-enforcement-citation-id: ${refId}. This citation is system-generated and verified using Dual-Model YOLOv11 analysis.`,
    margin,
    pageHeight - 12
  );

  doc.save(`Citation_${refId}.pdf`);
};
