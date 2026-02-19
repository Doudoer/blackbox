/*
  scripts/test_chat.js
  - Simula login de Alice, envía un mensaje a Bob, y verifica que Bob pueda leerlo.
  - Requiere que `npm run dev` esté corriendo en http://localhost:3000
*/

const fetch = global.fetch || require('node-fetch')

function extractCookie(setCookieHeaders, name) {
  if (!setCookieHeaders) return null
  const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders]
  for (const h of headers) {
    const m = h.match(new RegExp(`${name}=([^;]+)`))
    if (m) return `${name}=${m[1]}`
  }
  return null
}

async function login(username, password) {
  const res = await fetch('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch (e) { }
  const setCookie = res.headers.get('set-cookie') || res.headers.raw && res.headers.raw()['set-cookie']
  const cookie = extractCookie(setCookie, 'bb_token')
  return { ok: res.ok, status: res.status, json, cookie }
}

async function getContacts(cookie) {
  const res = await fetch('http://localhost:3000/api/contacts', { headers: { Cookie: cookie } })
  const j = await res.json()
  return j
}

async function postMessage(cookie, receiver_id, content, type='text', url=null) {
  const body = { receiver_id, content, message_type: type }
  if (url) {
    if (type === 'image') body.image_url = url
    if (type === 'sticker') body.sticker_url = url
  }
  const res = await fetch('http://localhost:3000/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie }, body: JSON.stringify(body) })
  return res.json()
}

async function getMessages(cookie, peer) {
  const res = await fetch(`http://localhost:3000/api/messages?peer=${peer}`, { headers: { Cookie: cookie } })
  return res.json()
}

async function run() {
  console.log('1) Login alice')
  const L = await login('alice', 'Test1234!')
  console.log('alice login:', L.ok, L.status, L.json)
  if (!L.cookie) return console.error('No cookie from alice login')

  console.log('2) Get contacts as alice')
  const contacts = await getContacts(L.cookie)
  console.log('contacts:', contacts.ok ? contacts.contacts : contacts)
  const bob = (contacts.contacts || []).find(c => c.username === 'bob')
  if (!bob) return console.error('bob not found in contacts')

  console.log('3) Alice -> send message to Bob')
  const send = await postMessage(L.cookie, bob.id, 'Hola Bob! Mensaje de prueba desde Alice')
  console.log('send result:', send)

  console.log('4) Login bob and fetch conversation')
  const LB = await login('bob', 'Test1234!')
  console.log('bob login:', LB.ok, LB.status, LB.json)
  if (!LB.cookie) return console.error('No cookie from bob login')

  const conv = await getMessages(LB.cookie, (contacts.contacts || []).find(c=>c.username==='alice').id)
  console.log('conversation for bob with alice:', conv)
}

run().catch(err => { console.error(err); process.exit(1) })
