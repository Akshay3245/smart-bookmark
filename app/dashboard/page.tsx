"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [bookmarks, setBookmarks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [shake, setShake] = useState(false);

    // -----------------------------
    // Session + Realtime
    // -----------------------------
    useEffect(() => {
        let channel: any;

        const init = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
                router.push("/");
                return;
            }

            setUser(session.user);
            await fetchBookmarks(session.user.id);

            // ✅ TRUE REALTIME SYNC
            channel = supabase
                .channel("bookmarks-channel")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "bookmarks",
                        filter: `user_id=eq.${session.user.id}`,
                    },
                    (payload) => {
                        setBookmarks((prev) => {
                            switch (payload.eventType) {
                                case "INSERT":
                                    if (prev.find((b) => b.id === payload.new.id)) {
                                        return prev;
                                    }
                                    return [payload.new, ...prev];

                                case "DELETE":
                                    return prev.filter((b) => b.id !== payload.old.id);

                                case "UPDATE":
                                    return prev.map((b) =>
                                        b.id === payload.new.id ? payload.new : b
                                    );

                                default:
                                    return prev;
                            }
                        });
                    }
                )
                .subscribe();

            setLoading(false);
        };

        init();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [router]);

    async function fetchBookmarks(userId: string) {
        const { data } = await supabase
            .from("bookmarks")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (data) setBookmarks(data);
    }

    // -----------------------------
    // URL Helpers
    // -----------------------------
    function normalizeUrl(value: string) {
        let trimmed = value.trim();
        if (!/^https?:\/\//i.test(trimmed)) {
            trimmed = "https://" + trimmed;
        }
        return trimmed;
    }

    function isValidDomain(urlString: string) {
        try {
            const parsed = new URL(urlString);
            if (!parsed.hostname.includes(".")) return false;
            if (parsed.hostname.startsWith("localhost")) return false;
            return true;
        } catch {
            return false;
        }
    }

    function triggerError(message: string) {
        setErrorMessage(message);
        setSuccessMessage("");
        setShake(true);
        setTimeout(() => setShake(false), 400);
    }

    const isFormValid =
        title.trim().length > 0 &&
        url.trim().length > 0 &&
        isValidDomain(normalizeUrl(url));

    // -----------------------------
    // Add Bookmark
    // -----------------------------
    async function handleAddBookmark() {
        setErrorMessage("");
        setSuccessMessage("");

        if (!title.trim()) return triggerError("Title is required.");
        if (!url.trim()) return triggerError("URL is required.");

        const formattedUrl = normalizeUrl(url);

        if (!isValidDomain(formattedUrl))
            return triggerError("Please enter a valid domain (example.com).");

        const duplicate = bookmarks.find(
            (b) => b.url.toLowerCase() === formattedUrl.toLowerCase()
        );

        if (duplicate) return triggerError("This URL already exists.");

        const { data, error } = await supabase
            .from("bookmarks")
            .insert([{ title, url: formattedUrl, user_id: user.id }])
            .select()
            .single();

        if (error) {
            triggerError(error.message);
        } else if (data) {
            // ✅ Instant update (same tab)
            setBookmarks((prev) => [data, ...prev]);
            setTitle("");
            setUrl("");
            setSuccessMessage("Bookmark added successfully!");
        }
    }

    // -----------------------------
    // Delete Bookmark
    // -----------------------------
    async function handleDelete(id: string) {
        const { error } = await supabase
            .from("bookmarks")
            .delete()
            .eq("id", id);

        if (!error) {
            // ✅ Instant update (same tab)
            setBookmarks((prev) => prev.filter((b) => b.id !== id));
            setSuccessMessage("Bookmark deleted successfully!");
        }
    }

    // -----------------------------
    // Logout
    // -----------------------------
    async function handleLogout() {
        await supabase.auth.signOut();
        router.push("/");
    }

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-700">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-10">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Smart Bookmark Dashboard
                        </h1>
                        <p className="text-gray-600 text-sm">
                            Welcome, {user.email}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-lg shadow"
                    >
                        Logout
                    </button>
                </div>

                {/* Messages */}
                {errorMessage && (
                    <div className={`mb-4 bg-red-100 border border-red-300 text-red-600 p-3 rounded ${shake ? "shake" : ""}`}>
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-4 bg-green-100 border border-green-300 text-green-600 p-3 rounded">
                        {successMessage}
                    </div>
                )}

                {/* Add Bookmark */}
                <div className="bg-white p-8 rounded-2xl shadow-md mb-10">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                        Add New Bookmark
                    </h2>

                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg p-3 mb-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Enter Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <input
                        type="text"
                        className="w-full border border-gray-300 rounded-lg p-3 mb-6 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Enter example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />

                    <button
                        type="button"
                        disabled={!isFormValid}
                        onClick={handleAddBookmark}
                        className={`px-6 py-3 rounded-lg shadow-md transition text-white ${
                            isFormValid
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-gray-400 cursor-not-allowed"
                        }`}
                    >
                        Add Bookmark
                    </button>
                </div>

                {/* Bookmark List */}
                <div className="grid gap-5">
                    {bookmarks.length === 0 ? (
                        <p className="text-gray-500 text-center">
                            No bookmarks added yet.
                        </p>
                    ) : (
                        bookmarks.map((b) => (
                            <div
                                key={b.id}
                                className="bg-white p-6 rounded-2xl shadow flex justify-between items-center hover:shadow-lg transition"
                            >
                                <div className="max-w-[75%]">
                                    <p className="font-semibold text-lg text-gray-900">
                                        {b.title}
                                    </p>
                                    <a
                                        href={b.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 text-sm break-words hover:underline"
                                    >
                                        {b.url}
                                    </a>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => handleDelete(b.id)}
                                    className="text-red-500 hover:text-red-700 font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
