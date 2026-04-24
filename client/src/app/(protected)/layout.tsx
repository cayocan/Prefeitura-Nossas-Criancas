import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";

function decodeJwtPayload(token: string): { preferred_username?: string } {
    try {
        const b64 = token.split(".")[1];
        return JSON.parse(Buffer.from(b64, "base64url").toString("utf-8"));
    } catch {
        return {};
    }
}

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;
    if (!token) redirect("/login");

    const { preferred_username } = decodeJwtPayload(token);

    return (
        <AppShell userEmail={preferred_username}>
            {children}
        </AppShell>
    );
}
