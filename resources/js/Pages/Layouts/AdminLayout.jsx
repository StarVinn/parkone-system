import { useState, useEffect } from "react";
import { Link, usePage, useForm, router } from "@inertiajs/react";
import { ChevronDown, Languages } from "lucide-react";
import useTheme from "../../hooks/useTheme";
import useI18n from "../../hooks/useI18n";
import logo from "../../Assets/Images/logo-parkone.png";

export default function AdminLayout({ children }) {
    const page = usePage();
    const { auth } = page.props;
    const currentPath = (page.url || "").split("?")[0];
    const { post, processing } = useForm();
    const { t, locale } = useI18n();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [navGroupOpen, setNavGroupOpen] = useState({});

    const { darkMode, setDarkMode } = useTheme();

    const navItems = Array.isArray(page.props?.nav?.items)
        ? page.props.nav.items
        : [];

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        // Close account dropdown on page navigation.
        setDropdownOpen(false);

        // Collapse nav groups when the current page is not inside any group.
        const hasActiveGroup = navItems
            .filter((item) => item?.type === "group")
            .some((item) =>
                Array.isArray(item.children)
                    ? item.children.some((child) =>
                          isPathActive(child?.href, true),
                      )
                    : false,
            );

        if (!hasActiveGroup) {
            setNavGroupOpen({});
        }
    }, [currentPath]);

    const handleLogout = () => {
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

    const canSeeItem = (item) => {
        if (!item?.active) return false;
        const roles = Array.isArray(item?.roles) ? item.roles : [];
        if (roles.length === 0) return true;
        const role = auth?.user?.role;
        return roles.includes(role);
    };

    const itemLabel = (item) =>
        t(item?.label_key, item?.label_key || item?.key || "-");

    const isPathActive = (href, allowNested = true) => {
        const path = String(currentPath || "");
        const target = String(href || "");
        if (!target) return false;

        if (path === target) return true;
        if (!allowNested) return false;

        return path.startsWith(`${target}/`);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0B1026] text-slate-900 dark:text-[#F5F7FA] font-['Inter'] transition-colors duration-300">
            <header
                className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md
        bg-white/80 dark:bg-[#0B1026]/80
        border-b border-slate-200 dark:border-white/5 transition-colors duration-300"
            >
                <div className="flex items-center justify-between px-6 lg:px-10 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="relative w-8 h-8 flex items-center justify-center"
                        >
                            <span
                                className={`absolute h-0.5 w-6 bg-slate-900 dark:bg-white transition-all duration-300 cursor-pointer ${
                                    sidebarOpen ? "rotate-45" : "-translate-y-2"
                                }`}
                            />
                            <span
                                className={`absolute h-0.5 w-6 bg-slate-900 dark:bg-white transition-all duration-300 cursor-pointer ${
                                    sidebarOpen ? "opacity-0" : ""
                                }`}
                            />
                            <span
                                className={`absolute h-0.5 w-6 bg-slate-900 dark:bg-white transition-all duration-300 cursor-pointer ${
                                    sidebarOpen ? "-rotate-45" : "translate-y-2"
                                }`}
                            />
                        </button>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 text-sm font-medium hover:text-[#1FD1A5] font-['Poppins'] transition cursor-pointer"
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
                                border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl py-2 text-sm
                                transition-all duration-300 origin-top ${
                                    dropdownOpen
                                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                                        : "opacity-0 -translate-y-1 scale-95 pointer-events-none"
                                }`}
                        >
                            <div className="px-4 py-2 text-xs text-slate-500 dark:text-slate-300">
                                {t(
                                    "layout.login_with_email",
                                    "Login dengan email",
                                )}
                                <div className="text-slate-800 dark:text-white font-medium truncate">
                                    {auth?.user?.email || "-"}
                                </div>
                            </div>

                            <hr className="my-2 border-slate-200 dark:border-white/10" />

                            <button
                                onClick={() => setDarkMode(!darkMode)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                            >
                                {darkMode
                                    ? t("layout.light_mode", "Light Mode")
                                    : t("layout.dark_mode", "Dark Mode")}
                            </button>

                            <hr className="my-2 border-slate-200 dark:border-white/10" />

                            <div className="px-4 py-2">
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                                    <Languages size={14} />
                                    <span>
                                        {t("layout.language", "Language")}
                                    </span>
                                    <span className="ml-auto font-semibold text-slate-700 dark:text-slate-200">
                                        {locale === "id" ? "ID" : "EN"}
                                    </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between gap-3">
                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
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
                                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                                            locale === "en"
                                                ? "bg-[#1E5EFF]"
                                                : "bg-slate-300 dark:bg-white/20"
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
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
                                onClick={handleLogout}
                                disabled={processing}
                                className="w-full text-left px-4 py-2 text-red-500 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                            >
                                {processing
                                    ? t("states.processing", "Processing...")
                                    : t("actions.logout", "Logout")}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <aside
                className={`fixed top-20 left-0 z-30 h-[calc(100vh-5rem)] w-64
            bg-slate-100 dark:bg-[#111633]
            border-r border-slate-200 dark:border-white/5
            p-6 transform transition-transform duration-300 flex flex-col overflow-hidden
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <img
                    src={logo}
                    alt="Logo ParkOne"
                    className="w-16 h-16 mx-auto mb-4"
                />
                <h2
                    className="text-lg font-semibold font-['Poppins'] mb-10
            bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5]
            bg-clip-text text-transparent text-center"
                >
                    PARKONE
                </h2>

                <nav className="space-y-3 text-sm flex-1 overflow-y-auto pr-1 overscroll-contain">
                    {navItems.filter(canSeeItem).map((item) => {
                        if (item.type === "group") {
                            const isGroupActive = Array.isArray(item.children)
                                ? item.children.some((c) =>
                                      isPathActive(c?.href, true),
                                  )
                                : false;
                            const open =
                                Boolean(navGroupOpen[item.key]) ||
                                isGroupActive;

                            return (
                                <div key={item.key}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setNavGroupOpen((prev) => ({
                                                ...prev,
                                                [item.key]: !open,
                                            }))
                                        }
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border-l-2 transition cursor-pointer ${
                                            isGroupActive
                                                ? "border-[#1FD1A5] bg-slate-200/70 dark:bg-white/10 text-slate-900 dark:text-white"
                                                : "border-transparent hover:bg-slate-200 dark:hover:bg-white/5"
                                        }`}
                                    >
                                        <span>{itemLabel(item)}</span>
                                        <ChevronDown
                                            size={14}
                                            className={`transition-transform duration-300 ${
                                                open ? "rotate-180" : "rotate-0"
                                            }`}
                                        />
                                    </button>
                                    <div
                                        className={`mt-1 pl-3 space-y-1 overflow-hidden transition-all duration-300 ${
                                            open
                                                ? "max-h-64 opacity-100 translate-y-0"
                                                : "max-h-0 opacity-0 -translate-y-1"
                                        }`}
                                    >
                                        {(Array.isArray(item.children)
                                            ? item.children
                                            : []
                                        )
                                            .filter((c) => c?.active)
                                            .map((child) => {
                                                const isChildActive =
                                                    isPathActive(
                                                        child?.href,
                                                        true,
                                                    );

                                                return (
                                                    <Link
                                                        key={
                                                            child.key ||
                                                            child.href
                                                        }
                                                        href={child.href}
                                                        className={`block px-3 py-2 rounded-lg border-l-2 transition ${
                                                            isChildActive
                                                                ? "border-[#1FD1A5] bg-slate-200/70 dark:bg-white/10 text-slate-900 dark:text-white"
                                                                : "border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/5"
                                                        }`}
                                                    >
                                                        {t(
                                                            child.label_key,
                                                            child.label_key ||
                                                                child.key ||
                                                                "-",
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                    </div>
                                </div>
                            );
                        }

                        const isItemActive = isPathActive(item?.href, false);

                        return (
                            <Link
                                key={item.key || item.href}
                                href={item.href}
                                className={`block px-3 py-2 rounded-lg border-l-2 transition ${
                                    isItemActive
                                        ? "border-[#1FD1A5] bg-slate-200/70 dark:bg-white/10 text-slate-900 dark:text-white"
                                        : "border-transparent hover:bg-slate-200 dark:hover:bg-white/5"
                                }`}
                            >
                                {itemLabel(item)}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main
                className={`pt-24 px-6 lg:px-10 transition-all duration-300 ${
                    sidebarOpen ? "lg:ml-64" : "lg:ml-0"
                }`}
            >
                {children}
            </main>
        </div>
    );
}
