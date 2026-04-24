"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
    const [state, action, isPending] = useActionState(loginAction, null);

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-background px-4">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-sm space-y-6">
                <div className="text-center space-y-1">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Prefeitura do Rio de Janeiro
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Nossas Crianças
                    </h1>
                </div>

                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg">
                            Acesso ao painel
                        </CardTitle>
                        <CardDescription>
                            Entre com suas credenciais institucionais.
                        </CardDescription>
                    </CardHeader>

                    <form action={action}>
                        <CardContent className="space-y-4">
                            {state?.error && (
                                <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{state.error}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <Label htmlFor="email">E-mail</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="voce@prefeitura.rio"
                                    required
                                    disabled={isPending}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="password">Senha</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    required
                                    disabled={isPending}
                                />
                            </div>
                        </CardContent>

                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Entrando…
                                    </>
                                ) : (
                                    "Entrar"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
