import os
import shutil
import logging
import json
import uuid
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ultralytics import YOLO

from db import Base, engine, get_db
from models import Incident

# Initialize logging configuration
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("DualModelLogger")

# Initialize SQLite database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Bus Violation Detection API - SQLite Edition",
    description="Advanced API utilizing custom YOLOv11 for infrastructure, pre-trained COCO weights, and SQLite for persistence.",
    version="5.0.0",
)

# Enable CORS Policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core Weights Navigation (Dynamic Paths)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CUSTOM_MODEL_PATH = os.path.join(BASE_DIR, "weights", "best.pt")
VEHICLE_MODEL_PATH = os.path.join(BASE_DIR, "weights", "yolo11n.pt")

# Create permanent uploads directory
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

try:
    # Model 1: Your Custom-Trained Infrastructure Model
    if not os.path.exists(CUSTOM_MODEL_PATH):
        raise FileNotFoundError(
            f"Custom model weights not located at {CUSTOM_MODEL_PATH}"
        )
    infra_model = YOLO(CUSTOM_MODEL_PATH)

    # Model 2: Official Pre-trained YOLO11 model
    vehicle_model = YOLO(VEHICLE_MODEL_PATH)

    logger.info(
        "Both Custom Infrastructure and COCO Vehicle models loaded successfully."
    )
except Exception as init_error:
    logger.critical(
        f"System boot failed during dual-model initiation: {str(init_error)}"
    )
    infra_model = None
    vehicle_model = None


@app.post("/predict", tags=["Traffic Enforcement Pipeline"])
async def predict_and_check_violation(
    speed: float = Form(..., description="Instantaneous velocity in km/h"),
    front_file: UploadFile = File(
        default=None, description="Front facing camera stream"
    ),
    rear_file: UploadFile = File(default=None, description="Rear facing camera stream"),
    db: Session = Depends(get_db),
):
    if infra_model is None or vehicle_model is None:
        raise HTTPException(
            status_code=503, detail="Dual-model machine learning core is offline."
        )

    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)

    front_path = None
    rear_path = None
    front_camera_active = False
    rear_camera_active = False

    # 1. Ingest Input Streams safely
    if front_file and front_file.filename != "":
        try:
            front_path = os.path.join(temp_dir, f"front_{uuid.uuid4().hex}_{front_file.filename}")
            with open(front_path, "wb") as f_buffer:
                shutil.copyfileobj(front_file.file, f_buffer)
            front_camera_active = True
        except Exception as e:
            logger.error(f"Front file storage stream failure: {str(e)}")

    if rear_file and rear_file.filename != "":
        try:
            rear_path = os.path.join(temp_dir, f"rear_{uuid.uuid4().hex}_{rear_file.filename}")
            with open(rear_path, "wb") as r_buffer:
                shutil.copyfileobj(rear_file.file, r_buffer)
            rear_camera_active = True
        except Exception as e:
            logger.error(f"Rear file storage stream failure: {str(e)}")

    if not front_camera_active and not rear_camera_active:
        raise HTTPException(
            status_code=400,
            detail="Total Optical Pipeline Failure: No active files parsed.",
        )

    try:
        front_infra_detections = []
        rear_infra_detections = []

        has_legal_infrastructure_front = False
        has_legal_infrastructure_rear = False
        traffic_congestion_detected = False

        # MS COCO standard class indices for common transit entities
        COCO_VEHICLE_CLASSES = ["car", "motorcycle", "bus", "truck"]

        # 2. Synchronous Parsing: Front Lens Node
        if front_camera_active and front_path:
            infra_res_front = infra_model.predict(
                source=front_path, save=False, conf=0.30
            )
            for r in infra_res_front:
                for box in r.boxes:
                    c_name = infra_model.names[int(box.cls)]
                    conf = float(box.conf)
                    # Require a higher confidence threshold (>= 0.50) specifically for signs to filter out generic highway signs
                    if c_name in ["shelter", "seating"] or (c_name == "sign" and conf >= 0.50):
                        has_legal_infrastructure_front = True
                        front_infra_detections.append(
                            {
                                "class": c_name,
                                "confidence": round(conf, 2),
                                "bbox": box.xyxy[0].tolist(),
                            }
                        )

            veh_res_front = vehicle_model.predict(
                source=front_path, save=False, conf=0.35
            )
            for r in veh_res_front:
                for box in r.boxes:
                    c_name = vehicle_model.names[int(box.cls)]
                    if c_name in COCO_VEHICLE_CLASSES:
                        traffic_congestion_detected = True

        # 3. Synchronous Parsing: Rear Lens Node
        if rear_camera_active and rear_path:
            infra_res_rear = infra_model.predict(
                source=rear_path, save=False, conf=0.30
            )
            for r in infra_res_rear:
                for box in r.boxes:
                    c_name = infra_model.names[int(box.cls)]
                    conf = float(box.conf)
                    # Require a higher confidence threshold (>= 0.50) specifically for signs to filter out generic highway signs
                    if c_name in ["shelter", "seating"] or (c_name == "sign" and conf >= 0.50):
                        has_legal_infrastructure_rear = True
                        rear_infra_detections.append(
                            {
                                "class": c_name,
                                "confidence": round(conf, 2),
                                "bbox": box.xyxy[0].tolist(),
                            }
                        )

            veh_res_rear = vehicle_model.predict(
                source=rear_path, save=False, conf=0.35
            )
            for r in veh_res_rear:
                for box in r.boxes:
                    c_name = vehicle_model.names[int(box.cls)]
                    if c_name in COCO_VEHICLE_CLASSES:
                        traffic_congestion_detected = True

        # 4. Hybrid Intelligent Decision Framework
        violation_detected = False
        reason = "Normal operation: vehicle status shows compliant movement parameters."

        if speed == 0:
            if traffic_congestion_detected:
                reason = "Enforcement suspended: Stationary state induced by surrounding traffic congestion (verified via COCO pipeline)."
            else:
                is_infrastructure_valid = (
                    has_legal_infrastructure_front or has_legal_infrastructure_rear
                )
                if is_infrastructure_valid:
                    reason = "Vehicle is stationary within an authorized commuter zone (verified via infrastructure markers)."
                else:
                    violation_detected = True
                    reason = "Violation Detected: Vehicle is static (0 km/h) outside legal zones. No shelter, sign, or seating context discovered."
        else:
            reason = "Vehicle status: Operational movement tracked."

        # 5. Database and Image Persistence Decisions
        front_saved_filename = None
        rear_saved_filename = None

        if violation_detected:
            # Save files permanently to uploads/
            if front_path and os.path.exists(front_path):
                front_saved_filename = f"front_{uuid.uuid4().hex}.jpg"
                shutil.copy(front_path, os.path.join(UPLOADS_DIR, front_saved_filename))
            if rear_path and os.path.exists(rear_path):
                rear_saved_filename = f"rear_{uuid.uuid4().hex}.jpg"
                shutil.copy(rear_path, os.path.join(UPLOADS_DIR, rear_saved_filename))

        # Create DB Incident Record
        incident = Incident(
            speed=speed,
            is_violation=violation_detected,
            reason=reason,
            traffic_congestion_detected=traffic_congestion_detected,
            front_image_path=front_saved_filename,
            rear_image_path=rear_saved_filename,
            infrastructure_verified_front=has_legal_infrastructure_front,
            infrastructure_verified_rear=has_legal_infrastructure_rear,
            detections_json=json.dumps({
                "front": front_infra_detections,
                "rear": rear_infra_detections
            }),
            status="Pending Review" if violation_detected else "Compliant"
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        # 6. Pipeline Cleanup Sequence (Temp files)
        if front_path and os.path.exists(front_path):
            os.remove(front_path)
        if rear_path and os.path.exists(rear_path):
            os.remove(rear_path)

        # 7. Response Output Structure
        return {
            "id": incident.id,
            "timestamp": incident.timestamp,
            "bus_speed_kmh": speed,
            "congestion_status": {
                "traffic_congestion_detected": traffic_congestion_detected
            },
            "multi_view_context": {
                "front_infrastructure_verified": has_legal_infrastructure_front,
                "rear_infrastructure_verified": has_legal_infrastructure_rear,
            },
            "infrastructure_detections_front": front_infra_detections,
            "infrastructure_detections_rear": rear_infra_detections,
            "violation_status": {"is_violation": violation_detected, "reason": reason},
            "front_image_url": f"/incidents/{incident.id}/image/front" if front_saved_filename else None,
            "rear_image_url": f"/incidents/{incident.id}/image/rear" if rear_saved_filename else None,
            "status": incident.status
        }

    except Exception as e:
        if front_path and os.path.exists(front_path):
            os.remove(front_path)
        if rear_path and os.path.exists(rear_path):
            os.remove(rear_path)
        logger.error(f"Execution Failure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")


@app.get("/incidents", tags=["Enforcement Management Panel"])
async def get_all_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.id.desc()).all()
    results = []
    for inc in incidents:
        # Load detections from json
        detections = {"front": [], "rear": []}
        if inc.detections_json:
            try:
                detections = json.loads(inc.detections_json)
            except Exception:
                pass

        results.append({
            "id": inc.id,
            "timestamp": inc.timestamp,
            "bus_speed_kmh": inc.speed,
            "congestion_status": {
                "traffic_congestion_detected": inc.traffic_congestion_detected
            },
            "multi_view_context": {
                "front_infrastructure_verified": inc.infrastructure_verified_front,
                "rear_infrastructure_verified": inc.infrastructure_verified_rear,
            },
            "infrastructure_detections_front": detections.get("front", []),
            "infrastructure_detections_rear": detections.get("rear", []),
            "violation_status": {"is_violation": inc.is_violation, "reason": inc.reason},
            "front_image_url": f"/incidents/{inc.id}/image/front" if inc.front_image_path else None,
            "rear_image_url": f"/incidents/{inc.id}/image/rear" if inc.rear_image_path else None,
            "status": inc.status
        })
    return results


@app.get("/incidents/{incident_id}/image/{camera_view}", tags=["Enforcement Management Panel"])
async def get_incident_image(incident_id: int, camera_view: str, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found")

    filename = None
    if camera_view == "front":
        filename = incident.front_image_path
    elif camera_view == "rear":
        filename = incident.rear_image_path
    else:
        raise HTTPException(status_code=400, detail="Invalid camera view selector. Choose front or rear.")

    if not filename:
        raise HTTPException(status_code=404, detail="No image recorded for this view")

    image_path = os.path.join(UPLOADS_DIR, filename)
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image file missing from server storage")

    return FileResponse(image_path)


@app.post("/incidents/{incident_id}/action", tags=["Enforcement Management Panel"])
async def take_enforcement_action(
    incident_id: int,
    action: str = Form(..., description="Action name, e.g. 'Citation Issued', 'Dismissed', 'Pending Review'"),
    db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found")

    incident.status = action
    db.commit()
    db.refresh(incident)

    return {
        "success": True,
        "incident_id": incident.id,
        "new_status": incident.status
    }


@app.delete("/incidents/{incident_id}", tags=["Enforcement Management Panel"])
async def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found")

    # Clean up associated files from disk
    if incident.front_image_path:
        f_path = os.path.join(UPLOADS_DIR, incident.front_image_path)
        if os.path.exists(f_path):
            os.remove(f_path)

    if incident.rear_image_path:
        r_path = os.path.join(UPLOADS_DIR, incident.rear_image_path)
        if os.path.exists(r_path):
            os.remove(r_path)

    db.delete(incident)
    db.commit()

    return {"success": True, "detail": f"Incident {incident_id} successfully deleted from database"}
