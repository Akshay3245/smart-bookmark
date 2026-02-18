"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (session?.user) {
                setUser(session.user);
                router.push("/dashboard");
            }
        };

        init();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser(session.user);
                router.push("/dashboard");
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const login = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
                queryParams: {
                    prompt: "select_account",
                },
            },
        });
    };

    if (user) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-500 to-indigo-600">
            <div className="bg-white/20 backdrop-blur-lg p-10 rounded-2xl shadow-2xl text-center w-[350px]">
                <h1 className="text-3xl font-bold text-white mb-3">
                    Smart Bookmark
                </h1>
                <p className="text-white/80 mb-6 text-sm">
                    Save and manage your favorite links securely.
                </p>

                <button
                    type="button"
                    onClick={login}
                    className="w-full bg-white text-gray-800 font-semibold py-3 rounded-lg hover:scale-105 transition-transform duration-300 shadow-md"
                >
                    Continue with Google
                </button>
            </div>
        </div>
    );
}
