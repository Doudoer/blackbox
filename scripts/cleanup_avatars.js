const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function cleanupData() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('Fetching profiles to cleanup...')
    const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('id, avatar_url')

    if (fetchError) {
        console.error('Error fetching profiles:', fetchError)
        return
    }

    for (const profile of profiles) {
        if (profile.avatar_url && (profile.avatar_url.includes('\r') || profile.avatar_url.includes('\n'))) {
            const cleanUrl = profile.avatar_url.replace(/\r/g, '').replace(/\n/g, '').trim()
            console.log(`Cleaning avatar for user ${profile.id}: ${profile.avatar_url} -> ${cleanUrl}`)

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: cleanUrl })
                .eq('id', profile.id)

            if (updateError) {
                console.error(`Error updating profile ${profile.id}:`, updateError)
            }
        }
    }

    console.log('Cleanup complete.')
}

cleanupData()
