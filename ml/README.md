# FitAI Machine Learning Layer

This folder adds a practical ML workflow for FitAI. The current Node.js backend serves live API predictions, while this Python layer shows how the project can train models from datasets and export model files for production use.

## What Is Included

- Dataset: `datasets/fitai_training_sample.csv`
- Regression: predicts workout calorie burn.
- Classification: predicts BMI category.
- Recommendation model: recommends exercise categories and diet plans from user profile features.
- Scikit-learn training pipeline: `train_models.py`
- Scikit-learn prediction example: `predict.py`
- Optional PyTorch neural-network demo: `pytorch_readiness_demo.py`
- Optional TensorFlow neural-network demo: `tensorflow_readiness_demo.py`

## Recommended Use

Use Scikit-learn first for this project because FitAI profile data is tabular: age, height, weight, activity level, goal, diet preference, and health notes. Scikit-learn is the best practical starting point for regression, classification, and recommendation from this data.

Use TensorFlow or PyTorch later when you have a larger dataset, wearable streams, camera form-correction data, or time-series training history.

## Install

```powershell
cd "C:\Users\Asus\OneDrive\Documents\AI FITNESS TRACKER\ml"
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Optional deep-learning demos:

```powershell
pip install -r requirements-deep-learning.txt
```

## Train Models

```powershell
python train_models.py
```

This creates model files in `ml/models/`:

- `calorie_burn_regressor.joblib`
- `bmi_classifier.joblib`
- `recommendation_engine.joblib`

## Run Prediction

```powershell
python predict.py
```

Expected output includes:

- Predicted calories burned
- BMI category prediction
- Recommended exercise category
- Recommended diet plan

## Production Path

The next production step is to load these `.joblib` model files from the backend or expose them through a small Python ML service. For a production FitAI system:

1. Store real user training records in PostgreSQL.
2. Export anonymized datasets for training.
3. Train Scikit-learn models from `ml/train_models.py`.
4. Save model artifacts to cloud storage.
5. Serve predictions through `/api/ml/recommendations`.
6. Monitor model accuracy and retrain weekly or monthly.
