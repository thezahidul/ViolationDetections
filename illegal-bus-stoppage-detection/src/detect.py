# -*- coding: utf-8 -*-

import os
import argparse
import cv2
from ultralytics import YOLO


def main():
    # টার্মিনাল থেকে ইনপুট নেওয়ার জন্য আর্গুমেন্ট পার্সার
    parser = argparse.ArgumentParser(
        description="Multi-Model Bus Stop & Traffic Detection"
    )
    parser.add_argument(
        "--source", type=str, required=True, help="Path to the input image file"
    )
    parser.add_argument(
        "--save-dir",
        type=str,
        default="runs/detect",
        help="Directory to save the output image",
    )
    args = parser.parse_args()

    # মডেলের পাথ সেট করা
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)

    shelter_path = os.path.join(project_root, "weights", "shelter_model.pt")
    sign_path = os.path.join(project_root, "weights", "ultimate_bus_stop_model.pt")
    vehicle_path = os.path.join(project_root, "weights", "vehicle_detector.pt")

    try:
        print("🚀 Loading Multi-Model AI Core...")
        shelter_model = YOLO(shelter_path)
        sign_model = YOLO(sign_path)
        vehicle_model = YOLO(vehicle_path)
    except Exception as e:
        print(f"❌ Error loading models: {e}. Please check your 'weights/' folder.")
        return

    print(f"📷 Processing image: {args.source}")

<<<<<<< HEAD
    # 1. Inference (৩টি মডেল দিয়ে ডিটেকশন)
    res_shelter = shelter_model.predict(source=args.source, conf=0.25, verbose=False)
    res_sign = sign_model.predict(source=args.source, conf=0.25, verbose=False)
    res_vehicle = vehicle_model.predict(
        source=args.source, conf=0.15, classes=[2, 3, 5, 7], verbose=False
=======
    # 3. Run prediction
    # If source_path is a folder, YOLO will automatically process all images in it
    print(f"Running detection on: {source_path}")
    results = model.predict(
        source=source_path,
        conf=conf_threshold,
        save=True,
        project="inference_results",
        name="detections",
        exist_ok=True,  # Overwrites the folder instead of creating detections2, detections3...
>>>>>>> e5a9bef9eef33c61d0a28c1f82d53cde33cb7373
    )

    # 2. Merge Bounding Boxes (একটি ছবিতে সব বক্স আঁকা)
    plotted_img = res_shelter[0].plot()
    plotted_img = res_sign[0].plot(img=plotted_img)
    plotted_img = res_vehicle[0].plot(img=plotted_img)

    # 3. Save Output
    os.makedirs(args.save_dir, exist_ok=True)
    filename = os.path.basename(args.source)
    save_path = os.path.join(args.save_dir, f"detected_{filename}")

    cv2.imwrite(save_path, plotted_img)
    print(f"\n✅ Detection complete! Result image saved to: {save_path}")

    # 4. Console Summary
    print("\n--- 📋 Enforcement Summary ---")
    infra_found = len(res_shelter[0].boxes) > 0 or len(res_sign[0].boxes) > 0

    if infra_found:
        print("🟢 STATUS: COMPLIANT ZONE (Infrastructure Detected)")
    else:
        print("🔴 STATUS: VIOLATION (No Custom Infrastructure Found)")

    print("------------------------------")


if __name__ == "__main__":
<<<<<<< HEAD
    main()
=======
    # Path configuration
    # Ensure your weights are in the 'weights' folder and images are in the 'data' folder
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    BEST_MODEL = os.path.join(base_dir, "weights", "best.pt")

    # Passing the folder path instead of a single image file to process everything auto
    TEST_SOURCE = os.path.join(base_dir, "data")

    run_detection(BEST_MODEL, TEST_SOURCE)
>>>>>>> e5a9bef9eef33c61d0a28c1f82d53cde33cb7373
