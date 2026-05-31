# Pneumonia Detection & Transfer Learning Lab

An interactive computer-aided chest X-ray diagnostic playground featuring Gemini-driven vision classification and an educational FastAI training sandbox with ResNet pretrained architectures.

---

## 🌟 Clinical Overview & Dataset

Many major respiratory and systematic diseases—such as cancer, pulmonary nodules, and pneumonia—are detected using computer-aided diagnosis (CAD) leveraging state-of-the-art vision models. 

This platform uses the **Kaggle Chest X-Ray Images (Pneumonia Detection)** dataset, consisting of 5,856 labeled AP/PA chest radiograph plates categorized into three clinical classes:
1. **NORMAL**: Clear lung fields, sharp demarcated costophrenic recesses, normal diaphragmatic dome structures, and physiological cardiothoracic volumes.
2. **BACTERIAL PNEUMONIA**: Characterized by localized, heavy lobar consolidation forming dense airspace opacity, completed by lucent air bronchogram networks.
3. **VIRAL PNEUMONIA**: Evidenced by bilateral, diffuse, patchy interstitial infiltrates, prominent bronchovascular wall thickening, and secondary hyperinflation.

---

## 🧪 The FastAI & ResNet Advantage

This lab acts as a didactic sandbox for understanding **Transfer Learning** in deep learning.

### What is Transfer Learning?
Rather than training a Convolutional Neural Network (CNN) from scratch—which requires hundreds of thousands of images and massive compute power—we use **ResNet50** pretrained on **ImageNet** (1.2 million general images). Since the early layers of ResNet50 have already mastered essential computer vision features (edges, color gradients, basic geometric shapes), we only need to fine-tune final classification layers on our specialized chest X-rays.

### Why FastAI?
**FastAI** is an elegant, open-source library built on top of PyTorch that provides high-level abstractions for deep learning workflows. 

A standard image classification pipeline that takes upwards of **35 lines of code** in Keras is condensed into only **5 streamlined lines** in FastAI:

```python
from fastai.vision.all import *

# 1. Load Chest X-Ray Images
path = Path('chest_xray')
dls = ImageDataLoaders.from_folder(path, valid_pct=0.2, item_tfms=Resize(224))

# 2. Compile Transfer Learner with Pretrained ResNet50
learn = vision_learner(dls, resnet50, metrics=accuracy)

# 3. Fine-Tune Weights in a single step
learn.fine_tune(epochs=5, base_lr=0.001)
```

---

## 💻 Workstation & Simulator Features

### 1. Interactive Diagnostic CAD Workstation
* **Visual Coordinates Probe**: Click anywhere on the radiographic plates to retrieve precise $(X, Y)$ relative coordinates.
* **Autonomous CAD Highlight Layer**: Staggered neural projections outlining high-risk zones, lobar focus points, peribronchial cuffing, and interstitial networks.
* **DICOM Filtration Controls**: Dynamically adjust plate exposure/gain, radiographic contrast, color solarization (invert), and edge-enhancement filters to highlight dense bone structures.
* **Live Gemini 3.5 Analysis**: Upload custom `.png` or `.jpg` chest radiographs. If a valid `GEMINI_API_KEY` is provided, the plate is analyzed live; otherwise, a robust radiologist simulation matches clinical templates.

### 2. FastAI Training Sandbox
* **Hyperparameter Sliders**: Directly shift CNN backbones (ResNet18, ResNet34, or ResNet50), learning rates (LR), training pass counts (epochs), and batch sizes.
* **PyTorch Terminal Simulation**: Watch standard progress outputs stream in live as PyTorch completes backward passes.
* **Interactive Epoch Charts**: Visualize live training loss vs. validation loss curves and macro accuracy trajectories plotted over Recharts modules.
* **Clinical Out-Of-Sample Confusion Matrix**: Evaluate macro accuracy, out-of-sample error distributions, and explore the classic diagnostic boundary challenge of telling bacterial and viral infiltrates apart.

---

## 🛠️ Project Architecture & Deployment

This application operates as a standalone full-stack Express + React/Vite program.

### Key Scripts
* **Development Server**: Launches with Hot Reloading active for backend endpoints and client views:
  ```bash
  npm run dev
  ```
* **Production Compilation**: Builds client static pages into `/dist` and bundles the Express backend server into a single, optimized CJS file (`/dist/server.cjs`) to ensure lightning-fast server cold-starts:
  ```bash
  npm run build
  ```
* **Production Start**: Starts the compiled high-efficiency production node server:
  ```bash
  npm run start
  ```

---

## ⚠️ Medical Disclaimer
*The Pneumonia Detection & Transfer Learning Lab is designed purely as an educational sandbox and visual demonstration of machine learning architectures. It is NOT FDA-approved, does NOT constitute clinical guidelines, and must never be utilized as a diagnostic utility.*
