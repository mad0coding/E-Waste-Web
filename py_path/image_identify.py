# image_classification.py and EfficientNetV2S_100epochs_0p8dropout.keras are needed
# Get the model from https://github.com/c-hars/IDE2025/tree/main
# Put in the same directory as this script
import os
import sys
import numpy as np
from datetime import datetime
from image_classification import ImageClassifier

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))  # dir of this script
    model_dir = os.path.join(current_dir, "EfficientNetV2S_100epochs_0p8dropout.keras")

    # Classifier Init
    ic = ImageClassifier(
        model_path=model_dir,
        class_names=[
            'Battery', 'Camera', 'Keyboard', 'Laptop', 'Microwave',
            'Mobile', 'Mouse', 'PCB', 'Player', 'Printer',
            'Smartwatch', 'Television', 'Washing Machine'
        ]
    )

    dummy = np.zeros((1, 384, 384, 3), dtype=np.float32)
    ic.model.predict(dummy, verbose=0) # warm-up

    print("Ready!!! (Not an error!!!)", file=sys.stderr) # avoid using std in/out

    while True:
        img_path = input("").strip()
        # if img_path.lower() == "q":
        #     break
        try:
            pred, conf = ic.predict_class(img_path)
            print(pred, flush=True) # flush=True to output immediately
            # print(f"Predicted class: {pred}, Confidence: {conf:.4f}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    main()
