# -*- coding: utf-8 -*-

import os
import logging
import json
import uuid
import io
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ultralytics import YOLO

from db import Base, engine, get_db
from models import Incident

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("MultiModelLogger")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Bus Violation Detection API - Final Edition",
    version="8.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SHELTER_MODEL_PATH = os.path.join(BASE_DIR, "weights", "shelter_model.pt")
SIGN_MODEL_PATH = os.path.join(BASE_DIR, "weights", "ultimate_bus_stop_model.pt")

UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

try:
    # আমাদের কাস্টম ২টি মডেল লোকাল ফোল্ডার থেকে লোড হবে
    shelter_model = YOLO(SHELTER_MODEL_PATH)
    sign_model = YOLO(SIGN_MODEL_PATH)
    # গাড়ির মডেলটি সরাসরি অফিশিয়াল ওয়েইট থেকে লোড হবে (যাতে কোনো এরর না আসে)
    vehicle_model = YOLO("yolo11n.pt")
    logger.info("All 3 AI Models loaded successfully into system memory.")
except Exception as e:
    logger.critical(f"System boot failed: {str(e)}")
    shelter_model, sign_model, vehicle_model = None, None, None


@app.post("/predict", tags=["Traffic Enforcement Pipeline"])
async def predict_and_check_violation(
    speed: float = Form(...),
    front_file: UploadFile = File(default=None),
    rear_file: UploadFile = File(default=None),
    db: Session = Depends(get_db),
):
    if not all([shelter_model, sign_model, vehicle_model]):
        raise HTTPException(status_code=503, detail="AI Core offline.")

    front_image, rear_image = None, None
    front_camera_active, rear_camera_active = False, False

    # 1. ইন-মেমোরি ইমেজ লোডিং (ফাইল করাপশন রোধ করতে)
    if front_file and front_file.filename != "":
        contents = await front_file.read()
        front_image = Image.open(io.BytesIO(contents)).convert("RGB")
        front_camera_active = True

    if rear_file and rear_file.filename != "":
        contents = await rear_file.read()
        rear_image = Image.open(io.BytesIO(contents)).convert("RGB")
        rear_camera_active = True

    if not front_camera_active and not rear_camera_active:
        raise HTTPException(
            status_code=400, detail="No active visual streams provided."
        )

    try:
        front_infra_detections, rear_infra_detections = [], []
        has_legal_infrastructure_front, has_legal_infrastructure_rear = False, False
        front_vehicle_detected, rear_vehicle_detected = False, False

        COCO_VEHICLES = ["car", "motorcycle", "bus", "truck"]

        # --- 2. FRONT CAMERA PARSING ---
        if front_camera_active:
            # Model 1: Shelter Detection
            s_res = shelter_model.predict(source=front_image, conf=0.25, verbose=False)
            for r in s_res:
                if len(r.boxes) > 0:
                    has_legal_infrastructure_front = True
                for box in r.boxes:
                    front_infra_detections.append(
                        {
                            "class": shelter_model.names[int(box.cls)],
                            "confidence": round(float(box.conf), 2),
                            "bbox": box.xyxy[0].tolist(),
                        }
                    )

            # Model 2: Sign Detection
            sign_res = sign_model.predict(source=front_image, conf=0.25, verbose=False)
            for r in sign_res:
                if len(r.boxes) > 0:
                    has_legal_infrastructure_front = True
                for box in r.boxes:
                    front_infra_detections.append(
                        {
                            "class": sign_model.names[int(box.cls)],
                            "confidence": round(float(box.conf), 2),
                            "bbox": box.xyxy[0].tolist(),
                        }
                    )

            # Model 3: Vehicle Detection
            v_res = vehicle_model.predict(source=front_image, conf=0.15, verbose=False)
            for r in v_res:
                for box in r.boxes:
                    if vehicle_model.names[int(box.cls)] in COCO_VEHICLES:
                        front_vehicle_detected = True

        # --- 3. REAR CAMERA PARSING ---
        if rear_camera_active:
            # Model 1: Shelter Detection
            s_res = shelter_model.predict(source=rear_image, conf=0.25, verbose=False)
            for r in s_res:
                if len(r.boxes) > 0:
                    has_legal_infrastructure_rear = True
                for box in r.boxes:
                    rear_infra_detections.append(
                        {
                            "class": shelter_model.names[int(box.cls)],
                            "confidence": round(float(box.conf), 2),
                            "bbox": box.xyxy[0].tolist(),
                        }
                    )

            # Model 2: Sign Detection
            sign_res = sign_model.predict(source=rear_image, conf=0.25, verbose=False)
            for r in sign_res:
                if len(r.boxes) > 0:
                    has_legal_infrastructure_rear = True
                for box in r.boxes:
                    rear_infra_detections.append(
                        {
                            "class": sign_model.names[int(box.cls)],
                            "confidence": round(float(box.conf), 2),
                            "bbox": box.xyxy[0].tolist(),
                        }
                    )

            # Model 3: Vehicle Detection
            v_res = vehicle_model.predict(source=rear_image, conf=0.15, verbose=False)
            for r in v_res:
                for box in r.boxes:
                    if vehicle_model.names[int(box.cls)] in COCO_VEHICLES:
                        rear_vehicle_detected = True

        traffic_congestion_detected = front_vehicle_detected or rear_vehicle_detected

        # --- 4. DECISION FRAMEWORK ---
        violation_detected = False
        reason = "Operational movement tracked."

        if speed < 5.0:
            if traffic_congestion_detected:
                reason = "Stationary state induced by traffic congestion."
            else:
                if has_legal_infrastructure_front or has_legal_infrastructure_rear:
                    reason = "Stationary within an authorized commuter zone."
                else:
                    violation_detected = True
                    reason = "Violation Detected: Static outside legal zones. No infrastructure found."

        # 5. Database Persistence (Image Save)
        front_saved_filename, rear_saved_filename = None, None
        if violation_detected:
            if front_camera_active:
                front_saved_filename = f"front_{uuid.uuid4().hex}.jpg"
                front_image.save(os.path.join(UPLOADS_DIR, front_saved_filename))
            if rear_camera_active:
                rear_saved_filename = f"rear_{uuid.uuid4().hex}.jpg"
                rear_image.save(os.path.join(UPLOADS_DIR, rear_saved_filename))

        incident = Incident(
            speed=speed,
            is_violation=violation_detected,
            reason=reason,
            traffic_congestion_detected=traffic_congestion_detected,
            front_image_path=front_saved_filename,
            rear_image_path=rear_saved_filename,
            infrastructure_verified_front=has_legal_infrastructure_front,
            infrastructure_verified_rear=has_legal_infrastructure_rear,
            detections_json=json.dumps(
                {"front": front_infra_detections, "rear": rear_infra_detections}
            ),
            status="Pending Review" if violation_detected else "Compliant",
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        return {
            "id": incident.id,
            "timestamp": incident.timestamp,
            "congestion_status": {
                "traffic_congestion_detected": traffic_congestion_detected,
                "front_congestion_detected": front_vehicle_detected,
                "rear_congestion_detected": rear_vehicle_detected,
            },
            "multi_view_context": {
                "front_infrastructure_verified": has_legal_infrastructure_front,
                "rear_infrastructure_verified": has_legal_infrastructure_rear,
            },
            "infrastructure_detections_front": front_infra_detections,
            "infrastructure_detections_rear": rear_infra_detections,
            "violation_status": {"is_violation": violation_detected, "reason": reason},
            "status": incident.status,
        }

    except Exception as e:
        logger.error(f"Execution Failure: {str(e)}")
        raise HTTPException(status_code=500, detail="Pipeline error")


@app.get("/incidents", tags=["Enforcement Management Panel"])
async def get_all_incidents(db: Session = Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.id.desc()).all()
    results = []
    for inc in incidents:
        detections = {"front": [], "rear": []}
        if inc.detections_json:
            try:
                detections = json.loads(inc.detections_json)
            except Exception:
                pass

        results.append(
            {
                "id": inc.id,
                "timestamp": inc.timestamp,
                "bus_speed_kmh": inc.speed,
                "congestion_status": {
                    "traffic_congestion_detected": inc.traffic_congestion_detected,
                    "front_congestion_detected": detections.get(
                        "front_vehicle_detected", inc.traffic_congestion_detected
                    ),
                    "rear_congestion_detected": detections.get(
                        "rear_vehicle_detected", inc.traffic_congestion_detected
                    ),
                },
                "multi_view_context": {
                    "front_infrastructure_verified": inc.infrastructure_verified_front,
                    "rear_infrastructure_verified": inc.infrastructure_verified_rear,
                },
                "infrastructure_detections_front": detections.get("front", []),
                "infrastructure_detections_rear": detections.get("rear", []),
                "violation_status": {
                    "is_violation": inc.is_violation,
                    "reason": inc.reason,
                },
                "front_image_url": (
                    f"/incidents/{inc.id}/image/front" if inc.front_image_path else None
                ),
                "rear_image_url": (
                    f"/incidents/{inc.id}/image/rear" if inc.rear_image_path else None
                ),
                "status": inc.status,
            }
        )
    return results


@app.get(
    "/incidents/{incident_id}/image/{camera_view}",
    tags=["Enforcement Management Panel"],
)
async def get_incident_image(
    incident_id: int, camera_view: str, db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident record not found")

    filename = (
        incident.front_image_path
        if camera_view == "front"
        else incident.rear_image_path
    )
    if not filename:
        raise HTTPException(status_code=404, detail="No image recorded for this view")

    image_path = os.path.join(UPLOADS_DIR, filename)
    if not os.path.exists(image_path):
        raise HTTPException(status_code=404, detail="Image missing")
    return FileResponse(image_path)


@app.post("/incidents/{incident_id}/action", tags=["Enforcement Management Panel"])
async def take_enforcement_action(
    incident_id: int, action: str = Form(...), db: Session = Depends(get_db)
):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    incident.status = action
    db.commit()
    return {"success": True, "incident_id": incident.id, "new_status": incident.status}


@app.delete("/incidents/{incident_id}", tags=["Enforcement Management Panel"])
async def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

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
    return {"success": True}
