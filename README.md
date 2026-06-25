---
title: Customer Churn Analytics
emoji: 📊
colorFrom: teal
colorTo: amber
sdk: streamlit
app_file: streamlit_app.py
pinned: false
---

# Customer Churn Prediction & Analytics

SQL-based customer churn analytics project using the Telco Customer Churn dataset. The project includes SQL analysis, a browser dashboard, and an optional Python machine learning extension.
<p align="center">

<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
<img src="https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas&logoColor=white"/>
<img src="https://img.shields.io/badge/Scikit--Learn-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white"/>
<img src="https://img.shields.io/badge/XGBoost-006400?style=for-the-badge&logo=xgboost&logoColor=white"/>
<img src="https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white"/>
<img src="https://img.shields.io/badge/OpenPyXL-217346?style=for-the-badge"/>

</p>



## Live Demo

[Open the Customer Churn Analytics Dashboard](https://customer-churn-analytics-ksvy-bsr4du1js.vercel.app)

## Dashboard Screenshot

![Customer Churn Dashboard](docs/screenshots/dashboard.png)

## Project Files

- `Customer_Churn_SQL_Project.sql` - SQL schema, import flow, churn analytics queries, revenue loss, segmentation, and high-risk customer identification.
- `Customer_Churn_SQL_Project_README.md` - Full project documentation.
- `Customer_Churn_ML_Model.py` - Optional ML pipeline using Logistic Regression, Random Forest, and XGBoost if installed.
- `live_app/` - Local browser dashboard for uploading and analyzing churn data.
- `data/` - Dataset folder.
- `requirements.txt` - Python dependencies for the ML extension.

## Run The Live App

Start a local server from the project folder:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8000/live_app/
```

Upload the Telco churn CSV or supported Excel workbook to view analytics.

## SQL Analysis

- Overall churn rate
- Contract type churn
- Monthly charges analysis
- Customer tenure segmentation
- Payment method analysis
- Revenue loss due to churn
- High-risk retained customers
- Business recommendations

## Machine Learning Extension

Run:

```powershell
pip install -r requirements.txt
python Customer_Churn_ML_Model.py
```

The ML script reports Accuracy, Precision, Recall, F1 Score, and ROC-AUC.

## Streamlit App

This project also includes a Streamlit dashboard:

```text
streamlit_app.py
```

Run it locally:

```powershell
pip install -r requirements.txt
streamlit run streamlit_app.py
```

The app lets you upload a Telco churn CSV or Excel workbook and view churn metrics, charts, high-risk customers, and business recommendations.
