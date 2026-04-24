import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InactivityWatcher } from "@/components/providers/inactivity-watcher";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    if (!cookieStore.get("auth-token")) {
        redirect("/login");
    }
    return (
        <>
            <InactivityWatcher />
            {children}
        </>
    );
}
