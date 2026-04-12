import { Head } from "@inertiajs/react";
import {
    CarFront,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    CreditCard,
    Mail,
    UserRound,
} from "lucide-react";
import UserLayout from "../Layouts/UserLayout";
import useI18n from "../../hooks/useI18n";

function formatCurrency(amount, locale) {
    const localeTag = locale === "en" ? "en-US" : "id-ID";
    return new Intl.NumberFormat(localeTag, {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));
}

function formatDateTime(value, locale) {
    if (!value) return "-";
    const localeTag = locale === "en" ? "en-US" : "id-ID";
    return new Intl.DateTimeFormat(localeTag, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}

function StatCard({ icon: Icon, title, value, subtitle }) {
    return (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121A3A] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        {title}
                    </p>
                    <p className="mt-2 text-2xl font-semibold font-['Poppins']">
                        {value}
                    </p>
                    {subtitle ? (
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            {subtitle}
                        </p>
                    ) : null}
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-700 dark:text-slate-200">
                    <Icon size={18} />
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({
    summary,
    profile,
    activeParking,
    recentTransactions,
}) {
    const { t, locale } = useI18n();
    const rows = Array.isArray(recentTransactions) ? recentTransactions : [];

    return (
        <>
            <Head title={t("user.dashboard.title", "Dashboard User")} />

            <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121A3A] p-6 md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-semibold font-['Poppins'] text-slate-900 dark:text-white">
                                {t("user.dashboard.greeting", "Halo")},{" "}
                                {profile?.name || "User"}
                            </h1>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                {t(
                                    "user.dashboard.subtitle",
                                    "Dashboard read-only untuk memantau status parkir dan histori transaksi Anda.",
                                )}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm">
                            <p className="font-semibold">
                                {t("user.dashboard.profile", "Profile")}
                            </p>
                            <div className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
                                <p className="flex items-center gap-2">
                                    <Mail size={14} /> {profile?.email || "-"}
                                </p>
                                <p className="flex items-center gap-2">
                                    <CreditCard size={14} /> RFID:{" "}
                                    {profile?.rfid_uid || "-"}
                                </p>
                                <p className="flex items-center gap-2">
                                    <UserRound size={14} />
                                    {t(
                                        "user.dashboard.vehicles",
                                        "Kendaraan terdaftar",
                                    )}
                                    : {profile?.vehicles_count ?? 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        icon={CarFront}
                        title={t(
                            "user.dashboard.cards.total_tx",
                            "Total Transaksi",
                        )}
                        value={summary?.total_transactions ?? 0}
                    />
                    <StatCard
                        icon={Clock3}
                        title={t(
                            "user.dashboard.cards.active_tx",
                            "Transaksi Aktif",
                        )}
                        value={summary?.active_transactions ?? 0}
                    />
                    <StatCard
                        icon={CheckCircle2}
                        title={t(
                            "user.dashboard.cards.completed_tx",
                            "Transaksi Selesai",
                        )}
                        value={summary?.completed_transactions ?? 0}
                    />
                    <StatCard
                        icon={CircleDollarSign}
                        title={t(
                            "user.dashboard.cards.total_spent",
                            "Total Pengeluaran",
                        )}
                        value={formatCurrency(summary?.total_spent, locale)}
                    />
                </section>

                <section className="grid gap-6 lg:grid-cols-5">
                    <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121A3A] p-5">
                        <h2 className="text-lg font-semibold font-['Poppins']">
                            {t(
                                "user.dashboard.active.title",
                                "Status Parkir Saat Ini",
                            )}
                        </h2>
                        {activeParking ? (
                            <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                <p>
                                    {t("fields.location", "Lokasi")}:{" "}
                                    <span className="font-medium">
                                        {activeParking.location}
                                    </span>
                                </p>
                                <p>
                                    {t("user.dashboard.active.area", "Area")}:{" "}
                                    <span className="font-medium">
                                        {activeParking.area}
                                    </span>
                                </p>
                                <p>
                                    {t("fields.license_plate", "Plat")}:{" "}
                                    <span className="font-medium">
                                        {activeParking.plate}
                                    </span>
                                </p>
                                <p>
                                    {t(
                                        "fields.vehicle_type",
                                        "Jenis Kendaraan",
                                    )}
                                    :{" "}
                                    <span className="font-medium">
                                        {activeParking.vehicle}
                                    </span>
                                </p>
                                <p>
                                    {t(
                                        "user.dashboard.active.entry",
                                        "Waktu Masuk",
                                    )}
                                    :{" "}
                                    <span className="font-medium">
                                        {formatDateTime(
                                            activeParking.entry_time,
                                            locale,
                                        )}
                                    </span>
                                </p>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                                {t(
                                    "user.dashboard.active.empty",
                                    "Tidak ada transaksi aktif saat ini.",
                                )}
                            </p>
                        )}
                    </div>

                    <div className="lg:col-span-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121A3A] p-5">
                        <h2 className="text-lg font-semibold font-['Poppins']">
                            {t(
                                "user.dashboard.recent.title",
                                "Transaksi Terakhir",
                            )}
                        </h2>

                        <div className="mt-4 space-y-3 md:hidden">
                            {rows.length > 0 ? (
                                rows.map((tx) => (
                                    <div
                                        key={tx.id}
                                        className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                                    {tx.plate || "-"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                                                    {formatDateTime(
                                                        tx.exit_time ||
                                                            tx.entry_time,
                                                        locale,
                                                    )}
                                                </p>
                                            </div>
                                            <p className="shrink-0 text-sm font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                                                {formatCurrency(
                                                    tx.total_fee,
                                                    locale,
                                                )}
                                            </p>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-200">
                                            <div className="min-w-0">
                                                <p className="text-slate-500 dark:text-slate-300">
                                                    {t(
                                                        "fields.location",
                                                        "Lokasi",
                                                    )}
                                                </p>
                                                <p className="truncate">
                                                    {tx.location || "-"}
                                                </p>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-slate-500 dark:text-slate-300">
                                                    {t(
                                                        "fields.status",
                                                        "Status",
                                                    )}
                                                </p>
                                                <p className="capitalize truncate">
                                                    {tx.status || "-"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-300">
                                    {t(
                                        "user.dashboard.recent.empty",
                                        "Belum ada transaksi.",
                                    )}
                                </p>
                            )}
                        </div>

                        <div className="mt-4 hidden md:block overflow-x-auto">
                            <table className="w-full min-w-[42rem] text-sm">
                                <thead>
                                    <tr className="text-left text-slate-500 dark:text-slate-300 border-b border-slate-200 dark:border-white/10">
                                        <th className="py-2 pr-3">
                                            {t("fields.time", "Waktu")}
                                        </th>
                                        <th className="py-2 pr-3">
                                            {t("fields.location", "Lokasi")}
                                        </th>
                                        <th className="py-2 pr-3">
                                            {t("fields.license_plate", "Plat")}
                                        </th>
                                        <th className="py-2 pr-3">
                                            {t("fields.status", "Status")}
                                        </th>
                                        <th className="py-2 text-right">
                                            {t("fields.amount", "Nominal")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length > 0 ? (
                                        rows.map((tx) => (
                                            <tr
                                                key={tx.id}
                                                className="border-b border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200"
                                            >
                                                <td className="py-3 pr-3 whitespace-nowrap">
                                                    {formatDateTime(
                                                        tx.exit_time ||
                                                            tx.entry_time,
                                                        locale,
                                                    )}
                                                </td>
                                                <td className="py-3 pr-3">
                                                    {tx.location}
                                                </td>
                                                <td className="py-3 pr-3 whitespace-nowrap">
                                                    {tx.plate}
                                                </td>
                                                <td className="py-3 pr-3 capitalize whitespace-nowrap">
                                                    {tx.status}
                                                </td>
                                                <td className="py-3 text-right font-medium whitespace-nowrap">
                                                    {formatCurrency(
                                                        tx.total_fee,
                                                        locale,
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="py-6 text-center text-slate-500 dark:text-slate-300"
                                            >
                                                {t(
                                                    "user.dashboard.recent.empty",
                                                    "Belum ada transaksi.",
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

Dashboard.layout = (page) => <UserLayout>{page}</UserLayout>;
