# Customer Churn Prediction & Analytics Using Kaggle Data

## Project Objective

This SQL project analyzes customer churn using the real **Telco Customer Churn** dataset from Kaggle. The goal is to calculate churn rate, identify churn drivers, estimate revenue loss, segment customers, and flag retained customers who are at high churn risk.

Dataset source: [Telco Customer Churn on Kaggle](https://www.kaggle.com/datasets/blastchar/telco-customer-churn)

## Important Note

The Kaggle CLI is not currently installed on this machine, so the dataset was not downloaded automatically. The SQL project has been converted to use the Kaggle dataset schema and is ready once the CSV is downloaded.

## Download The Dataset

### Option 1: Manual Download

1. Open [Telco Customer Churn on Kaggle](https://www.kaggle.com/datasets/blastchar/telco-customer-churn).
2. Download the dataset ZIP.
3. Extract this file:

```text
WA_Fn-UseC_-Telco-Customer-Churn.csv
```

4. Place it here:

```text
C:\Users\Asus\OneDrive\Documents\AI FITNESS TRACKER\data\WA_Fn-UseC_-Telco-Customer-Churn.csv
```

### Option 2: Kaggle CLI

Install and configure the Kaggle CLI, then run:

```powershell
kaggle datasets download -d blastchar/telco-customer-churn -p data --unzip
```

## Dataset Columns

| Column | Description |
| --- | --- |
| customerID | Unique customer identifier |
| gender | Customer gender |
| SeniorCitizen | Whether the customer is a senior citizen |
| Partner | Whether the customer has a partner |
| Dependents | Whether the customer has dependents |
| tenure | Number of months the customer has stayed |
| PhoneService | Whether the customer has phone service |
| MultipleLines | Whether the customer has multiple lines |
| InternetService | DSL, Fiber optic, or No internet service |
| OnlineSecurity | Online security subscription status |
| OnlineBackup | Online backup subscription status |
| DeviceProtection | Device protection subscription status |
| TechSupport | Technical support subscription status |
| StreamingTV | Streaming TV subscription status |
| StreamingMovies | Streaming movie subscription status |
| Contract | Month-to-month, One year, or Two year |
| PaperlessBilling | Whether paperless billing is enabled |
| PaymentMethod | Customer payment method |
| MonthlyCharges | Monthly billing amount |
| TotalCharges | Total billing amount |
| Churn | Whether the customer left |

## How To Run In MySQL Workbench

1. Download the Kaggle CSV into the `data` folder.
2. Open `Customer_Churn_SQL_Project.sql`.
3. Run the database, staging table, and final table creation statements.
4. Uncomment the `LOAD DATA LOCAL INFILE` block in the SQL file.
5. Run the import statement.
6. Run the `INSERT INTO customers SELECT ... FROM customers_staging;` statement.
7. Confirm the import:

```sql
SELECT COUNT(*) AS TotalRows FROM customers;
```

The Kaggle dataset normally contains **7,043 rows**.

## Live Dashboard App

This project includes a local browser app:

```text
live_app/index.html
```

Start a local server from the project folder:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8000/live_app/
```

The app waits for you to upload the Kaggle CSV, then analyzes that uploaded file directly in the browser.

## SQL Analysis Performed

1. Overall churn rate and retention rate
2. Churn by contract type
3. Churn by monthly charge band
4. Churn by customer tenure
5. Churn by payment method
6. Customer segmentation into New, Medium, and Loyal customers
7. Monthly and annual revenue loss due to churn
8. Tech support impact on churn
9. High-risk retained customer identification
10. Internet service churn comparison
11. Senior citizen churn comparison
12. Executive summary query
13. Feature view for BI dashboards or machine learning

## Expected Business Insights

- Month-to-month contract customers usually have the highest churn rate.
- Customers with short tenure are more likely to churn.
- Customers with high monthly charges often show higher churn risk.
- Customers without tech support may churn more often.
- Electronic check users commonly show elevated churn in this dataset.
- Churned customers represent monthly recurring revenue loss and annual revenue at risk.

## Business Recommendations

- Offer onboarding discounts or check-ins for customers with tenure under 6 months.
- Encourage month-to-month customers to upgrade to one-year or two-year contracts.
- Improve support experience for customers without tech support.
- Build retention campaigns for high-charge, short-tenure customers.
- Monitor retained customers marked as `Critical Risk` or `High Risk`.

## Machine Learning Extension

The SQL file creates a view named `churn_customer_features`. This project also includes a Python machine learning script:

```text
Customer_Churn_ML_Model.py
```

It trains and evaluates:

- Logistic Regression
- Random Forest
- XGBoost, if installed

Recommended evaluation metrics:

- Accuracy
- Precision
- Recall
- F1 Score
- ROC-AUC

Run the ML project after placing the Kaggle CSV in the `data` folder:

```powershell
pip install -r requirements.txt
python Customer_Churn_ML_Model.py
```

The script saves:

- `outputs/model_metrics.csv`
- `outputs/high_risk_customers.csv`

## Resume Description

**Customer Churn Prediction & Analytics**

Developed a SQL-based customer churn analytics project using the Kaggle Telco Customer Churn dataset. Designed staging and cleaned customer tables, handled missing billing values, and wrote SQL queries for churn rate analysis, contract analysis, payment method analysis, tenure segmentation, revenue loss calculation, and high-risk customer identification. Created a reusable SQL feature view for dashboarding and machine learning workflows.
