
-- Eliminar tablas existentes si existen para recrear completamente
DROP TABLE IF EXISTS cash_cuts CASCADE;
DROP TABLE IF EXISTS order_item_modifiers CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS modifiers CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;

-- Eliminar tipos si existen
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS order_type CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS table_status CASCADE;
DROP TYPE IF EXISTS app_permission CASCADE;

-- Recrear tipos enumerados
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'supervisor', 'cajero', 'mesero', 'cocina');
CREATE TYPE order_status AS ENUM ('pendiente', 'en_preparacion', 'lista', 'pagada', 'entregada', 'cancelada');
CREATE TYPE order_type AS ENUM ('mesa', 'para_llevar');
CREATE TYPE payment_method AS ENUM ('efectivo', 'tarjeta', 'transferencia');
CREATE TYPE table_status AS ENUM ('disponible', 'ocupada', 'sucia', 'reservada');
CREATE TYPE app_permission AS ENUM ('pos_access', 'kitchen_access', 'sales_view', 'users_manage', 'cash_manage', 'reports_view', 'inventory_manage');

-- Tabla de usuarios con autenticación
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'cajero',
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de permisos de usuarios
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission app_permission NOT NULL,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, permission)
);

-- Tabla de turnos mejorada
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE,
    initial_cash DECIMAL(10,2) DEFAULT 0,
    final_cash DECIMAL(10,2),
    expected_cash DECIMAL(10,2),
    cash_difference DECIMAL(10,2),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    closed_by UUID REFERENCES users(id)
);

-- Tabla de categorías
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#FF6B35',
    icon TEXT,
    order_position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de productos con inventario
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    barcode TEXT,
    sku TEXT UNIQUE,
    is_customizable BOOLEAN DEFAULT false,
    stock_quantity INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    max_stock INTEGER DEFAULT 100,
    unit TEXT DEFAULT 'pcs',
    tax_rate DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de modificadores
CREATE TABLE modifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    price DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de mesas
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER UNIQUE NOT NULL,
    name TEXT,
    capacity INTEGER DEFAULT 4,
    status table_status DEFAULT 'disponible',
    x_position INTEGER DEFAULT 0,
    y_position INTEGER DEFAULT 0,
    qr_code TEXT,
    is_active BOOLEAN DEFAULT true
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
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    payment_method payment_method,
    customer_name TEXT,
    customer_phone TEXT,
    notes TEXT,
    kitchen_notes TEXT,
    estimated_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de items de órdenes
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    notes TEXT,
    kitchen_notes TEXT
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
    type TEXT NOT NULL,
    total_sales DECIMAL(10,2) DEFAULT 0,
    total_cash DECIMAL(10,2) DEFAULT 0,
    total_card DECIMAL(10,2) DEFAULT 0,
    total_transfer DECIMAL(10,2) DEFAULT 0,
    cash_counted DECIMAL(10,2),
    difference DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
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
    tax_id TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de movimientos de inventario
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) NOT NULL,
    type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reason TEXT,
    reference_id UUID, -- puede referenciar orden, compra, etc.
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS básicas (acceso completo para usuarios autenticados)
CREATE POLICY "Acceso completo autenticado" ON users FOR ALL USING (true);
CREATE POLICY "Acceso completo autenticado" ON user_permissions FOR ALL USING (true);
CREATE POLICY "Acceso completo autenticado" ON shifts FOR ALL USING (true);
CREATE POLICY "Acceso completo autenticado" ON categories FOR ALL USING (true);
CREATE POLICY "Acceso completo autenticado" ON products FOR ALL USING (true);
CREATE POLICY "Acceso completo autenticado" ON modifiers FOR ALL USING (true);
CREATE POLICY "Acceso completo autenticado" ON tables FOR ALL USING (true);
CREATE POLICY "Acceso completo autenticado" ON orders FOR ALL USING (true);
CREATE POLICY "Acceso completo autenticado" ON order_items FOR ALL USING (true);
CREATE POLICY "Acceso completo autenticado" ON order_item_modifiers FOR ALL USING (true);
CREATE POLICY "Acceso completo autenticado" ON cash_cuts FOR ALL USING (true);
CREATE POLICY "Acceso completo autenticado" ON suppliers FOR ALL USING (true);
CREATE POLICY "Acceso completo autenticado" ON inventory_movements FOR ALL USING (true);

-- Función para verificar permisos
CREATE OR REPLACE FUNCTION has_permission(user_uuid UUID, required_permission app_permission)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_permissions up
        JOIN users u ON u.id = up.user_id
        WHERE u.auth_user_id = user_uuid 
        AND up.permission = required_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Función para crear perfil de usuario automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_user_id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'cajero'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insertar datos iniciales
INSERT INTO categories (name, description, color, icon, order_position) VALUES
('Tacos', 'Tacos tradicionales mexicanos', '#FF6B35', '🌮', 1),
('Bebidas', 'Refrescos, aguas y bebidas', '#4ECDC4', '🥤', 2),
('Complementos', 'Guacamole, salsas y acompañamientos', '#45B7D1', '🥑', 3),
('Postres', 'Dulces tradicionales', '#96CEB4', '🍮', 4);

INSERT INTO products (category_id, name, description, price, cost, sku, is_customizable, stock_quantity) VALUES
((SELECT id FROM categories WHERE name = 'Tacos'), 'Taco de Pastor', 'Carne de cerdo marinada con piña', 18.00, 10.00, 'TAC001', true, 100),
((SELECT id FROM categories WHERE name = 'Tacos'), 'Taco de Carnitas', 'Carne de cerdo confitada', 16.00, 9.00, 'TAC002', true, 80),
((SELECT id FROM categories WHERE name = 'Tacos'), 'Taco de Pollo', 'Pollo asado con especias', 15.00, 8.00, 'TAC003', true, 120),
((SELECT id FROM categories WHERE name = 'Tacos'), 'Taco de Bistec', 'Carne de res asada', 20.00, 12.00, 'TAC004', true, 60),
((SELECT id FROM categories WHERE name = 'Bebidas'), 'Coca Cola', 'Refresco 355ml', 25.00, 12.00, 'BEB001', false, 50),
((SELECT id FROM categories WHERE name = 'Bebidas'), 'Agua de Horchata', 'Bebida tradicional mexicana', 20.00, 8.00, 'BEB002', false, 30),
((SELECT id FROM categories WHERE name = 'Bebidas'), 'Agua de Jamaica', 'Agua fresca de flor de jamaica', 18.00, 7.00, 'BEB003', false, 25),
((SELECT id FROM categories WHERE name = 'Complementos'), 'Guacamole', 'Aguacate fresco con especias', 35.00, 20.00, 'COM001', false, 20),
((SELECT id FROM categories WHERE name = 'Complementos'), 'Salsa Verde', 'Salsa picante de tomatillo', 10.00, 4.00, 'COM002', false, 40);

INSERT INTO modifiers (name, type, price) VALUES
('Tortilla de Maíz', 'tortilla', 0),
('Tortilla de Harina', 'tortilla', 2.00),
('Sin Picante', 'picante', 0),
('Poco Picante', 'picante', 0),
('Muy Picante', 'picante', 0),
('Extra Carne', 'extra', 8.00),
('Extra Queso', 'extra', 5.00),
('Extra Aguacate', 'extra', 6.00);

INSERT INTO tables (number, name, capacity) VALUES
(1, 'Mesa 1', 4), (2, 'Mesa 2', 4), (3, 'Mesa 3', 2), (4, 'Mesa 4', 6), (5, 'Mesa 5', 4), 
(6, 'Mesa 6', 2), (7, 'Mesa 7', 4), (8, 'Mesa 8', 8), (9, 'Mesa 9', 4), (10, 'Mesa 10', 2);

-- Crear usuario administrador por defecto (este se actualizará cuando se registre el primer usuario)
INSERT INTO users (email, name, role, is_active) VALUES
('admin@taqueria.com', 'Administrador', 'super_admin', true);

-- Asignar todos los permisos al usuario administrador
INSERT INTO user_permissions (user_id, permission) 
SELECT 
    (SELECT id FROM users WHERE email = 'admin@taqueria.com'),
    unnest(ARRAY['pos_access', 'kitchen_access', 'sales_view', 'users_manage', 'cash_manage', 'reports_view', 'inventory_manage']::app_permission[]);
