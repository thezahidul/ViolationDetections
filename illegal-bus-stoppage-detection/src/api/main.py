import os
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from ultralytics import YOLO

app = FastAPI(
    title="Smart Bus Violation Detection API",
    description="API for detecting illegal bus stoppage behavior using YOLOv11 and contextual edge logic.",
    version="1.0.0"
)

# Relative path navigation from src/api/ to weights/best.pt
api_dir = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(os.path.join(api_dir, "..", "..", "weights", "best.pt"))

if not os.path.exists(MODEL_PATH):
    print(f"[Warning] YOLOv11 weight file not found at: {MODEL_PATH}. Please check folder paths.")

# Load the custom-trained YOLOv11 model
model = YOLO(MODEL_PATH)

@app.get("/", tags=["Root"])
def read_root():
    """
    Root endpoint to verify API health and deployment status.
    """
    return {
        "project": "AI-Based Detection of Illegal Bus Stoppage Behavior",
        "status": "Healthy",
        "version": "1.0.0"
    }

@app.post("/predict", tags=["Detection & Traffic Enforcement"])
async def predict_and_check_violation(
    speed: float = Form(..., description="Current live speed of the bus captured via GPS/optical flow in km/h"),
    file: UploadFile = File(..., description="Side-view image from the onboard bus camera system")
):
    """
    Core algorithm endpoint: Receives real-time physical variables (speed) and 
    side-view visual feeds to determine illegal traffic stoppage patterns.
    """
    # 1. Initialize temporary directory for incoming binary data streams
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, file.filename)
    
    # Write file stream to disk
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # 2. Run real-time visual inference via YOLOv11
        results = model.predict(source=temp_file_path, save=False, conf=0.4)
        
        detections = []
        has_legal_infrastructure = False
        
        # Parse inference tensors
        for r in results:
            for box in r.boxes:
                class_id = int(box.cls)
                class_name = model.names[class_id]
                confidence = float(box.conf)
                bbox = box.xyxy[0].tolist()  # Extract boundaries and flatten nested structure
                
                detections.append({
                    "class": class_name,
                    "confidence": round(confidence, 2),
                    "bbox": bbox
                })
                
                # Check for legal infrastructure context matching your dataset annotations
                if class_name in ["shelter", "bus_stop_sign", "bus_stop"]:
                    has_legal_infrastructure = True
                    
        # 3. Apply Traffic Violation Logic
        violation_detected = False
        reason = "Normal operation: vehicle is in motion or legally stationary."
        
        if speed == 0:
            if not has_legal_infrastructure:
                violation_detected = True
                reason = "Violation Detected: Vehicle is static (Speed=0 km/h) without context validation of a passenger shelter/sign in side-view camera."
            else:
                reason = "Vehicle is stationary within an authorized commuter zone (passenger shed/stop detected)."
        else:
            reason = "Vehicle status: Operational movement tracked."

        # 4. Storage cleanup post-processing
        os.remove(temp_file_path)
        
        # 5. Build and return optimized JSON payload
        return {
            "filename": file.filename,
            "bus_speed_kmh": speed,
            "detections": detections,
            "violation_status": {
                "is_violation": violation_detected,
                "reason": reason
            }
        }

    except Exception as e:
        # Emergency pipeline cleanup in case of execution failure
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Inference execution engine error: {str(e)}")
    