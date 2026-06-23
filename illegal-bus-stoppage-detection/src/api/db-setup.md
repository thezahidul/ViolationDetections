# SQLite Database Setup & Management Guide

This guide explains how the backend database is configured, how it is initialized automatically, and how you can query or manage the SQLite file locally.

---

## ⚙️ How it Works

The system utilizes **SQLite** for metadata and infraction logs persistence, orchestrated via **SQLAlchemy ORM**. 

*   **Zero-Configuration**: Since it uses SQLite, you do not need to install or configure external database servers like MySQL or PostgreSQL. 
*   **Automatic Schema Initialization**: When you boot the FastAPI server, it checks if the database exists. If it doesn't, SQLAlchemy automatically generates the file `violations.db` and creates the necessary database tables.

---

## 🛠️ Setup Instructions

### 1. Install Backend Dependencies
Ensure your python virtual environment is active, then install the dependencies (which now includes `sqlalchemy`):
```bash
cd illegal-bus-stoppage-detection/src/api
pip install -r requirements.txt
```

### 2. Run the Server to Initialize
Boot the FastAPI application. The startup hook will automatically trigger table creation:
```bash
python -m uvicorn main:app --reload
```
You will notice a new file named `violations.db` created inside the `illegal-bus-stoppage-detection/src/api/` directory.

---

## 📊 Database Schema Details

The database table `incidents` stores all target metadata from infraction detections. The schema defined in [models.py](file:///home/sayem/projects/ViolationDetections/illegal-bus-stoppage-detection/src/api/models.py) includes:

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key (auto-incrementing reference ID, e.g., BUS-1, BUS-2). |
| `timestamp` | `VARCHAR` | The ISO-8601 formatted date-time string when the incident occurred. |
| `speed` | `FLOAT` | Measured speed of the vehicle in km/h. |
| `is_violation` | `BOOLEAN` | Boolean flag representing whether a stoppage violation was detected. |
| `reason` | `VARCHAR` | Detailed explanation of the compliance or violation status. |
| `traffic_congestion_detected` | `BOOLEAN` | Indicator if congestion logic was active to filter false positives. |
| `front_image_path` | `VARCHAR` | Disk filename of the front camera snapshot (if a violation occurred). |
| `rear_image_path` | `VARCHAR` | Disk filename of the rear camera snapshot (if a violation occurred). |
| `infrastructure_verified_front` | `BOOLEAN` | Checked if bus shelter/seating/sign was seen in front camera. |
| `infrastructure_verified_rear` | `BOOLEAN` | Checked if bus shelter/seating/sign was seen in rear camera. |
| `detections_json` | `TEXT` | Raw JSON string containing model coordinates, classes, and confidences. |
| `status` | `VARCHAR` | Enforcement action: `Pending Review`, `Citation Issued`, or `Dismissed`. |

---

## 🔍 Accessing and Querying the Database

Since SQLite databases are single-file containers, you can inspect it directly using standard tools.

### Option A: Using the CLI Tool (`sqlite3`)
If you have `sqlite3` installed on your machine, run:
```bash
# Start sqlite console
sqlite3 violations.db
```

Within the SQLite prompt, you can run:
```sql
-- List tables (should output 'incidents')
.tables

-- Read schema structure
.schema incidents

-- View all logged incident entries
SELECT id, timestamp, speed, is_violation, status FROM incidents;

-- Quit the command line
.quit
```

### Option B: Visual GUI Client
To visually view and edit your database tables, install **DB Browser for SQLite**:
1. Download from [sqlitebrowser.org](https://sqlitebrowser.org/).
2. Open the program and click **Open Database**.
3. Choose the `violations.db` file from the directory: `illegal-bus-stoppage-detection/src/api/violations.db`.

### Option C: VS Code Extension
You can install the **SQLite Viewer** or **SQLite** extensions directly inside VS Code to query tables inside your editor.
