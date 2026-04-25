import { cookies } from 'next/headers'

function normalizeUrl(raw: string | undefined): string {
    const url = raw ?? 'http://localhost:3001'
    if (/^https?:\/\//i.test(url)) return url.replace(/\/$/, '')
    return `https://${url.replace(/\/$/, '')}`
}

const API_URL = normalizeUrl(
    process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL,
)

export async function apiGet<T>(path: string): Promise<T> {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value ?? ''

    console.log('[apiGet] GET', `${API_URL}${path}`)
    const res = await fetch(`${API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    })
    console.log('[apiGet] status', res.status, path)

    if (!res.ok) {
        console.error('[apiGet] error', res.status, path)
        throw new Error(`API ${res.status} — ${path}`)
    }

    return res.json() as Promise<T>
}
