import { useEffect } from 'react'
import createClient from '../lib/supabase'

type Message = any

// now accepts optional userId to subscribe only to messages where receiver_id == userId
export function useRealtimeMessages(onNewMessage: (message: Message) => void, userPublicId?: string | null) {
  const supabase = createClient()

  useEffect(() => {
    // subscribe to inserts on messages and translate raw uids to public_ids via server
    try {
      // eslint-disable-next-line no-console
      console.debug('[realtime] subscribing to messages')
      const channel = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload: any) => {
          try {
            // eslint-disable-next-line no-console
            console.debug('[realtime] messages raw payload', payload)
          } catch (e) {}

          const raw = payload.new
          if (!raw) return

          // call server to convert the sender/receiver uids to public_ids
          try {
            const res = await fetch('/api/privacy/resolve-ids', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uids: [raw.sender_id, raw.receiver_id] }),
            })
            const j = await res.json()
            const map: Record<string, string> = (j && j.ok && j.map) || {}

            const safe: any = {
              ...raw,
              sender_public_id: map[raw.sender_id] || null,
              receiver_public_id: map[raw.receiver_id] || null,
            }
            // strip raw uids to avoid exposing them to UI
            delete safe.sender_id
            delete safe.receiver_id

            // if userPublicId is provided, filter messages that don't involve this user
            if (userPublicId) {
              const involves = safe.sender_public_id === userPublicId || safe.receiver_public_id === userPublicId
              if (!involves) {
                // eslint-disable-next-line no-console
                console.debug('[realtime] ignored: not involving current public id')
                return
              }
            }

            onNewMessage(safe)
          } catch (e) {
            // if translation fails, still forward raw but this should be rare
            try {
              const fallback = { ...raw }
              onNewMessage(fallback)
            } catch (er) {
              // swallow
            }
          }
        })
        .subscribe()

      // log subscription established (best-effort)
      try {
        // eslint-disable-next-line no-console
        console.debug('[realtime] subscribed channel', channel)
      } catch (e) {}

      return () => {
        try {
          supabase.removeChannel(channel)
          // eslint-disable-next-line no-console
          console.debug('[realtime] removed channel')
        } catch (err) {
          // best-effort cleanup
          // eslint-disable-next-line no-console
          console.warn('[realtime] removeChannel failed', err)
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[realtime] subscribe error', err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onNewMessage, userPublicId])
}

export default useRealtimeMessages
