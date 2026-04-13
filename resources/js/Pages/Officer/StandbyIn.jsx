import { Link, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
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

const extractLicensePlateFromText = (value) => {
    const text = String(value || "").toUpperCase();
    const compact = text.replace(/[^A-Z0-9]/g, " ");
    const tokens = compact.split(/\s+/).filter(Boolean);

    for (let i = 0; i < tokens.length; i += 1) {
        const first = tokens[i] || "";
        const second = tokens[i + 1] || "";
        const third = tokens[i + 2] || "";

        const candidate = `${first}${second}${third}`;
        const normalized = formatLicensePlate(candidate);
        if (
            normalized &&
            /^[A-Z]{1,2}\s[0-9]{1,4}(\s[A-Z]{1,3})?$/.test(normalized)
        ) {
            return normalized;
        }
    }

    const fallback = formatLicensePlate(compact.replace(/\s+/g, ""));
    if (fallback && /^[A-Z]{1,2}\s[0-9]{1,4}(\s[A-Z]{1,3})?$/.test(fallback)) {
        return fallback;
    }

    return "";
};

export default function StandbyIn({
    selectedParkingArea = null,
    scope = { parking_area_id: "" },
    entryVehicleTypes = [],
    readiness = { entry_ready: false, entry_blockers: [] },
}) {
    const { flash, errors } = usePage().props;
    const { locale, t } = useI18n();
    const tr = (key, id, en) => t(key, locale === "id" ? id : en);
    const [rfidUid, setRfidUid] = useState("");
    const [rfidUser, setRfidUser] = useState(null);
    const [rfidVehicle, setRfidVehicle] = useState(null);
    const [rfidError, setRfidError] = useState("");
    const [lookupLoading, setLookupLoading] = useState(false);
    const [licensePlate, setLicensePlate] = useState("");
    const [showVisitorModal, setShowVisitorModal] = useState(false);
    const [cameraError, setCameraError] = useState("");
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraDevices, setCameraDevices] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState("");
    const [photoError, setPhotoError] = useState("");
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrError, setOcrError] = useState("");
    const [ocrResult, setOcrResult] = useState("");
    const [plateSource, setPlateSource] = useState("none");
    const hasRfidInput = String(rfidUid || "").trim() !== "";
    const hasPlateInput = String(licensePlate || "").trim() !== "";
    const hideRfidInput =
        hasPlateInput && (plateSource === "manual" || plateSource === "ocr");
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
        let active = true;

        const stopStream = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };

        const loadCameraDevices = async () => {
            if (!navigator?.mediaDevices?.enumerateDevices) {
                setCameraDevices([]);
                return;
            }

            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                if (!active) return;
                const videoInputs = devices.filter(
                    (device) => device.kind === "videoinput",
                );
                setCameraDevices(videoInputs);
            } catch {
                if (!active) return;
                setCameraDevices([]);
            }
        };

        const startCamera = async () => {
            if (!navigator?.mediaDevices?.getUserMedia) {
                setCameraError(
                    tr(
                        "Browser tidak mendukung akses kamera.",
                        "Browser does not support camera access.",
                    ),
                );
                return;
            }

            stopStream();
            setCameraReady(false);

            try {
                let stream;
                if (selectedCameraId) {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            deviceId: { exact: selectedCameraId },
                        },
                        audio: false,
                    });
                } else {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: { facingMode: { ideal: "environment" } },
                        audio: false,
                    });
                }

                if (!active) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                await loadCameraDevices();

                const currentTrackDeviceId =
                    stream.getVideoTracks()?.[0]?.getSettings?.()?.deviceId ||
                    "";
                if (!selectedCameraId && currentTrackDeviceId && active) {
                    setSelectedCameraId(currentTrackDeviceId);
                }

                setCameraReady(true);
                setCameraError("");
            } catch {
                if (!active) return;
                setCameraReady(false);
                setCameraError(
                    tr(
                        "Izin kamera ditolak atau kamera tidak tersedia.",
                        "Camera permission denied or camera is unavailable.",
                    ),
                );
            }
        };

        startCamera();

        return () => {
            active = false;
            stopStream();
        };
    }, [selectedCameraId]);

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
            hasRfidInput ? licensePlate : formData.get("license_plate"),
        );

        if (rfidVehicle?.license_plate) {
            const boundPlate = formatLicensePlate(rfidVehicle.license_plate);
            if (
                boundPlate &&
                normalizedLicensePlate &&
                boundPlate !== normalizedLicensePlate
            ) {
                setRfidError(
                    t(
                        "officer.common.rfid_bound_other_vehicle",
                        locale === "id"
                            ? "RFID ini terikat ke kendaraan lain."
                            : "This RFID is bound to another vehicle.",
                    ),
                );
                return;
            }
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
        if (!normalizedLicensePlate) {
            setPhotoError(
                tr(
                    "officer.common.license_plate_required",
                    "Plat nomor wajib diisi.",
                    "License plate is required.",
                ),
            );
            return;
        }
        if (!entryReady) {
            setPhotoError(
                entryBlockers[0] ||
                    tr(
                        "Area belum siap untuk transaksi masuk.",
                        "Area is not ready for entry transaction.",
                    ),
            );
            return;
        }

        const photoBlob = await capturePhotoBlob();
        if (!photoBlob) {
            setPhotoError(
                tr(
                    "Kamera belum siap, tunggu sebentar lalu coba lagi.",
                    "Camera is not ready yet, please wait and try again.",
                ),
            );
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

    const handleDetectLicensePlate = async () => {
        setOcrError("");
        setOcrResult("");

        const photoBlob = await capturePhotoBlob();
        if (!photoBlob) {
            setOcrError(
                tr(
                    "Kamera belum siap, tunggu sebentar lalu coba lagi.",
                    "Camera is not ready yet, please wait and try again.",
                ),
            );
            return;
        }

        setOcrLoading(true);
        let worker = null;
        try {
            const { createWorker } = await import("tesseract.js");
            worker = await createWorker("eng");
            const {
                data: { text },
            } = await worker.recognize(photoBlob);

            const detectedPlate = extractLicensePlateFromText(text);
            if (!detectedPlate) {
                setOcrError(
                    tr(
                        "Plat nomor belum terbaca jelas. Coba dekatkan kamera atau ulangi scan.",
                        "License plate is not clearly readable yet. Try moving the camera closer or scan again.",
                    ),
                );
                return;
            }

            setLicensePlate(detectedPlate);
            setPlateSource("ocr");
            setOcrResult(detectedPlate);
        } catch {
            setOcrError(
                tr(
                    "Gagal memproses OCR kamera.",
                    "Failed to process camera OCR.",
                ),
            );
        } finally {
            if (worker) {
                await worker.terminate();
            }
            setOcrLoading(false);
        }
    };

    const handleLookupRfid = async (uid) => {
        const normalizedUid = String(uid || "").trim();
        if (!normalizedUid) {
            setLookupLoading(false);
            setRfidError("");
            setRfidUser(null);
            setRfidVehicle(null);
            if (plateSource === "rfid") {
                setLicensePlate("");
                setPlateSource("none");
            }
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

    const submitVisitorVehicle = async (event) => {
        event.preventDefault();

        const photoBlob = await capturePhotoBlob();
        if (!photoBlob) {
            setPhotoError(
                tr(
                    "Kamera belum siap, tunggu sebentar lalu coba lagi.",
                    "Camera is not ready yet, please wait and try again.",
                ),
            );
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
                        {tr(
                            "officer.standby_in.title",
                            "Standby IN",
                            "Standby IN",
                        )}
                    </h1>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {tr(
                            "officer.standby_in.subtitle",
                            "Mode cepat untuk transaksi kendaraan masuk.",
                            "Fast mode for vehicle entry transactions.",
                        )}
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
                        {tr(
                            "Transaksi masuk belum bisa diproses.",
                            "Entry transaction cannot be processed yet.",
                        )}
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
                {!hideRfidInput && (
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
                                onChange={(event) =>
                                    setRfidUid(event.target.value)
                                }
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
                                "Jika diisi, RFID diverifikasi otomatis. Jika kosong, transaksi tetap diproses pakai plat.",
                                "If filled, RFID is verified automatically. If empty, transaction still proceeds using plate.",
                            )}
                        </p>
                        {rfidVehicle?.license_plate && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                {tr(
                                    "RFID terhubung ke kendaraan dengan plat",
                                    "RFID linked to vehicle plate",
                                )}{" "}
                                {formatLicensePlate(rfidVehicle.license_plate)}.
                            </p>
                        )}
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
                )}

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
                        disabled={hasRfidInput}
                        onInput={(event) => {
                            const normalized = formatLicensePlate(
                                event.target.value,
                            );
                            event.target.value = normalized;
                            setLicensePlate(normalized);
                            setPlateSource(normalized ? "manual" : "none");
                        }}
                        onChange={(event) => {
                            const normalized = formatLicensePlate(
                                event.target.value,
                            );
                            setLicensePlate(normalized);
                            setPlateSource(normalized ? "manual" : "none");
                        }}
                        placeholder={tr(
                            "officer.common.example_plate_ad",
                            "Contoh: AD 45 ID",
                            "Example: AD 45 ID",
                        )}
                        className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30 disabled:bg-slate-100 disabled:text-slate-500 dark:disabled:bg-white/10 dark:disabled:text-slate-400 disabled:cursor-not-allowed"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                        {tr(
                            "officer.common.parking_area",
                            "Area Parkir",
                            "Parking Area",
                        )}
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
                        {tr(
                            "Area ditentukan dari dashboard officer.",
                            "Area is set from officer dashboard.",
                        )}
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm text-slate-600 dark:text-slate-300">
                            {tr(
                                "officer.standby_in.entry_vehicle_photo",
                                "Foto Kendaraan Masuk",
                                "Entry Vehicle Photo",
                            )}
                        </label>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {tr(
                                "Otomatis capture saat proses masuk",
                                "Auto capture during entry process",
                            )}
                        </span>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                            {tr(
                                "officer.standby_in.camera_device",
                                "Perangkat Kamera",
                                "Camera Device",
                            )}
                        </label>
                        <select
                            value={selectedCameraId}
                            onChange={(event) =>
                                setSelectedCameraId(event.target.value)
                            }
                            className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                            disabled={cameraDevices.length === 0}
                        >
                            {cameraDevices.length === 0 && (
                                <option value="">
                                    {tr(
                                        "officer.standby_in.no_camera_detected",
                                        "Kamera belum terdeteksi",
                                        "No camera detected",
                                    )}
                                </option>
                            )}
                            {cameraDevices.map((device, index) => (
                                <option
                                    key={device.deviceId || `camera-${index}`}
                                    value={device.deviceId}
                                >
                                    {device.label ||
                                        (locale === "id"
                                            ? `Kamera ${index + 1}`
                                            : `Camera ${index + 1}`)}
                                </option>
                            ))}
                        </select>
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

                    {!hasRfidInput && (
                        <button
                            type="button"
                            onClick={handleDetectLicensePlate}
                            disabled={!cameraReady || ocrLoading}
                            className="w-full rounded-xl border border-[#1E5EFF]/30 bg-[#1E5EFF]/10 px-4 py-2.5 text-sm font-semibold text-[#1E5EFF] hover:bg-[#1E5EFF]/15 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {ocrLoading
                                ? tr("Memproses OCR...", "Processing OCR...")
                                : tr(
                                      "Deteksi Plat Otomatis",
                                      "Auto Detect License Plate",
                                  )}
                        </button>
                    )}

                    {cameraError && (
                        <p className="text-sm text-red-600">{cameraError}</p>
                    )}
                    {photoError && (
                        <p className="text-sm text-red-600">{photoError}</p>
                    )}
                    {ocrError && (
                        <p className="text-sm text-red-600">{ocrError}</p>
                    )}
                    {ocrResult && (
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">
                            {tr("Plat terdeteksi:", "Detected plate:")}{" "}
                            <span className="font-semibold">{ocrResult}</span>
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={!entryReady}
                    className="w-full rounded-xl bg-[#1FD1A5] px-4 py-2.5 text-white font-semibold hover:bg-[#14A886] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {tr(
                        "officer.standby_in.process_entry",
                        "Proses Kendaraan Masuk",
                        "Process Vehicle Entry",
                    )}
                </button>
            </form>

            {showVisitorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-xl rounded-2xl border border-[#1E5EFF]/20 dark:border-white/10 bg-white dark:bg-[#111633] p-6 space-y-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                    {tr(
                                        "officer.standby_in.unregistered_vehicle",
                                        "Kendaraan Belum Terdaftar",
                                        "Vehicle Not Registered",
                                    )}
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                    {tr(
                                        "Lengkapi data kendaraan, lalu sistem akan lanjutkan transaksi masuk.",
                                        "Complete vehicle data, then the system will continue entry transaction.",
                                    )}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowVisitorModal(false)}
                                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                            >
                                {tr("officer.common.close", "Tutup", "Close")}
                            </button>
                        </div>

                        <form
                            onSubmit={submitVisitorVehicle}
                            className="space-y-4"
                        >
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                                    {tr(
                                        "officer.common.license_plate",
                                        "Plat Nomor",
                                        "License Plate",
                                    )}
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
                                        {tr(
                                            "RFID UID (Dari Form Sebelumnya)",
                                            "RFID UID (From Previous Form)",
                                        )}
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
                                    {tr(
                                        "officer.common.vehicle_type",
                                        "Tipe Kendaraan",
                                        "Vehicle Type",
                                    )}
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
                                        {tr(
                                            "officer.common.select_vehicle_type",
                                            "Pilih tipe kendaraan",
                                            "Select vehicle type",
                                        )}
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
                                        {tr(
                                            "Belum ada tipe kendaraan yang punya tarif di area ini.",
                                            "No vehicle types with rate are available in this area.",
                                        )}
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
                                    ? tr(
                                          "states.saving",
                                          "Menyimpan...",
                                          "Saving...",
                                      )
                                    : tr(
                                          "officer.standby_in.save_continue_entry",
                                          "Simpan & Lanjutkan Masuk",
                                          "Save & Continue Entry",
                                      )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

StandbyIn.layout = (page) => <OfficerLayout children={page} />;
