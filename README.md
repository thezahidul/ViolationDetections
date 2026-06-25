# Bus Stoppage Violation Detection System

This repository contains the implementation of an automated, real-time traffic enforcement system designed to detect illegal bus stoppage behavior using a **Dual-Model YOLOv11 Ensemble Architecture** and multi-view vision sensors. This project is developed as part of my final year thesis at Dhaka International University.

---

## 📌 Project Overview
The primary goal of this system is to evaluate whether a transit vehicle is stopping within legally designated commuter boundaries (passenger shelters/signs) or violating urban traffic regulations by stopping elsewhere. 

To eliminate false-positive citations caused by typical Dhaka City gridlocks, the system deploys a **hybrid intelligent decision network** processing synchronized telemetry parameters (speed) along with front and rear optical streams.

### 🚀 Key Architectural Upgrades
- **Dual-Model Ensemble Core:** Uses a custom-trained YOLOv11 model (`best.pt`) specialized in urban infrastructure detection alongside a state-of-the-art pre-trained YOLOv11 model (`yolo11n.pt`) as a dedicated congestion filter.
- **Multi-View Optical Ingestion:** Simultaneously processes front-facing and rear-facing vehicle-mounted camera frames to maintain high context availability.

---

# 🖥️ Local Model Testing via Web Interface

1. **Clone the repository**
    ```bash
    git clone https://github.com/thezahidul/ViolationDetections.git
    cd ViolationDetections/
    ```

2. **Create a virtual environment:**
    ```bash
    python -m venv venv
    ```

3. **Activate the virtual environment:**
    * **On Windows (Command Prompt):**
      ```cmd
      venv\Scripts\activate
      ```
    * **On Windows (PowerShell):**
      ```powershell
      .\venv\Scripts\activate
      ```
    * **On macOS/Linux:**
      ```bash
      source venv/bin/activate
      ```

4. **Install dependencies**
    ```bash
    # Navigate to the inner core project directory
    cd illegal-bus-stoppage-detection/
    
    # [Linux/Ubuntu Users Only] Run this if you face folder permission issues:
    # sudo chown -R $USER:$USER ../venv
    
    # Install the required software ecosystem
    pip install -r requirements.txt
    ```

5. **Run Detection (Streamlit App Interface)**
    Place your test validation frames or images in the `data/` folder and execute:
    ```bash
    streamlit run src/app.py
    ```
    *Open your web browser and navigate to the local host address:* `http://localhost:8501`


# 🔌 Production API Testing Guidelines (FastAPI backend)

This module allows developers, IoT edge devices (like Jetson Nano), or external systems to send physical parameters (bus speed) and image streams to verify traffic infractions programmatically.

---

## 🛠️ Launching the API Server

1. Ensure your virtual environment is activated (see setup instructions above).
2. Navigate directly to the API container directory:
    ```bash
    cd illegal-bus-stoppage-detection/src/api
    pip install -r requirements.txt
    ```

3. Initialize the ASGI server instance:
    * **Standard Cross-Platform Command:**
      ```bash
      python -m uvicorn main:app --reload
      ```
    * **Alternative (Linux/macOS):**
      ```bash
      python3 -m uvicorn main:app --reload
      ```

Expected terminal output confirmation:

INFO:     Uvicorn running on http://127.0.0.1:8000/docs (Press CTRL+C to quit)
    
## 📊 Dataset & Results
#### 📂 Dataset (1,100+ Images)
The model was trained on a custom-curated dataset of over 1,200 images, specifically labeled for bus stop infrastructure and vehicle positioning to ensure high accuracy in violation detection.

**Dataset Link:** Download Dataset from Google Drive
https://drive.google.com/file/d/154_HpA77ra5RlFbzOm1sHJkzXNqR0otG/view?usp=sharing

## 📈 Thesis Project Results
Detailed training logs, confusion matrices, performance graphs, and inference results (output images/videos) are available here:

**Result Folder:** View Project Results on Google Drive
https://drive.google.com/drive/folders/1RBBKi4eG7KyfznEFwtxqylLeHqDB9xKi?usp=sharing

## 🛠️ Violation Logic
###### The system utilizes a Region of Interest (ROI) mapping technique:

**Detection:** The model identifies the 'Bus' and the 'Bus Stop' area in real-time.

**Coordinate Analysis:** If the bounding box of the 'Bus' remains stationary for a specific duration outside the designated 'Bus Stop' coordinates, a Violation is triggered and logged automatically.

## References & Acknowledgments

This project utilizes multi-model AI architectures for robust urban infrastructure and traffic enforcement tracking. The following models and frameworks are referenced and integrated into the pipeline:

### 1. Vehicle Detection Model
* **Model Framework:** YOLOv11 (Nano Variant)
* **Pre-trained Weights:** `yolo11n.pt`
* **Dataset Target:** COCO Dataset (specifically filtering classes: `car`, `motorcycle`, `bus`, `truck`)
* **Developer/Maintainer:** Ultralytics Inc.
* **Official Repository:** [Ultralytics GitHub - YOLO11](https://github.com/ultralytics/ultralytics)

