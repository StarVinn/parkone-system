import { Head, Link, router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import logo from "../../Assets/Images/logo-parkone.png";

export default function RfidScan({ selectedParkingArea = null, scope = {} }) {
    const EXIT_LOCK_SECONDS = 10;

    const inputRef = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const debounceRef = useRef(null);
    const exitRedirectRef = useRef(null);
    const latestLookupRef = useRef(0);
    const lastSubmittedUidRef = useRef("");

    const [rfidUid, setRfidUid] = useState("");
    const [cameraError, setCameraError] = useState("");
    const [cameraReady, setCameraReady] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState(
        "Arahkan kartu ke reader, hasil scan akan diproses otomatis.",
    );
    const [statusTone, setStatusTone] = useState("info");
    const [rfidError, setRfidError] = useState("");
    const [rfidUser, setRfidUser] = useState(null);
    const [rfidVehicle, setRfidVehicle] = useState(null);
    const [activeTransaction, setActiveTransaction] = useState(null);

    const availableCapacity = Math.max(
        Number(selectedParkingArea?.capacity || 0) -
            Number(selectedParkingArea?.occupied || 0),
        0,
    );

    const setStatus = (message, tone = "info") => {
        setStatusMessage(String(message || ""));
        setStatusTone(tone);
    };

    const getEntryElapsedSeconds = (transaction) => {
        const rawEntryTime = String(transaction?.entry_time || "").trim();
        if (!rawEntryTime) {
            return null;
        }

        const parsed = new Date(rawEntryTime.replace(" ", "T"));
        if (Number.isNaN(parsed.getTime())) {
            return null;
        }

        return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 1000));
    };

    const clearExitRedirect = () => {
        if (exitRedirectRef.current) {
            clearTimeout(exitRedirectRef.current);
            exitRedirectRef.current = null;
        }
    };

    const formatCurrency = (value) =>
        `Rp ${new Intl.NumberFormat("id-ID").format(Number(value || 0))}`;

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        let active = true;

        const stopStream = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };

        const startCamera = async () => {
            if (!navigator?.mediaDevices?.getUserMedia) {
                setCameraError("Browser tidak mendukung akses kamera.");
                return;
            }

            stopStream();
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: "environment" } },
                    audio: false,
                });

                if (!active) {
                    stream.getTracks().forEach((track) => track.stop());
                    return;
                }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }

                setCameraReady(true);
                setCameraError("");
            } catch {
                if (!active) return;
                setCameraReady(false);
                setCameraError(
                    "Izin kamera ditolak atau kamera tidak tersedia.",
                );
            }
        };

        startCamera();

        return () => {
            active = false;
            stopStream();
            clearExitRedirect();
        };
    }, []);

    const capturePhotoBlob = () => {
        const video = videoRef.current;
        const canvas = document.createElement("canvas");

        return new Promise((resolve) => {
            if (!video || !cameraReady) {
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

    const submitEntry = async (uid, vehicle) => {
        const normalizedUid = String(uid || "").trim();
        if (!normalizedUid || !vehicle?.license_plate) {
            return;
        }

        if (!selectedParkingArea?.id) {
            setStatus("Area parkir belum dipilih.", "warning");
            return;
        }

        if (lastSubmittedUidRef.current === normalizedUid) {
            return;
        }

        const photoBlob = await capturePhotoBlob();
        if (!photoBlob) {
            setStatus(
                "Kamera belum siap, tunggu sebentar lalu scan ulang.",
                "warning",
            );
            return;
        }

        lastSubmittedUidRef.current = normalizedUid;
        setSubmitting(true);
        setStatus(
            `RFID terbaca: ${normalizedUid}. Mengirim permintaan masuk...`,
            "info",
        );

        router.post(
            route("officer.transactions.store"),
            {
                action: "entry",
                license_plate: String(vehicle.license_plate || "").trim(),
                parking_area_id: String(scope.parking_area_id || ""),
                rfid_uid: normalizedUid,
                source: "rfid",
                vehicle_photo: new File(
                    [photoBlob],
                    `entry-${Date.now()}.jpg`,
                    {
                        type: "image/jpeg",
                    },
                ),
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onFinish: () => {
                    setSubmitting(false);
                },
                onSuccess: () => {
                    setStatus("Berhasil diproses.", "success");
                },
                onError: (errors) => {
                    const message =
                        errors?.rfid_uid ||
                        errors?.license_plate ||
                        errors?.parking_area_id ||
                        "Gagal memproses scan RFID.";
                    setStatus(String(message), "danger");
                    lastSubmittedUidRef.current = "";
                },
            },
        );
    };

    const submitExit = async (uid, vehicle) => {
        const normalizedUid = String(uid || "").trim();
        if (!normalizedUid || !vehicle?.license_plate) {
            return;
        }

        if (!selectedParkingArea?.id) {
            setStatus("Area parkir belum dipilih.", "warning");
            return;
        }

        if (lastSubmittedUidRef.current === normalizedUid) {
            return;
        }

        lastSubmittedUidRef.current = normalizedUid;
        setSubmitting(true);
        setStatus(
            `RFID terbaca: ${normalizedUid}. Mengirim permintaan keluar...`,
            "info",
        );

        router.post(
            route("officer.transactions.store"),
            {
                action: "exit",
                license_plate: String(vehicle.license_plate || "").trim(),
                parking_area_id: String(scope.parking_area_id || ""),
                rfid_uid: normalizedUid,
                checkout_mode: "rfid",
                source: "rfid",
            },
            {
                preserveScroll: true,
                onFinish: () => {
                    setSubmitting(false);
                },
                onSuccess: () => {
                    setStatus(
                        "Keluar diproses. Lanjut ke konfirmasi pembayaran.",
                        "success",
                    );
                },
                onError: (errors) => {
                    const message =
                        errors?.rfid_uid ||
                        errors?.license_plate ||
                        errors?.parking_area_id ||
                        "Gagal memproses scan RFID keluar.";
                    setStatus(String(message), "danger");
                    lastSubmittedUidRef.current = "";
                },
            },
        );
    };

    const handleLookupRfid = async (uid) => {
        const normalizedUid = String(uid || "").trim();
        if (!normalizedUid) {
            setLookupLoading(false);
            setRfidError("");
            setRfidUser(null);
            setRfidVehicle(null);
            setActiveTransaction(null);
            clearExitRedirect();
            lastSubmittedUidRef.current = "";
            setStatus(
                "Arahkan kartu ke reader, sistem akan pilih masuk atau keluar otomatis.",
                "info",
            );
            return;
        }

        const lookupId = latestLookupRef.current + 1;
        latestLookupRef.current = lookupId;
        setLookupLoading(true);
        setRfidError("");
        setRfidUser(null);
        setRfidVehicle(null);
        setActiveTransaction(null);
        clearExitRedirect();
        setStatus(`Membaca RFID ${normalizedUid}...`, "info");

        try {
            const url = `${route("officer.rfid.lookup")}?rfid_uid=${encodeURIComponent(normalizedUid)}&parking_area_id=${encodeURIComponent(String(scope.parking_area_id || ""))}`;
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
                setStatus(payload.message || "RFID tidak ditemukan.", "danger");
                setActiveTransaction(null);
                clearExitRedirect();
                lastSubmittedUidRef.current = "";
                return;
            }

            setRfidUser(payload.user || null);
            setRfidVehicle(payload.vehicle || null);

            if (!payload.vehicle?.license_plate) {
                setRfidError(
                    "RFID terdaftar, tetapi kendaraan belum di-assign.",
                );
                setStatus(
                    "RFID terdaftar, tetapi kendaraan belum di-assign.",
                    "warning",
                );
                setActiveTransaction(null);
                clearExitRedirect();
                lastSubmittedUidRef.current = "";
                return;
            }

            if (payload.active_transaction) {
                setActiveTransaction(payload.active_transaction);
                const elapsedSeconds = getEntryElapsedSeconds(
                    payload.active_transaction,
                );

                if (
                    elapsedSeconds !== null &&
                    elapsedSeconds < EXIT_LOCK_SECONDS
                ) {
                    const remainingSeconds = EXIT_LOCK_SECONDS - elapsedSeconds;
                    setRfidError(
                        `Kartu baru dipakai masuk. Tunggu ${remainingSeconds} detik sebelum scan keluar.`,
                    );
                    setStatus(
                        `Transaksi masuk masih baru. Coba scan keluar lagi dalam ${remainingSeconds} detik.`,
                        "warning",
                    );
                    clearExitRedirect();
                    lastSubmittedUidRef.current = "";
                    return;
                }

                setStatus(
                    "Transaksi aktif ditemukan. Lanjut ke konfirmasi pembayaran.",
                    "warning",
                );

                exitRedirectRef.current = setTimeout(() => {
                    submitExit(normalizedUid, payload.vehicle);
                }, 900);
            } else {
                setStatus(
                    `RFID cocok dengan ${payload.user?.name || "user"}. Menyiapkan proses masuk...`,
                    "success",
                );
                if (cameraReady) {
                    await submitEntry(normalizedUid, payload.vehicle);
                }
            }
        } catch {
            if (latestLookupRef.current !== lookupId) {
                return;
            }
            setRfidError("Gagal melakukan lookup RFID.");
            setStatus("Gagal melakukan lookup RFID.", "danger");
            setActiveTransaction(null);
            clearExitRedirect();
            lastSubmittedUidRef.current = "";
        } finally {
            if (latestLookupRef.current === lookupId) {
                setLookupLoading(false);
            }
        }
    };

    useEffect(() => {
        const normalizedUid = String(rfidUid || "").trim();

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!normalizedUid) {
            return undefined;
        }

        debounceRef.current = setTimeout(() => {
            handleLookupRfid(normalizedUid);
        }, 450);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [rfidUid, cameraReady]);

    return (
        <>
            <Head title="RFID Kiosk | PARKONE" />

            <div className="relative min-h-screen overflow-hidden bg-[#060A1A] px-4 py-4 sm:px-6 lg:px-8">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(30,94,255,0.34),transparent_42%),radial-gradient(circle_at_82%_16%,rgba(31,209,165,0.16),transparent_34%),linear-gradient(145deg,#061024_0%,#0A1636_55%,#11204A_100%)]" />
                </div>

                {/* <Link
                    href={route("officer.dashboard")}
                    className="absolute left-4 top-4 z-20 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
                >
                    Kembali
                </Link> */}

                <div
                    className="relative z-10 mx-auto flex min-h-[calc(100vh-2rem)] w-full items-stretch"
                    style={{ maxWidth: "1680px" }}
                >
                    <section
                        className="flex w-full flex-col overflow-hidden border border-white/10 bg-white/92 p-4 shadow-[0_24px_70px_rgba(2,8,23,0.38)] sm:p-5 xl:p-6"
                        style={{ borderRadius: "2rem" }}
                    >
                        <div className="flex flex-col gap-4 xl:flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <Link
                                    href={route("officer.dashboard")}
                                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Back
                                </Link>

                                <div className="flex items-center gap-4">
                                    <img
                                        src={logo}
                                        alt="PARKONE Logo"
                                        className="h-12 w-12 sm:h-14 sm:w-14"
                                    />
                                    <div>
                                        <h1 className="text-2xl font-extrabold tracking-wide text-[#1E5EFF] sm:text-3xl">
                                            RFID Kiosk
                                        </h1>
                                        <p className="text-sm text-slate-500 sm:text-base">
                                            Tap masuk jika belum aktif, tap
                                            keluar jika masih parkir.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                                    {cameraReady ? "Active" : "Starting"}
                                </div>
                            </div>

                            <div className="grid flex-1 gap-4 xl:grid-cols-[1.15fr_0.85fr] xl:gap-5">
                                <div className="flex flex-col gap-4">
                                    <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-100">
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="h-[42vh] w-full object-cover xl:h-[52vh]"
                                            style={{ minHeight: "280px" }}
                                        />
                                        <div
                                            className="absolute inset-0 pointer-events-none"
                                            style={{
                                                background:
                                                    "linear-gradient(to top, rgba(0,0,0,0.34), rgba(0,0,0,0.00) 58%)",
                                            }}
                                        />
                                        <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                            Live camera preview
                                        </div>
                                    </div>

                                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                            Area
                                        </p>
                                        <div className="mt-2 flex items-end justify-between gap-4">
                                            <div>
                                                <p className="text-lg font-semibold text-slate-900">
                                                    {selectedParkingArea?.name ||
                                                        "-"}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    {selectedParkingArea?.location_name ||
                                                        "Area aktif"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                                    Available
                                                </p>
                                                <p className="text-3xl font-bold text-slate-900">
                                                    {availableCapacity}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    of{" "}
                                                    {selectedParkingArea?.capacity ||
                                                        0}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {activeTransaction && (
                                        <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-4 sm:px-5">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
                                                Transaksi aktif
                                            </p>
                                            <div className="mt-2">
                                                <p className="text-lg font-semibold text-amber-950">
                                                    {activeTransaction.license_plate ||
                                                        rfidVehicle?.license_plate ||
                                                        "-"}
                                                </p>
                                                <p className="mt-1 text-sm text-amber-700">
                                                    Tap keluar terdeteksi,
                                                    lanjut ke konfirmasi
                                                    pembayaran.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Nomor RFID
                                        </label>
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={rfidUid}
                                            onChange={(event) => {
                                                setRfidUid(event.target.value);
                                                setRfidError("");
                                            }}
                                            placeholder="Scan / input nomor kartu RFID"
                                            autoComplete="off"
                                            autoFocus
                                            className="w-full rounded-[1.25rem] border border-slate-300 px-4 py-4 text-lg outline-none transition focus:border-[#1E5EFF] focus:ring-4 focus:ring-[#1E5EFF]/15"
                                        />
                                        <p className="mt-2 text-xs text-slate-500">
                                            Auto proses setelah RFID terbaca dan
                                            berhenti.
                                        </p>
                                    </div>

                                    <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
                                                    statusTone === "success"
                                                        ? "bg-emerald-500"
                                                        : statusTone ===
                                                            "warning"
                                                          ? "bg-amber-500"
                                                          : statusTone ===
                                                              "danger"
                                                            ? "bg-rose-500"
                                                            : "bg-blue-500"
                                                }`}
                                            />
                                            <div className="flex-1">
                                                <p
                                                    className={`text-xs font-semibold uppercase tracking-wide ${
                                                        statusTone === "success"
                                                            ? "text-emerald-700"
                                                            : statusTone ===
                                                                "warning"
                                                              ? "text-amber-700"
                                                              : statusTone ===
                                                                  "danger"
                                                                ? "text-rose-700"
                                                                : "text-blue-700"
                                                    }`}
                                                >
                                                    {statusTone === "success"
                                                        ? "Sukses"
                                                        : statusTone ===
                                                            "warning"
                                                          ? "Penting"
                                                          : statusTone ===
                                                              "danger"
                                                            ? "Error"
                                                            : "Info"}
                                                </p>
                                                <p
                                                    className={`mt-1 text-sm font-medium leading-6 ${
                                                        statusTone === "success"
                                                            ? "text-emerald-700"
                                                            : statusTone ===
                                                                "warning"
                                                              ? "text-amber-800"
                                                              : statusTone ===
                                                                  "danger"
                                                                ? "text-rose-700"
                                                                : "text-slate-700"
                                                    }`}
                                                >
                                                    {statusMessage}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {lookupLoading && (
                                        <div className="rounded-[1.25rem] border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                                            Mencari data RFID...
                                        </div>
                                    )}

                                    {cameraError && (
                                        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                            {cameraError}
                                        </div>
                                    )}

                                    {rfidError && (
                                        <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                                            {rfidError}
                                        </div>
                                    )}

                                    {rfidUser && !rfidError && (
                                        <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                                            RFID cocok dengan user:{" "}
                                            <strong>{rfidUser.name}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}
