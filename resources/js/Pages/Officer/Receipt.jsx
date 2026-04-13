import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useEffect, useRef } from "react";
import OfficerLayout from "../Layouts/OfficerLayout";
import useI18n from "../../hooks/useI18n";

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
    source = "standby_out",
}) {
    const { errors } = usePage().props;
    const { auth } = usePage().props;
    const { locale, t } = useI18n();
    const tr = (key, id, en) => t(key, locale === "id" ? id : en);
    const isExit = receiptType === "exit";
    const isExitPaymentStep = isExit && step === "payment";
    const isExitPreviewStep = isExit && step === "preview";
    const hasAutoPrinted = useRef(false);
    const { data, setData, post, processing } = useForm({
        type: receiptType,
        received_amount: receivedAmount ?? nominal,
        checkout_mode: checkoutMode,
        step: isExit ? step : "preview",
        source,
    });
    const pageSize = `80mm auto`;

    useEffect(() => {
        setData("type", receiptType);
        setData("checkout_mode", checkoutMode);
        setData("step", isExit ? step : "preview");
        setData("source", source);

        if (receivedAmount !== null && receivedAmount !== undefined) {
            setData("received_amount", receivedAmount);
        }
    }, [
        checkoutMode,
        isExit,
        receivedAmount,
        receiptType,
        setData,
        source,
        step,
    ]);

    const backRouteName =
        source === "rfid"
            ? "officer.rfid.scan"
            : source === "standby_in"
              ? "officer.standby.in"
              : "officer.standby.out";
    const backLabel =
        source === "rfid"
            ? "Kembali ke RFID"
            : source === "standby_in"
              ? "Kembali ke Standby IN"
              : "Kembali ke Standby OUT";

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
                {tr(
                    "officer.receipt.not_found",
                    "Data transaksi tidak ditemukan.",
                    "Transaction data not found.",
                )}
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
    const baseTotal = Number(nominal || 0);
    const receivedAmountValue = Number(data.received_amount || 0);
    const penaltyAmount =
        isExit &&
        data.checkout_mode === "ticket" &&
        receivedAmountValue > baseTotal
            ? receivedAmountValue - baseTotal
            : 0;
    const totalToPay = baseTotal + penaltyAmount;
    const baseTotalText = `Rp ${currency.format(Number(baseTotal || 0))}`;
    const penaltyText = `Rp ${currency.format(Number(penaltyAmount || 0))}`;
    const totalText = `Rp ${currency.format(Number(totalToPay || 0))}`;

    return (
        <>
            <Head
                title={tr(
                    "officer.receipt.head_title",
                    "Struk Transaksi | PARKONE",
                    "Transaction Receipt | PARKONE",
                )}
            />
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
                                ? tr(
                                      "officer.receipt.confirm_payment",
                                      "Konfirmasi Uang Masuk",
                                      "Confirm Received Payment",
                                  )
                                : `${tr("officer.receipt.receipt_label", "Struk", "Receipt")} ${receiptType === "entry" ? tr("officer.receipt.vehicle_entry", "Kendaraan Masuk", "Vehicle Entry") : tr("officer.receipt.vehicle_exit", "Kendaraan Keluar", "Vehicle Exit")}`}
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            {isExitPaymentStep
                                ? tr(
                                      "Isi nominal uang masuk sebelum preview struk.",
                                      "Enter received amount before receipt preview.",
                                  )
                                : tr(
                                      "Preview nominal dan konfirmasi transaksi.",
                                      "Preview amount and confirm transaction.",
                                  )}
                        </p>
                    </div>
                    {isExitPaymentStep ? (
                        <Link
                            href={route(backRouteName)}
                            className="shrink-0 rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5"
                        >
                            {backLabel}
                        </Link>
                    ) : null}
                </div>

                <div className="space-y-4">
                    {isExitPaymentStep ? (
                        <div className="rounded-3xl border border-[#1E5EFF]/20 bg-[#1E5EFF]/8 px-4 py-4 shadow-sm sm:px-5 sm:py-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1E5EFF]">
                                Preview biaya keluar
                            </p>
                            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
                                        Total yang harus dibayar sebelum struk
                                        diproses.
                                    </p>
                                    <p className="mt-2 text-s font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl xl:text-3xl">
                                        {baseTotalText}
                                    </p>
                                </div>
                                <div className="grid gap-1.5 text-xs text-slate-600 dark:text-slate-300 sm:text-right sm:text-sm">
                                    <p>
                                        Kendaraan:{" "}
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {plate}
                                        </span>
                                    </p>
                                    <p>
                                        Area:{" "}
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {parkingGate}
                                        </span>
                                    </p>
                                    <p>
                                        Lama parkir:{" "}
                                        <span className="font-semibold text-slate-900 dark:text-white">
                                            {transaction.total_hours || "-"} jam
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : null}

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
                            <p>
                                {padLine(
                                    tr(
                                        "officer.receipt.label_plate",
                                        "PLAT",
                                        "PLATE",
                                    ),
                                    plate,
                                )}
                            </p>
                            <p>
                                {padLine(
                                    tr(
                                        "officer.receipt.label_vehicle_type",
                                        "JENIS KENDARAAN",
                                        "VEHICLE TYPE",
                                    ),
                                    transaction.vehicle?.vehicle_type?.name ||
                                        "-",
                                )}
                            </p>
                            {isExit ? (
                                <>
                                    <p>
                                        {padLine(
                                            tr(
                                                "officer.receipt.label_entry",
                                                "MASUK",
                                                "ENTRY",
                                            ),
                                            entryDate,
                                        )}
                                    </p>
                                    <p>
                                        {padLine(
                                            tr(
                                                "officer.receipt.label_exit",
                                                "KELUAR",
                                                "EXIT",
                                            ),
                                            exitDate,
                                        )}
                                    </p>
                                </>
                            ) : null}
                            <p>
                                {padLine(
                                    tr(
                                        "officer.receipt.label_gate",
                                        "GERBANG",
                                        "GATE",
                                    ),
                                    parkingGate,
                                )}
                            </p>
                            <p>
                                {padLine(
                                    tr(
                                        "officer.receipt.label_officer",
                                        "PETUGAS",
                                        "OFFICER",
                                    ),
                                    operatorName,
                                )}
                            </p>

                            {isExit ? (
                                <>
                                    <div className="my-2 border-t border-slate-700" />
                                    <p>
                                        {padLine(
                                            tr(
                                                "officer.receipt.label_parking",
                                                "PARKIR",
                                                "PARKING",
                                            ),
                                            baseTotalText,
                                        )}
                                    </p>
                                    {penaltyAmount > 0 ? (
                                        <p>
                                            {padLine(
                                                tr(
                                                    "officer.receipt.label_penalty",
                                                    "DENDA",
                                                    "PENALTY",
                                                ),
                                                penaltyText,
                                            )}
                                        </p>
                                    ) : null}
                                    <p>
                                        {padLine(
                                            tr(
                                                "officer.receipt.label_total",
                                                "TOTAL",
                                                "TOTAL",
                                            ),
                                            totalText,
                                        )}
                                    </p>
                                    <p>
                                        {padLine(
                                            tr(
                                                "officer.receipt.label_cash",
                                                "TUNAI",
                                                "CASH",
                                            ),
                                            `Rp ${currency.format(Number(data.received_amount || 0))}`,
                                        )}
                                    </p>
                                </>
                            ) : null}
                            <div className="my-3 border-t border-slate-700" />
                            {isExit ? (
                                <p className="text-center">
                                    {tr(
                                        "officer.receipt.thank_you",
                                        "TERIMA KASIH - SELAMAT JALAN",
                                        "THANK YOU - HAVE A SAFE TRIP",
                                    )}
                                </p>
                            ) : (
                                <>
                                    <p className="text-center">
                                        {tr(
                                            "officer.receipt.welcome",
                                            "SELAMAT DATANG",
                                            "WELCOME",
                                        )}
                                    </p>
                                    <p className="mt-1 text-center text-[11px] text-slate-500">
                                        {tr(
                                            "officer.receipt.penalty",
                                            "Denda",
                                            "Penalty",
                                        )}{" "}
                                        Rp{" "}
                                        {currency.format(
                                            Number(ticketPenalty || 0),
                                        )}{" "}
                                        {tr(
                                            "officer.receipt.lost_ticket_suffix",
                                            "jika tiket hilang",
                                            "for lost ticket",
                                        )}
                                    </p>
                                </>
                            )}
                        </div>
                    ) : null}

                    <form onSubmit={submit} className="space-y-3">
                        {isExitPaymentStep && (
                            <div>
                                <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">
                                    {tr(
                                        "officer.receipt.received_amount",
                                        "Nominal Pembayaran",
                                        "Received Amount",
                                    )}
                                </label>
                                {data.checkout_mode === "ticket" ? (
                                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                                        {tr(
                                            "Jika struk hilang, silahkan tambahkan denda Rp",
                                            "If receipt is lost, add penalty Rp",
                                        )}{" "}
                                        {currency.format(
                                            Number(ticketPenalty || 0),
                                        )}{" "}
                                        {tr(
                                            "dari nominal awal",
                                            "to the base amount",
                                        )}
                                    </p>
                                ) : (
                                    <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
                                        {tr(
                                            "Mode RFID: nominal harus pas",
                                            "RFID mode: amount must match",
                                        )}{" "}
                                        ({baseTotalText}).
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
                                    {tr(
                                        "officer.receipt.print",
                                        "Cetak Struk",
                                        "Print Receipt",
                                    )}
                                </button>
                            ) : null}
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 rounded-xl bg-[#1E5EFF] px-4 py-2.5 font-semibold text-white hover:bg-[#194FD8] transition disabled:opacity-60 cursor-pointer"
                            >
                                {processing
                                    ? tr(
                                          "states.processing",
                                          "Memproses...",
                                          "Processing...",
                                      )
                                    : tr(
                                          "officer.receipt.done",
                                          "Selesai",
                                          "Done",
                                      )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}

Receipt.layout = (page) => <OfficerLayout children={page} />;
