import { Link, router, useForm, usePage } from "@inertiajs/react";
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

export default function StandbyIn({
    selectedParkingArea = null,
    scope = { parking_area_id: "" },
    entryVehicleTypes = [],
}) {
    const { flash, errors } = usePage().props;
    const [useRfid, setUseRfid] = useState(false);
    const [rfidUid, setRfidUid] = useState("");
    const [rfidUser, setRfidUser] = useState(null);
    const [rfidVehicles, setRfidVehicles] = useState([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState("");
    const [rfidError, setRfidError] = useState("");
    const [lookupLoading, setLookupLoading] = useState(false);
    const [showVisitorModal, setShowVisitorModal] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [cameraReady, setCameraReady] = useState(false);
    const [photoPreview, setPhotoPreview] = useState("");
    const [photoBlob, setPhotoBlob] = useState(null);
    const [photoError, setPhotoError] = useState("");
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const {
        data: visitorData,
        setData: setVisitorData,
        post: postVisitorVehicle,
        processing: visitorProcessing,
        errors: visitorErrors,
    } = useForm({
        license_plate: "",
        vehicle_type_id: "",
        next_action: "entry",
        parking_area_id: scope.parking_area_id || "",
    });

    const selectedVehicle = useMemo(
        () => rfidVehicles.find((item) => String(item.id) === String(selectedVehicleId)),
        [rfidVehicles, selectedVehicleId],
    );

    useEffect(() => {
        setVisitorData("parking_area_id", scope.parking_area_id || "");
    }, [scope.parking_area_id]);

    useEffect(() => {
        const payload = flash?.visitor_vehicle;
        if (!payload?.license_plate) {
            return;
        }

        setVisitorData("license_plate", formatLicensePlate(payload.license_plate));
        setVisitorData("vehicle_type_id", "");
        setVisitorData("next_action", payload.next_action || "entry");
        setVisitorData("parking_area_id", payload.parking_area_id || scope.parking_area_id || "");
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
                setCameraError("Izin kamera ditolak atau kamera tidak tersedia.");
            }
        };

        startCamera();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const capturePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || !cameraReady) {
            setPhotoError("Kamera belum siap.");
            return;
        }

        const width = video.videoWidth || 1280;
        const height = video.videoHeight || 720;
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
            setPhotoError("Gagal memproses gambar kamera.");
            return;
        }

        context.drawImage(video, 0, 0, width, height);
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    setPhotoError("Gagal mengambil foto kendaraan.");
                    return;
                }

                setPhotoBlob(blob);
                setPhotoPreview(canvas.toDataURL("image/jpeg", 0.92));
                setPhotoError("");
            },
            "image/jpeg",
            0.92,
        );
    };

    const resetPhoto = () => {
        setPhotoBlob(null);
        setPhotoPreview("");
        setPhotoError("");

        if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => {});
        }
    };

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

        if (!photoBlob) {
            setPhotoError("Ambil foto kendaraan terlebih dahulu.");
            return;
        }

        router.post(
            route("officer.transactions.store"),
            {
                action: "entry",
                license_plate: String(licensePlate || ""),
                parking_area_id: String(scope.parking_area_id || ""),
                vehicle_photo: new File([photoBlob], `entry-${Date.now()}.jpg`, {
                    type: "image/jpeg",
                }),
            },
            { forceFormData: true },
        );
    };

    const submitVisitorVehicle = (event) => {
        event.preventDefault();

        postVisitorVehicle(route("officer.visitor-vehicles.store"), {
            preserveScroll: true,
            onSuccess: () => setShowVisitorModal(false),
        });
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Standby IN</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        Mode cepat untuk transaksi kendaraan masuk.
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

            {(errors.license_plate || errors.parking_area_id || errors.action) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {errors.license_plate || errors.parking_area_id || errors.action}
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
                            placeholder="Contoh: AD 45 ID"
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

                <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Area Parkir</label>
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
                        <div className="flex items-center gap-2">
                            {!photoPreview ? (
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="rounded-xl bg-slate-900 dark:bg-slate-700 px-4 py-2 text-sm text-white font-medium hover:bg-slate-800 dark:hover:bg-slate-600 cursor-pointer"
                                >
                                    Capture
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={resetPhoto}
                                    className="rounded-xl border border-slate-300 dark:border-white/20 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                                >
                                    Ambil Ulang
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="relative rounded-xl border border-slate-300 dark:border-white/15 overflow-hidden bg-slate-100 dark:bg-[#0B1026]">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="h-64 w-full object-cover"
                        />
                        {!!photoPreview && (
                            <img
                                src={photoPreview}
                                alt="Preview kendaraan masuk"
                                className="absolute inset-0 h-64 w-full object-cover"
                            />
                        )}
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
                    className="w-full rounded-xl bg-[#1FD1A5] px-4 py-2.5 text-white font-semibold hover:bg-[#14A886] transition cursor-pointer"
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
                                    Lengkapi data kendaraan, lalu sistem akan lanjutkan transaksi masuk.
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

                        <form onSubmit={submitVisitorVehicle} className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                                    Plat Nomor
                                </label>
                                <input
                                    value={visitorData.license_plate}
                                    onChange={(event) =>
                                        setVisitorData("license_plate", formatLicensePlate(event.target.value))
                                    }
                                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                                    required
                                />
                                {visitorErrors.license_plate && (
                                    <p className="mt-1 text-sm text-red-600">{visitorErrors.license_plate}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                                    Tipe Kendaraan
                                </label>
                                <select
                                    value={visitorData.vehicle_type_id}
                                    onChange={(event) => setVisitorData("vehicle_type_id", event.target.value)}
                                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                                    required
                                >
                                    <option value="">Pilih tipe kendaraan</option>
                                    {entryVehicleTypes.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                                {visitorErrors.vehicle_type_id && (
                                    <p className="mt-1 text-sm text-red-600">{visitorErrors.vehicle_type_id}</p>
                                )}
                                {entryVehicleTypes.length === 0 && (
                                    <p className="mt-1 text-sm text-red-600">
                                        Belum ada tipe kendaraan yang punya tarif di area ini.
                                    </p>
                                )}
                            </div>

                            <input type="hidden" name="next_action" value={visitorData.next_action} />
                            <input type="hidden" name="parking_area_id" value={visitorData.parking_area_id} />

                            <button
                                type="submit"
                                disabled={visitorProcessing || entryVehicleTypes.length === 0}
                                className="w-full rounded-xl bg-[#1E5EFF] px-4 py-2.5 font-semibold text-white hover:bg-[#194FD8] transition disabled:opacity-60 cursor-pointer"
                            >
                                {visitorProcessing ? "Menyimpan..." : "Simpan & Lanjutkan Masuk"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

StandbyIn.layout = (page) => <OfficerLayout children={page} />;
