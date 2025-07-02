
-- Limpiar datos existentes para evitar duplicados
DELETE FROM user_permissions WHERE user_id IN (
    SELECT id FROM users WHERE email IN (
        'superadmin@taqueria.com',
        'admin@taqueria.com', 
        'supervisor@taqueria.com',
        'cajero@taqueria.com',
        'mesero@taqueria.com',
        'cocina@taqueria.com'
    )
);

-- Eliminar usuarios existentes de la tabla users
DELETE FROM users WHERE email IN (
    'superadmin@taqueria.com',
    'admin@taqueria.com', 
    'supervisor@taqueria.com',
    'cajero@taqueria.com',
    'mesero@taqueria.com',
    'cocina@taqueria.com'
);

-- Eliminar usuarios existentes de auth.users si existen
DELETE FROM auth.users WHERE email IN (
    'superadmin@taqueria.com',
    'admin@taqueria.com', 
    'supervisor@taqueria.com',
    'cajero@taqueria.com',
    'mesero@taqueria.com',
    'cocina@taqueria.com'
);

-- Crear usuarios de prueba en auth.users (el trigger creará automáticamente los perfiles)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    role
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'superadmin@taqueria.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"name": "Super Administrador"}',
    'authenticated'
),
(
    '22222222-2222-2222-2222-222222222222',
    'admin@taqueria.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"name": "Administrador"}',
    'authenticated'
),
(
    '33333333-3333-3333-3333-333333333333',
    'supervisor@taqueria.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"name": "Supervisor"}',
    'authenticated'
),
(
    '44444444-4444-4444-4444-444444444444',
    'cajero@taqueria.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"name": "Cajero"}',
    'authenticated'
),
(
    '55555555-5555-5555-5555-555555555555',
    'mesero@taqueria.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"name": "Mesero"}',
    'authenticated'
),
(
    '66666666-6666-6666-6666-666666666666',
    'cocina@taqueria.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"name": "Cocinero"}',
    'authenticated'
);

-- Actualizar los roles de los usuarios creados automáticamente por el trigger
UPDATE users SET role = 'super_admin', name = 'Super Administrador' WHERE email = 'superadmin@taqueria.com';
UPDATE users SET role = 'admin', name = 'Administrador' WHERE email = 'admin@taqueria.com';
UPDATE users SET role = 'supervisor', name = 'Supervisor' WHERE email = 'supervisor@taqueria.com';
UPDATE users SET role = 'cajero', name = 'Cajero' WHERE email = 'cajero@taqueria.com';
UPDATE users SET role = 'mesero', name = 'Mesero' WHERE email = 'mesero@taqueria.com';
UPDATE users SET role = 'cocina', name = 'Cocinero' WHERE email = 'cocina@taqueria.com';

-- Asignar permisos según el rol
-- Super Admin - todos los permisos
INSERT INTO user_permissions (user_id, permission) 
SELECT 
    (SELECT id FROM users WHERE email = 'superadmin@taqueria.com'),
    unnest(ARRAY['pos_access', 'kitchen_access', 'sales_view', 'users_manage', 'cash_manage', 'reports_view', 'inventory_manage']::app_permission[]);

-- Admin - casi todos los permisos excepto gestión completa de usuarios
INSERT INTO user_permissions (user_id, permission) 
SELECT 
    (SELECT id FROM users WHERE email = 'admin@taqueria.com'),
    unnest(ARRAY['pos_access', 'kitchen_access', 'sales_view', 'cash_manage', 'reports_view', 'inventory_manage']::app_permission[]);

-- Supervisor - permisos de supervisión
INSERT INTO user_permissions (user_id, permission) 
SELECT 
    (SELECT id FROM users WHERE email = 'supervisor@taqueria.com'),
    unnest(ARRAY['pos_access', 'kitchen_access', 'sales_view', 'reports_view']::app_permission[]);

-- Cajero - acceso al POS y ventas
INSERT INTO user_permissions (user_id, permission) 
SELECT 
    (SELECT id FROM users WHERE email = 'cajero@taqueria.com'),
    unnest(ARRAY['pos_access', 'sales_view']::app_permission[]);

-- Mesero - acceso al POS
INSERT INTO user_permissions (user_id, permission) 
SELECT 
    (SELECT id FROM users WHERE email = 'mesero@taqueria.com'),
    unnest(ARRAY['pos_access']::app_permission[]);

-- Cocina - acceso a cocina
INSERT INTO user_permissions (user_id, permission) 
SELECT 
    (SELECT id FROM users WHERE email = 'cocina@taqueria.com'),
    unnest(ARRAY['kitchen_access']::app_permission[]);
