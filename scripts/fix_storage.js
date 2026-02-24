const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkStorage() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'blackboxbucket'

    console.log(`Checking bucket: ${bucketName}...`)

    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
        console.error('Error listing buckets:', listError)
        return
    }

    const bucket = buckets.find(b => b.name === bucketName)

    if (!bucket) {
        console.log(`Bucket "${bucketName}" NOT FOUND. Existing buckets:`, buckets.map(b => b.name))
        console.log(`Attempting to create bucket "${bucketName}"...`)
        const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4', 'audio/x-m4a'],
            fileSizeLimit: 5242880 // 5MB
        })
        if (createError) {
            console.error('Error creating bucket:', createError)
        } else {
            console.log('Bucket created successfully:', newBucket)
        }
    } else {
        console.log(`Bucket "${bucketName}" exists. Public: ${bucket.public}`)
        if (!bucket.public) {
            console.log('Bucket is PRIVATE. Updating to PUBLIC...')
            const { data, error: updateError } = await supabase.storage.updateBucket(bucketName, {
                public: true
            })
            if (updateError) {
                console.error('Error updating bucket:', updateError)
            } else {
                console.log('Bucket updated to PUBLIC.')
            }
        }
    }

    // Also check chat_media bucket
    const chatBucket = 'chat_media'
    const hasChatBucket = buckets.find(b => b.name === chatBucket)
    if (!hasChatBucket) {
        console.log(`Bucket "${chatBucket}" NOT FOUND. Creating...`)
        await supabase.storage.createBucket(chatBucket, { public: true })
    }
}

checkStorage()
