# Retail Sales Analytics Platform

A full-stack web-based **Retail Sales Analytics Platform** designed to help businesses manage products, customers, suppliers, inventory, and sales while gaining useful business insights through data analytics and machine learning.

The system combines **Retail Management + Data Analytics + Reporting + Sales Forecasting** in a single platform.

---

## 🚀 Features

### 🔐 Authentication
- User Registration
- User Login
- JWT Authentication
- Protected API Endpoints
- Role-based access support

### 📦 Product Management
- Add Products
- Update Products
- Delete Products
- Search Products
- Product Categories
- Product Pricing
- Stock Tracking

### 👥 Customer Management
- Add Customers
- Update Customer Details
- View Customer Information
- Search Customers
- Customer Purchase Tracking

### 🚚 Supplier Management
- Add Suppliers
- Update Supplier Information
- View Supplier Details
- Search Suppliers

### 📊 Inventory Management
- Current Stock Tracking
- Low Stock Detection
- Out-of-Stock Detection
- Stock Adjustments
- Stock Movement History
- Automatic Stock Reduction After Sales

### 🛒 Sales / POS
- Create Sales
- Multiple Products per Sale
- Shopping Cart
- Customer Selection
- Quantity Management
- Discount Calculation
- Multiple Payment Methods
- Automatic Inventory Updates
- Sales History

### 📈 Analytics Dashboard
The dashboard provides real-time business insights using data stored in the MySQL database.

Key metrics include:

- Total Revenue
- Total Profit
- Total Orders
- Total Customers
- Total Products
- Units Sold
- Low Stock Products
- Out-of-Stock Products

### 📊 Data Visualization

Interactive charts are used to visualize:

- Monthly Sales Trends
- Top Selling Products
- Sales by Product Category
- Payment Method Analysis
- Inventory Insights

### 📄 Reports & Export

The system provides different business reports:

- Sales Reports
- Product Reports
- Inventory Reports
- Customer Reports
- Financial Reports

Reports can be exported as:

- Excel
- PDF

### 🤖 Sales Forecasting

The platform includes a Machine Learning based sales forecasting module.

The forecasting workflow is:

```text
Historical Sales Data
        ↓
Data Processing
        ↓
Pandas / NumPy
        ↓
Feature Engineering
        ↓
Machine Learning Model
        ↓
Future Sales Prediction
        ↓
Forecast Dashboard
