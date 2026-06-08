import os
import argparse
from ultralytics import YOLO


def run_detection(model_path, source_path, conf_threshold=0.25):
    """
    Run object detection using the trained YOLO model on a single file or a folder.
    """
    # 1. Check if model exists
    if not os.path.exists(model_path):
        print(f"Error: Model weights not found at {model_path}")
        return

    # 2. Load the trained model
    model = YOLO(model_path)

    # 3. Run prediction
    # If source_path is a folder, YOLO will automatically process all images in it
    print(f"Running detection on: {source_path}")
    results = model.predict(
        source=source_path,
        conf=conf_threshold,
        save=True,
        project='inference_results',
        name='detections',
        exist_ok=True  # Overwrites the folder instead of creating detections2, detections3...
    )

    print(f"Detection completed! Results saved in: inference_results/detections")


if __name__ == "__main__":
    # Path configuration
    # Ensure your weights are in the 'weights' folder and images are in the 'data' folder
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    BEST_MODEL = os.path.join(base_dir, 'weights', 'best.pt')

    # Passing the folder path instead of a single image file to process everything auto
    TEST_SOURCE = os.path.join(base_dir, 'data')

    run_detection(BEST_MODEL, TEST_SOURCE)