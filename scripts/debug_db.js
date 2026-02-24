const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTable() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Checking profiles table...');

    // Try to select one row and see the keys
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Error selecting from profiles:', error.message);
    } else {
        console.log('Columns found:', Object.keys(data));
    }
}

checkTable();
