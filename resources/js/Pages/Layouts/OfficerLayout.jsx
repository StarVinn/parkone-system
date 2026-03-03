import { useForm, usePage } from "@inertiajs/react";
import logo from "../../Assets/Images/logo-parkone.png";
import useTheme from "../../hooks/useTheme";

export default function OfficerLayout({ children }) {
    const page = usePage();
    const { auth } = page.props;
    const { post, processing } = useForm();
    const { darkMode, setDarkMode } = useTheme();

    const handleLogout = () => {
        post("/logout");
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#0B1026] transition-colors duration-300">
            <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#0B1026]/90 backdrop-blur transition-colors duration-300">
                <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
                    <div className="flex items-center gap-3">
                        <img src={logo} alt="Logo" className="h-9 w-9 rounded-xl" />
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">PARKONE</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">Officer Panel</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setDarkMode(!darkMode)}
                            className="rounded-lg border border-slate-300 dark:border-white/20 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                        >
                            {darkMode ? "Light Mode" : "Dark Mode"}
                        </button>
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                            Login sebagai <strong className="text-slate-900 dark:text-white">{auth?.user?.name}</strong>
                        </span>
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={processing}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-[#1E5EFF] transition cursor-pointer disabled:opacity-60"
                        >
                            {processing ? "Logging out..." : "Logout"}
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
        </div>
    );
}
