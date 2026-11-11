const KEY = 'ck_last_order_number'
export const saveLastOrderNumber = (n: string) => { try { localStorage.setItem(KEY, n) } catch { /* ignore */ } }
export const getLastOrderNumber = (): string | null => { try { return localStorage.getItem(KEY) } catch { return null } }
