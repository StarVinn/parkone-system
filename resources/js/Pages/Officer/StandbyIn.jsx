import { Link, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
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

export default function StandbyIn({
    selectedParkingArea = null,
    scope = { parking_area_id: "" },
    entryVehicleTypes = [],
    readiness = { entry_ready: false, entry_blockers: [] },
}) {
    const { flash, errors } = usePage().props;
    const [rfidUid, setRfidUid] = useState("");
    const [rfidUser, setRfidUser] = useState(null);
    const [rfidVehicle, setRfidVehicle] = useState(null);
    const [rfidError, setRfidError] = useState("");
    const [lookupLoading, setLookupLoading] = useState(false);
    const [licensePlate, setLicensePlate] = useState("");
    const [showVisitorModal, setShowVisitorModal] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [cameraReady, setCameraReady] = useState(false);
    const [photoError, setPhotoError] = useState("");
    const entryReady = Boolean(readiness?.entry_ready);
    const entryBlockers = Array.isArray(readiness?.entry_blockers)
        ? readiness.entry_blockers
        : [];
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const latestLookupRef = useRef(0);
    const {
        data: visitorData,
        setData: setVisitorData,
        transform: transformVisitorData,
        post: postVisitorVehicle,
        processing: visitorProcessing,
        errors: visitorErrors,
    } = useForm({
        license_plate: "",
        vehicle_type_id: "",
        next_action: "entry",
        parking_area_id: scope.parking_area_id || "",
        rfid_uid: "",
        vehicle_photo: null,
    });

    useEffect(() => {
        setVisitorData("parking_area_id", scope.parking_area_id || "");
    }, [scope.parking_area_id]);

    useEffect(() => {
        const payload = flash?.visitor_vehicle;
        if (!payload?.license_plate) {
            return;
        }

        setVisitorData(
            "license_plate",
            formatLicensePlate(payload.license_plate),
        );
        setVisitorData("vehicle_type_id", "");
        setVisitorData("next_action", payload.next_action || "entry");
        setVisitorData(
            "parking_area_id",
            payload.parking_area_id || scope.parking_area_id || "",
        );
        setVisitorData("rfid_uid", payload.rfid_uid || "");
        setVisitorData(
            "license_plate",
            formatLicensePlate(
                payload.license_plate || payload.vehicle?.license_plate || "",
            ),
        );
        setShowVisitorModal(true);
    }, [flash?.visitor_vehicle]);

    useEffect(() => {
        const startCamera = async () => {
            if (!navigator?.mediaDevices?.getUserMedia) {
                setCameraError("Browser tidak mendukung akses kamera.");
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                setCameraReady(true);
                setCameraError("");
            } catch {
                setCameraReady(false);
                setCameraError(
                    "Izin kamera ditolak atau kamera tidak tersedia.",
                );
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const capturePhotoBlob = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        return new Promise((resolve) => {
            if (!video || !canvas || !cameraReady) {
                resolve(null);
                return;
            }

            const width = video.videoWidth || 1280;
            const height = video.videoHeight || 720;
            canvas.width = width;
            canvas.height = height;

            const context = canvas.getContext("2d");
            if (!context) {
                resolve(null);
                return;
            }

            context.drawImage(video, 0, 0, width, height);
            canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
        });
    };

    const submit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const normalizedLicensePlate = formatLicensePlate(
            formData.get("license_plate"),
        );

        if (rfidVehicle?.license_plate) {
            const boundPlate = formatLicensePlate(rfidVehicle.license_plate);
            if (boundPlate && normalizedLicensePlate && boundPlate !== normalizedLicensePlate) {
                setRfidError("RFID ini terikat ke kendaraan lain.");
                return;
            }
        }

        if (rfidUid.trim() && !rfidUser) {
            setRfidError("RFID belum terverifikasi.");
            return;
        }
        if (!entryReady) {
            setPhotoError(
                entryBlockers[0] || "Area belum siap untuk transaksi masuk.",
            );
            return;
        }

        const photoBlob = await capturePhotoBlob();
        if (!photoBlob) {
            setPhotoError("Kamera belum siap, tunggu sebentar lalu coba lagi.");
            return;
        }
        setPhotoError("");

        router.post(
            route("officer.transactions.store"),
            {
                action: "entry",
                license_plate: String(normalizedLicensePlate || ""),
                parking_area_id: String(scope.parking_area_id || ""),
                rfid_uid: String(rfidUid || "").trim(),
                vehicle_photo: new File(
                    [photoBlob],
                    `entry-${Date.now()}.jpg`,
                    {
                        type: "image/jpeg",
                    },
                ),
            },
            { forceFormData: true },
        );
    };

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
                setLicensePlate(formatLicensePlate(payload.vehicle.license_plate));
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

    const submitVisitorVehicle = async (event) => {
        event.preventDefault();

        const photoBlob = await capturePhotoBlob();
        if (!photoBlob) {
            setPhotoError("Kamera belum siap, tunggu sebentar lalu coba lagi.");
            return;
        }
        setPhotoError("");
        const visitorPhotoFile = new File(
            [photoBlob],
            `entry-visitor-${Date.now()}.jpg`,
            {
                type: "image/jpeg",
            },
        );

        transformVisitorData((data) => ({
            ...data,
            vehicle_photo: visitorPhotoFile,
        }));

        postVisitorVehicle(route("officer.visitor-vehicles.store"), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => setShowVisitorModal(false),
            onFinish: () => {
                transformVisitorData((data) => data);
                setVisitorData("vehicle_photo", null);
            },
        });
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Standby IN
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Mode cepat untuk transaksi kendaraan masuk.
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

            {(errors.license_plate ||
                errors.parking_area_id ||
                errors.action ||
                errors.rfid_uid) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errors.license_plate ||
                        errors.parking_area_id ||
                        errors.action ||
                        errors.rfid_uid}
                </div>
            )}
            {!entryReady && entryBlockers.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <p className="font-semibold mb-1">
                        Transaksi masuk belum bisa diproses.
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        {entryBlockers.map((item, index) => (
                            <li key={`standbyin-blocker-${index}`}>{item}</li>
                        ))}
                    </ul>
                </div>
            )}

            <form
                onSubmit={submit}
                className="rounded-2xl border border-[#1E5EFF]/20 dark:border-white/10 bg-white dark:bg-[#111633] p-6 space-y-4"
            >
                <div className="space-y-3">
                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                            RFID UID (Opsional)
                        </label>
                        <input
                            value={rfidUid}
                            onChange={(event) => setRfidUid(event.target.value)}
                            placeholder="Scan / input RFID UID (boleh kosong)"
                            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                        />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Jika diisi, RFID diverifikasi otomatis. Jika kosong,
                        transaksi tetap diproses pakai plat.
                    </p>
                    {rfidVehicle?.license_plate && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                            RFID terhubung ke kendaraan dengan plat {formatLicensePlate(rfidVehicle.license_plate)}.
                        </p>
                    )}
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

                <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                        Plat Nomor
                    </label>
                    <input
                        name="license_plate"
                        value={licensePlate}
                        onInput={(event) => {
                            const normalized = formatLicensePlate(event.target.value);
                            event.target.value = normalized;
                            setLicensePlate(normalized);
                        }}
                        onChange={(event) => {
                            setLicensePlate(formatLicensePlate(event.target.value));
                        }}
                        placeholder="Contoh: AD 45 ID"
                        className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                        Area Parkir
                    </label>
                    <input
                        value={
                            selectedParkingArea
                                ? `${selectedParkingArea.name} (${selectedParkingArea.occupied}/${selectedParkingArea.capacity})`
                                : "-"
                        }
                        disabled
                        className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/10 px-3 py-2.5 text-slate-700 dark:text-slate-200"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Area ditentukan dari dashboard officer.
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm text-slate-600 dark:text-slate-300">
                            Foto Kendaraan Masuk
                        </label>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            Otomatis capture saat proses masuk
                        </span>
                    </div>

                    <div className="relative rounded-xl border border-slate-300 dark:border-white/15 overflow-hidden bg-slate-100 dark:bg-[#0B1026]">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="h-64 w-full object-cover"
                        />
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {cameraError && (
                        <p className="text-sm text-red-600">{cameraError}</p>
                    )}
                    {photoError && (
                        <p className="text-sm text-red-600">{photoError}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!entryReady}
                    className="w-full rounded-xl bg-[#1FD1A5] px-4 py-2.5 text-white font-semibold hover:bg-[#14A886] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    Proses Kendaraan Masuk
                </button>
            </form>

            {showVisitorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-xl rounded-2xl border border-[#1E5EFF]/20 dark:border-white/10 bg-white dark:bg-[#111633] p-6 space-y-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Kendaraan Belum Terdaftar
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                    Lengkapi data kendaraan, lalu sistem akan
                                    lanjutkan transaksi masuk.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowVisitorModal(false)}
                                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                            >
                                Tutup
                            </button>
                        </div>

                        <form
                            onSubmit={submitVisitorVehicle}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                                    Plat Nomor
                                </label>
                                <input
                                    value={visitorData.license_plate}
                                    onChange={(event) =>
                                        setVisitorData(
                                            "license_plate",
                                            formatLicensePlate(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                                    required
                                />
                                {visitorErrors.license_plate && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {visitorErrors.license_plate}
                                    </p>
                                )}
                            </div>

                            {visitorData.rfid_uid && (
                                <div>
                                    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                                        RFID UID (Dari Form Sebelumnya)
                                    </label>
                                    <input
                                        value={visitorData.rfid_uid}
                                        disabled
                                        className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-white/10 px-3 py-2.5 text-slate-700 dark:text-slate-200"
                                    />
                                    {visitorErrors.rfid_uid && (
                                        <p className="mt-1 text-sm text-red-600">
                                            {visitorErrors.rfid_uid}
                                        </p>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                                    Tipe Kendaraan
                                </label>
                                <select
                                    value={visitorData.vehicle_type_id}
                                    onChange={(event) =>
                                        setVisitorData(
                                            "vehicle_type_id",
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                                    required
                                >
                                    <option value="">
                                        Pilih tipe kendaraan
                                    </option>
                                    {entryVehicleTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                                {visitorErrors.vehicle_type_id && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {visitorErrors.vehicle_type_id}
                                    </p>
                                )}
                                {entryVehicleTypes.length === 0 && (
                                    <p className="mt-1 text-sm text-red-600">
                                        Belum ada tipe kendaraan yang punya
                                        tarif di area ini.
                                    </p>
                                )}
                            </div>

                            <input
                                type="hidden"
                                name="next_action"
                                value={visitorData.next_action}
                            />
                            <input
                                type="hidden"
                                name="parking_area_id"
                                value={visitorData.parking_area_id}
                            />
                            <input
                                type="hidden"
                                name="rfid_uid"
                                value={visitorData.rfid_uid}
                            />

                            <button
                                type="submit"
                                disabled={
                                    visitorProcessing ||
                                    entryVehicleTypes.length === 0
                                }
                                className="w-full rounded-xl bg-[#1E5EFF] px-4 py-2.5 font-semibold text-white hover:bg-[#194FD8] transition disabled:opacity-60 cursor-pointer"
                            >
                                {visitorProcessing
                                    ? "Menyimpan..."
                                    : "Simpan & Lanjutkan Masuk"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

StandbyIn.layout = (page) => <OfficerLayout children={page} />;
