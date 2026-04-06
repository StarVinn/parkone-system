import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
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

const canonicalize = (value) =>
    String(value || "")
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

export default function StandbyOut({
    activeTransactions = [],
    selectedParkingArea = null,
}) {
    const { flash, errors } = usePage().props;
    const [licensePlate, setLicensePlate] = useState("");
    const [plateSource, setPlateSource] = useState("none");
    const [plateError, setPlateError] = useState("");
    const [rfidUid, setRfidUid] = useState("");
    const [rfidUser, setRfidUser] = useState(null);
    const [rfidVehicle, setRfidVehicle] = useState(null);
    const [rfidError, setRfidError] = useState("");
    const [lookupLoading, setLookupLoading] = useState(false);
    const [selectedActiveTransaction, setSelectedActiveTransaction] =
        useState(null);
    const [activePlateSearch, setActivePlateSearch] = useState("");
    const latestLookupRef = useRef(0);

    const filteredActiveTransactions = useMemo(() => {
        const keyword = activePlateSearch
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "");

        if (!keyword) {
            return activeTransactions;
        }

        return activeTransactions.filter((item) => {
            const plate = String(item.vehicle?.license_plate || "")
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "");
            return plate.includes(keyword);
        });
    }, [activeTransactions, activePlateSearch]);

    const activeTransactionForPlate = useMemo(() => {
        const canonicalPlate = canonicalize(licensePlate);
        if (!canonicalPlate) {
            return null;
        }

        return (
            activeTransactions.find((tx) => {
                const txPlate = canonicalize(tx.vehicle?.license_plate);
                return txPlate && txPlate === canonicalPlate;
            }) || null
        );
    }, [activeTransactions, licensePlate]);

    const rfidRequiredForPlate = useMemo(() => {
        const tx = activeTransactionForPlate;
        if (!tx) {
            return false;
        }

        return Boolean(tx.rfidCard?.uid || tx.rfid_uid);
    }, [activeTransactionForPlate]);

    const handleLookupRfid = async (uid) => {
        const normalizedUid = String(uid || "").trim();
        if (!normalizedUid) {
            setLookupLoading(false);
            setRfidError("");
            setRfidUser(null);
            setRfidVehicle(null);
            return;
        }

        const lookupId = latestLookupRef.current + 1;
        latestLookupRef.current = lookupId;

        setLookupLoading(true);
        setRfidError("");
        setRfidUser(null);
        setRfidVehicle(null);

        try {
            const url = `${route("officer.rfid.lookup")}?rfid_uid=${encodeURIComponent(normalizedUid)}`;
            const response = await fetch(url, {
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            });
            const payload = await response.json();
            if (latestLookupRef.current !== lookupId) {
                return;
            }

            if (!response.ok) {
                setRfidError(payload.message || "RFID tidak ditemukan.");
                return;
            }

            setRfidUser(payload.user);
            setRfidVehicle(payload.vehicle || null);

            if (payload.vehicle?.license_plate) {
                setLicensePlate(
                    formatLicensePlate(payload.vehicle.license_plate),
                );
                setPlateSource("rfid");
                setPlateError("");
            }

            const matched = activeTransactions.find((tx) => {
                const txUid = String(tx.rfidCard?.uid || tx.rfid_uid || "")
                    .trim()
                    .toUpperCase();
                return txUid && txUid === normalizedUid.toUpperCase();
            });
            const matchedPlate =
                payload.vehicle?.license_plate ||
                matched?.vehicle?.license_plate;
            if (matchedPlate) {
                setLicensePlate(formatLicensePlate(matchedPlate));
                setPlateSource("rfid");
                setPlateError("");
            }
        } catch {
            if (latestLookupRef.current !== lookupId) {
                return;
            }
            setRfidError("Gagal melakukan lookup RFID.");
        } finally {
            if (latestLookupRef.current === lookupId) {
                setLookupLoading(false);
            }
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleLookupRfid(rfidUid);
        }, 450);

        return () => clearTimeout(timeoutId);
    }, [rfidUid]);

    const submit = (event) => {
        event.preventDefault();
        const normalizedPlate = String(licensePlate || "").trim();

        if (!normalizedPlate) {
            setPlateError("Plat nomor wajib diisi.");
            return;
        }

        if (rfidUid.trim() && !rfidUser) {
            setRfidError("RFID belum terverifikasi.");
            return;
        }

        router.post(route("officer.transactions.store"), {
            action: "exit",
            license_plate: normalizedPlate,
            checkout_mode: String(rfidUid || "").trim() ? "rfid" : "ticket",
            rfid_uid: String(rfidUid || "").trim(),
        });
    };

    const showRfidInput =
        !licensePlate.trim() || rfidUid.trim() || rfidRequiredForPlate;
    const showPlateInput = !rfidUid.trim();

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Standby OUT
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Mode cepat untuk transaksi kendaraan keluar.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Area aktif:{" "}
                        <strong>{selectedParkingArea?.name || "-"}</strong>
                    </p>
                </div>
                <Link
                    href="/officer"
                    className="text-sm text-[#1E5EFF] hover:underline"
                >
                    Kembali ke Dashboard
                </Link>
            </div>

            {flash?.success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {flash.success}
                </div>
            )}

            {(errors.license_plate || errors.action || errors.rfid_uid) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errors.license_plate || errors.action || errors.rfid_uid}
                </div>
            )}

            <form
                onSubmit={submit}
                className="rounded-2xl border border-[#1E5EFF]/20 dark:border-white/10 bg-white dark:bg-[#111633] p-6 space-y-4"
            >
                {showRfidInput ? (
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                                RFID UID (Opsional)
                            </label>
                            <input
                                value={rfidUid}
                                onChange={(event) => {
                                    const nextUid = event.target.value;
                                    setRfidUid(nextUid);
                                    if (
                                        String(nextUid || "").trim() &&
                                        plateSource === "manual"
                                    ) {
                                        setLicensePlate("");
                                        setPlateSource("none");
                                        setPlateError("");
                                    }
                                }}
                                placeholder="Scan / input RFID UID (boleh kosong)"
                                className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Jika transaksi masuk memakai RFID, saat keluar RFID
                            yang sama harus diinput.
                        </p>
                        {lookupLoading && (
                            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                Mencari data RFID...
                            </div>
                        )}

                        {rfidUser && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                RFID cocok dengan user:{" "}
                                <strong>{rfidUser.name}</strong>
                            </div>
                        )}

                        {rfidError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {rfidError}
                            </div>
                        )}
                    </div>
                ) : (
                    <input type="hidden" name="rfid_uid" value="" />
                )}

                {showPlateInput ? (
                    <div className="space-y-2">
                        <div>
                            <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                                Plat Nomor
                            </label>
                            <input
                                name="license_plate"
                                value={licensePlate}
                                onChange={(event) => {
                                    setLicensePlate(
                                        formatLicensePlate(event.target.value),
                                    );
                                    setPlateSource("manual");
                                    setPlateError("");
                                    if (rfidUid.trim()) {
                                        setRfidUid("");
                                        setRfidUser(null);
                                        setRfidError("");
                                    }
                                }}
                                placeholder="Contoh: B 1018 PIA"
                                className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                                required
                            />
                        </div>
                        {plateError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {plateError}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <input
                            type="hidden"
                            name="license_plate"
                            value={licensePlate}
                        />
                        <div className="space-y-1">
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Plat Nomor (Otomatis)
                            </p>
                            <div className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white px-3 py-2.5 text-sm font-semibold uppercase">
                                {licensePlate || "-"}
                            </div>
                        </div>
                        {plateError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {plateError}
                            </div>
                        )}
                    </>
                )}

                <button
                    type="submit"
                    className="w-full rounded-xl bg-[#1E5EFF] px-4 py-2.5 text-white font-semibold hover:bg-[#194FD8] transition cursor-pointer"
                >
                    Proses Kendaraan Keluar
                </button>
            </form>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111633] p-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Transaksi Aktif
                    </h2>
                    {/* <input
                        value={activePlateSearch}
                        onChange={(event) =>
                            setActivePlateSearch(
                                formatLicensePlate(event.target.value),
                            )
                        }
                        placeholder="Cari plat: B 1234 XYZ"
                        className="w-full sm:w-64 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                    /> */}
                </div>
                <div className="space-y-2 max-h-72 overflow-auto pr-1">
                    {filteredActiveTransactions.length === 0 && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Tidak ada transaksi aktif.
                        </p>
                    )}
                    {filteredActiveTransactions.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedActiveTransaction(item)}
                            className="w-full text-left rounded-lg border border-slate-200 dark:border-white/10 p-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                        >
                            <p className="text-sm font-semibold text-slate-900 dark:text-white uppercase">
                                {item.vehicle?.license_plate}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {item.vehicle?.vehicle_type?.name || "-"} |{" "}
                                {item.parking_area?.name || "-"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Masuk:{" "}
                                {item.entry_time
                                    ? new Date(item.entry_time).toLocaleString(
                                          "id-ID",
                                      )
                                    : "-"}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {selectedActiveTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-2xl rounded-2xl border border-[#1E5EFF]/20 dark:border-white/10 bg-white dark:bg-[#111633] p-6 space-y-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Detail Kendaraan Aktif
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                    Preview foto kendaraan masuk dan data
                                    transaksi.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedActiveTransaction(null)
                                }
                                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                            >
                                Tutup
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden bg-slate-100 dark:bg-[#0B1026]">
                                {selectedActiveTransaction.entry_vehicle_photo_url ? (
                                    <img
                                        src={
                                            selectedActiveTransaction.entry_vehicle_photo_url
                                        }
                                        alt={`Foto ${selectedActiveTransaction.vehicle?.license_plate || "kendaraan"}`}
                                        className="h-64 w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-64 w-full flex items-center justify-center text-sm text-slate-500 dark:text-slate-400 px-4 text-center">
                                        Foto kendaraan masuk belum tersedia.
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-2">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Plat Nomor
                                </p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white uppercase">
                                    {selectedActiveTransaction.vehicle
                                        ?.license_plate || "-"}
                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Tipe Kendaraan
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                    {selectedActiveTransaction.vehicle
                                        ?.vehicle_type?.name || "-"}
                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Area Parkir
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                    {selectedActiveTransaction.parking_area
                                        ?.name || "-"}
                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    RFID Card ID
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                    {selectedActiveTransaction.rfid_card?.id
                                        ? `#${selectedActiveTransaction.rfid_card.id}`
                                        : "-"}
                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    Waktu Masuk
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                    {selectedActiveTransaction.entry_time
                                        ? new Date(
                                              selectedActiveTransaction.entry_time,
                                          ).toLocaleString("id-ID")
                                        : "-"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

StandbyOut.layout = (page) => <OfficerLayout children={page} />;
