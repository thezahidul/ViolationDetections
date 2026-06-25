# -*- coding: utf-8 -*-

import os
import streamlit as st
from ultralytics import YOLO
from PIL import Image
import numpy as np

# Page Configuration
st.set_page_config(page_title="Intelligent Bus Stop Enforcement System", layout="wide")

<<<<<<< HEAD
st.title("🚌 Urban Infrastructure & Bus Stop Enforcement Pipeline")
st.write(
    "Upload an image to detect infrastructure (Sheds, Signs) and Traffic elements."
)
=======
st.title("🚌 Urban Infrastructure & Passenger Shed Detection")
st.write(
    "Upload an image to detect passenger sheds, seating, signs, and other elements using our YOLOv11 model."
)

>>>>>>> e5a9bef9eef33c61d0a28c1f82d53cde33cb7373


# Load the models using cache so they only load once
@st.cache_resource
<<<<<<< HEAD
def load_models():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)

    # ৩টি মডেলের পাথ
    shelter_path = os.path.join(project_root, "weights", "shelter_model.pt")
    sign_path = os.path.join(project_root, "weights", "ultimate_bus_stop_model.pt")
    vehicle_path = os.path.join(project_root, "weights", "vehicle_detector.pt")

    # ৩টি মডেল মেমোরিতে লোড করা
    s_model = YOLO(shelter_path)
    sign_m = YOLO(sign_path)
    v_model = YOLO(vehicle_path)

    return s_model, sign_m, v_model

=======
def load_model():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, "weights", "best.pt")
    return YOLO(model_path)
>>>>>>> e5a9bef9eef33c61d0a28c1f82d53cde33cb7373


try:
    shelter_model, sign_model, vehicle_model = load_models()
    st.success("🤖 Multi-Model AI Core loaded successfully!")
except Exception as e:
    st.error(f"Error loading models: {e}. Please check your 'weights/' folder.")
    st.stop()

# Image Upload Section
uploaded_file = st.file_uploader(
    "Choose a verification frame/image...", type=["jpg", "jpeg", "png"]
)

if uploaded_file is not None:
    # Convert image to RGB to prevent color channel issues
    image = Image.open(uploaded_file).convert("RGB")
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Source Frame")
        st.image(image, use_container_width=True)

<<<<<<< HEAD
    # Run Detection Pipeline
    if st.button("Run Enforcement Verification"):
        with st.spinner("Processing Multi-Model Pipeline..."):
=======
    # Run Detection
    if st.button("Perform Detection"):
        with st.spinner("Detecting objects..."):
            results = model.predict(source=image, conf=0.25)
>>>>>>> e5a9bef9eef33c61d0a28c1f82d53cde33cb7373

            # 1. Inference (৩টি মডেল দিয়ে আলাদাভাবে ডিটেকশন)
            res_shelter = shelter_model.predict(source=image, conf=0.25, verbose=False)
            res_sign = sign_model.predict(source=image, conf=0.25, verbose=False)
            # COCO Vehicle classes: 2=car, 3=motorcycle, 5=bus, 7=truck (দূরের গাড়ির জন্য conf 0.15)
            res_vehicle = vehicle_model.predict(
                source=image, conf=0.15, classes=[2, 3, 5, 7], verbose=False
            )

            # 2. Merge Bounding Boxes (৩টি মডেলের বাউন্ডিং বক্স একটি ইমেজে বসানো)
            plotted_img = res_shelter[0].plot()
            plotted_img = res_sign[0].plot(img=plotted_img)
            plotted_img = res_vehicle[0].plot(img=plotted_img)

            # Convert BGR to RGB for Streamlit visualization
            plotted_rgb = plotted_img[..., ::-1]

            with col2:
                st.subheader("Enforcement Visualization")
                st.image(plotted_rgb, use_container_width=True)

            # 3. Decision Logic & Dashboard
            st.markdown("---")
            st.subheader("📋 Enforcement System Summary:")

            # যদি শেড অথবা সাইন যেকোনো একটি পাওয়া যায়, তাহলেই কমপ্লায়েন্ট
            infra_found = len(res_shelter[0].boxes) > 0 or len(res_sign[0].boxes) > 0

            if infra_found:
                st.success(
                    "✅ **STATUS: COMPLIANT ZONE** — Authorized Bus Stop Infrastructure or Signage Detected."
                )
            else:
                st.error(
                    "🚨 **STATUS: VIOLATION GENERATED** — No Bus Shed, Seating, or Signpost detected."
                )

<<<<<<< HEAD
            # বিস্তারিত ড্যাশবোর্ড ডাটা
            col_inf, col_veh = st.columns(2)

            with col_inf:
                st.markdown("**Detected Infrastructure:**")
                if len(res_shelter[0].boxes) > 0:
                    for box in res_shelter[0].boxes:
                        label = shelter_model.names[int(box.cls[0])]
                        st.write(
                            f"• Found **{label}** ({float(box.conf[0]):.2%} Conf.)"
                        )

                if len(res_sign[0].boxes) > 0:
                    for box in res_sign[0].boxes:
                        label = sign_model.names[int(box.cls[0])]
                        st.write(
                            f"• Found **{label}** ({float(box.conf[0]):.2%} Conf.)"
                        )

                if not infra_found:
                    st.caption("No custom infrastructure detected.")

            with col_veh:
                st.markdown("**Surrounding Vehicles:**")
                if len(res_vehicle[0].boxes) > 0:
                    for box in res_vehicle[0].boxes:
                        label = vehicle_model.names[int(box.cls[0])]
                        st.write(
                            f"• Found **{label}** ({float(box.conf[0]):.2%} Conf.)"
                        )
                else:
                    st.caption("No target vehicles detected.")
=======
# Footer
st.markdown("---")
st.markdown(
    "Developed by **Zahidul Islam and My team members** | Dhaka International University"
)
>>>>>>> e5a9bef9eef33c61d0a28c1f82d53cde33cb7373
