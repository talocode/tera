export const TERA_USAGE_REFRESH_EVENT = 'tera:usage-refresh'

export function dispatchUsageRefresh(reason: 'messages' | 'uploads' | 'profile') {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(TERA_USAGE_REFRESH_EVENT, { detail: { reason } }))
    }
}
