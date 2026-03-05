import { Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import OfficerLayout from "../Layouts/OfficerLayout";

const formatLicensePlate = (value) => {
    const cleaned = String(value || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    if (!cleaned) {
        return "";
    }

    const match = cleaned.match(/^([A-Z]{1,2})([0-9]{0,4})([A-Z]{0,3})/);
    if (!match) {
        return cleaned;
    }

    return [match[1], match[2], match[3]].filter(Boolean).join(" ");
};

export default function StandbyOut({ activeTransactions = [], selectedParkingArea = null }) {
    const { flash, errors } = usePage().props;
    const [useRfid, setUseRfid] = useState(false);
    const [rfidUid, setRfidUid] = useState("");
    const [rfidUser, setRfidUser] = useState(null);
    const [rfidVehicles, setRfidVehicles] = useState([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState("");
    const [rfidError, setRfidError] = useState("");
    const [lookupLoading, setLookupLoading] = useState(false);

    const selectedVehicle = useMemo(
        () => rfidVehicles.find((item) => String(item.id) === String(selectedVehicleId)),
        [rfidVehicles, selectedVehicleId],
    );

    const handleLookupRfid = async () => {
        if (!rfidUid.trim()) {
            setRfidError("RFID wajib diisi.");
            return;
        }

        setLookupLoading(true);
        setRfidError("");
        setRfidUser(null);
        setRfidVehicles([]);
        setSelectedVehicleId("");

        try {
            const url = `${route("officer.rfid.lookup")}?rfid_uid=${encodeURIComponent(rfidUid)}`;
            const response = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            });
            const payload = await response.json();

            if (!response.ok) {
                setRfidError(payload.message || "RFID tidak ditemukan.");
                return;
            }

            setRfidUser(payload.user);
            setRfidVehicles(payload.vehicles || []);

            if (!payload.vehicles?.length) {
                setRfidError("User ditemukan, tapi belum punya data kendaraan.");
            }
        } catch {
            setRfidError("Gagal melakukan lookup RFID.");
        } finally {
            setLookupLoading(false);
        }
    };

    const submit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const licensePlate = useRfid
            ? selectedVehicle?.license_plate || ""
            : formData.get("license_plate");

        if (useRfid && !licensePlate) {
            setRfidError("Pilih kendaraan dari hasil RFID terlebih dahulu.");
            return;
        }

        router.post(route("officer.transactions.store"), {
            action: "exit",
            license_plate: licensePlate,
            checkout_mode: useRfid ? "rfid" : "ticket",
        });
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Standby OUT</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Mode cepat untuk transaksi kendaraan keluar.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Area aktif: <strong>{selectedParkingArea?.name || "-"}</strong>
                    </p>
                </div>
                <Link href="/officer" className="text-sm text-[#1E5EFF] hover:underline">
                    Kembali ke Dashboard
                </Link>
            </div>

            {flash?.success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}

            {(errors.license_plate || errors.action) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errors.license_plate || errors.action}
                </div>
            )}

            <form
                onSubmit={submit}
                className="rounded-2xl border border-[#1E5EFF]/20 dark:border-white/10 bg-white dark:bg-[#111633] p-6 space-y-4"
            >
                <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 px-4 py-3">
                    <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Mode Input</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {useRfid ? "Pakai RFID" : "Input Normal Plat Nomor"}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setUseRfid((prev) => !prev);
                            setRfidError("");
                        }}
                        className={`relative h-7 w-14 rounded-full transition ${
                            useRfid ? "bg-[#1E5EFF]" : "bg-slate-300"
                        }`}
                    >
                        <span
                            className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                                useRfid ? "left-8" : "left-1"
                            }`}
                        />
                    </button>
                </div>

                {!useRfid ? (
                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Plat Nomor</label>
                        <input
                            name="license_plate"
                            onInput={(event) => {
                                event.target.value = formatLicensePlate(event.target.value);
                            }}
                            placeholder="Contoh: B 1018 PIA"
                            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                            required
                        />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex flex-col md:flex-row gap-2">
                            <input
                                value={rfidUid}
                                onChange={(event) => setRfidUid(event.target.value)}
                                placeholder="Scan / input RFID UID"
                                className="flex-1 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                            />
                            <button
                                type="button"
                                onClick={handleLookupRfid}
                                disabled={lookupLoading}
                                className="rounded-xl bg-slate-900 dark:bg-slate-700 px-4 py-2.5 text-white font-medium hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-60 cursor-pointer"
                            >
                                {lookupLoading ? "Mencari..." : "Cari RFID"}
                            </button>
                        </div>

                        {rfidUser && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                RFID cocok dengan user: <strong>{rfidUser.name}</strong>
                            </div>
                        )}

                        {!!rfidVehicles.length && (
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                                    Kendaraan Owner
                                </label>
                                <select
                                    value={selectedVehicleId}
                                    onChange={(event) => setSelectedVehicleId(event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                                    required={useRfid}
                                >
                                    <option value="">Pilih kendaraan</option>
                                    {rfidVehicles.map((vehicle) => (
                                        <option key={vehicle.id} value={vehicle.id}>
                                            {vehicle.license_plate} ({vehicle.vehicle_type_name || "-"})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {rfidError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {rfidError}
                            </div>
                        )}
                    </div>
                )}

                <button
                    type="submit"
                    className="w-full rounded-xl bg-[#1E5EFF] px-4 py-2.5 text-white font-semibold hover:bg-[#194FD8] transition cursor-pointer"
                >
                    Proses Kendaraan Keluar
                </button>
            </form>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111633] p-5">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Transaksi Aktif</h2>
                <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    {activeTransactions.length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada transaksi aktif.</p>
                    )}
                    {activeTransactions.map((item) => (
                        <div key={item.id} className="rounded-lg border border-slate-200 dark:border-white/10 p-3">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase">
                                {item.vehicle?.license_plate}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {item.vehicle?.vehicle_type?.name || "-"} | {item.parking_area?.name || "-"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Masuk: {item.entry_time ? new Date(item.entry_time).toLocaleString("id-ID") : "-"}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

StandbyOut.layout = (page) => <OfficerLayout children={page} />;
