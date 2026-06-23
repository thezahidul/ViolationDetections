import datetime
from sqlalchemy import Column, Integer, Float, String, Boolean, Text
from db import Base

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(String, default=lambda: datetime.datetime.now().isoformat())
    speed = Column(Float, nullable=False)
    is_violation = Column(Boolean, default=False)
    reason = Column(String, nullable=True)
    traffic_congestion_detected = Column(Boolean, default=False)
    front_image_path = Column(String, nullable=True)
    rear_image_path = Column(String, nullable=True)
    infrastructure_verified_front = Column(Boolean, default=False)
    infrastructure_verified_rear = Column(Boolean, default=False)
    detections_json = Column(Text, nullable=True)  # Stores JSON list of detections
    status = Column(String, default="Pending Review")  # Pending Review, Citation Issued, Dismissed
