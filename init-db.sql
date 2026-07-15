CREATE SCHEMA IF NOT EXISTS warehouse;

-- Basic tables for OLTP
CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(255) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    prep_time_estimate INT DEFAULT 10,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cafe_tables (
    id SERIAL PRIMARY KEY,
    table_number INT NOT NULL UNIQUE,
    qr_token VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'free' -- free, occupied
);

CREATE TABLE IF NOT EXISTS cafe_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    table_id INT REFERENCES cafe_tables(id),
    table_number INT,
    customer_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'placed', -- placed, confirmed, preparing, ready, served, completed, cancelled
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INT REFERENCES menu_items(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL
);

-- Analytics Warehouse schema
CREATE TABLE IF NOT EXISTS warehouse.dim_items (
    item_id INT PRIMARY KEY,
    name VARCHAR(255),
    category VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS warehouse.dim_tables (
    table_id INT PRIMARY KEY,
    table_number INT
);

CREATE TABLE IF NOT EXISTS warehouse.dim_time (
    time_id VARCHAR(255) PRIMARY KEY,
    date DATE,
    hour INT,
    day_of_week INT
);

CREATE TABLE IF NOT EXISTS warehouse.fact_orders (
    order_id VARCHAR(255) PRIMARY KEY,
    time_id VARCHAR(255),
    table_id INT,
    total_amount DECIMAL(10, 2),
    status VARCHAR(50),
    payment_status VARCHAR(50),
    prep_time_actual INT
);
