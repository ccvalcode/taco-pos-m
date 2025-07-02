
-- Verificar si los usuarios existen y crearlos correctamente
DO $$
BEGIN
    -- Eliminar usuarios existentes para empezar limpio
    DELETE FROM auth.users WHERE email IN (
        'admin@taqueria.com',
        'superadmin@taqueria.com'
    );
    
    -- Crear usuario admin de prueba
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        'authenticated',
        'authenticated',
        'admin@taqueria.com',
        crypt('admin123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"Administrador"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

    -- Crear superadmin de prueba
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        'bbbbbbbb-cccc-dddd-eeee-ffffffffffff',
        'authenticated',
        'authenticated',
        'superadmin@taqueria.com',
        crypt('admin123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"Super Administrador"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );

EXCEPTION WHEN OTHERS THEN
    -- Si hay error, crear de forma más simple
    RAISE NOTICE 'Error creando usuarios: %', SQLERRM;
END $$;

-- Asegurar que los perfiles se crearon correctamente
INSERT INTO users (auth_user_id, email, name, role) VALUES
('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', 'admin@taqueria.com', 'Administrador', 'admin'),
('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', 'superadmin@taqueria.com', 'Super Administrador', 'super_admin')
ON CONFLICT (auth_user_id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role;

-- Asignar permisos
INSERT INTO user_permissions (user_id, permission)
SELECT u.id, unnest(ARRAY['pos_access', 'kitchen_access', 'sales_view', 'users_manage', 'cash_manage', 'reports_view', 'inventory_manage']::app_permission[])
FROM users u WHERE u.email = 'superadmin@taqueria.com'
ON CONFLICT DO NOTHING;

INSERT INTO user_permissions (user_id, permission)
SELECT u.id, unnest(ARRAY['pos_access', 'kitchen_access', 'sales_view', 'cash_manage', 'reports_view', 'inventory_manage']::app_permission[])
FROM users u WHERE u.email = 'admin@taqueria.com'
ON CONFLICT DO NOTHING;
