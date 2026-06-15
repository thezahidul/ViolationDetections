import os
import shutil
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

# Initialize logging configuration
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("DualModelLogger")

app = FastAPI(
    title="Smart Bus Violation Detection API - Dual-Model Ensemble Edition",
    description="Advanced API utilizing custom YOLOv11 for infrastructure and pre-trained COCO weights for congestion filtering.",
    version="4.0.0",
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
            front_path = os.path.join(temp_dir, f"front_{front_file.filename}")
            with open(front_path, "wb") as f_buffer:
                shutil.copyfileobj(front_file.file, f_buffer)
            front_camera_active = True
        except Exception as e:
            logger.error(f"Front file storage stream failure: {str(e)}")

    if rear_file and rear_file.filename != "":
        try:
            rear_path = os.path.join(temp_dir, f"rear_{rear_file.filename}")
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
                    if c_name in ["shelter", "sign", "seating"]:
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
                    if c_name in ["shelter", "sign", "seating"]:
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

        # 5. Pipeline Cleanup Sequence
        if front_path and os.path.exists(front_path):
            os.remove(front_path)
        if rear_path and os.path.exists(rear_path):
            os.remove(rear_path)

        # 6. Response Output Structure
        return {
            "bus_speed_kmh": speed,
            "congestion_status": {
                "traffic_congestion_detected": traffic_congestion_detected
            },
            "multi_view_context": {
                "infrastructure_verified_front": has_legal_infrastructure_front,
                "infrastructure_verified_rear": has_legal_infrastructure_rear,
            },
            "infrastructure_detections_front": front_infra_detections,
            "infrastructure_detections_rear": rear_infra_detections,
            "violation_status": {"is_violation": violation_detected, "reason": reason},
        }

    except Exception as e:
        if front_path and os.path.exists(front_path):
            os.remove(front_path)
        if rear_path and os.path.exists(rear_path):
            os.remove(rear_path)
        logger.error(f"Execution Failure: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")
