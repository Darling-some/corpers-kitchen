const KEY = 'ck_last_order_number'
const CHAT_TOKEN_KEY = 'ck_guest_chat_token'

export const saveLastOrderNumber = (n: string) => { try { localStorage.setItem(KEY, n) } catch { /* ignore */ } }
export const getLastOrderNumber = (): string | null => { try { return localStorage.getItem(KEY) } catch { return null } }

export const saveChatToken = (token: string) => { try { localStorage.setItem(CHAT_TOKEN_KEY, token) } catch { /* ignore */ } }
export const getChatToken = (): string | null => { try { return localStorage.getItem(CHAT_TOKEN_KEY) } catch { return null } }
