import LoginForm from "./login-form";

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ reason?: string }>;
}) {
    const params = await searchParams;
    const isInactivity = params.reason === "inatividade";

    return <LoginForm isInactivity={isInactivity} />;
}
