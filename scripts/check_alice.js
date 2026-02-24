const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkAlice() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Retrieving alice profile...');
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, nombre_mostrar, pass_blocked, pin, lock_key_hash, is_admin')
        .eq('username', 'alice')
        .single();

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Alice data:', data);
    }
}

checkAlice();
