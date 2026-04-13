import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
import OfficerLayout from "../Layouts/OfficerLayout";
import useI18n from "../../hooks/useI18n";

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
    scope = { location_id: "", parking_area_id: "" },
    initialRfidUid = "",
}) {
    const { flash, errors } = usePage().props;
    const { locale, t } = useI18n();
    const tr = (key, id, en) => t(key, locale === "id" ? id : en);
    const [licensePlate, setLicensePlate] = useState("");
    const [plateSource, setPlateSource] = useState("none");
    const [plateError, setPlateError] = useState("");
    const [rfidUid, setRfidUid] = useState(() =>
        String(initialRfidUid || "").trim(),
    );
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
                setRfidError(
                    payload.message ||
                        tr(
                            "officer.common.rfid_not_found",
                            "RFID tidak ditemukan.",
                            "RFID not found.",
                        ),
                );
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
            setRfidError(
                t(
                    "officer.common.rfid_lookup_failed",
                    locale === "id"
                        ? "Gagal melakukan lookup RFID."
                        : "Failed to lookup RFID.",
                ),
            );
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
            setPlateError(
                tr(
                    "officer.common.license_plate_required",
                    "Plat nomor wajib diisi.",
                    "License plate is required.",
                ),
            );
            return;
        }

        if (rfidUid.trim() && !rfidUser) {
            setRfidError(
                tr(
                    "officer.common.rfid_not_verified",
                    "RFID belum terverifikasi.",
                    "RFID is not verified yet.",
                ),
            );
            return;
        }

        router.post(route("officer.transactions.store"), {
            action: "exit",
            license_plate: normalizedPlate,
            checkout_mode: String(rfidUid || "").trim() ? "rfid" : "ticket",
            rfid_uid: String(rfidUid || "").trim(),
            source: "standby_out",
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
                        {tr(
                            "officer.standby_out.title",
                            "Standby OUT",
                            "Standby OUT",
                        )}
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {tr(
                            "Mode cepat untuk transaksi kendaraan keluar.",
                            "Fast mode for vehicle exit transactions.",
                        )}
                    </p>
                    <Link
                        href={route("officer.rfid.scan", {
                            location_id: scope.location_id,
                            parking_area_id: scope.parking_area_id,
                        })}
                        className="mt-2 inline-flex text-sm font-semibold text-[#1E5EFF] hover:underline"
                    >
                        Buka label scan RFID
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {tr(
                            "officer.dashboard.active_area",
                            "Area aktif:",
                            "Active area:",
                        )}{" "}
                        <strong>{selectedParkingArea?.name || "-"}</strong>
                    </p>
                </div>
                <Link
                    href="/officer"
                    className="text-sm text-[#1E5EFF] hover:underline"
                >
                    {tr(
                        "officer.common.back_dashboard",
                        "Kembali ke Dashboard",
                        "Back to Dashboard",
                    )}
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
                                {tr(
                                    "officer.common.rfid_optional",
                                    "RFID UID (Opsional)",
                                    "RFID UID (Optional)",
                                )}
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
                                placeholder={tr(
                                    "officer.common.rfid_placeholder",
                                    "Scan / input RFID UID (boleh kosong)",
                                    "Scan / input RFID UID (optional)",
                                )}
                                className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tr(
                                "Jika transaksi masuk memakai RFID, saat keluar RFID yang sama harus diinput.",
                                "If entry used RFID, the same RFID must be provided on exit.",
                            )}
                        </p>
                        {lookupLoading && (
                            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                {tr(
                                    "Mencari data RFID...",
                                    "Searching RFID data...",
                                )}
                            </div>
                        )}

                        {rfidUser && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                                {tr(
                                    "RFID cocok dengan user:",
                                    "RFID matched with user:",
                                )}{" "}
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
                                {tr(
                                    "officer.common.license_plate",
                                    "Plat Nomor",
                                    "License Plate",
                                )}
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
                                placeholder={tr(
                                    "Contoh: B 1018 PIA",
                                    "Example: B 1018 PIA",
                                )}
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
                                {tr(
                                    "officer.common.plate_auto",
                                    "Plat Nomor (Otomatis)",
                                    "License Plate (Auto)",
                                )}
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
                    {tr(
                        "officer.standby_out.process_exit",
                        "Proses Kendaraan Keluar",
                        "Process Vehicle Exit",
                    )}
                </button>
            </form>

            <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111633] p-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {tr(
                            "officer.common.active_transactions",
                            "Transaksi Aktif",
                            "Active Transactions",
                        )}
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
                            {tr(
                                "officer.common.no_active_transactions",
                                "Tidak ada transaksi aktif.",
                                "No active transactions.",
                            )}
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
                                {tr(
                                    "officer.common.entry_colon",
                                    "Masuk:",
                                    "Entry:",
                                )}{" "}
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
                                    {tr(
                                        "officer.standby_out.active_vehicle_detail",
                                        "Detail Kendaraan Aktif",
                                        "Active Vehicle Detail",
                                    )}
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                    {tr(
                                        "Preview foto kendaraan masuk dan data transaksi.",
                                        "Preview entry vehicle photo and transaction data.",
                                    )}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedActiveTransaction(null)
                                }
                                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                            >
                                {tr("officer.common.close", "Tutup", "Close")}
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
                                        {tr(
                                            "Foto kendaraan masuk belum tersedia.",
                                            "Entry vehicle photo is not available yet.",
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="rounded-xl border border-slate-200 dark:border-white/10 p-4 space-y-2">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {tr(
                                        "officer.common.license_plate",
                                        "Plat Nomor",
                                        "License Plate",
                                    )}
                                </p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white uppercase">
                                    {selectedActiveTransaction.vehicle
                                        ?.license_plate || "-"}
                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    {tr(
                                        "officer.common.vehicle_type",
                                        "Tipe Kendaraan",
                                        "Vehicle Type",
                                    )}
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                    {selectedActiveTransaction.vehicle
                                        ?.vehicle_type?.name || "-"}
                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    {tr(
                                        "officer.common.parking_area",
                                        "Area Parkir",
                                        "Parking Area",
                                    )}
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                    {selectedActiveTransaction.parking_area
                                        ?.name || "-"}
                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    {tr(
                                        "officer.common.rfid_card_id",
                                        "RFID Card ID",
                                        "RFID Card ID",
                                    )}
                                </p>
                                <p className="text-sm text-slate-800 dark:text-slate-200">
                                    {selectedActiveTransaction.rfid_card?.id
                                        ? `#${selectedActiveTransaction.rfid_card.id}`
                                        : "-"}
                                </p>

                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    {tr(
                                        "officer.common.entry_time",
                                        "Waktu Masuk",
                                        "Entry Time",
                                    )}
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
