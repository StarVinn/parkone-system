import { useForm, usePage, router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Languages, LogOut, Moon, Sun, User } from "lucide-react";
import useTheme from "../../hooks/useTheme";
import useI18n from "../../hooks/useI18n";
import logo from "../../Assets/Images/logo-parkone.png";

export default function UserLayout({ children }) {
    const { auth } = usePage().props;
    const { post, processing } = useForm();
    const { darkMode, setDarkMode } = useTheme();
    const { locale, t } = useI18n();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        setDropdownOpen(false);
        post("/logout");
    };

    const handleLocale = (nextLocale) => {
        router.post(
            route("locale.update"),
            { locale: nextLocale },
            { preserveScroll: true },
        );
        setDropdownOpen(false);
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
        <div className="min-h-screen w-full overflow-x-hidden bg-slate-100 dark:bg-[#0C122B] text-slate-900 dark:text-slate-100 transition-colors duration-300">
            <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0C122B]/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
                    <div className="flex flex-1 min-w-0 items-center gap-3">
                        <img
                            src={logo}
                            alt="PARKONE"
                            className="h-10 w-10 rounded-xl"
                        />
                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                                ParkOne
                            </p>
                            <p className="text-sm font-semibold font-['Poppins'] truncate">
                                {t("user.layout.title", "User Dashboard")}
                            </p>
                        </div>
                    </div>

                    <div className="relative shrink-0" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setDropdownOpen((open) => !open)}
                            className="flex items-center gap-2 text-sm font-medium hover:text-[#1E5EFF] font-['Poppins'] transition cursor-pointer"
                        >
                            <User size={16} />
                            <span className="max-w-[12rem] sm:max-w-[16rem] truncate">
                                {auth?.user?.name}
                            </span>
                            <ChevronDown
                                size={14}
                                className={`transition-transform duration-300 ${dropdownOpen ? "rotate-180" : "rotate-0"}`}
                            />
                        </button>

                        <div
                            className={`absolute right-0 mt-3 w-[min(16rem,calc(100vw-2rem))] sm:w-64 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121A3A] shadow-2xl py-2 transition-all duration-200 origin-top ${
                                dropdownOpen
                                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                                    : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                            }`}
                        >
                            <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-300">
                                {t(
                                    "layout.login_with_email",
                                    "Login dengan email",
                                )}
                                <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white break-all">
                                    {auth?.user?.email || "-"}
                                </div>
                            </div>

                            <hr className="my-2 border-slate-200 dark:border-white/10" />

                            <button
                                onClick={() => {
                                    setDarkMode(!darkMode);
                                    setDropdownOpen(false);
                                }}
                                className="w-full flex items-center gap-2 text-sm font-semibold text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                            >
                                {darkMode
                                    ? t("layout.light_mode", "Light Mode")
                                    : t("layout.dark_mode", "Dark Mode")}
                            </button>

                            <hr className="my-2 border-slate-200 dark:border-white/10" />

                            <div className="px-4 py-2">
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                                    <Languages size={14} />
                                    <span>
                                        {t("layout.language", "Language")}
                                    </span>
                                    <span className="ml-auto text-sm font-semibold text-slate-700 dark:text-slate-200">
                                        {locale === "id" ? "ID" : "EN"}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {locale === "id"
                                            ? t("lang.id", "Bahasa Indonesia")
                                            : t("lang.en", "English")}
                                    </span>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={locale === "en"}
                                        onClick={() =>
                                            handleLocale(
                                                locale === "id" ? "en" : "id",
                                            )
                                        }
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                                            locale === "en"
                                                ? "bg-[#1E5EFF]"
                                                : "bg-slate-300 dark:bg-white/20"
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform cursor-pointer ${
                                                locale === "en"
                                                    ? "translate-x-6"
                                                    : "translate-x-1"
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>

                            <hr className="my-2 border-slate-200 dark:border-white/10" />

                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={processing}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-semibold text-left text-rose-600 dark:text-rose-400 hover:bg-slate-100 dark:hover:bg-white/5 disabled:opacity-60 cursor-pointer"
                            >
                                <LogOut size={16} />
                                {processing
                                    ? t("states.processing", "Processing...")
                                    : t("actions.logout", "Logout")}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
        </div>
    );
}
