import { cookies } from 'next/headers'

const API_URL = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function apiGet<T>(path: string): Promise<T> {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value ?? ''

    const res = await fetch(`${API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    })

    if (!res.ok) {
        throw new Error(`API ${res.status} — ${path}`)
    }

    return res.json() as Promise<T>
}
