import { useForm, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Moon, Sun } from "lucide-react";
import logo from "../../Assets/Images/logo-parkone.png";
import useTheme from "../../hooks/useTheme";

export default function OfficerLayout({ children }) {
    const page = usePage();
    const { auth } = page.props;
    const { post, processing } = useForm();
    const { darkMode, setDarkMode } = useTheme();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        setDropdownOpen(false);
        post("/logout");
    };

    useEffect(() => {
        if (!dropdownOpen) return;

        const handlePointerDown = (event) => {
            if (!dropdownRef.current) return;
            if (dropdownRef.current.contains(event.target)) return;
            setDropdownOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () =>
            document.removeEventListener("pointerdown", handlePointerDown);
    }, [dropdownOpen]);

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#0B1026] transition-colors duration-300">
            <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0B1026]/90 backdrop-blur transition-colors duration-300">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
                    <div className="flex items-center gap-3">
                        <img
                            src={logo}
                            alt="Logo"
                            className="h-9 w-9 rounded-xl"
                        />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                PARKONE
                            </p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                Officer Panel
                            </p>
                        </div>
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-[#1FD1A5] font-['Poppins'] transition cursor-pointer"
                        >
                            {auth?.user?.name}
                            <ChevronDown
                                size={14}
                                className={`transition-transform duration-300 ${
                                    dropdownOpen ? "rotate-180" : "rotate-0"
                                }`}
                            />
                        </button>

                        <div
                            className={`absolute right-0 mt-4 w-48 bg-white dark:bg-[#111633]
                                border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-2 text-sm ring-1 ring-black/5 dark:ring-white/10
                                transition-all duration-300 origin-top ${
                                    dropdownOpen
                                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                                        : "opacity-0 -translate-y-1 scale-95 pointer-events-none"
                                }`}
                        >
                            <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-300">
                                Login dengan email
                                <div className="text-slate-800 dark:text-white font-medium truncate">
                                    {auth?.user?.email || "-"}
                                </div>
                            </div>

                            <hr className="my-2 border-slate-200 dark:border-white/10" />

                            <button
                                type="button"
                                onClick={() => {
                                    setDarkMode(!darkMode);
                                    setDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer inline-flex items-center gap-2"
                            >
                                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                                {darkMode ? "Light Mode" : "Dark Mode"}
                            </button>

                            <hr className="my-2 border-slate-200 dark:border-white/10" />

                            <button
                                onClick={handleLogout}
                                disabled={processing}
                                className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer inline-flex items-center gap-2 disabled:opacity-60"
                            >
                                <LogOut size={16} />
                                {processing ? "Logging out..." : "Logout"}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
        </div>
    );
}
