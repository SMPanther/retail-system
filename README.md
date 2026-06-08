# 🏪 RetailMS — Retail Management System

A full-stack web application for managing retail store operations including inventory, sales, HR, supplier management, and financial analytics. Built as a Database Systems course project.

---

## 👥 Authors

| Name | Role No. |
|---|---|
| Muhammad Umer Iqbal | L1F24BSCS0601 |
| Arslan Aman | — |

**University:** University of Central Punjab (UCP), Lahore
**Course:** Database Systems · Instructor: Muneeb Ali Muzaffar
**Program:** BSCS · Spring 2026

---

## 🚀 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Database | MySQL 8.0 | Relational data storage |
| DB Tool | MySQL Workbench | Schema design and management |
| Backend | Node.js + Express.js | REST API (port 5001) |
| MySQL Driver | mysql2/promise | Connection pool + queries |
| Auth | JWT (jsonwebtoken) | Token-based authentication |
| Frontend | React 18 | User interface |
| HTTP Client | Axios | API calls with JWT interceptor |

---

## ✨ Features

### Role-Based Access
| Feature | Admin | Manager | Cashier |
|---|---|---|---|
| Dashboard (full analytics) | ✅ | ❌ | ❌ |
| Manager Dashboard (staff + low stock) | ❌ | ✅ | ❌ |
| Products / Inventory | ✅ | ✅ | ❌ |
| New Sale | ❌ | ✅ | ✅ |
| Sales History | ✅ | ✅ | ✅ |
| Customers | ✅ | ❌ | ❌ |
| Employees | ✅ | ✅ (view) | ❌ |
| Assign Duties | ❌ | ✅ | ❌ |
| Salary Management | ✅ | ❌ | ❌ |

### Core Features
- **Inventory Management** — Add, edit, restock products with cost/selling price tracking
- **Live Stock Alerts** — Dashboard highlights products at or below reorder level
- **Sales Processing** — Cart-based POS with automatic stock deduction
- **Customer Loyalty Discount** — Registered customers get configurable % discount (editable by admin)
- **Per-Product Discounts** — Set discount for all customers or extra for registered customers
- **Store Budget** — Track deposits and spending; restock deducts from budget automatically
- **Profit Analytics** — Revenue vs cost vs gross profit from `vw_profit_summary`
- **Supplier Management** — Supplier cards with category labels and full purchase history
- **HR Management** — Add employees, assign duties by shift, pay/deduct salaries
- **Salary Guard** — Pay button disabled once an employee is paid for the current month
- **Sales by Date** — Filter sales day by day with daily summary chart
- **Customer History** — View all bills per registered customer with full item breakdown

### Database Concepts
- **Normalization** — 3NF across all tables
- **Foreign Keys** — ON DELETE CASCADE / RESTRICT / SET NULL
- **Views** — `vw_product_details`, `vw_sales_summary`, `vw_low_stock`, `vw_customer_spend`, `vw_daily_sales`, `vw_profit_summary`, `vw_budget_balance`, `vw_supplier_purchases`, `vw_employee_duties`, `vw_salary_summary`
- **Stored Procedures** — `sp_process_sale`, `sp_add_sale_item`, `sp_restock_product`, `sp_assign_duty`, `sp_pay_salary`
- **Transactions** — Atomic sale processing with rollback on failure
- **JOINs** — INNER, LEFT JOIN across multiple tables
- **Aggregates** — SUM(), COUNT(), AVG(), MAX(), GROUP BY, HAVING
- **Subqueries** — Nested SELECT for above-average customer spend
- **GROUP_CONCAT** — Supplier category labels

---

## 📁 Project Structure

```
retail-system/
├── schema.sql                      ← Base schema (run first)
├── sql_budget_profit.sql           ← HR + Budget + Profit additions (run second)
├── README.md
├── retail-backend/
│   ├── server.js                   ← Express entry point (port 5001)
│   ├── .env                        ← DB credentials
│   ├── config/db.js                ← MySQL connection pool
│   ├── middleware/auth.js          ← JWT verification
│   └── routes/
│       ├── auth.js                 ← Login
│       ├── products.js             ← CRUD + restock + edit + discounts
│       ├── sales.js                ← Sale creation + date filter
│       ├── customers.js            ← Customers + history + discount setting
│       ├── suppliers.js            ← Suppliers + purchase history
│       ├── categories.js
│       ├── employees.js            ← HR: employees, duties, salary
│       ├── budget.js               ← Store budget + profit
│       └── dashboard.js            ← Admin + Manager dashboards
└── retail-frontend/
    └── src/
        ├── App.js                  ← Router + role guards
        ├── context/AuthContext.js
        ├── api/axios.js
        ├── components/Sidebar.js   ← Role-based navigation
        └── pages/
            ├── Login.js
            ├── AdminDashboard.js   ← Revenue, profit, budget, analytics
            ├── ManagerDashboard.js ← Staff duties + low stock
            ├── Products.js         ← Inventory + edit + restock
            ├── NewSale.js          ← POS cart with live discount
            ├── Sales.js            ← History + date filter
            ├── Customers.js        ← List + history + discount setting
            ├── Suppliers.js        ← Cards + purchase history
            ├── Categories.js
            ├── Employees.js        ← HR management
            ├── SalaryManagement.js ← Pay + deduct + monthly guard
            └── AssignDuties.js     ← Manager duty assignment
```

---

## ⚙️ Setup

### Prerequisites
- Node.js 20+, MySQL 8.0, MySQL Workbench

### Step 1 — Database
```
1. Open MySQL Workbench
2. Run schema.sql          (creates retail_db + all base tables + sample data)
3. Run sql_budget_profit.sql  (adds HR, budget, profit tables + views + procedures)
```

### Step 2 — Backend
```bash
cd retail-backend
npm install
# Edit .env: set DB_PASSWORD to your MySQL root password
npm start
# Test: http://localhost:5001/api/health
```

### Step 3 — Frontend
```bash
cd retail-frontend
npm install
npm start
# Opens: http://localhost:3000
```

### Login Credentials
| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Manager | `manager` | `manager123` |
| Cashier | `cashier` | `cashier123` |

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
