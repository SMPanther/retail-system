# 🏪 RetailMS — Retail Management System

A full-stack web application for managing retail operations including inventory, sales, customers, and suppliers. Built as a Database Systems course project.

---

## 👥 Authors

| Name | Role |
|---|---|
| Muhammad Umer Iqbal | Full-Stack Development, Database Design |
| Arslan Aman | Full-Stack Development, Database Design |

**University:** University of Central Punjab (UCP), Lahore  
**Course:** Database Systems  
**Program:** BSCS

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Database | MySQL 8.0 |
| DB Tool | MySQL Workbench |
| Backend | Node.js + Express.js |
| MySQL Driver | mysql2/promise |
| Authentication | JWT (jsonwebtoken) |
| Frontend | React 18 |
| HTTP Client | Axios |

---

## ✨ Features

- **Role-based access** — Admin, Manager, Cashier with different permissions
- **Product management** — Add, restock (with supplier selection), delete products
- **Live inventory** — Stock deducts automatically on every sale
- **Low stock alerts** — Dashboard highlights products at or below reorder level
- **Sales processing** — Cart-based sale system with transaction support
- **Customer loyalty discount** — Registered customers get 5% off automatically
- **Supplier management** — Suppliers labeled with their product categories
- **Analytics dashboard** — Revenue by category, top products, top customers
- **MySQL Views** — `vw_product_details`, `vw_sales_summary`, `vw_low_stock`, `vw_customer_spend`
- **Stored Procedures** — `sp_process_sale`, `sp_add_sale_item`, `sp_restock_product`

---

## 📁 Project Structure

```
retail-system/
├── schema.sql                    ← MySQL schema, views, stored procedures, sample data
├── README.md
├── retail-backend/
│   ├── server.js                 ← Express entry point (port 5001)
│   ├── .env                      ← DB credentials (not committed)
│   ├── config/db.js              ← MySQL connection pool
│   ├── middleware/auth.js        ← JWT verification
│   └── routes/
│       ├── auth.js               ← Login
│       ├── products.js           ← Product CRUD + restock
│       ├── sales.js              ← Sale creation with discount logic
│       ├── customers.js          ← Customer management
│       ├── suppliers.js          ← Suppliers with category info
│       ├── categories.js         ← Category management
│       └── dashboard.js          ← Analytics + all views
└── retail-frontend/
    └── src/
        ├── App.js                ← Router + role guards
        ├── context/AuthContext.js
        ├── api/axios.js          ← Axios with JWT interceptor
        ├── components/Sidebar.js ← Role-based navigation
        └── pages/
            ├── Login.js
            ├── Dashboard.js      ← Live stats + views
            ├── Products.js       ← Inventory management
            ├── NewSale.js        ← POS-style sale screen
            ├── Sales.js          ← Sales history
            ├── Customers.js      ← Customer list + loyalty info
            ├── Suppliers.js      ← Supplier cards with categories
            └── Categories.js     ← Category management
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 20+
- MySQL 8.0
- MySQL Workbench

### Step 1 — Database
1. Open MySQL Workbench
2. Open `schema.sql`
3. Run the full script (`Ctrl+Shift+Enter`)

### Step 2 — Backend
```bash
cd retail-backend
npm install
```

Edit `.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=retail_db
JWT_SECRET=retail_secret_key
PORT=5001
```

```bash
npm start
```

Test: http://localhost:5001/api/health

### Step 3 — Frontend
```bash
cd retail-frontend
npm install
npm start
```

Opens at: http://localhost:3000

---

## 🔐 Login Credentials

| Role | Username | Password | Access |
|---|---|---|---|
| Admin | `admin` | `admin123` | Full access — add/delete products, view all |
| Manager | `manager` | `manager123` | Inventory + Sales + Customers |
| Cashier | `cashier` | `cashier123` | New Sale + Sales History only |

---

## 🗄️ Database Concepts Demonstrated

- **Normalization** — Tables in 3NF
- **Foreign Keys** — With ON DELETE CASCADE / RESTRICT / SET NULL
- **Views** — `vw_product_details`, `vw_sales_summary`, `vw_low_stock`, `vw_customer_spend`
- **Stored Procedures** — `sp_process_sale`, `sp_add_sale_item`, `sp_restock_product`
- **Transactions** — Atomic sale processing with rollback on failure
- **JOINs** — INNER JOIN, LEFT JOIN across multiple tables
- **Aggregates** — SUM(), COUNT(), AVG(), GROUP BY, HAVING
- **Subqueries** — Nested SELECT for above-average customer spend
- **GROUP_CONCAT** — Supplier category labels

---

## 📊 API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/products` | No | All products (vw_product_details) |
| POST | `/api/products` | Manager+ | Add product |
| PATCH | `/api/products/:id/restock` | Manager+ | Restock via sp_restock_product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| GET | `/api/sales` | Yes | Sales history (vw_sales_summary) |
| POST | `/api/sales` | Yes | Create sale with discount + stock update |
| GET | `/api/customers` | Yes | All customers |
| GET | `/api/customers/top` | Yes | Above-average spenders (subquery) |
| GET | `/api/suppliers` | Yes | Suppliers with category labels |
| GET | `/api/dashboard` | Yes | Live stats + all views |

---

## 🔗 Repository

[github.com/SMPanther/retail-system](https://github.com/SMPanther/retail-system)
