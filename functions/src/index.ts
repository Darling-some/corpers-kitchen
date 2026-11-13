import { initializeApp } from 'firebase-admin/app'
import { getStorage } from 'firebase-admin/storage'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { createHash, randomUUID } from 'crypto'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore'
import { defineSecret } from 'firebase-functions/params'

initializeApp()
const db = getFirestore()
const REGION = 'europe-west1'
const PAYSTACK_SECRET_KEY = defineSecret('PAYSTACK_SECRET_KEY')
const MIN_ORDER_TOTAL = 1000
const gifts: Record<string, { name: string; cost: number; recipientXp: number }> = {
  coffee: { name: 'Coffee', cost: 10, recipientXp: 2 },
  meal: { name: 'Meal treat', cost: 35, recipientXp: 8 },
  rose: { name: 'Golden rose', cost: 50, recipientXp: 12 },
  trophy: { name: 'Champion trophy', cost: 100, recipientXp: 25 },
}
function levelFor(xp: number) { return Math.floor(xp / 100) + 1 }
async function awardXp(uid: string, amount: number, message: string, eventId: string) {
  const profile = db.doc(`profiles/${uid}`)
  const eventRef = db.doc(`xpEvents/${eventId}`)
  await db.runTransaction(async tx => {
    const [snap, processed] = await Promise.all([tx.get(profile), tx.get(eventRef)])
    if (!snap.exists || processed.exists) return
    const xp = Number(snap.get('xp') || 0) + amount
    const level = levelFor(xp)
    const oldLevel = Number(snap.get('level') || 1)
    const badges = Array.isArray(snap.get('badges')) ? snap.get('badges') as string[] : []
    const nextBadges = [...badges]
    if (xp >= 100 && !nextBadges.includes('First 100 XP')) nextBadges.push('First 100 XP')
    if (level >= 5 && !nextBadges.includes('Level 5')) nextBadges.push('Level 5')
    tx.create(eventRef, { uid, amount, createdAt: FieldValue.serverTimestamp() })
    tx.update(profile, { xp, level, badges: nextBadges })
    tx.create(profile.collection('notifications').doc(), { message: oldLevel < level ? `You reached level ${level}! ${message}` : message, createdAt: FieldValue.serverTimestamp(), read: false })
  })
}

export const createOrder = onCall({ region: REGION, secrets: [PAYSTACK_SECRET_KEY] }, async request => {
  const data = request.data as {
    customerName?: string; phone?: string; items?: Array<{ menuItemId?: string; name?: string; price?: number; quantity?: number }>;
    specialInstructions?: string; clientRequestId?: string; payment?: { method?: string; reference?: string }
  }
  const customerName = typeof data.customerName === 'string' ? data.customerName.trim() : ''
  const phone = typeof data.phone === 'string' ? data.phone.trim() : ''
  const clientRequestId = typeof data.clientRequestId === 'string' ? data.clientRequestId : ''
  if (customerName.length < 2 || customerName.length > 60 || !/^[0-9+\s-]{7,15}$/.test(phone)) throw new HttpsError('invalid-argument', 'Enter a valid name and phone number.')
  if (!/^[A-Za-z0-9_-]{8,100}$/.test(clientRequestId)) throw new HttpsError('invalid-argument', 'Invalid order request. Refresh the page and try again.')
  if (!Array.isArray(data.items) || data.items.length < 1 || data.items.length > 30) throw new HttpsError('invalid-argument', 'Choose at least one menu item.')
  const instructions = typeof data.specialInstructions === 'string' ? data.specialInstructions.trim().slice(0, 500) : ''
  const menuItems = await Promise.all(data.items.map(async item => {
    if (!item || typeof item !== 'object' || !item.menuItemId || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 20) throw new HttpsError('invalid-argument', 'Invalid order quantity.')
    const snap = await db.doc(`menuItems/${item.menuItemId}`).get()
    if (!snap.exists || snap.get('stockStatus') === 'sold_out') throw new HttpsError('failed-precondition', `${item.name || 'An item'} is currently unavailable.`)
    const availableOnDays = snap.get('availableOnDays')
    if (Array.isArray(availableOnDays)) {
      const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos', weekday: 'short' }).format(new Date())
      const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday)
      if (!availableOnDays.includes(dayIndex)) throw new HttpsError('failed-precondition', `${snap.get('name') || item.name || 'This special'} is not available today.`)
    }
    const price = Number(snap.get('price'))
    if (!Number.isFinite(price) || price < 0) throw new HttpsError('failed-precondition', 'Menu pricing is not valid.')
    return { menuItemId: item.menuItemId, name: String(snap.get('name') || ''), price, quantity: Number(item.quantity) }
  }))
  const total = menuItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  if (total < MIN_ORDER_TOTAL) throw new HttpsError('failed-precondition', `Minimum order is ₦${MIN_ORDER_TOTAL.toLocaleString()}.`)
  const method = data.payment?.method
  let paymentReferencePath: string | null = null
  let payment: { paymentMethod: 'paystack' | 'manual_transfer'; paymentStatus: 'paid' | 'pending'; paymentReference: string; status: 'waiting' | 'awaiting_payment'; confirmedAt?: number }
  if (method === 'paystack') {
    const reference = typeof data.payment?.reference === 'string' ? data.payment.reference : ''
    if (!reference || reference.length > 100) throw new HttpsError('invalid-argument', 'Missing Paystack payment reference.')
    const secret = PAYSTACK_SECRET_KEY.value()
    if (!secret) throw new HttpsError('failed-precondition', 'Online payment verification is not configured. Choose bank transfer or contact the kitchen.')
    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${secret}` } })
    if (!response.ok) throw new HttpsError('unavailable', 'Could not verify the Paystack payment. Please contact the kitchen before trying again.')
    const verification = await response.json() as { status?: boolean; data?: { status?: string; amount?: number; currency?: string; reference?: string } }
    const transaction = verification.data
    if (!verification.status || transaction?.status !== 'success' || transaction.amount !== total * 100 || transaction.currency !== 'NGN' || transaction.reference !== reference) throw new HttpsError('failed-precondition', 'The payment could not be verified for this order amount.')
    paymentReferencePath = `paystackReferences/${createHash('sha256').update(reference).digest('hex')}`
    payment = { paymentMethod: 'paystack', paymentStatus: 'paid', paymentReference: reference, status: 'waiting', confirmedAt: Date.now() }
  } else if (method === 'manual_transfer') {
    payment = { paymentMethod: 'manual_transfer', paymentStatus: 'pending', paymentReference: '', status: 'awaiting_payment' }
  } else throw new HttpsError('invalid-argument', 'Choose a supported payment method.')

  const dateParts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', day: '2-digit', month: '2-digit', year: '2-digit' }).formatToParts(new Date())
  const part = (key: string) => dateParts.find(item => item.type === key)?.value || '00'
  const dateKey = `${part('year')}${part('month')}${part('day')}`
  const counterRef = db.doc(`counters/${dateKey}`)
  const idempotencyRef = db.doc(`idempotency/${clientRequestId}`)
  const orderRef = db.collection('orders').doc()
  const chatToken = randomUUID()
  const chatTokenHash = createHash('sha256').update(chatToken).digest('hex')
  return db.runTransaction(async tx => {
    const previous = await tx.get(idempotencyRef)
    if (previous.exists) {
      const existingOrder = await tx.get(db.doc(`orders/${previous.get('orderId')}`))
      if (existingOrder.exists) {
        tx.set(existingOrder.ref.collection('private').doc('chatAccess'), { tokenHash: chatTokenHash, updatedAt: Date.now() })
        return { id: existingOrder.id, orderNumber: String(existingOrder.get('orderNumber')), chatToken }
      }
      throw new HttpsError('already-exists', 'This order request was already used. Refresh and try again.')
    }
    const counter = await tx.get(counterRef)
    const usedPayment = paymentReferencePath ? await tx.get(db.doc(paymentReferencePath)) : null
    if (usedPayment?.exists) throw new HttpsError('already-exists', 'This Paystack payment reference has already been used.')
    const next = (counter.exists ? Number(counter.get('value')) : 0) + 1
    const orderNumber = `CK-${dateKey}-${String(next).padStart(3, '0')}`
    const now = Date.now()
    tx.set(counterRef, { value: next }, { merge: true })
    tx.create(idempotencyRef, { orderId: orderRef.id, createdAt: now })
    if (paymentReferencePath) tx.create(db.doc(paymentReferencePath), { orderId: orderRef.id, reference: payment.paymentReference, createdAt: now })
    tx.create(orderRef, { orderNumber, customerName, items: menuItems, total, specialInstructions: instructions, paymentMethod: payment.paymentMethod, paymentStatus: payment.paymentStatus, paymentReference: payment.paymentReference, status: payment.status, queuePosition: next, createdAt: now, updatedAt: now, ...(payment.confirmedAt ? { confirmedAt: payment.confirmedAt } : {}) })
    tx.create(orderRef.collection('private').doc('contact'), { phone })
    tx.create(orderRef.collection('private').doc('chatAccess'), { tokenHash: chatTokenHash, createdAt: now })
    return { id: orderRef.id, orderNumber, chatToken }
  })
})


export const sendVoiceChatMessage = onCall({ region: REGION, timeoutSeconds: 60, memory: '512MiB' }, async request => {
  const data = request.data as {
    orderId?: string; chatToken?: string; audioBase64?: string;
    contentType?: string; duration?: number
  }

  const orderId = typeof data.orderId === 'string' ? data.orderId : ''
  const chatToken = typeof data.chatToken === 'string' ? data.chatToken : ''
  const audioBase64 = typeof data.audioBase64 === 'string' ? data.audioBase64 : ''
  const contentType = typeof data.contentType === 'string' ? data.contentType : ''
  const duration = Number(data.duration)

  if (!orderId || orderId.length > 128 || !/^[0-9a-f-]{36}$/i.test(chatToken)) {
    throw new HttpsError('invalid-argument', 'Invalid voice-message credentials.')
  }
  if (!/^audio\/(webm|ogg|mp4|mpeg)(;.*)?$/i.test(contentType)) {
    throw new HttpsError('invalid-argument', 'Unsupported voice recording format.')
  }
  if (!Number.isFinite(duration) || duration < 1 || duration > 60) {
    throw new HttpsError('invalid-argument', 'Voice notes must be between 1 and 60 seconds.')
  }
  if (!audioBase64 || audioBase64.length > 2_500_000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(audioBase64)) {
    throw new HttpsError('invalid-argument', 'The recording is empty or too large.')
  }

  const audio = Buffer.from(audioBase64, 'base64')
  if (!audio.length || audio.length > 1_800_000) {
    throw new HttpsError('resource-exhausted', 'Voice notes must be smaller than 1.8 MB.')
  }

  const orderRef = db.doc(`orders/${orderId}`)
  const accessRef = orderRef.collection('private').doc('chatAccess')
  const [order, access, chatSettings] = await Promise.all([
    orderRef.get(),
    accessRef.get(),
    db.doc('settings/chat').get(),
  ])

  if (!order.exists || !access.exists) {
    throw new HttpsError('permission-denied', 'This order cannot send voice notes.')
  }

  const expectedHash = String(access.get('tokenHash') || '')
  const suppliedHash = createHash('sha256').update(chatToken).digest('hex')
  if (!expectedHash || expectedHash !== suppliedHash) {
    throw new HttpsError('permission-denied', 'Voice-message authorization failed. Place a new order to enable voice notes.')
  }

  const orderData = order.data()!
  const now = Date.now()
  const today = (timestamp: number) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date(timestamp))

  if (orderData.status === 'cancelled' || typeof orderData.createdAt !== 'number' || today(orderData.createdAt) !== today(now)) {
    throw new HttpsError('failed-precondition', 'Only customers with an active order today can send voice notes.')
  }
  if (chatSettings.get('enabled') !== true) {
    throw new HttpsError('failed-precondition', 'The Waiting Room is currently closed.')
  }

  const orderNumber = String(orderData.orderNumber || '')
  const mute = await db.doc(`chatMutes/${orderNumber}`).get()
  if (mute.exists) throw new HttpsError('permission-denied', 'This customer is muted in the Waiting Room.')

  const name = String(orderData.customerName || 'Guest').trim().split(/\s+/)[0].slice(0, 30) || 'Guest'
  const extension = contentType.toLowerCase().includes('mp4') ? 'm4a'
    : contentType.toLowerCase().includes('ogg') ? 'ogg'
    : contentType.toLowerCase().includes('mpeg') ? 'mp3' : 'webm'
  const audioPath = `chat-audio/${orderId}/${randomUUID()}.${extension}`
  const downloadToken = randomUUID()
  const bucket = getStorage().bucket()
  const file = bucket.file(audioPath)

  try {
    await file.save(audio, {
      resumable: false,
      metadata: {
        contentType: contentType.split(';')[0],
        metadata: { firebaseStorageDownloadTokens: downloadToken },
      },
    })

    const audioUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(audioPath)}?alt=media&token=${downloadToken}`
    const messageRef = db.collection('chatMessages').doc()
    await messageRef.set({
      orderId, orderNumber, name, text: '', type: 'audio',
      audioUrl, audioPath, audioDuration: Math.round(duration),
      createdAt: now, isStaff: false,
    })

    return { id: messageRef.id, audioUrl, audioPath }
  } catch (error) {
    await file.delete().catch(() => undefined)
    throw new HttpsError('internal', 'The voice note could not be saved. Please try again.')
  }
})

export const awardPostXp = onDocumentCreated({ document: 'posts/{postId}', region: REGION }, async event => {
  const post = event.data?.data()
  if (!post?.uid || post.status !== 'published') return
  await awardXp(String(post.uid), 5, 'You earned 5 XP for sharing with the community.', event.id)
})
export const incrementPostCommentCount = onDocumentCreated({ document: 'posts/{postId}/comments/{commentId}', region: REGION }, async event => {
  const eventRef = db.doc(`commentCountEvents/${event.id}`)
  const postRef = db.doc(`posts/${event.params.postId}`)
  await db.runTransaction(async tx => {
    const [processed, post] = await Promise.all([tx.get(eventRef), tx.get(postRef)])
    if (processed.exists || !post.exists) return
    tx.create(eventRef, { createdAt: FieldValue.serverTimestamp() })
    tx.update(postRef, { commentsCount: FieldValue.increment(1) })
  })
})
export const awardCommentXp = onDocumentCreated({ document: 'posts/{postId}/comments/{commentId}', region: REGION }, async event => {
  const comment = event.data?.data()
  if (!comment?.uid) return
  await awardXp(String(comment.uid), 2, 'You earned 2 XP for joining a conversation.', event.id)
})
export const notifyFriendRequest = onDocumentCreated({ document: 'friendRequests/{requestId}', region: REGION }, async event => {
  const data = event.data?.data()
  if (!data?.to) return
  await db.doc(`profiles/${data.to}/notifications/${event.params.requestId}`).set({ message: 'You received a new friend request.', createdAt: FieldValue.serverTimestamp(), read: false })
})
export const notifyFriendAccepted = onDocumentUpdated({ document: 'friendRequests/{requestId}', region: REGION }, async event => {
  const before = event.data?.before.data(); const after = event.data?.after.data()
  if (before?.status === 'pending' && after?.status === 'accepted' && after?.from) {
    await db.doc(`profiles/${after.from}/notifications/${event.id}`).set({ message: 'Your friend request was accepted.', createdAt: FieldValue.serverTimestamp(), read: false })
  }
})
export const createCommunityPost = onCall({ region: REGION }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to post.')
  const text = typeof request.data?.text === 'string' ? request.data.text.trim() : ''
  const imageURL = typeof request.data?.imageURL === 'string' ? request.data.imageURL : ''
  if (!text || text.length > 1000) throw new HttpsError('invalid-argument', 'Posts must contain 1–1,000 characters.')
  if (imageURL && (!imageURL.startsWith('https://firebasestorage.googleapis.com/') || imageURL.length > 2048)) throw new HttpsError('invalid-argument', 'Upload the post image to Corpers Kitchen storage.')
  const uid = request.auth.uid
  const profileRef = db.doc(`profiles/${uid}`)
  const now = new Date(); const day = `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}`
  const rateRef = db.doc(`postRateLimits/${uid}_${day}`)
  const postRef = db.collection('posts').doc()
  await db.runTransaction(async tx => {
    const [profile, rate] = await Promise.all([tx.get(profileRef), tx.get(rateRef)])
    if (!profile.exists) throw new HttpsError('failed-precondition', 'Create your member profile first.')
    const count = Number(rate.get('count') || 0)
    if (count >= 10) throw new HttpsError('resource-exhausted', 'You have reached today’s post limit.')
    tx.set(rateRef, { count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    tx.create(postRef, { uid, displayName: String(profile.get('displayName') || 'Member'), username: String(profile.get('username') || ''), photoURL: String(profile.get('photoURL') || ''), text, imageURL, status: 'published', likes: [], commentsCount: 0, createdAt: FieldValue.serverTimestamp() })
  })
  return { id: postRef.id }
})
export const createCommunityComment = onCall({ region: REGION }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to comment.')
  const postId = typeof request.data?.postId === 'string' ? request.data.postId : ''
  const text = typeof request.data?.text === 'string' ? request.data.text.trim() : ''
  if (!postId || !text || text.length > 500) throw new HttpsError('invalid-argument', 'Comments must contain 1–500 characters.')
  const uid = request.auth.uid
  const profileRef = db.doc(`profiles/${uid}`); const postRef = db.doc(`posts/${postId}`)
  const now = new Date(); const day = `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}`
  const rateRef = db.doc(`commentRateLimits/${uid}_${day}`); const commentRef = postRef.collection('comments').doc()
  await db.runTransaction(async tx => {
    const [profile, post, rate] = await Promise.all([tx.get(profileRef), tx.get(postRef), tx.get(rateRef)])
    if (!profile.exists || !post.exists || post.get('status') !== 'published') throw new HttpsError('not-found', 'Post not found.')
    const count = Number(rate.get('count') || 0)
    if (count >= 40) throw new HttpsError('resource-exhausted', 'You have reached today’s comment limit.')
    tx.set(rateRef, { count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    tx.create(commentRef, { uid, displayName: String(profile.get('displayName') || 'Member'), text, createdAt: FieldValue.serverTimestamp() })
  })
  return { id: commentRef.id }
})

export const sendCommunityRoomMessage = onCall({ region: REGION }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to use community chatrooms.')
  const { roomId, text } = request.data as { roomId?: string; text?: string }
  const clean = typeof text === 'string' ? text.trim() : ''
  if (!['lounge', 'food', 'tech'].includes(String(roomId)) || !clean || clean.length > 500) throw new HttpsError('invalid-argument', 'Choose a room and enter a message of 1–500 characters.')
  if (/(https?:\/\/|www\.)/i.test(clean) || /(?:\+?\d[\d\s().-]{7,}\d)/.test(clean)) throw new HttpsError('invalid-argument', 'Do not share links or phone numbers in public chatrooms.')
  const uid = request.auth.uid
  const profileRef = db.doc(`profiles/${uid}`)
  const rateRef = db.doc(`roomChatRateLimits/${uid}`)
  const messageRef = db.collection('communityRoomMessages').doc()
  await db.runTransaction(async tx => {
    const [profile, rate] = await Promise.all([tx.get(profileRef), tx.get(rateRef)])
    if (!profile.exists) throw new HttpsError('failed-precondition', 'Create your member profile first.')
    const lastSentAt = Number(rate.get('lastSentAt') || 0)
    if (Date.now() - lastSentAt < 2500) throw new HttpsError('resource-exhausted', 'Please wait a moment before sending another message.')
    tx.set(rateRef, { lastSentAt: Date.now() })
    tx.create(messageRef, { uid, displayName: String(profile.get('displayName') || 'Member'), roomId, text: clean, createdAt: FieldValue.serverTimestamp() })
  })
  return { id: messageRef.id }
})

export const openConversation = onCall({ region: REGION }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to open a conversation.')
  const toUid = typeof request.data?.toUid === 'string' ? request.data.toUid : ''
  const fromUid = request.auth.uid
  if (!toUid || toUid === fromUid) throw new HttpsError('invalid-argument', 'Choose another member.')
  const senderRef = db.doc(`profiles/${fromUid}`); const recipientRef = db.doc(`profiles/${toUid}`)
  const members = [fromUid, toUid].sort(); const threadId = members.join('_')
  const conversationRef = db.doc(`conversations/${threadId}`)
  const friendshipRef = db.doc(`friendships/${fromUid}_${toUid}`)
  await db.runTransaction(async tx => {
    const [sender, recipient, conversation, friendship] = await Promise.all([tx.get(senderRef), tx.get(recipientRef), tx.get(conversationRef), tx.get(friendshipRef)])
    if (!sender.exists || !recipient.exists || (recipient.get('isPrivate') === true && !friendship.exists && !conversation.exists)) throw new HttpsError('not-found', 'Member profile not found or private.')
    if (conversation.exists) return
    tx.create(conversationRef, { members, lastMessage: '', updatedAt: FieldValue.serverTimestamp() })
  })
  return { conversationId: threadId }
})

export const sendDirectMessage = onCall({ region: REGION }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to send a private message.')
  const { toUid, text } = request.data as { toUid?: string; text?: string }
  const clean = typeof text === 'string' ? text.trim() : ''
  const fromUid = request.auth.uid
  if (!toUid || toUid === fromUid || !clean || clean.length > 1000) throw new HttpsError('invalid-argument', 'Choose a member and enter a message of 1–1,000 characters.')
  const senderRef = db.doc(`profiles/${fromUid}`); const recipientRef = db.doc(`profiles/${toUid}`)
  const members = [fromUid, toUid].sort(); const threadId = members.join('_')
  const conversationRef = db.doc(`conversations/${threadId}`)
  const friendshipRef = db.doc(`friendships/${fromUid}_${toUid}`)
  const rateRef = db.doc(`directMessageRateLimits/${fromUid}_${toUid}`)
  const messageRef = conversationRef.collection('messages').doc()
  await db.runTransaction(async tx => {
    const [sender, recipient, conversation, rate, friendship] = await Promise.all([tx.get(senderRef), tx.get(recipientRef), tx.get(conversationRef), tx.get(rateRef), tx.get(friendshipRef)])
    if (!sender.exists || !recipient.exists || (recipient.get('isPrivate') === true && !friendship.exists && !conversation.exists)) throw new HttpsError('not-found', 'Member profile not found or private.')
    if (conversation.exists && JSON.stringify(conversation.get('members')) !== JSON.stringify(members)) throw new HttpsError('failed-precondition', 'Conversation membership is invalid.')
    const lastSentAt = Number(rate.get('lastSentAt') || 0)
    if (Date.now() - lastSentAt < 1500) throw new HttpsError('resource-exhausted', 'Please wait a moment before sending another message.')
    tx.set(rateRef, { lastSentAt: Date.now() })
    tx.set(conversationRef, { members, lastMessage: clean.slice(0, 120), updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    tx.create(messageRef, { from: fromUid, to: toUid, text: clean, createdAt: FieldValue.serverTimestamp(), read: false })
  })
  return { conversationId: threadId, messageId: messageRef.id }
})

export const notifyDirectMessage = onDocumentCreated({ document: 'conversations/{threadId}/messages/{messageId}', region: REGION }, async event => {
  const message = event.data?.data()
  if (!message?.to || !message?.from) return
  await db.doc(`profiles/${message.to}/notifications/${event.id}`).set({ message: 'You received a new private message.', createdAt: FieldValue.serverTimestamp(), read: false })
})

const quizBank = [
  { q: 'Which food is the main ingredient in jollof rice?', a: ['Rice', 'Yam', 'Beans'], correct: 0 },
  { q: 'Which kitchen tool is used to flip an egg?', a: ['Ladle', 'Spatula', 'Whisk'], correct: 1 },
  { q: 'Which one is a source of protein?', a: ['Chicken', 'Sugar', 'Salt'], correct: 0 },
  { q: 'Which temperature scale is commonly used in kitchen recipes?', a: ['Celsius', 'Light years', 'Decibels'], correct: 0 },
  { q: 'What should you do before handling food?', a: ['Wash your hands', 'Touch your phone', 'Taste raw meat'], correct: 0 },
  { q: 'Which ingredient helps bread dough rise?', a: ['Yeast', 'Pepper', 'Vinegar'], correct: 0 },
]
export const startKitchenQuiz = onCall({ region: REGION }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to play.')
  const uid = request.auth.uid
  const now = new Date(); const day = `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}`
  const rateRef = db.doc(`quizStarts/${uid}_${day}`)
  const shuffled = [...quizBank].sort(() => Math.random() - 0.5).slice(0, 3)
  const challengeId = randomUUID()
  await db.runTransaction(async tx => {
    const rate = await tx.get(rateRef)
    const count = Number(rate.get('count') || 0)
    if (count >= 5) throw new HttpsError('resource-exhausted', 'You have started the maximum number of quizzes for today.')
    tx.set(rateRef, { count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    tx.create(db.doc(`quizChallenges/${challengeId}`), { uid, answers: shuffled.map(q => q.correct), questions: shuffled.map(q => ({ q: q.q, a: q.a })), expiresAt: Date.now() + 10 * 60 * 1000, used: false, createdAt: FieldValue.serverTimestamp() })
  })
  return { challengeId, questions: shuffled.map(q => ({ q: q.q, a: q.a })) }
})
export const submitGameScore = onCall({ region: REGION }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to play.')
  const { challengeId, answers } = request.data as { challengeId?: string; answers?: number[] }
  if (!challengeId || !Array.isArray(answers) || answers.length !== 3 || answers.some(a => !Number.isInteger(a) || a < 0 || a > 2)) throw new HttpsError('invalid-argument', 'Invalid quiz submission.')
  const uid = request.auth.uid
  const now = new Date(); const day = `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}`
  const attempt = db.doc(`gameAttempts/${uid}_kitchen-quiz_${day}`)
  const challenge = db.doc(`quizChallenges/${challengeId}`)
  const profile = db.doc(`profiles/${uid}`)
  let score = 0; let reward = 0
  await db.runTransaction(async tx => {
    const [challengeSnap, used, user] = await Promise.all([tx.get(challenge), tx.get(attempt), tx.get(profile)])
    if (!challengeSnap.exists || challengeSnap.get('uid') !== uid) throw new HttpsError('failed-precondition', 'Quiz challenge not found.')
    if (used.exists) { score = Number(used.get('score') || 0); reward = Number(used.get('reward') || 0); return }
    if (challengeSnap.get('used') === true || Number(challengeSnap.get('expiresAt')) < Date.now()) throw new HttpsError('failed-precondition', 'Quiz expired. Start a new quiz.')
    if (!user.exists) throw new HttpsError('failed-precondition', 'Create your profile first.')
    const correct = challengeSnap.get('answers') as number[]
    score = answers.reduce((sum, answer, index) => sum + (answer === correct[index] ? 1 : 0), 0)
    const earned = score * 10
    reward = earned
    const xp = Number(user.get('xp') || 0) + earned
    const level = levelFor(xp)
    const badges = Array.isArray(user.get('badges')) ? user.get('badges') as string[] : []
    const nextBadges = [...badges]
    if (score === 3 && !nextBadges.includes('Quiz champion')) nextBadges.push('Quiz champion')
    if (xp >= 100 && !nextBadges.includes('First 100 XP')) nextBadges.push('First 100 XP')
    if (level >= 5 && !nextBadges.includes('Level 5')) nextBadges.push('Level 5')
    tx.update(challenge, { used: true, submittedAt: FieldValue.serverTimestamp() })
    tx.create(attempt, { uid, gameId: 'kitchen-quiz', score, reward: earned, createdAt: FieldValue.serverTimestamp() })
    tx.update(profile, { xp, level, badges: nextBadges })
    tx.create(profile.collection('notifications').doc(), { message: `Quiz completed: ${score}/3. You earned ${earned} XP.`, createdAt: FieldValue.serverTimestamp(), read: false })
  })
  return { score, reward }
})
export const submitConfession = onCall({ region: REGION }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to submit a confession.')
  const text = typeof request.data?.text === 'string' ? request.data.text.trim() : ''
  if (!text || text.length > 700) throw new HttpsError('invalid-argument', 'Confessions must contain 1–700 characters.')
  const uid = request.auth.uid
  const now = new Date(); const day = `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}`
  const rate = db.doc(`confessionRateLimits/${uid}_${day}`)
  const confession = db.collection('confessions').doc()
  await db.runTransaction(async tx => {
    const current = await tx.get(rate)
    const count = Number(current.get('count') || 0)
    if (count >= 3) throw new HttpsError('resource-exhausted', 'You have reached the daily confession limit.')
    tx.set(rate, { count: count + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true })
    tx.create(confession, { text, status: 'published', reactions: 0, createdAt: FieldValue.serverTimestamp() })
    tx.create(db.doc(`confessionMeta/${confession.id}`), { uid, createdAt: FieldValue.serverTimestamp() })
  })
  return { id: confession.id }
})

export const sendGift = onCall({ region: REGION }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in to send a gift.')
  const { toUid, giftId, requestId } = request.data as { toUid?: string; giftId?: string; requestId?: string }
  const gift = giftId ? gifts[giftId] : undefined
  const fromUid = request.auth.uid
  if (!toUid || toUid === fromUid || !gift || !requestId || !/^[A-Za-z0-9_-]{1,80}$/.test(requestId)) throw new HttpsError('invalid-argument', 'Choose a valid recipient and gift.')
  const sender = db.doc(`profiles/${fromUid}`); const recipient = db.doc(`profiles/${toUid}`)
  const ledger = db.collection('giftLedger').doc()
  const requestRef = db.doc(`giftRequests/${requestId}`)
  await db.runTransaction(async tx => {
    const [from, to, previous] = await Promise.all([tx.get(sender), tx.get(recipient), tx.get(requestRef)])
    if (previous.exists) return
    if (!from.exists || !to.exists) throw new HttpsError('not-found', 'Member profile not found.')
    const balance = Number(from.get('xp') || 0)
    if (balance < gift.cost) throw new HttpsError('failed-precondition', `You need ${gift.cost} XP to send this gift.`)
    const recipientXp = Number(to.get('xp') || 0) + gift.recipientXp
    const recipientLevel = levelFor(recipientXp)
    const recipientBadges = Array.isArray(to.get('badges')) ? [...(to.get('badges') as string[])] : []
    if (recipientXp >= 100 && !recipientBadges.includes('First 100 XP')) recipientBadges.push('First 100 XP')
    if (recipientLevel >= 5 && !recipientBadges.includes('Level 5')) recipientBadges.push('Level 5')
    tx.update(sender, { xp: balance - gift.cost, level: levelFor(balance - gift.cost) })
    tx.update(recipient, { xp: recipientXp, level: recipientLevel, badges: recipientBadges })
    tx.create(ledger, { from: fromUid, to: toUid, giftId, giftName: gift.name, cost: gift.cost, createdAt: FieldValue.serverTimestamp() })
    tx.create(requestRef, { from: fromUid, to: toUid, giftId, createdAt: FieldValue.serverTimestamp() })
    tx.create(recipient.collection('notifications').doc(), { message: `Someone sent you a ${gift.name.toLowerCase()}! You received ${gift.recipientXp} XP.`, createdAt: FieldValue.serverTimestamp(), read: false })
    tx.create(sender.collection('notifications').doc(), { message: `Your ${gift.name.toLowerCase()} gift was sent.`, createdAt: FieldValue.serverTimestamp(), read: false })
  })
  return { gift: gift.name, cost: gift.cost }
})
