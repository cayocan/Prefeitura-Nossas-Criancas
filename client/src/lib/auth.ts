'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function normalizeUrl(raw: string | undefined): string {
    const url = raw ?? 'http://localhost:3001'
    if (/^https?:\/\//i.test(url)) return url.replace(/\/$/, '')
    return `https://${url.replace(/\/$/, '')}`
}

const API_URL = normalizeUrl(
    process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL,
)

export type LoginState = { error: string } | null

export async function loginAction(
    _prevState: LoginState,
    formData: FormData,
): Promise<LoginState> {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Preencha e-mail e senha.' }
    }

    let res: Response
    try {
        console.log('[loginAction] POST', `${API_URL}/auth/login`)
        res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
        console.log('[loginAction] status', res.status)
    } catch (err) {
        console.error('[loginAction] fetch error', err)
        return { error: 'Não foi possível conectar ao servidor.' }
    }

    if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        return { error: body?.message ?? 'Credenciais inválidas.' }
    }

    const { token } = await res.json()

    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 8, // 8 h
    })

    redirect('/dashboard')
}

export async function logoutAction(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete('auth-token')
    redirect('/login')
}

/** Apaga o cookie sem redirecionar — usado pelo InactivityWatcher no cliente. */
export async function clearSessionAction(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete('auth-token')
}

/** Marca uma criança como revisada via PATCH /children/:id/review */
export async function reviewChildAction(
    id: string,
): Promise<{ ok: boolean; revisado_por?: string; revisado_em?: string; error?: string }> {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value ?? ''

    try {
        console.log('[reviewChildAction] PATCH', `${API_URL}/children/${id}/review`)
        const res = await fetch(`${API_URL}/children/${id}/review`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
        })
        console.log('[reviewChildAction] status', res.status)
        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            return { ok: false, error: (body as { error?: string }).error ?? 'Erro ao revisar.' }
        }
        const data = await res.json() as { ok: boolean; revisado_por: string; revisado_em: string }
        return { ok: true, revisado_por: data.revisado_por, revisado_em: data.revisado_em }
    } catch (err) {
        console.error('[reviewChildAction] fetch error', err)
        return { ok: false, error: 'Falha de conexão com o servidor.' }
    }
}
