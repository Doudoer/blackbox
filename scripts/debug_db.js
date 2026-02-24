const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTable() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Checking profiles table...');

    // Try to select one row and see the keys
    const { data: profiles, error } = await supabase.from('profiles').select('*').limit(10)
    if (error) {
        console.error('Error fetching profiles:', error)
        return
    }
    console.log('Profiles data:', JSON.stringify(profiles, null, 2));
}

checkTable();
