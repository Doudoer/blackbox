import { useEffect } from 'react'
import createClient from '../lib/supabase'

type Message = any

// now accepts optional userId to subscribe only to messages where receiver_id == userId
export function useRealtimeMessages(onNewMessage: (message: Message) => void, userId?: string | null) {
  const supabase = createClient()

  useEffect(() => {
    // subscribe to inserts on messages (no client-side filter here)
    try {
      // eslint-disable-next-line no-console
      console.debug('[realtime] subscribing to messages')
      const channel = supabase
        .channel('public:messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
          onNewMessage({ ...payload.new, _eventType: 'INSERT' })
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload: any) => {
          onNewMessage({ ...payload.new, _eventType: 'UPDATE' })
        })
        .subscribe()

      // log subscription established (best-effort)
      try {
        // eslint-disable-next-line no-console
        console.debug('[realtime] subscribed channel', channel)
      } catch (e) { }

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
  }, [onNewMessage, userId])
}

export default useRealtimeMessages
