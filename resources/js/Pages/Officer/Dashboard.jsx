import { Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import OfficerLayout from "../Layouts/OfficerLayout";
import useI18n from "../../hooks/useI18n";

const currency = new Intl.NumberFormat("id-ID");

export default function Dashboard({
    stats = { active: 0, completed_today: 0, revenue_today: 0 },
    parkingLocations = [],
    parkingAreas = [],
    selectedParkingArea = null,
    scope = { location_id: "", parking_area_id: "", is_selected: false },
    activeTransactions = [],
    recentTransactions = [],
    readiness = { entry_ready: false, entry_blockers: [] },
}) {
    const { flash, errors } = usePage().props;
    const { locale, t } = useI18n();
    const tr = (key, id, en) => t(key, locale === "id" ? id : en);
    const [selectedLocationId, setSelectedLocationId] = useState(
        scope.location_id || "",
    );
    const [selectedAreaId, setSelectedAreaId] = useState(
        scope.parking_area_id || "",
    );
    const hasSelection = Boolean(selectedLocationId && selectedAreaId);
    const hasFilterChanged =
        String(selectedLocationId) !== String(scope.location_id || "") ||
        String(selectedAreaId) !== String(scope.parking_area_id || "");
    const isApplyDisabled =
        !hasSelection || (scope.is_selected && !hasFilterChanged);

    const applyScope = (event) => {
        event.preventDefault();
        router.get(
            route("officer.dashboard"),
            {
                location_id: selectedLocationId,
                parking_area_id: selectedAreaId,
            },
            { preserveScroll: true },
        );
    };

    const capacityPercent = selectedParkingArea?.capacity
        ? Math.round(
              (selectedParkingArea.occupied / selectedParkingArea.capacity) *
                  100,
          )
        : 0;
    const entryReady = Boolean(readiness?.entry_ready);
    const entryBlockers = Array.isArray(readiness?.entry_blockers)
        ? readiness.entry_blockers
        : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {tr(
                        "officer.dashboard.title",
                        "Dashboard Officer",
                        "Officer Dashboard",
                    )}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {tr(
                        "officer.dashboard.subtitle",
                        "Pilih lokasi dan area parkir kerja, lalu jalankan transaksi dari standby mode.",
                        "Choose work location and parking area, then run transactions from standby mode.",
                    )}
                </p>
            </div>

            {flash?.success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}
            {flash?.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {flash.error}
                </div>
            )}
            {(errors.location_id || errors.parking_area_id) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errors.location_id || errors.parking_area_id}
                </div>
            )}

            <form
                onSubmit={applyScope}
                className="rounded-2xl bg-white dark:bg-[#111633] border border-[#1E5EFF]/20 dark:border-white/10 p-5 space-y-4"
            >
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {tr(
                        "officer.dashboard.work_area_title",
                        "Pilih Area Kerja Officer",
                        "Select Officer Work Area",
                    )}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                            {tr(
                                "officer.dashboard.location_label",
                                "Lokasi Parkir",
                                "Parking Location",
                            )}
                        </label>
                        <select
                            value={selectedLocationId}
                            onChange={(event) => {
                                const value = event.target.value;
                                setSelectedLocationId(value);
                                setSelectedAreaId("");
                                router.get(
                                    route("officer.dashboard"),
                                    { location_id: value, parking_area_id: "" },
                                    { preserveScroll: true, replace: true },
                                );
                            }}
                            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                            required
                        >
                            <option value="">
                                {tr(
                                    "officer.dashboard.location_placeholder",
                                    "Pilih lokasi",
                                    "Select location",
                                )}
                            </option>
                            {parkingLocations.map((location) => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                            {tr(
                                "officer.dashboard.area_label",
                                "Area Parkir",
                                "Parking Area",
                            )}
                        </label>
                        <select
                            value={selectedAreaId}
                            onChange={(event) =>
                                setSelectedAreaId(event.target.value)
                            }
                            disabled={!selectedLocationId}
                            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30 disabled:bg-slate-100 dark:disabled:bg-white/10"
                            required
                        >
                            <option value="">
                                {tr(
                                    "officer.dashboard.area_placeholder",
                                    "Pilih area",
                                    "Select area",
                                )}
                            </option>
                            {parkingAreas.map((area) => (
                                <option key={area.id} value={area.id}>
                                    {area.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={isApplyDisabled}
                            className="w-full rounded-xl bg-[#1E5EFF] px-4 py-2.5 text-white font-semibold hover:bg-[#194FD8] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-[#1E5EFF]"
                        >
                            {tr(
                                "officer.dashboard.apply",
                                "Terapkan Area",
                                "Apply Area",
                            )}
                        </button>
                    </div>
                </div>
            </form>

            {!scope.is_selected ? (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111633] p-6 text-center text-slate-600 dark:text-slate-300">
                    {tr(
                        "Select parking location and parking area first to display dashboard data.",
                        "Pilih parking location dan parking area dulu untuk menampilkan data dashboard.",
                    )}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="rounded-2xl bg-white dark:bg-[#111633] p-4 border border-[#1E5EFF]/20 dark:border-white/10">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {tr(
                                    "officer.dashboard.selected_area",
                                    "Area Terpilih",
                                    "Selected Area",
                                )}
                            </p>
                            <p className="text-base font-semibold text-slate-900 dark:text-white mt-2">
                                {selectedParkingArea?.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {selectedParkingArea?.location_name}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-[#111633] p-4 border border-[#1E5EFF]/20 dark:border-white/10">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {tr(
                                    "officer.dashboard.capacity",
                                    "Kapasitas Area",
                                    "Area Capacity",
                                )}
                            </p>
                            <p className="text-3xl font-bold text-[#1E5EFF] mt-2">
                                {selectedParkingArea?.occupied || 0}/
                                {selectedParkingArea?.capacity || 0}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {tr(
                                    `${capacityPercent}% terisi`,
                                    `${capacityPercent}% occupied`,
                                )}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-[#111633] p-4 border border-[#1FD1A5]/25 dark:border-white/10">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {tr(
                                    "officer.dashboard.completed_today",
                                    "Selesai Hari Ini",
                                    "Completed Today",
                                )}
                            </p>
                            <p className="text-3xl font-bold text-[#14A886] mt-2">
                                {stats.completed_today}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-[#111633] p-4 border border-[#1E5EFF]/20 dark:border-white/10">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {tr(
                                    "officer.dashboard.revenue_today",
                                    "Pendapatan Hari Ini",
                                    "Revenue Today",
                                )}
                            </p>
                            <p className="text-3xl font-bold text-[#1E5EFF] mt-2">
                                Rp{" "}
                                {currency.format(
                                    Number(stats.revenue_today || 0),
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl bg-white dark:bg-[#111633] border border-[#1E5EFF]/20 dark:border-white/10 p-5">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            {tr(
                                "officer.dashboard.standby_mode",
                                "Standby Mode",
                                "Standby Mode",
                            )}
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                            {tr(
                                "officer.dashboard.active_area",
                                "Area aktif:",
                                "Active area:",
                            )}{" "}
                            <strong>{selectedParkingArea?.name}</strong>.
                            {tr(
                                " Standby IN akan otomatis pakai area ini.",
                                " Standby IN will automatically use this area.",
                            )}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Link
                                href={
                                    entryReady
                                        ? route("officer.standby.in")
                                        : "#"
                                }
                                className={`rounded-xl px-4 py-3 text-white text-center font-semibold transition ${
                                    entryReady
                                        ? "bg-[#1FD1A5] hover:bg-[#14A886]"
                                        : "bg-slate-400 cursor-not-allowed pointer-events-none"
                                }`}
                            >
                                {tr(
                                    "officer.dashboard.open_standby_in",
                                    "Buka Standby IN",
                                    "Open Standby IN",
                                )}
                            </Link>
                            <Link
                                href={route("officer.standby.out")}
                                className="rounded-xl bg-[#1E5EFF] px-4 py-3 text-white text-center font-semibold hover:bg-[#194FD8] transition"
                            >
                                {tr(
                                    "officer.dashboard.open_standby_out",
                                    "Buka Standby OUT",
                                    "Open Standby OUT",
                                )}
                            </Link>
                        </div>
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-500 dark:text-slate-400">
                            <div>
                                <span className="block text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    RFID
                                </span>
                                <Link
                                    href={
                                        entryReady
                                            ? route("officer.rfid.scan", {
                                                  location_id:
                                                      scope.location_id,
                                                  parking_area_id:
                                                      scope.parking_area_id,
                                              })
                                            : "#"
                                    }
                                    className="inline-flex text-[#1E5EFF] hover:underline font-semibold"
                                >
                                    Buka halaman scan RFID untuk IN & OUT
                                </Link>
                            </div>
                            {/* <div>
                                <span className="block text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                    RFID
                                </span>
                                <Link
                                    href={
                                        scope.is_selected
                                            ? route("officer.rfid.scan", {
                                                  location_id:
                                                      scope.location_id,
                                                  parking_area_id:
                                                      scope.parking_area_id,
                                              })
                                            : "#"
                                    }
                                    className="inline-flex text-[#1E5EFF] hover:underline font-semibold"
                                >
                                    Buka halaman scan RFID untuk OUT
                                </Link>
                            </div> */}
                        </div>
                        {!entryReady && entryBlockers.length > 0 && (
                            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                <p className="font-semibold mb-1">
                                    {tr(
                                        "Standby IN dikunci sementara.",
                                        "Standby IN is temporarily locked.",
                                    )}
                                </p>
                                <ul className="list-disc pl-5 space-y-1">
                                    {entryBlockers.map((item, index) => (
                                        <li key={`entry-blocker-${index}`}>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-2">
                                    {tr(
                                        "Lengkapi dari menu admin:",
                                        "Complete from admin menu:",
                                    )}{" "}
                                    <Link
                                        href="/admin/parking-rates"
                                        className="underline"
                                    >
                                        Parking Rates
                                    </Link>{" "}
                                    /{" "}
                                    <Link
                                        href="/admin/parking-areas"
                                        className="underline"
                                    >
                                        Parking Areas
                                    </Link>
                                    .
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 p-5">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                {tr(
                                    "officer.dashboard.active_transactions_title",
                                    "Transaksi Aktif Area Ini",
                                    "Active Transactions in This Area",
                                )}{" "}
                                ({stats.active})
                            </h2>
                            <div className="space-y-2 max-h-72 overflow-auto pr-1">
                                {activeTransactions.length === 0 && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {tr(
                                            "Tidak ada transaksi aktif.",
                                            "No active transactions.",
                                        )}
                                    </p>
                                )}
                                {activeTransactions.map((item) => (
                                    <div
                                        key={item.id}
                                        className="rounded-lg border border-slate-200 dark:border-white/10 p-3"
                                    >
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase">
                                            {item.vehicle?.license_plate}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            {item.vehicle?.vehicle_type?.name ||
                                                "-"}{" "}
                                            | {item.parking_area?.name || "-"}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {tr(
                                                "officer.common.entry_colon",
                                                "Masuk:",
                                                "Entry:",
                                            )}{" "}
                                            {item.entry_time
                                                ? new Date(
                                                      item.entry_time,
                                                  ).toLocaleString("id-ID")
                                                : "-"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 p-5">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                {tr(
                                    "officer.dashboard.latest_history_title",
                                    "Riwayat Terbaru Area Ini",
                                    "Latest History in This Area",
                                )}
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-160 text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                                            <th className="text-left py-2">
                                                {tr(
                                                    "officer.common.plate_short",
                                                    "Plat",
                                                    "Plate",
                                                )}
                                            </th>
                                            <th className="text-left py-2">
                                                {tr(
                                                    "officer.common.status",
                                                    "Status",
                                                    "Status",
                                                )}
                                            </th>
                                            <th className="text-left py-2">
                                                {tr(
                                                    "officer.common.entry",
                                                    "Masuk",
                                                    "Entry",
                                                )}
                                            </th>
                                            <th className="text-left py-2">
                                                {tr(
                                                    "officer.common.exit",
                                                    "Keluar",
                                                    "Exit",
                                                )}
                                            </th>
                                            <th className="text-right py-2">
                                                {tr(
                                                    "officer.common.fee",
                                                    "Biaya",
                                                    "Fee",
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTransactions.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="py-6 text-center text-slate-500 dark:text-slate-400"
                                                >
                                                    {tr(
                                                        "Belum ada transaksi.",
                                                        "No transactions yet.",
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                        {recentTransactions.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-slate-100 dark:border-white/10"
                                            >
                                                <td className="py-2 uppercase text-slate-900 dark:text-white">
                                                    {item.vehicle
                                                        ?.license_plate || "-"}
                                                </td>
                                                <td className="py-2">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                                                            item.status ===
                                                            "active"
                                                                ? "bg-[#1E5EFF]/10 text-[#1E5EFF]"
                                                                : "bg-[#1FD1A5]/20 text-[#138D72]"
                                                        }`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="py-2 text-slate-900 dark:text-white">
                                                    {item.entry_time
                                                        ? new Date(
                                                              item.entry_time,
                                                          ).toLocaleString(
                                                              "id-ID",
                                                          )
                                                        : "-"}
                                                </td>
                                                <td className="py-2 text-slate-900 dark:text-white">
                                                    {item.exit_time
                                                        ? new Date(
                                                              item.exit_time,
                                                          ).toLocaleString(
                                                              "id-ID",
                                                          )
                                                        : "-"}
                                                </td>
                                                <td className="py-2 text-slate-900 dark:text-white text-right">
                                                    {item.total_fee
                                                        ? `Rp ${currency.format(item.total_fee)}`
                                                        : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

Dashboard.layout = (page) => <OfficerLayout children={page} />;
