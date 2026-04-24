'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const API_URL =
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001'

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
        res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        })
    } catch {
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
