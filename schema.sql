-- ============================================================
--  RETAIL MANAGEMENT SYSTEM — MySQL Schema
--  Includes: DDL, DML (sample data), Views, Stored Procedures
-- ============================================================

DROP DATABASE IF EXISTS retail_db;
CREATE DATABASE retail_db;
USE retail_db;

-- ============================================================
--  DDL — TABLE DEFINITIONS
-- ============================================================

CREATE TABLE Category (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT
);

CREATE TABLE Supplier (
    supplier_id    INT AUTO_INCREMENT PRIMARY KEY,
    supplier_name  VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone          VARCHAR(20),
    email          VARCHAR(100) UNIQUE,
    address        TEXT
);

CREATE TABLE Product (
    product_id   INT AUTO_INCREMENT PRIMARY KEY,
    category_id  INT NOT NULL,
    supplier_id  INT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    description  TEXT,
    unit_price   DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    reorder_level INT NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
    FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id) ON DELETE RESTRICT
);

CREATE TABLE Inventory (
    inventory_id      INT AUTO_INCREMENT PRIMARY KEY,
    product_id        INT NOT NULL UNIQUE,
    quantity_in_stock INT NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    last_updated      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE
);

CREATE TABLE Customer (
    customer_id       INT AUTO_INCREMENT PRIMARY KEY,
    first_name        VARCHAR(80) NOT NULL,
    last_name         VARCHAR(80) NOT NULL,
    email             VARCHAR(100) UNIQUE,
    phone             VARCHAR(20),
    address           TEXT,
    registration_date DATE NOT NULL DEFAULT (CURRENT_DATE)
);

CREATE TABLE Sale (
    sale_id      INT AUTO_INCREMENT PRIMARY KEY,
    customer_id  INT DEFAULT NULL,
    sale_date    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE SET NULL
);

CREATE TABLE Sale_Item (
    sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id      INT NOT NULL,
    product_id   INT NOT NULL,
    quantity     INT NOT NULL CHECK (quantity > 0),
    unit_price   DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    FOREIGN KEY (sale_id)    REFERENCES Sale(sale_id)       ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE RESTRICT
);

-- ============================================================
--  DML — SAMPLE DATA
-- ============================================================

INSERT INTO Category (category_name, description) VALUES
('Electronics',     'Electronic devices and accessories'),
('Clothing',        'Men and women apparel'),
('Groceries',       'Food and daily consumables'),
('Home & Kitchen',  'Furniture and kitchen appliances'),
('Sports',          'Sports equipment and gear'),
('Stationery',      'Office and school supplies');

INSERT INTO Supplier (supplier_name, contact_person, phone, email, address) VALUES
('TechWorld Supplies',   'Ali Hassan',     '0300-1234567', 'ali@techworld.pk',    'Plot 12, Lahore'),
('FashionHub Co.',       'Sara Ahmed',     '0321-9876543', 'sara@fashionhub.pk',  'Block B, Karachi'),
('FreshMart Traders',    'Usman Tariq',    '0333-4567890', 'usman@freshmart.pk',  'G-9, Islamabad'),
('HomePro Distributors', 'Ayesha Malik',   '0345-6543210', 'ayesha@homepro.pk',   'Gulberg, Lahore'),
('SportZone Ltd.',       'Bilal Chaudhry', '0311-7891234', 'bilal@sportzone.pk',  'DHA, Lahore'),
('OfficeBase Pvt.',      'Nadia Iqbal',    '0322-3216540', 'nadia@officebase.pk', 'Blue Area, Islamabad');

INSERT INTO Product (category_id, supplier_id, product_name, description, unit_price, reorder_level) VALUES
(1, 1, 'Samsung 55" QLED TV',      '4K Smart TV with HDR',           85000.00, 5),
(1, 1, 'Sony WH-1000XM5 Headphones','Noise-cancelling wireless',      45000.00, 8),
(1, 1, 'HP Laptop 15s',            'Intel i5, 8GB RAM, 512GB SSD',   95000.00, 5),
(2, 2, 'Men Formal Shirt',         'Cotton slim-fit formal shirt',      1800.00, 20),
(2, 2, 'Women Kameez',             'Lawn fabric summer collection',     2500.00, 20),
(2, 2, 'Denim Jeans',              'Stretchable slim-fit jeans',        3200.00, 15),
(3, 3, 'Basmati Rice 5kg',         'Premium long-grain basmati',         800.00, 30),
(3, 3, 'Sunflower Oil 3L',         'Refined cooking oil',               650.00, 30),
(3, 3, 'Milk 1L',                  'Full-cream pasteurized milk',         180.00, 50),
(4, 4, 'Non-stick Cookware Set',   '5-piece granite-coated set',        6500.00, 10),
(4, 4, 'Wooden Dining Table',      '6-seater solid wood table',        35000.00, 3),
(5, 5, 'Cricket Bat (Kashmir)',    'Full-size Kashmir willow bat',       4500.00, 10),
(5, 5, 'Football Nike Size 5',     'FIFA approved match ball',           3800.00, 10),
(6, 6, 'A4 Paper Ream 500',        '80gsm premium white paper',          850.00, 25),
(6, 6, 'Stapler Set',              'Heavy-duty stapler with pins',        450.00, 20);

INSERT INTO Inventory (product_id, quantity_in_stock) VALUES
(1, 15), (2, 22), (3, 10), (4, 60), (5, 55), (6, 40),
(7, 90), (8, 75), (9,120), (10,35), (11, 8), (12,28),
(13,30), (14,60), (15,45);

INSERT INTO Customer (first_name, last_name, email, phone, address, registration_date) VALUES
('Ahmed',   'Khan',    'ahmed.khan@gmail.com',   '0300-1111111', 'House 5, DHA Lahore',         '2024-01-10'),
('Fatima',  'Ali',     'fatima.ali@yahoo.com',   '0321-2222222', 'Flat 3B, Gulberg Lahore',     '2024-02-15'),
('Hassan',  'Raza',    'hassan.raza@gmail.com',  '0333-3333333', 'Street 7, F-8 Islamabad',     '2024-03-20'),
('Zainab',  'Sheikh',  'zainab.s@hotmail.com',   '0345-4444444', 'Plot 9, PECHS Karachi',       '2024-04-05'),
('Omar',    'Farooq',  'omar.f@gmail.com',        '0311-5555555', 'House 12, Johar Town Lahore', '2024-05-01'),
('Maryam',  'Hussain', 'maryam.h@gmail.com',     '0322-6666666', 'Sector G, Bahria Islamabad',  '2024-06-18'),
('Tariq',   'Mehmood', 'tariq.m@outlook.com',    '0300-7777777', 'Block C, Model Town Lahore',  '2024-07-22'),
('Sana',    'Butt',    'sana.butt@gmail.com',     '0321-8888888', 'House 4, Cavalry Lahore',     '2024-08-30');

-- Sales (some with customer, some guest = NULL)
INSERT INTO Sale (customer_id, sale_date, total_amount) VALUES
(1, '2024-09-01 10:30:00', 0),
(2, '2024-09-02 14:00:00', 0),
(NULL, '2024-09-03 11:15:00', 0),  -- guest
(3, '2024-09-05 16:45:00', 0),
(4, '2024-09-07 09:00:00', 0),
(NULL, '2024-09-08 13:30:00', 0),  -- guest
(5, '2024-09-10 12:00:00', 0),
(6, '2024-09-12 15:00:00', 0),
(7, '2024-09-14 10:00:00', 0),
(1, '2024-09-20 11:00:00', 0);

INSERT INTO Sale_Item (sale_id, product_id, quantity, unit_price) VALUES
(1, 1,  1, 85000.00),
(1, 2,  1, 45000.00),
(2, 4,  2,  1800.00),
(2, 5,  1,  2500.00),
(2, 6,  1,  3200.00),
(3, 7,  3,   800.00),
(3, 8,  2,   650.00),
(3, 9,  5,   180.00),
(4, 3,  1, 95000.00),
(4, 14, 2,   850.00),
(5, 10, 1,  6500.00),
(5, 12, 1,  4500.00),
(6, 13, 1,  3800.00),
(6, 15, 2,   450.00),
(7, 11, 1, 35000.00),
(8, 2,  1, 45000.00),
(8, 1,  1, 85000.00),
(9, 4,  3,  1800.00),
(9, 7,  2,   800.00),
(10, 3, 1, 95000.00),
(10, 2, 2, 45000.00);

-- Update total_amount based on sale items
UPDATE Sale s
SET total_amount = (
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    FROM Sale_Item
    WHERE sale_id = s.sale_id
);

-- ============================================================
--  VIEWS
-- ============================================================

CREATE OR REPLACE VIEW vw_sales_summary AS
SELECT
    s.sale_id,
    s.sale_date,
    COALESCE(CONCAT(c.first_name, ' ', c.last_name), 'Guest') AS customer_name,
    COUNT(si.sale_item_id) AS total_items,
    s.total_amount
FROM Sale s
LEFT JOIN Customer c ON s.customer_id = c.customer_id
JOIN Sale_Item si    ON s.sale_id = si.sale_id
GROUP BY s.sale_id, s.sale_date, customer_name, s.total_amount;

CREATE OR REPLACE VIEW vw_low_stock AS
SELECT
    p.product_id,
    p.product_name,
    i.quantity_in_stock,
    p.reorder_level,
    s.supplier_name,
    s.phone AS supplier_phone
FROM Product p
JOIN Inventory i ON p.product_id = i.product_id
JOIN Supplier s  ON p.supplier_id = s.supplier_id
WHERE i.quantity_in_stock <= p.reorder_level;

CREATE OR REPLACE VIEW vw_product_details AS
SELECT
    p.product_id,
    p.product_name,
    p.unit_price,
    c.category_name,
    s.supplier_name,
    i.quantity_in_stock
FROM Product p
JOIN Category c  ON p.category_id = c.category_id
JOIN Supplier s  ON p.supplier_id = s.supplier_id
JOIN Inventory i ON p.product_id  = i.product_id;

CREATE OR REPLACE VIEW vw_customer_spend AS
SELECT
    c.customer_id,
    CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
    c.email,
    COUNT(s.sale_id)      AS total_orders,
    SUM(s.total_amount)   AS total_spent,
    MAX(s.sale_date)      AS last_purchase
FROM Customer c
JOIN Sale s ON c.customer_id = s.customer_id
GROUP BY c.customer_id, customer_name, c.email;

-- ============================================================
--  STORED PROCEDURES
-- ============================================================

DELIMITER $$

-- Process a new sale
CREATE PROCEDURE sp_process_sale(
    IN  p_customer_id INT,
    OUT p_sale_id     INT
)
BEGIN
    INSERT INTO Sale (customer_id, sale_date, total_amount)
    VALUES (p_customer_id, NOW(), 0);
    SET p_sale_id = LAST_INSERT_ID();
END$$

-- Add item to a sale and update inventory + total
CREATE PROCEDURE sp_add_sale_item(
    IN p_sale_id    INT,
    IN p_product_id INT,
    IN p_quantity   INT
)
BEGIN
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_stock INT;

    SELECT unit_price INTO v_price FROM Product WHERE product_id = p_product_id;
    SELECT quantity_in_stock INTO v_stock FROM Inventory WHERE product_id = p_product_id;

    IF v_stock < p_quantity THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock';
    ELSE
        INSERT INTO Sale_Item (sale_id, product_id, quantity, unit_price)
        VALUES (p_sale_id, p_product_id, p_quantity, v_price);

        UPDATE Inventory
        SET quantity_in_stock = quantity_in_stock - p_quantity
        WHERE product_id = p_product_id;

        UPDATE Sale
        SET total_amount = (
            SELECT SUM(quantity * unit_price) FROM Sale_Item WHERE sale_id = p_sale_id
        )
        WHERE sale_id = p_sale_id;
    END IF;
END$$

-- Restock a product
CREATE PROCEDURE sp_restock_product(
    IN p_product_id INT,
    IN p_quantity   INT
)
BEGIN
    UPDATE Inventory
    SET quantity_in_stock = quantity_in_stock + p_quantity,
        last_updated = NOW()
    WHERE product_id = p_product_id;
END$$

DELIMITER ;

-- ============================================================
--  FIXED QUERIES (for display/demo purposes)
-- ============================================================

-- Q1: All products with category and supplier (JOIN)
-- SELECT p.product_id, p.product_name, p.unit_price, c.category_name, s.supplier_name, i.quantity_in_stock
-- FROM Product p
-- JOIN Category c ON p.category_id = c.category_id
-- JOIN Supplier s ON p.supplier_id = s.supplier_id
-- JOIN Inventory i ON p.product_id = i.product_id;

-- Q2: Total revenue per category (JOIN + GROUP BY)
-- SELECT c.category_name, SUM(si.quantity * si.unit_price) AS revenue
-- FROM Sale_Item si
-- JOIN Product p ON si.product_id = p.product_id
-- JOIN Category c ON p.category_id = c.category_id
-- GROUP BY c.category_name ORDER BY revenue DESC;

-- Q3: Top 5 best-selling products
-- SELECT p.product_name, SUM(si.quantity) AS total_sold
-- FROM Sale_Item si JOIN Product p ON si.product_id = p.product_id
-- GROUP BY p.product_name ORDER BY total_sold DESC LIMIT 5;

-- Q4: Customers who spent above average (nested query)
-- SELECT customer_name, total_spent FROM vw_customer_spend
-- WHERE total_spent > (SELECT AVG(total_amount) FROM Sale WHERE customer_id IS NOT NULL);

-- Q5: Low stock products
-- SELECT * FROM vw_low_stock;
