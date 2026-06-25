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
<img src="https://img.shields.io/badge/XGBoost-006400?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white"/>
<img src="https://img.shields.io/badge/OpenPyXL-217346?style=for-the-badge"/>

</p>

<p align="center">
<a href="https://customer-churn-analytics-ksvy-bsr4du1js.vercel.app">
<img src="https://img.shields.io/badge/🚀%20Live%20Demo-Visit%20App-000000?style=for-the-badge&logo=vercel&logoColor=white"/>
</a>
</p>

## ✨ Features

- 📊 Predict customer churn using a machine learning model.
- ⚡ Interactive web application built with Streamlit.
- 📁 Upload customer datasets for analysis.
- 📈 Generate real-time churn predictions.
- 🤖 XGBoost-powered classification model.
- 📋 View prediction results in an intuitive dashboard.
- 📥 Export prediction results for further analysis.
- 🔍 Analyze customer behavior to identify churn risk.
- 📂 Excel file support using OpenPyXL.
- 🚀 Fast and user-friendly interface.

## 🛠️ Tech Stack

| Category                 | Technologies                 |
| ------------------------ | ---------------------------- |
| **Programming Language** | Python                       |
| **Machine Learning**     | Scikit-learn, XGBoost        |
| **Data Analysis**        | Pandas                       |
| **Data Processing**      | OpenPyXL                     |
| **Web Framework**        | Streamlit                    |
| **Database**             | SQL                          |
| **Dataset**              | Telco Customer Churn Dataset |
| **Version Control**      | Git, GitHub                  |
| **Deployment**           | Vercel                       |


  
## Dashboard Screenshot

![Customer Churn Dashboard](docs/screenshots/dashboard.png)

## Project Structure 
```text
customer-churn-analytics/
│
├── 📂 data/
├── 📂 docs/
│   └── screenshots/
├── 📂 live_app/
├── 📄 Customer_Churn_SQL_Project.sql
├── 📄 Customer_Churn_ML_Model.py
├── 📄 requirements.txt
├── 📄 README.md
└── 📄 LICENSE
```


## 🚀 Run the Application

### 1. Clone the Repository

```bash
git clone https://github.com/kundanmrj5-dev/customer-churn-analytics-.git
cd customer-churn-analytics-
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Launch the Streamlit Dashboard

```bash
streamlit run streamlit_app.py
```

Once the server starts, open the URL displayed in your terminal (typically `http://localhost:8501`) in your web browser.

Alternatively, access the deployed application here:

**🌐 Live Demo:** https://customer-churn-analytics-ksvy-bsr4du1js.vercel.app


## 🗄️ SQL Analysis

The SQL module performs end-to-end business analytics on the Telco Customer Churn dataset, including:

* 📊 Customer segmentation
* 📉 Churn rate analysis
* 💰 Revenue loss estimation
* 🌐 Internet service analysis
* 💳 Payment method analysis
* 📞 Tech support impact analysis
* ⏳ Tenure-based churn analysis
* ⚠️ High-risk customer identification
* 💡 Business recommendations for customer retention


## 🤖 Train & Evaluate the Machine Learning Model

Run the following commands to install the required dependencies and evaluate the customer churn prediction models.

```bash
pip install -r requirements.txt
python Customer_Churn_ML_Model.py
## Streamlit App

## 🌐 Launch the Streamlit Dashboard

Start the interactive dashboard:

```bash
streamlit run streamlit_app.py
```

### Dashboard Features

* 📂 Upload CSV or Excel datasets
* 📊 Explore interactive charts
* 🤖 Predict customer churn
* ⚠️ Identify high-risk customers
* 💡 Generate business insights
* 📈 View churn metrics and analytics

## Workflow 
            
Dataset
   │
   ▼
Data Cleaning
   │
   ▼
Feature Engineering
   │
   ▼
XGBoost Model
   │
   ▼
Prediction
   │
   ▼
Interactive Dashboard
