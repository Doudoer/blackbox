const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Migrating database...');

    // Supabase JS client doesn't support raw SQL easily unless using RPC or if the user has a specific function.
    // However, we can try to update the column directly or use a function if it exists.
    // In this project, we have functions like set_user_password.

    // Since I can't run raw SQL through the client easily without a stored procedure, 
    // I will assume the column exists (as it was in schema.sql) or I will try to update it.

    const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('username', 'alice');

    if (error) {
        console.error('Error updating alice to admin:', error.message);
    } else {
        console.log('Successfully set alice as admin.');
    }
}

migrate();
