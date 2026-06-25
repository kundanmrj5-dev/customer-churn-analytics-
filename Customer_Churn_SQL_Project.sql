-- Customer Churn Prediction & Analytics - Kaggle SQL Project
-- Dataset: Telco Customer Churn by Blastchar on Kaggle
-- Kaggle URL: https://www.kaggle.com/datasets/blastchar/telco-customer-churn
-- Dialect: MySQL 8+

CREATE DATABASE IF NOT EXISTS churn_project;
USE churn_project;

DROP VIEW IF EXISTS churn_customer_features;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS customers_staging;

-- Staging table keeps TotalCharges as text because the Kaggle CSV contains blank values.
CREATE TABLE customers_staging (
    customerID VARCHAR(20),
    gender VARCHAR(10),
    SeniorCitizen VARCHAR(5),
    Partner VARCHAR(5),
    Dependents VARCHAR(5),
    tenure VARCHAR(10),
    PhoneService VARCHAR(5),
    MultipleLines VARCHAR(30),
    InternetService VARCHAR(20),
    OnlineSecurity VARCHAR(30),
    OnlineBackup VARCHAR(30),
    DeviceProtection VARCHAR(30),
    TechSupport VARCHAR(30),
    StreamingTV VARCHAR(30),
    StreamingMovies VARCHAR(30),
    Contract VARCHAR(30),
    PaperlessBilling VARCHAR(5),
    PaymentMethod VARCHAR(50),
    MonthlyCharges VARCHAR(20),
    TotalCharges VARCHAR(20),
    Churn VARCHAR(5)
);

-- Import the Kaggle CSV after downloading it into the project data folder.
-- If MySQL blocks LOCAL INFILE, enable it in Workbench connection settings or import the CSV manually.
--
-- Expected file:
-- C:/Users/Asus/OneDrive/Documents/AI FITNESS TRACKER/data/WA_Fn-UseC_-Telco-Customer-Churn.csv
--
-- LOAD DATA LOCAL INFILE 'C:/Users/Asus/OneDrive/Documents/AI FITNESS TRACKER/data/WA_Fn-UseC_-Telco-Customer-Churn.csv'
-- INTO TABLE customers_staging
-- FIELDS TERMINATED BY ','
-- ENCLOSED BY '"'
-- LINES TERMINATED BY '\n'
-- IGNORE 1 ROWS;

CREATE TABLE customers (
    customerID VARCHAR(20) PRIMARY KEY,
    gender VARCHAR(10),
    SeniorCitizen TINYINT,
    Partner VARCHAR(5),
    Dependents VARCHAR(5),
    tenure INT,
    PhoneService VARCHAR(5),
    MultipleLines VARCHAR(30),
    InternetService VARCHAR(20),
    OnlineSecurity VARCHAR(30),
    OnlineBackup VARCHAR(30),
    DeviceProtection VARCHAR(30),
    TechSupport VARCHAR(30),
    StreamingTV VARCHAR(30),
    StreamingMovies VARCHAR(30),
    Contract VARCHAR(30),
    PaperlessBilling VARCHAR(5),
    PaymentMethod VARCHAR(50),
    MonthlyCharges DECIMAL(10,2),
    TotalCharges DECIMAL(10,2),
    Churn VARCHAR(5)
);

-- Run this after loading the CSV into customers_staging.
INSERT INTO customers
SELECT
    TRIM(customerID),
    TRIM(gender),
    CAST(SeniorCitizen AS UNSIGNED) AS SeniorCitizen,
    TRIM(Partner),
    TRIM(Dependents),
    CAST(tenure AS UNSIGNED) AS tenure,
    TRIM(PhoneService),
    TRIM(MultipleLines),
    TRIM(InternetService),
    TRIM(OnlineSecurity),
    TRIM(OnlineBackup),
    TRIM(DeviceProtection),
    TRIM(TechSupport),
    TRIM(StreamingTV),
    TRIM(StreamingMovies),
    TRIM(Contract),
    TRIM(PaperlessBilling),
    TRIM(PaymentMethod),
    CAST(MonthlyCharges AS DECIMAL(10,2)) AS MonthlyCharges,
    CAST(NULLIF(TRIM(TotalCharges), '') AS DECIMAL(10,2)) AS TotalCharges,
    TRIM(Churn)
FROM customers_staging;

-- Check imported row count. The Kaggle dataset normally has 7,043 rows.
SELECT COUNT(*) AS TotalRows FROM customers;

-- 1. Overall churn rate
SELECT
    COUNT(*) AS TotalCustomers,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS ChurnedCustomers,
    SUM(CASE WHEN Churn = 'No' THEN 1 ELSE 0 END) AS RetainedCustomers,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS ChurnRatePercent,
    ROUND(SUM(CASE WHEN Churn = 'No' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS RetentionRatePercent
FROM customers;

-- 2. Contract type analysis
SELECT
    Contract AS ContractType,
    COUNT(*) AS TotalCustomers,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS ChurnedCustomers,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS ChurnRatePercent
FROM customers
GROUP BY Contract
ORDER BY ChurnRatePercent DESC;

-- 3. Monthly charges analysis
SELECT
    CASE
        WHEN MonthlyCharges < 35 THEN 'Low: < 35'
        WHEN MonthlyCharges BETWEEN 35 AND 70 THEN 'Medium: 35-70'
        ELSE 'High: > 70'
    END AS MonthlyChargeBand,
    COUNT(*) AS TotalCustomers,
    ROUND(AVG(MonthlyCharges), 2) AS AverageMonthlyCharge,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS ChurnedCustomers,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS ChurnRatePercent
FROM customers
GROUP BY MonthlyChargeBand
ORDER BY ChurnRatePercent DESC;

-- 4. Customer tenure analysis
SELECT
    CASE
        WHEN tenure < 6 THEN '0-5 months'
        WHEN tenure BETWEEN 6 AND 12 THEN '6-12 months'
        WHEN tenure BETWEEN 13 AND 36 THEN '1-3 years'
        ELSE '3+ years'
    END AS TenureBand,
    COUNT(*) AS TotalCustomers,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS ChurnedCustomers,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS ChurnRatePercent
FROM customers
GROUP BY TenureBand
ORDER BY ChurnRatePercent DESC;

-- 5. Payment method analysis
SELECT
    PaymentMethod,
    COUNT(*) AS TotalCustomers,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS ChurnedCustomers,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS ChurnRatePercent
FROM customers
GROUP BY PaymentMethod
ORDER BY ChurnRatePercent DESC;

-- 6. Customer segmentation by tenure
WITH customer_segments AS (
    SELECT
        customerID,
        Churn,
        CASE
            WHEN tenure < 12 THEN 'New'
            WHEN tenure BETWEEN 12 AND 36 THEN 'Medium'
            ELSE 'Loyal'
        END AS CustomerSegment
    FROM customers
)
SELECT
    CustomerSegment,
    COUNT(*) AS TotalCustomers,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS ChurnedCustomers,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS ChurnRatePercent
FROM customer_segments
GROUP BY CustomerSegment
ORDER BY ChurnRatePercent DESC;

-- 7. Revenue loss due to churn
SELECT
    ROUND(SUM(MonthlyCharges), 2) AS MonthlyRevenueLost,
    ROUND(SUM(MonthlyCharges) * 12, 2) AS EstimatedAnnualRevenueLost,
    ROUND(AVG(MonthlyCharges), 2) AS AverageChurnedCustomerMonthlyCharge
FROM customers
WHERE Churn = 'Yes';

-- 8. Tech support analysis
-- Kaggle does not include support ticket counts, so TechSupport is used as the complaint/support proxy.
SELECT
    TechSupport,
    COUNT(*) AS TotalCustomers,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS ChurnedCustomers,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS ChurnRatePercent
FROM customers
GROUP BY TechSupport
ORDER BY ChurnRatePercent DESC;

-- 9. High-risk retained customer identification
SELECT
    customerID,
    gender,
    SeniorCitizen,
    tenure,
    MonthlyCharges,
    Contract,
    PaymentMethod,
    InternetService,
    TechSupport,
    PaperlessBilling,
    CASE
        WHEN tenure < 6
            AND MonthlyCharges > 70
            AND Contract = 'Month-to-month'
            AND TechSupport = 'No'
        THEN 'Critical Risk'
        WHEN tenure < 12
            AND MonthlyCharges > 65
            AND Contract = 'Month-to-month'
        THEN 'High Risk'
        WHEN Contract = 'Month-to-month'
            OR TechSupport = 'No'
        THEN 'Medium Risk'
        ELSE 'Low Risk'
    END AS RiskLevel
FROM customers
WHERE Churn = 'No'
ORDER BY
    CASE
        WHEN tenure < 6
            AND MonthlyCharges > 70
            AND Contract = 'Month-to-month'
            AND TechSupport = 'No'
        THEN 1
        WHEN tenure < 12
            AND MonthlyCharges > 65
            AND Contract = 'Month-to-month'
        THEN 2
        WHEN Contract = 'Month-to-month'
            OR TechSupport = 'No'
        THEN 3
        ELSE 4
    END,
    MonthlyCharges DESC;

-- 10. Churn analysis by internet service
SELECT
    InternetService,
    COUNT(*) AS TotalCustomers,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS ChurnedCustomers,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS ChurnRatePercent,
    ROUND(AVG(MonthlyCharges), 2) AS AverageMonthlyCharge
FROM customers
GROUP BY InternetService
ORDER BY ChurnRatePercent DESC;

-- 11. Senior citizen churn analysis
SELECT
    CASE WHEN SeniorCitizen = 1 THEN 'Senior Citizen' ELSE 'Non-Senior Citizen' END AS SeniorCitizenGroup,
    COUNT(*) AS TotalCustomers,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS ChurnedCustomers,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS ChurnRatePercent
FROM customers
GROUP BY SeniorCitizenGroup
ORDER BY ChurnRatePercent DESC;

-- 12. Executive summary query
SELECT
    COUNT(*) AS TotalCustomers,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) AS OverallChurnRatePercent,
    SUM(CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END) AS ChurnedCustomers,
    SUM(CASE WHEN Churn = 'No' THEN 1 ELSE 0 END) AS RetainedCustomers,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN MonthlyCharges ELSE 0 END), 2) AS MonthlyRevenueLost,
    ROUND(SUM(CASE WHEN Churn = 'Yes' THEN MonthlyCharges ELSE 0 END) * 12, 2) AS AnnualRevenueAtRisk,
    ROUND(AVG(CASE WHEN Churn = 'Yes' THEN tenure END), 2) AS AvgTenureOfChurnedCustomers,
    ROUND(AVG(CASE WHEN Churn = 'Yes' THEN MonthlyCharges END), 2) AS AvgMonthlyChargeOfChurnedCustomers
FROM customers;

-- 13. Feature view for BI dashboards or Python machine learning
CREATE VIEW churn_customer_features AS
SELECT
    customerID,
    gender,
    SeniorCitizen,
    Partner,
    Dependents,
    tenure,
    PhoneService,
    MultipleLines,
    InternetService,
    OnlineSecurity,
    OnlineBackup,
    DeviceProtection,
    TechSupport,
    StreamingTV,
    StreamingMovies,
    Contract,
    PaperlessBilling,
    PaymentMethod,
    MonthlyCharges,
    TotalCharges,
    CASE
        WHEN tenure < 12 THEN 'New'
        WHEN tenure BETWEEN 12 AND 36 THEN 'Medium'
        ELSE 'Loyal'
    END AS CustomerSegment,
    CASE
        WHEN MonthlyCharges < 35 THEN 'Low'
        WHEN MonthlyCharges BETWEEN 35 AND 70 THEN 'Medium'
        ELSE 'High'
    END AS MonthlyChargeBand,
    CASE
        WHEN tenure < 6
            AND MonthlyCharges > 70
            AND Contract = 'Month-to-month'
            AND TechSupport = 'No'
        THEN 'Critical Risk'
        WHEN tenure < 12
            AND MonthlyCharges > 65
            AND Contract = 'Month-to-month'
        THEN 'High Risk'
        WHEN Contract = 'Month-to-month'
            OR TechSupport = 'No'
        THEN 'Medium Risk'
        ELSE 'Low Risk'
    END AS RiskLevel,
    CASE WHEN Churn = 'Yes' THEN 1 ELSE 0 END AS ChurnFlag
FROM customers;

SELECT * FROM churn_customer_features;
