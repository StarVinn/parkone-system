import { Link, usePage } from "@inertiajs/react";

export default function OwnerLayout({ children }) {
    const { auth } = usePage().props;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            <aside className="w-64 bg-emerald-700 text-white p-6">
                <h2 className="text-xl font-bold mb-8">PARKONE Owner</h2>

                <nav className="space-y-4">
                    <Link href="/dashboard" className="block hover:opacity-80">
                        Dashboard
                    </Link>
                    <Link href="/reports" className="block hover:opacity-80">
                        Laporan Keuangan
                    </Link>
                </nav>

                <div className="mt-10 text-sm opacity-80">
                    Login sebagai:
                    <br />
                    <strong>{auth?.user?.name}</strong>
                </div>
            </aside>

            <main className="flex-1 p-8">{children}</main>
        </div>
    );
}
