-- ============================================================
--  RETAIL MANAGEMENT SYSTEM — Budget, Profit & HR Additions
--  Run AFTER schema.sql and sql_hr_and_discount.sql
--  Author: Muhammad Umer Iqbal & Arslan Aman
-- ============================================================

USE retail_db;

-- ============================================================
-- ALTER Product — add cost_price (if columns don't exist yet)
-- ============================================================
ALTER TABLE Product
  ADD COLUMN cost_price          DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT 'Price paid to supplier per unit',
  ADD COLUMN discount_all        DECIMAL(5,2)  NOT NULL DEFAULT 0 COMMENT 'Discount % for all customers',
  ADD COLUMN discount_registered DECIMAL(5,2)  NOT NULL DEFAULT 0 COMMENT 'Extra discount % for registered customers';

-- ============================================================
-- TABLE: Store_Budget
-- ============================================================
CREATE TABLE IF NOT EXISTS Store_Budget (
    budget_id    INT AUTO_INCREMENT PRIMARY KEY,
    amount       DECIMAL(12,2) NOT NULL,
    type         ENUM('deposit','purchase','adjustment') NOT NULL DEFAULT 'deposit',
    description  VARCHAR(255),
    reference_id INT DEFAULT NULL COMMENT 'supplier_purchase_id if purchase',
    created_by   VARCHAR(80) NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: Supplier_Purchase
-- ============================================================
CREATE TABLE IF NOT EXISTS Supplier_Purchase (
    purchase_id   INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id   INT NOT NULL,
    product_id    INT NOT NULL,
    quantity      INT NOT NULL CHECK (quantity > 0),
    unit_cost     DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
    total_cost    DECIMAL(10,2) NOT NULL,
    purchased_by  VARCHAR(80) NOT NULL,
    purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notes         TEXT,
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id) ON DELETE RESTRICT,
    FOREIGN KEY (product_id)  REFERENCES Product(product_id)   ON DELETE RESTRICT
);

-- ============================================================
-- TABLE: Store_Settings
-- ============================================================
CREATE TABLE IF NOT EXISTS Store_Settings (
    setting_key   VARCHAR(80) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    updated_by    VARCHAR(80),
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: Employee
-- ============================================================
CREATE TABLE IF NOT EXISTS Employee (
    employee_id  INT AUTO_INCREMENT PRIMARY KEY,
    first_name   VARCHAR(80)  NOT NULL,
    last_name    VARCHAR(80)  NOT NULL,
    email        VARCHAR(100) UNIQUE,
    phone        VARCHAR(20),
    role         ENUM('manager','cashier','stock_handler','rack_manager') NOT NULL,
    base_salary  DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (base_salary >= 0),
    join_date    DATE NOT NULL DEFAULT (CURRENT_DATE),
    status       ENUM('active','inactive') NOT NULL DEFAULT 'active',
    address      TEXT
);

-- ============================================================
-- TABLE: Duty
-- ============================================================
CREATE TABLE IF NOT EXISTS Duty (
    duty_id     INT AUTO_INCREMENT PRIMARY KEY,
    duty_name   VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    department  VARCHAR(80)  NOT NULL DEFAULT 'General'
);

-- ============================================================
-- TABLE: Duty_Assignment
-- ============================================================
CREATE TABLE IF NOT EXISTS Duty_Assignment (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id   INT NOT NULL,
    duty_id       INT NOT NULL,
    assigned_by   INT NOT NULL,
    assigned_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    shift         ENUM('morning','evening','night') NOT NULL DEFAULT 'morning',
    status        ENUM('active','completed','cancelled') NOT NULL DEFAULT 'active',
    notes         TEXT,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (duty_id)     REFERENCES Duty(duty_id)         ON DELETE RESTRICT,
    FOREIGN KEY (assigned_by) REFERENCES Employee(employee_id) ON DELETE RESTRICT
);

-- ============================================================
-- TABLE: Salary_Payment
-- ============================================================
CREATE TABLE IF NOT EXISTS Salary_Payment (
    payment_id      INT AUTO_INCREMENT PRIMARY KEY,
    employee_id     INT NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    payment_date    DATE NOT NULL DEFAULT (CURRENT_DATE),
    month_year      VARCHAR(20) NOT NULL,
    paid_by         VARCHAR(80) NOT NULL,
    payment_method  ENUM('cash','bank_transfer','cheque') NOT NULL DEFAULT 'cash',
    notes           TEXT,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id) ON DELETE CASCADE
);

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Update cost prices (~60% of unit price)
UPDATE Product SET cost_price = ROUND(unit_price * 0.60, 2);

-- Initial store budget
INSERT INTO Store_Budget (amount, type, description, created_by) VALUES
(500000.00, 'deposit', 'Initial store budget', 'admin');

-- Global discount setting
INSERT INTO Store_Settings (setting_key, setting_value, updated_by) VALUES
('registered_customer_discount', '5', 'admin');

-- Duties
INSERT INTO Duty (duty_name, description, department) VALUES
('Cashier',          'Handle customer billing and payments',     'Sales'),
('Rack Management',  'Organize and restock product racks',       'Inventory'),
('Stock Management', 'Receive, count and store incoming stock',  'Inventory'),
('Customer Service', 'Assist customers and handle complaints',   'Sales'),
('Security',         'Monitor store premises',                   'Operations'),
('Cleaning',         'Maintain store cleanliness',               'Operations');

-- Employees
INSERT INTO Employee (first_name, last_name, email, phone, role, base_salary, join_date, status, address) VALUES
('Kamran', 'Butt',    'kamran@retailms.pk',  '0300-1010101', 'manager',       85000.00, '2023-01-15', 'active', 'DHA Lahore'),
('Zara',   'Malik',   'zara@retailms.pk',    '0321-2020202', 'manager',       80000.00, '2023-03-01', 'active', 'Gulberg Lahore'),
('Usman',  'Ali',     'usman@retailms.pk',   '0333-3030303', 'cashier',       35000.00, '2023-06-01', 'active', 'Model Town Lahore'),
('Hina',   'Nawaz',   'hina@retailms.pk',    '0345-4040404', 'cashier',       33000.00, '2023-07-15', 'active', 'Johar Town Lahore'),
('Bilal',  'Shah',    'bilal@retailms.pk',   '0311-5050505', 'stock_handler', 30000.00, '2023-08-01', 'active', 'Bahria Town Lahore'),
('Saima',  'Qureshi', 'saima@retailms.pk',   '0322-6060606', 'rack_manager',  28000.00, '2023-09-01', 'active', 'Faisal Town Lahore'),
('Tariq',  'Hassan',  'tariq@retailms.pk',   '0300-7070707', 'cashier',       32000.00, '2024-01-10', 'active', 'Wapda Town Lahore'),
('Nadia',  'Baig',    'nadia@retailms.pk',   '0321-8080808', 'stock_handler', 29000.00, '2024-02-20', 'active', 'Township Lahore');

-- Duty assignments
INSERT INTO Duty_Assignment (employee_id, duty_id, assigned_by, assigned_date, shift, status, notes) VALUES
(3, 1, 1, '2026-06-01', 'morning', 'active', 'Morning shift cashier'),
(4, 1, 1, '2026-06-01', 'evening', 'active', 'Evening shift cashier'),
(5, 3, 2, '2026-06-01', 'morning', 'active', 'Handle incoming stock'),
(6, 2, 2, '2026-06-01', 'morning', 'active', 'Electronics and clothing racks'),
(7, 1, 1, '2026-06-02', 'night',   'active', 'Night shift cashier'),
(8, 3, 2, '2026-06-02', 'evening', 'active', 'Evening stock receiving');

-- Salary payments
INSERT INTO Salary_Payment (employee_id, amount, payment_date, month_year, paid_by, payment_method, notes) VALUES
(1, 85000.00, '2026-06-01', 'May 2026', 'admin', 'bank_transfer', 'May salary - Manager'),
(2, 80000.00, '2026-06-01', 'May 2026', 'admin', 'bank_transfer', 'May salary - Manager'),
(3, 35000.00, '2026-06-01', 'May 2026', 'admin', 'cash',          'May salary - Cashier'),
(4, 33000.00, '2026-06-01', 'May 2026', 'admin', 'cash',          'May salary - Cashier'),
(5, 30000.00, '2026-06-01', 'May 2026', 'admin', 'cash',          'May salary - Stock Handler'),
(6, 28000.00, '2026-06-01', 'May 2026', 'admin', 'cash',          'May salary - Rack Manager'),
(7, 32000.00, '2026-06-01', 'May 2026', 'admin', 'cash',          'May salary - Cashier'),
(8, 29000.00, '2026-06-01', 'May 2026', 'admin', 'cash',          'May salary - Stock Handler');

-- Supplier purchases
INSERT INTO Supplier_Purchase (supplier_id, product_id, quantity, unit_cost, total_cost, purchased_by, purchase_date) VALUES
(1, 1, 15, 51000.00, 765000.00, 'admin', '2024-08-15 09:00:00'),
(1, 2, 22, 27000.00, 594000.00, 'admin', '2024-08-15 09:30:00'),
(2, 4, 60,  1080.00,  64800.00, 'admin', '2024-08-20 10:00:00'),
(3, 7, 90,   480.00,  43200.00, 'admin', '2024-08-22 11:00:00'),
(4,10, 35,  3900.00, 136500.00, 'admin', '2024-08-25 09:30:00');

-- Budget deductions for purchases
INSERT INTO Store_Budget (amount, type, description, reference_id, created_by, created_at) VALUES
(-765000.00, 'purchase', 'Restock: Samsung TV x15 from TechWorld Supplies',       1, 'admin', '2024-08-15 09:00:00'),
(-594000.00, 'purchase', 'Restock: Sony Headphones x22 from TechWorld Supplies',  2, 'admin', '2024-08-15 09:30:00'),
(-64800.00,  'purchase', 'Restock: Men Formal Shirt x60 from FashionHub Co.',     3, 'admin', '2024-08-20 10:00:00'),
(-43200.00,  'purchase', 'Restock: Basmati Rice x90 from FreshMart Traders',      4, 'admin', '2024-08-22 11:00:00'),
(-136500.00, 'purchase', 'Restock: Cookware Set x35 from HomePro Distributors',   5, 'admin', '2024-08-25 09:30:00');

-- ============================================================
-- VIEWS
-- ============================================================

-- Updated product details view (includes cost_price and discounts)
CREATE OR REPLACE VIEW vw_product_details AS
SELECT
    p.product_id,
    p.product_name,
    p.description,
    p.unit_price,
    p.cost_price,
    p.reorder_level,
    p.discount_all,
    p.discount_registered,
    c.category_name,
    c.category_id,
    s.supplier_name,
    s.supplier_id,
    i.quantity_in_stock
FROM Product p
JOIN Category c  ON p.category_id = c.category_id
JOIN Supplier s  ON p.supplier_id = s.supplier_id
JOIN Inventory i ON p.product_id  = i.product_id;

-- Daily sales view
CREATE OR REPLACE VIEW vw_daily_sales AS
SELECT
    DATE(s.sale_date)             AS sale_day,
    COUNT(s.sale_id)              AS total_sales,
    SUM(s.total_amount)           AS daily_revenue,
    COUNT(DISTINCT s.customer_id) AS registered_customers,
    SUM(CASE WHEN s.customer_id IS NULL THEN 1 ELSE 0 END) AS guest_sales
FROM Sale s
GROUP BY DATE(s.sale_date)
ORDER BY sale_day DESC;

-- Profit summary view
CREATE OR REPLACE VIEW vw_profit_summary AS
SELECT
    SUM(si.quantity * si.unit_price)                                                        AS total_revenue,
    SUM(si.quantity * p.cost_price)                                                         AS total_cost,
    SUM(si.quantity * si.unit_price) - SUM(si.quantity * p.cost_price)                     AS gross_profit,
    CASE
        WHEN SUM(si.quantity * si.unit_price) > 0
        THEN ROUND(
            (SUM(si.quantity * si.unit_price) - SUM(si.quantity * p.cost_price))
            / SUM(si.quantity * si.unit_price) * 100, 2)
        ELSE 0
    END                                                                                     AS profit_margin_pct
FROM Sale_Item si
JOIN Product p ON si.product_id = p.product_id;

-- Budget balance view
CREATE OR REPLACE VIEW vw_budget_balance AS
SELECT
    SUM(CASE WHEN type = 'deposit'  THEN amount  ELSE 0   END) AS total_deposited,
    SUM(CASE WHEN type = 'purchase' THEN ABS(amount) ELSE 0 END) AS total_spent,
    SUM(amount)                                                   AS current_balance
FROM Store_Budget;

-- Supplier purchase history view
CREATE OR REPLACE VIEW vw_supplier_purchases AS
SELECT
    sp.purchase_id,
    sp.purchase_date,
    s.supplier_id,
    s.supplier_name,
    p.product_id,
    p.product_name,
    c.category_name,
    sp.quantity,
    sp.unit_cost,
    sp.total_cost,
    sp.purchased_by,
    sp.notes
FROM Supplier_Purchase sp
JOIN Supplier s  ON sp.supplier_id = s.supplier_id
JOIN Product p   ON sp.product_id  = p.product_id
JOIN Category c  ON p.category_id  = c.category_id
ORDER BY sp.purchase_date DESC;

-- Employee duties view
CREATE OR REPLACE VIEW vw_employee_duties AS
SELECT
    e.employee_id,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    e.role,
    e.status AS employee_status,
    e.base_salary,
    d.duty_name,
    d.department,
    da.shift,
    da.assigned_date,
    da.status AS duty_status,
    CONCAT(m.first_name, ' ', m.last_name) AS assigned_by_name,
    da.notes
FROM Employee e
LEFT JOIN Duty_Assignment da ON e.employee_id = da.employee_id AND da.status = 'active'
LEFT JOIN Duty d             ON da.duty_id     = d.duty_id
LEFT JOIN Employee m         ON da.assigned_by  = m.employee_id;

-- Salary summary view
CREATE OR REPLACE VIEW vw_salary_summary AS
SELECT
    e.employee_id,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    e.role,
    e.base_salary,
    COUNT(sp.payment_id)       AS total_payments,
    COALESCE(SUM(sp.amount),0) AS total_paid,
    MAX(sp.payment_date)       AS last_payment_date,
    MAX(sp.month_year)         AS last_month_paid
FROM Employee e
LEFT JOIN Salary_Payment sp ON e.employee_id = sp.employee_id
GROUP BY e.employee_id, employee_name, e.role, e.base_salary;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER $$

CREATE PROCEDURE sp_assign_duty(
    IN p_employee_id  INT,
    IN p_duty_id      INT,
    IN p_assigned_by  INT,
    IN p_shift        VARCHAR(20),
    IN p_notes        TEXT
)
BEGIN
    UPDATE Duty_Assignment
    SET status = 'cancelled'
    WHERE employee_id = p_employee_id AND status = 'active';

    INSERT INTO Duty_Assignment (employee_id, duty_id, assigned_by, shift, status, notes)
    VALUES (p_employee_id, p_duty_id, p_assigned_by, p_shift, 'active', p_notes);
END$$

CREATE PROCEDURE sp_pay_salary(
    IN p_employee_id    INT,
    IN p_amount         DECIMAL(10,2),
    IN p_month_year     VARCHAR(20),
    IN p_paid_by        VARCHAR(80),
    IN p_payment_method VARCHAR(20),
    IN p_notes          TEXT
)
BEGIN
    INSERT INTO Salary_Payment (employee_id, amount, payment_date, month_year, paid_by, payment_method, notes)
    VALUES (p_employee_id, p_amount, CURRENT_DATE, p_month_year, p_paid_by, p_payment_method, p_notes);
END$$

DELIMITER ;

-- ============================================================
-- VERIFY
-- ============================================================
SELECT 'Tables created' AS status;
SELECT * FROM vw_product_details        LIMIT 3;
SELECT * FROM vw_profit_summary;
SELECT * FROM vw_budget_balance;
SELECT * FROM vw_daily_sales            LIMIT 5;
SELECT * FROM vw_supplier_purchases     LIMIT 3;
SELECT * FROM vw_employee_duties        LIMIT 3;
SELECT * FROM vw_salary_summary         LIMIT 3;
