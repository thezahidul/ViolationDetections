# -*- coding: utf-8 -*-

import os
import streamlit as st
from ultralytics import YOLO
from PIL import Image
import numpy as np

# Page Configuration
st.set_page_config(page_title="Passenger Shed Detection System", layout="wide")

st.title("🚌 Urban Infrastructure & Passenger Shed Detection")
st.write("Upload an image to detect passenger sheds, seating, signs, and other elements using our YOLOv11 model.")

# Load the trained model
# Make sure 'best.pt' is in the 'weights' folder
@st.cache_resource
def load_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, 'weights', 'best.pt')
    return YOLO(model_path)

try:
    model = load_model()
    st.success("Model loaded successfully!")
except Exception as e:
    st.error(f"Error loading model: {e}. Please ensure 'weights/best.pt' exists.")

# Image Upload Section
uploaded_file = st.file_uploader("Choose an image...", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    # Display the uploaded image
    image = Image.open(uploaded_file)

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Uploaded Image")
        st.image(image, use_container_width=True)

    # Run Detection
    if st.button('Perform Detection'):
        with st.spinner('Detecting objects...'):
            results = model.predict(source=image, conf=0.25)

            # Plot results on the image
            res_plotted = results[0].plot()

            with col2:
                st.subheader("Detection Result")
                st.image(res_plotted, use_container_width=True)

            # Show detection summary
            st.subheader("Detection Summary:")
            if len(results[0].boxes) > 0:
                for box in results[0].boxes:
                    class_id = int(box.cls[0])
                    label = model.names[class_id]
                    conf = float(box.conf[0])
                    st.write(f"✅ Found **{label}** with **{conf:.2%}** confidence.")
            else:
                st.info("No objects detected in this image.")

# Footer
st.markdown("---")
st.markdown("Developed by **Zahidul Islam and My team members** | Dhaka International University")