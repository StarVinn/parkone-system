import { Link, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import { ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import useTheme from "../../hooks/useTheme";
import logo from "../../Assets/Images/logo-parkone.png";

export default function OwnerLayout({ children }) {
    const { auth } = usePage().props;
    const { post, processing } = useForm();
    const { darkMode, setDarkMode } = useTheme();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = () => {
        post("/logout");
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-darkbg-primary text-slate-900 dark:text-[#F5F7FA] font-['Inter'] transition-colors duration-300">
            <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-white/95 dark:bg-darkbg-primary/90 border-b border-slate-200 dark:border-white/10 transition-colors duration-300">
                <div className="mx-auto max-w-7xl px-6 lg:px-10 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logo} alt="Logo" className="h-8 w-8" />
                        <Link
                            href="/owner"
                            className="font-['Poppins'] font-semibold tracking-wide bg-gradient-to-r from-brand.blue to-brand.teal bg-clip-text"
                        >
                            PARKONE Owner
                        </Link>

                    </div>

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setDropdownOpen((open) => !open)}
                            className="flex items-center gap-2 text-sm font-medium hover:text-brand.teal font-['Poppins'] transition cursor-pointer"
                        >
                            <span className="max-w-40 truncate">
                                {auth?.user?.name}
                            </span>
                            <ChevronDown
                                size={14}
                                className={`transition-transform duration-300 ${dropdownOpen ? "rotate-180" : "rotate-0"}`}
                            />
                        </button>

                        <div
                            className={`absolute right-0 mt-4 w-56 bg-white dark:bg-darkbg-secondary border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-2 text-sm transition-all duration-300 origin-top ${
                                dropdownOpen
                                    ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                                    : "opacity-0 -translate-y-1 scale-95 pointer-events-none"
                            }`}
                        >
                            <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-300">
                                Login sebagai
                                <div className="text-slate-800 dark:text-white font-medium truncate">
                                    {auth?.user?.email || "-"}
                                </div>
                            </div>

                            <hr className="my-2 border-slate-200 dark:border-white/10" />

                            <button
                                type="button"
                                onClick={() => setDarkMode(!darkMode)}
                                className="w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                            >
                                {darkMode ? (
                                    <Sun size={16} />
                                ) : (
                                    <Moon size={16} />
                                )}
                                <span>
                                    {darkMode ? "Light Mode" : "Dark Mode"}
                                </span>
                            </button>

                            <hr className="my-2 border-slate-200 dark:border-white/10" />

                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={processing}
                                className="w-full flex items-center gap-2 text-left px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer disabled:opacity-60"
                            >
                                <LogOut size={16} />
                                <span>
                                    {processing ? "Logging out..." : "Logout"}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="pt-24 pb-10">
                <div className="mx-auto max-w-7xl px-6 lg:px-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
