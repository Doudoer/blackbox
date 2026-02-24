const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function validateAPI() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('Querying profiles (mimicking the API)...');
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, nombre_mostrar, is_admin, pass_blocked')
        .order('username', { ascending: true });

    if (error) {
        console.error('API Query Simulation Failed:', error.message);
    } else {
        console.log('API Query Simulation Success! Users count:', data.length);
        console.log('Sample user:', data[0]);
    }
}

validateAPI();
