import { useState, useEffect } from "react";
import { Link, usePage, useForm } from "@inertiajs/react";
import useTheme from "../../hooks/useTheme";
import logo from "../../Assets/Images/logo-parkone.png";

export default function AdminLayout({ children }) {
    const { auth } = usePage().props;
    const { post, processing } = useForm();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { darkMode, setDarkMode } = useTheme();

    // Auto open sidebar on desktop
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

    const handleLogout = () => {
        post("/logout");
    };

    return (
        <div className="min-h-screen bg-white dark:bg-[#0B1026] text-slate-900 dark:text-[#F5F7FA] font-['Inter'] transition-colors duration-300">
            {/* ================= NAVBAR ================= */}
            <header
                className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md 
        bg-white/80 dark:bg-[#0B1026]/80 
        border-b border-slate-200 dark:border-white/5 transition-colors duration-300"
            >
                <div className="flex items-center justify-between px-6 lg:px-10 py-4">
                    {/* LEFT */}
                    <div className="flex items-center gap-4">
                        {/* Toggle Button */}
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

                    {/* RIGHT */}
                    <div className="relative">
                        <button
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="flex items-center gap-2 text-sm font-medium hover:text-[#1FD1A5] font-['Poppins'] transition cursor-pointer"
                        >

                            {auth?.user?.name}
                            <span className="text-xs">
                                {dropdownOpen ? "▲" : "▼"}
                            </span>
                        </button>

                        {dropdownOpen && (
                            <div
                                className="absolute right-0 mt-4 w-48 
                        bg-white dark:bg-[#111633] 
                        border border-slate-200 dark:border-white/10 
                        rounded-xl shadow-2xl py-2 text-sm transition-colors duration-300"
                            >
                                <Link
                                    href="/"
                                    className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                                >
                                    Home
                                </Link>

                                <Link
                                    href="/profile"
                                    className="block px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition"
                                >
                                    Profile
                                </Link>

                                <hr className="my-2 border-slate-200 dark:border-white/10" />

                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                                >
                                    {darkMode
                                        ? "☀️ Light Mode"
                                        : "🌙 Dark Mode"}
                                </button>

                                <hr className="my-2 border-slate-200 dark:border-white/10" />

                                <button
                                    onClick={handleLogout}
                                    disabled={processing}
                                    className="w-full text-left px-4 py-2 text-red-500 hover:bg-slate-100 dark:hover:bg-white/5 transition cursor-pointer"
                                >
                                    {processing ? "Logging out..." : "Logout"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ================= SIDEBAR ================= */}
            <aside
                className={`fixed top-20 left-0 z-30 h-[calc(100vh-5rem)] w-64 
            bg-slate-100 dark:bg-[#111633] 
            border-r border-slate-200 dark:border-white/5
            p-6 transform transition-transform duration-300
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

                <nav className="space-y-4 text-sm">
                    <Link
                        href="/admin"
                        className="block px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 transition"
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/admin/vehicle-types"
                        className="block px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 transition"
                    >
                        Manage Vehicle Types
                    </Link>

                    <Link
                        href="/admin/parking-locations"
                        className="block px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 transition"
                    >
                        Parking Locations
                    </Link>
                    <Link
                        href="/admin/parking-areas"
                        className="block px-3 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-white/5 transition"
                    >
                        Parking Areas
                    </Link>
                </nav>
            </aside>

            {/* ================= OVERLAY ================= */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ================= CONTENT ================= */}
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
