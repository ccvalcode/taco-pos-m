
-- Crear tipos enumerados para el sistema
CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'cajero', 'mesero', 'cocina');
CREATE TYPE order_status AS ENUM ('pendiente', 'en_preparacion', 'lista', 'pagada', 'entregada');
CREATE TYPE order_type AS ENUM ('mesa', 'para_llevar');
CREATE TYPE payment_method AS ENUM ('efectivo', 'tarjeta', 'transferencia');
CREATE TYPE table_status AS ENUM ('disponible', 'ocupada', 'sucia');

-- Tabla de usuarios del sistema
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'cajero',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de turnos
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE,
    initial_cash DECIMAL(10,2) DEFAULT 0,
    final_cash DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true
);

-- Tabla de categorías de productos
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#FF6B35',
    icon TEXT,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Tabla de productos
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_customizable BOOLEAN DEFAULT false,
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    max_stock INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de modificadores (tortilla, picante, extras)
CREATE TABLE modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'tortilla', 'picante', 'extra'
    price DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Tabla de mesas
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER UNIQUE NOT NULL,
    capacity INTEGER DEFAULT 4,
    status table_status DEFAULT 'disponible',
    x_position INTEGER DEFAULT 0,
    y_position INTEGER DEFAULT 0
);

-- Tabla de órdenes
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    table_id UUID REFERENCES tables(id),
    user_id UUID REFERENCES users(id) NOT NULL,
    shift_id UUID REFERENCES shifts(id) NOT NULL,
    type order_type NOT NULL,
    status order_status DEFAULT 'pendiente',
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    payment_method payment_method,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de items de órdenes
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT
);

-- Tabla de modificadores aplicados a items
CREATE TABLE order_item_modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    modifier_id UUID REFERENCES modifiers(id),
    price DECIMAL(10,2) DEFAULT 0
);

-- Tabla de cortes de caja
CREATE TABLE cash_cuts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID REFERENCES shifts(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    type TEXT NOT NULL, -- 'corte_x', 'corte_z'
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_cash DECIMAL(10,2) DEFAULT 0,
    total_card DECIMAL(10,2) DEFAULT 0,
    total_transfer DECIMAL(10,2) DEFAULT 0,
    cash_counted DECIMAL(10,2),
    difference DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de proveedores
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_cuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (acceso completo para usuarios autenticados)
CREATE POLICY "Usuarios pueden ver todos los datos" ON users FOR ALL USING (true);
CREATE POLICY "Shifts acceso completo" ON shifts FOR ALL USING (true);
CREATE POLICY "Categorías acceso completo" ON categories FOR ALL USING (true);
CREATE POLICY "Productos acceso completo" ON products FOR ALL USING (true);
CREATE POLICY "Modificadores acceso completo" ON modifiers FOR ALL USING (true);
CREATE POLICY "Mesas acceso completo" ON tables FOR ALL USING (true);
CREATE POLICY "Órdenes acceso completo" ON orders FOR ALL USING (true);
CREATE POLICY "Items órdenes acceso completo" ON order_items FOR ALL USING (true);
CREATE POLICY "Modificadores items acceso completo" ON order_item_modifiers FOR ALL USING (true);
CREATE POLICY "Cortes caja acceso completo" ON cash_cuts FOR ALL USING (true);
CREATE POLICY "Proveedores acceso completo" ON suppliers FOR ALL USING (true);

-- Insertar datos iniciales
INSERT INTO categories (name, description, color, icon, order_position) VALUES
('Tacos', 'Tacos tradicionales mexicanos', '#FF6B35', '🌮', 1),
('Bebidas', 'Refrescos, aguas y bebidas', '#4ECDC4', '🥤', 2),
('Complementos', 'Guacamole, salsas y acompañamientos', '#45B7D1', '🥑', 3),
('Postres', 'Dulces tradicionales', '#96CEB4', '🍮', 4);

INSERT INTO products (category_id, name, description, price, is_customizable) VALUES
((SELECT id FROM categories WHERE name = 'Tacos'), 'Taco de Pastor', 'Carne de cerdo marinada con piña', 18.00, true),
((SELECT id FROM categories WHERE name = 'Tacos'), 'Taco de Carnitas', 'Carne de cerdo confitada', 16.00, true),
((SELECT id FROM categories WHERE name = 'Tacos'), 'Taco de Pollo', 'Pollo asado con especias', 15.00, true),
((SELECT id FROM categories WHERE name = 'Tacos'), 'Taco de Bistec', 'Carne de res asada', 20.00, true),
((SELECT id FROM categories WHERE name = 'Bebidas'), 'Coca Cola', 'Refresco 355ml', 25.00, false),
((SELECT id FROM categories WHERE name = 'Bebidas'), 'Agua de Horchata', 'Bebida tradicional mexicana', 20.00, false),
((SELECT id FROM categories WHERE name = 'Bebidas'), 'Agua de Jamaica', 'Agua fresca de flor de jamaica', 18.00, false),
((SELECT id FROM categories WHERE name = 'Complementos'), 'Guacamole', 'Aguacate fresco con especias', 35.00, false),
((SELECT id FROM categories WHERE name = 'Complementos'), 'Salsa Verde', 'Salsa picante de tomatillo', 10.00, false);

INSERT INTO modifiers (name, type, price) VALUES
('Tortilla de Maíz', 'tortilla', 0),
('Tortilla de Harina', 'tortilla', 2.00),
('Sin Picante', 'picante', 0),
('Poco Picante', 'picante', 0),
('Muy Picante', 'picante', 0),
('Extra Carne', 'extra', 8.00),
('Extra Queso', 'extra', 5.00),
('Extra Aguacate', 'extra', 6.00);

INSERT INTO tables (number, capacity) VALUES
(1, 4), (2, 4), (3, 2), (4, 6), (5, 4), 
(6, 2), (7, 4), (8, 8), (9, 4), (10, 2);

-- Función para generar número de orden
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    SELECT 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
           LPAD((COALESCE(MAX(SUBSTRING(order_number FROM '[0-9]+$')::INTEGER), 0) + 1)::TEXT, 4, '0')
    INTO new_number
    FROM orders 
    WHERE order_number LIKE 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-generar número de orden
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();
