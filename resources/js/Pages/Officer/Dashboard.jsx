import { Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import OfficerLayout from "../Layouts/OfficerLayout";

const currency = new Intl.NumberFormat("id-ID");

export default function Dashboard({
    stats = { active: 0, completed_today: 0, revenue_today: 0 },
    parkingLocations = [],
    parkingAreas = [],
    selectedParkingArea = null,
    scope = { location_id: "", parking_area_id: "", is_selected: false },
    activeTransactions = [],
    recentTransactions = [],
}) {
    const { flash, errors } = usePage().props;
    const [selectedLocationId, setSelectedLocationId] = useState(scope.location_id || "");
    const [selectedAreaId, setSelectedAreaId] = useState(scope.parking_area_id || "");

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
        ? Math.round((selectedParkingArea.occupied / selectedParkingArea.capacity) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Dashboard Officer
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Pilih lokasi dan area parkir kerja, lalu jalankan transaksi
                    dari standby mode.
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
                    Pilih Area Kerja Officer
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                            Parking Location
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
                            <option value="">Pilih location</option>
                            {parkingLocations.map((location) => (
                                <option key={location.id} value={location.id}>
                                    {location.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                            Parking Area
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
                            <option value="">Pilih area</option>
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
                            className="w-full rounded-xl bg-[#1E5EFF] px-4 py-2.5 text-white font-semibold hover:bg-[#194FD8] transition cursor-pointer"
                        >
                            Terapkan Area
                        </button>
                    </div>
                </div>
            </form>

            {!scope.is_selected ? (
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111633] p-6 text-center text-slate-600 dark:text-slate-300">
                    Pilih parking location dan parking area dulu untuk
                    menampilkan data dashboard.
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="rounded-2xl bg-white dark:bg-[#111633] p-4 border border-[#1E5EFF]/20 dark:border-white/10">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Area Terpilih
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
                                Kapasitas Area
                            </p>
                            <p className="text-3xl font-bold text-[#1E5EFF] mt-2">
                                {selectedParkingArea?.occupied || 0}/
                                {selectedParkingArea?.capacity || 0}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {capacityPercent}% terisi
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-[#111633] p-4 border border-[#1FD1A5]/25 dark:border-white/10">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Selesai Hari Ini
                            </p>
                            <p className="text-3xl font-bold text-[#14A886] mt-2">
                                {stats.completed_today}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-white dark:bg-[#111633] p-4 border border-[#1E5EFF]/20 dark:border-white/10">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Pendapatan Hari Ini
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
                            Standby Mode
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                            Area aktif:{" "}
                            <strong>{selectedParkingArea?.name}</strong>.
                            Standby IN akan otomatis pakai area ini.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Link
                                href={route("officer.standby.in")}
                                className="rounded-xl bg-[#1FD1A5] px-4 py-3 text-white text-center font-semibold hover:bg-[#14A886] transition"
                            >
                                Buka Standby IN
                            </Link>
                            <Link
                                href={route("officer.standby.out")}
                                className="rounded-xl bg-[#1E5EFF] px-4 py-3 text-white text-center font-semibold hover:bg-[#194FD8] transition"
                            >
                                Buka Standby OUT
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 p-5">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                                Transaksi Aktif Area Ini ({stats.active})
                            </h2>
                            <div className="space-y-2 max-h-72 overflow-auto pr-1">
                                {activeTransactions.length === 0 && (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Tidak ada transaksi aktif.
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
                                            Masuk:{" "}
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
                                Riwayat Terbaru Area Ini
                            </h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                                            <th className="text-left py-2">
                                                Plat
                                            </th>
                                            <th className="text-left py-2">
                                                Status
                                            </th>
                                            <th className="text-left py-2">
                                                Masuk
                                            </th>
                                            <th className="text-left py-2">
                                                Keluar
                                            </th>
                                            <th className="text-right py-2">
                                                Biaya
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
                                                    Belum ada transaksi.
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
