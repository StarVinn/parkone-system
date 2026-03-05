import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useEffect, useRef } from "react";
import OfficerLayout from "../Layouts/OfficerLayout";

const currency = new Intl.NumberFormat("id-ID");
const padLine = (label, value) => `${label.padEnd(10, " ")}: ${value}`;

export default function Receipt({
    receiptType = "entry",
    nominal = 0,
    transaction = null,
    checkoutMode = "ticket",
    ticketPenalty = 10000,
    step = "preview",
    receivedAmount = null,
}) {
    const { errors } = usePage().props;
    const { auth } = usePage().props;
    const isExit = receiptType === "exit";
    const isExitPaymentStep = isExit && step === "payment";
    const isExitPreviewStep = isExit && step === "preview";
    const hasAutoPrinted = useRef(false);
    const { data, setData, post, processing } = useForm({
        type: receiptType,
        received_amount: receivedAmount ?? nominal,
        checkout_mode: checkoutMode,
        step: isExit ? step : "preview",
    });
    const pageSize = `80mm auto`;

    useEffect(() => {
        setData("type", receiptType);
        setData("checkout_mode", checkoutMode);
        setData("step", isExit ? step : "preview");

        if (receivedAmount !== null && receivedAmount !== undefined) {
            setData("received_amount", receivedAmount);
        }
    }, [checkoutMode, isExit, receivedAmount, receiptType, setData, step]);

    useEffect(() => {
        if (isExitPaymentStep || hasAutoPrinted.current) {
            return;
        }

        hasAutoPrinted.current = true;
        window.print();
    }, [isExitPaymentStep]);

    const submit = (event) => {
        event.preventDefault();
        post(route("officer.transactions.receipt.confirm", transaction?.id));
    };

    const handlePrint = () => {
        window.print();
    };

    if (!transaction) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                Data transaksi tidak ditemukan.
            </div>
        );
    }

    const entryDate = transaction.entry_time
        ? new Date(transaction.entry_time).toLocaleString("id-ID")
        : "-";
    const exitDate = transaction.exit_time
        ? new Date(transaction.exit_time).toLocaleString("id-ID")
        : "-";
    const ticketNumber = `PKO/${transaction.id.toString().padStart(6, "0")}`;
    const operatorName = auth?.user?.name || "-";
    const parkingGate = transaction.parking_area?.name || "-";
    const plate = transaction.vehicle?.license_plate || "-";
    const subtotalText = `Rp ${currency.format(Number(nominal || 0))}`;

    return (
        <>
            <Head title="Struk Transaksi | PARKONE" />
            <style>{`
                @page {
                    size: ${pageSize};
                    margin: 0 0 0 0;
                }
                @media print {
                    html, body {
                        width: 80mm;
                        height: auto;
                        margin: 0;
                        padding: 0;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #receipt-print, #receipt-print * {
                        visibility: visible;
                    }
                    #receipt-print {
                        position: fixed;
                        left: 0;
                        top: 0;
                        width: 80mm;
                        height: auto;
                        box-sizing: border-box;
                        padding: 3.5mm;
                        border: 0.35mm solid #94a3b8;
                        border-radius: 4mm;
                        box-shadow: none;
                        margin: 0;
                        overflow: visible;
                        background: #fff;
                    }
                }
            `}</style>

            <div className="w-full">
                <div className="mb-6 flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {isExitPaymentStep
                                ? "Konfirmasi Uang Masuk"
                                : `Struk ${receiptType === "entry" ? "Kendaraan Masuk" : "Kendaraan Keluar"}`}
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            {isExitPaymentStep
                                ? "Isi nominal uang masuk sebelum preview struk."
                                : "Preview nominal dan konfirmasi transaksi."}
                        </p>
                    </div>
                    {isExitPaymentStep ? (
                        <Link
                            href={route("officer.standby.out")}
                            className="shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                        >
                            Kembali ke Standby OUT
                        </Link>
                    ) : null}
                </div>

                <div className="space-y-4">
                    {!isExitPaymentStep ? (
                        <div
                            id="receipt-print"
                            className="mx-auto w-full md:w-1/2 rounded-3xl border border-slate-300 bg-white p-6 text-[13px] leading-5 text-slate-900 font-mono shadow-sm"
                            style={{
                                maxWidth: "100%",
                            }}
                        >
                            <p className="text-center font-bold">
                                PARKONE PARKING SYSTEM
                            </p>
                            <p className="text-center text-[12px]">
                                PT. PARKONE INDONESIA
                            </p>
                            <div className="my-3 border-t border-slate-700" />

                            <p>{padLine("NO KARCIS", ticketNumber)}</p>
                            <p>{padLine("PLAT", plate)}</p>
                            <p>
                                {padLine(
                                    "JENIS KENDARAAN",
                                    transaction.vehicle?.vehicle_type?.name || "-",
                                )}
                            </p>
                            {isExit ? (
                                <>
                                    <p>{padLine("MASUK", entryDate)}</p>
                                    <p>{padLine("KELUAR", exitDate)}</p>
                                </>
                            ) : null}
                            <p>{padLine("GERBANG", parkingGate)}</p>
                            <p>{padLine("PETUGAS", operatorName)}</p>

                            {isExit ? (
                                <>
                                    <div className="my-2 border-t border-slate-700" />
                                    <p>{padLine("TOTAL", subtotalText)}</p>
                                    <p>
                                        {padLine(
                                            "TUNAI",
                                            `Rp ${currency.format(Number(data.received_amount || 0))}`,
                                        )}
                                    </p>
                                </>
                            ) : null}
                            <div className="my-3 border-t border-slate-700" />
                            {isExit ? (
                                <p className="text-center">
                                    TERIMA KASIH - SELAMAT JALAN
                                </p>
                            ) : (
                                <>
                                    <p className="text-center">SELAMAT DATANG</p>
                                    <p className="mt-1 text-center text-[11px] text-slate-500">
                                        Denda 10.000 jika struk/tiket hilang
                                    </p>
                                </>
                            )}
                        </div>
                    ) : null}

                    <form onSubmit={submit} className="space-y-3">
                        {isExitPaymentStep && (
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                                    Uang Masuk
                                </label>
                                {data.checkout_mode === "ticket" ? (
                                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                                        Jika struk hilang, silahkan tambahkan denda Rp{" "}
                                        {currency.format(Number(ticketPenalty || 0))} dari nominal awal
                                    </p>
                                ) : (
                                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                                        Mode RFID: nominal harus pas ({subtotalText}).
                                    </p>
                                )}
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.received_amount}
                                    onChange={(event) =>
                                        setData(
                                            "received_amount",
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#0B1026] text-slate-900 dark:text-white px-3 py-2.5 outline-none focus:ring-2 focus:ring-[#1E5EFF]/30"
                                    required
                                />
                                {errors.received_amount && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.received_amount}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-3">
                            {isExitPreviewStep || !isExit ? (
                                <button
                                    type="button"
                                    onClick={handlePrint}
                                    className="flex-1 rounded-xl border border-[#1E5EFF] px-4 py-2.5 font-semibold text-[#1E5EFF] hover:bg-[#1E5EFF]/5 transition cursor-pointer"
                                >
                                    Cetak Struk
                                </button>
                            ) : null}
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 rounded-xl bg-[#1E5EFF] px-4 py-2.5 font-semibold text-white hover:bg-[#194FD8] transition disabled:opacity-60 cursor-pointer"
                            >
                                {processing ? "Memproses..." : "Selesai"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

Receipt.layout = (page) => <OfficerLayout children={page} />;
