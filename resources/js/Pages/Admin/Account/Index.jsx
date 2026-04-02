import { Link, router, useForm, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import {
    ChevronDown,
    Info,
    MailCheck,
    MailPlus,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UserX,
    X,
} from "lucide-react";
import AdminLayout from "../../Layouts/AdminLayout";

export default function Index({ users = [], filters = {} }) {
    const page = usePage();
    const { flash } = page.props;
    const [actionMenu, setActionMenu] = useState(null);
    const [emailTargetUser, setEmailTargetUser] = useState(null);
    const [rfidTargetUser, setRfidTargetUser] = useState(null);
    const [confirmModal, setConfirmModal] = useState({
        open: false,
        action: null,
        user: null,
    });
    const [confirmProcessing, setConfirmProcessing] = useState(false);

    // Create modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const rows = Array.isArray(users?.data)
        ? users.data
        : Array.isArray(users)
          ? users
          : [];
    const paginationLinks = Array.isArray(users?.links) ? users.links : [];
    const from = users?.from ?? 0;
    const to = users?.to ?? rows.length;
    const total = users?.total ?? rows.length;
    const { data, setData } = useForm({
        search: filters.search ?? "",
        status: filters.status ?? "all",
    });

    const didMountRef = useRef(false);
    const debounceRef = useRef(null);

    // Create form
    const {
        data: createForm,
        setData: setCreateForm,
        post: postCreate,
        processing: processingCreate,
        errors: createErrors,
        reset: resetCreateForm,
    } = useForm({
        name: "",
        email: "",
        role: "user",
        rfid_uid: "",
    });

    const {
        data: emailForm,
        setData: setEmailForm,
        put: putEmail,
        processing: processingEmail,
        errors: emailErrors,
        reset: resetEmailForm,
    } = useForm({
        email: "",
    });
    const {
        data: rfidForm,
        setData: setRfidForm,
        put: putRfid,
        processing: processingRfid,
        errors: rfidErrors,
        reset: resetRfidForm,
    } = useForm({
        rfid_uid: "",
    });

    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            router.get(route("admin.accounts.index"), data, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["users", "filters", "flash", "errors"],
            });
        }, 500);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [data.search, data.status]);

    const goToPage = (url) => {
        if (!url) return;

        router.get(
            url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                only: ["users", "filters", "flash", "errors"],
            },
        );
    };

    const paginationLabel = (label) =>
        String(label || "")
            .replace(/&laquo;/g, "«")
            .replace(/&raquo;/g, "»")
            .replace(/<[^>]*>/g, "");

    const handleActivate = (userId) => {
        router.post(route("admin.accounts.activate", userId));
    };

    const toggleActionMenu = (event, user) => {
        const isSameUser = actionMenu?.user?.id === user.id;
        if (isSameUser) {
            setActionMenu(null);
            return;
        }

        const rect = event.currentTarget.getBoundingClientRect();
        const menuWidth = 192;
        const menuHeight = 216;
        const spacing = 8;
        const viewportPadding = 12;

        const left = Math.max(
            viewportPadding,
            Math.min(
                rect.right - menuWidth,
                window.innerWidth - menuWidth - viewportPadding,
            ),
        );

        let top = rect.bottom + spacing;
        if (top + menuHeight > window.innerHeight - viewportPadding) {
            top = Math.max(viewportPadding, rect.top - menuHeight - spacing);
        }

        setActionMenu({ user, top, left });
    };

    const openEmailForm = (user) => {
        setActionMenu(null);
        setEmailTargetUser(user);
        setEmailForm("email", user.email ?? "");
    };

    const closeEmailForm = () => {
        setEmailTargetUser(null);
        resetEmailForm();
    };

    const submitEmailForm = (e) => {
        e.preventDefault();
        if (!emailTargetUser) return;

        putEmail(route("admin.accounts.reset-email", emailTargetUser.id), {
            preserveScroll: true,
            onSuccess: () => {
                closeEmailForm();
            },
        });
    };

    const openRfidForm = (user) => {
        setActionMenu(null);
        setRfidTargetUser(user);
        setRfidForm("rfid_uid", "");
    };

    const closeConfirmModal = () => {
        setConfirmModal({ open: false, action: null, user: null });
        setConfirmProcessing(false);
    };

    const confirmTitle = () => {
        if (confirmModal.action === "delete") return "Hapus Account";
        if (confirmModal.action === "deactivate") return "Nonaktifkan Account";
        return "Konfirmasi";
    };

    const confirmDescription = () => {
        const name = confirmModal.user?.name ? ` (${confirmModal.user.name})` : "";

        if (confirmModal.action === "delete") {
            return `Yakin mau hapus user ini${name}? Tindakan ini tidak bisa dibatalkan.`;
        }

        if (confirmModal.action === "deactivate") {
            return `Nonaktifkan akun ini${name}? User tidak bisa login sampai diaktifkan kembali.`;
        }

        return "Lanjutkan aksi ini?";
    };

    const confirmPrimaryLabel = () => {
        if (confirmModal.action === "delete") return "Hapus";
        if (confirmModal.action === "deactivate") return "Nonaktifkan";
        return "Konfirmasi";
    };

    const openConfirmModal = (action, user) => {
        setActionMenu(null);
        if (!user?.id) return;
        setConfirmModal({ open: true, action, user });
        setConfirmProcessing(false);
    };

    const runConfirmedAction = () => {
        const user = confirmModal.user;
        if (!user?.id || !confirmModal.action) return;

        setConfirmProcessing(true);

        if (confirmModal.action === "delete") {
            router.delete(route("admin.accounts.destroy", user.id), {
                preserveScroll: true,
                onFinish: () => {
                    closeConfirmModal();
                },
            });
            return;
        }

        if (confirmModal.action === "deactivate") {
            router.put(
                route("admin.accounts.deactivate", user.id),
                {},
                {
                    preserveScroll: true,
                    onFinish: () => {
                        closeConfirmModal();
                    },
                },
            );
        }
    };

    const handleDeleteUser = (user) => {
        openConfirmModal("delete", user);
    };

    const handleDeactivateUser = (user) => {
        openConfirmModal("deactivate", user);
    };

    const closeRfidForm = () => {
        setRfidTargetUser(null);
        resetRfidForm();
    };

    const submitRfidForm = (e) => {
        e.preventDefault();
        if (!rfidTargetUser) return;

        putRfid(route("admin.accounts.update-identity", rfidTargetUser.id), {
            preserveScroll: true,
            onSuccess: () => {
                closeRfidForm();
            },
        });
    };

    // Create modal functions
    const openCreateModal = () => {
        resetCreateForm();
        setIsCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        resetCreateForm();
    };

    const submitCreateForm = (e) => {
        e.preventDefault();
        postCreate(route("admin.accounts.store"), {
            preserveScroll: true,
            onSuccess: () => {
                closeCreateModal();
            },
        });
    };

    return (
        <div className="p-4 sm:p-6 transition-colors duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        Manage Accounts
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Create user satu per satu, kirim email aktivasi, dan
                        kelola reset email akun.
                    </p>
                </div>

                <button
                    onClick={openCreateModal}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white transition-all
                        bg-gradient-to-r from-[#1E5EFF] to-[#1FD1A5]
                        hover:opacity-90 active:scale-95 shadow-lg shadow-blue-500/20 text-sm cursor-pointer"
                >
                    <Plus size={18} />
                    Create Account
                </button>
            </div>

            {(flash.success || flash.error) && (
                <div
                    className={`flex items-center gap-3 p-4 mb-6 rounded-2xl text-sm border animate-in fade-in slide-in-from-top-4 ${
                        flash.error
                            ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
                            : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    }`}
                >
                    <Info size={18} />
                    {flash.error || flash.success}
                </div>
            )}

            <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm p-4 sm:p-5 mb-6">
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={data.search}
                        onChange={(e) => setData("search", e.target.value)}
                        placeholder="Cari nama, email, role, atau RFID..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                    />
                </div>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Filter otomatis setelah selesai mengetik.
                    </p>
                    <div className="flex items-center gap-2">
                        <select
                            value={data.status}
                            onChange={(e) => setData("status", e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5] text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Name
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Role
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    RFID
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-center text-slate-500 dark:text-slate-400">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-10 text-center text-slate-400 dark:text-slate-500 italic"
                                    >
                                        Belum ada akun yang cocok.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors"
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm uppercase">
                                            {user.role}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                                            {user.rfid_uid || "-"}
                                            {user.rfid_count > 1
                                                ? ` (+${user.rfid_count - 1})`
                                                : ""}
                                        </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                            user.status ===
                                                            "active"
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                                                                : user.status ===
                                                                    "inactive"
                                                                  ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                                                                  : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                                        }`}
                                                    >
                                                        {user.status === "active"
                                                            ? "Active"
                                                            : user.status ===
                                                                "inactive"
                                                              ? "Inactive"
                                                              : "Pending Activation"}
                                                    </span>
                                                </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2 relative">
                                                {user.status === "pending" && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleActivate(
                                                                user.id,
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 transition cursor-pointer"
                                                    >
                                                        <MailCheck size={14} />
                                                        Activate Account
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={(event) =>
                                                        toggleActionMenu(
                                                            event,
                                                            user,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition cursor-pointer"
                                                >
                                                    Action
                                                    <ChevronDown size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {paginationLinks.length > 3 && (
                    <div className="border-t border-slate-200 dark:border-white/5 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Menampilkan {from} - {to} dari {total} data
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                            {paginationLinks.map((link, index) => (
                                <button
                                    key={`${link.label}-${index}`}
                                    type="button"
                                    onClick={() => goToPage(link.url)}
                                    disabled={!link.url}
                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                        link.active
                                            ? "bg-[#1E5EFF] text-white border-[#1E5EFF]"
                                            : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                    {paginationLabel(link.label)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {actionMenu && (
                <>
                    <button
                        type="button"
                        onClick={() => setActionMenu(null)}
                        className="fixed inset-0 z-40 bg-transparent cursor-default"
                        aria-label="Close action menu"
                    />
                    <div
                        className="fixed z-50 min-w-48 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0B1026] shadow-xl p-2"
                        style={{
                            top: `${actionMenu.top}px`,
                            left: `${actionMenu.left}px`,
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => openRfidForm(actionMenu.user)}
                            className="w-full inline-flex items-center gap-2 px-3 py-2 text-xs rounded-lg font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition cursor-pointer"
                        >
                            <ShieldCheck size={14} />
                            {actionMenu.user?.rfid_uid ? "Switch RFID" : "Insert RFID"}
                        </button>
                        <button
                            type="button"
                            onClick={() => openEmailForm(actionMenu.user)}
                            className="w-full inline-flex items-center gap-2 px-3 py-2 text-xs rounded-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                        >
                            <MailPlus size={14} />
                            Reset Email
                        </button>
                        {actionMenu.user?.status === "active" && (
                            <button
                                type="button"
                                onClick={() => handleDeactivateUser(actionMenu.user)}
                                className="w-full inline-flex items-center gap-2 px-3 py-2 text-xs rounded-lg font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition cursor-pointer"
                            >
                                <UserX size={14} />
                                Deactivate Account
                            </button>
                        )}
                        <div className="my-2 border-t border-slate-200 dark:border-white/10" />
                        <button
                            type="button"
                            onClick={() => handleDeleteUser(actionMenu.user)}
                            className="w-full inline-flex items-center gap-2 px-3 py-2 text-xs rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer"
                        >
                            <Trash2 size={14} />
                            Delete User
                        </button>
                    </div>
                </>
            )}

            {confirmModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-md bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-['Poppins']">
                                {confirmTitle()}
                            </h2>
                            <button
                                type="button"
                                onClick={closeConfirmModal}
                                disabled={confirmProcessing}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                {confirmDescription()}
                            </p>

                            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] px-4 py-3 text-xs text-slate-600 dark:text-slate-400">
                                User:{" "}
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                    {confirmModal.user?.name || "-"}
                                </span>{" "}
                                <span className="text-slate-500 dark:text-slate-400">
                                    ({confirmModal.user?.email || "-"})
                                </span>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeConfirmModal}
                                    disabled={confirmProcessing}
                                    className="px-4 py-2 text-sm rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={runConfirmedAction}
                                    disabled={confirmProcessing}
                                    className={`px-4 py-2 text-sm rounded-lg font-medium text-white transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                                        confirmModal.action === "delete"
                                            ? "bg-red-500 hover:bg-red-600"
                                            : "bg-amber-500 hover:bg-amber-600"
                                    }`}
                                >
                                    {confirmProcessing
                                        ? "Memproses..."
                                        : confirmPrimaryLabel()}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {rfidTargetUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-['Poppins']">
                                {rfidTargetUser?.rfid_uid ? "Switch RFID" : "Insert RFID"}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                User: {rfidTargetUser.name} (
                                {rfidTargetUser.email})
                            </p>
                            {rfidTargetUser?.rfid_uid && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    RFID aktif sekarang:{" "}
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                                        {rfidTargetUser.rfid_uid}
                                    </span>
                                </p>
                            )}
                        </div>

                        <form
                            onSubmit={submitRfidForm}
                            className="p-6 space-y-4"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    RFID UID
                                </label>
                                <input
                                    type="text"
                                    value={rfidForm.rfid_uid}
                                    onChange={(e) =>
                                        setRfidForm("rfid_uid", e.target.value)
                                    }
                                    placeholder="Scan / input RFID UID"
                                    className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none ${
                                        rfidErrors.rfid_uid
                                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                            : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                    }`}
                                />
                                {rfidErrors.rfid_uid && (
                                    <p className="text-xs text-red-500">
                                        {rfidErrors.rfid_uid}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
                                Pastikan perangkat input RFID sudah terpasang
                                dengan baik dan aman sebelum melakukan
                                penyimpanan UID.
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeRfidForm}
                                    className="px-4 py-2 text-sm rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingRfid}
                                    className="px-4 py-2 text-sm rounded-lg font-medium text-white bg-indigo-500 hover:bg-indigo-600 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {processingRfid
                                        ? "Menyimpan..."
                                        : rfidTargetUser?.rfid_uid
                                          ? "Switch RFID"
                                          : "Simpan RFID"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {emailTargetUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/10">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-['Poppins']">
                                Reset Email
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                User: {emailTargetUser.name} (
                                {emailTargetUser.email})
                            </p>
                        </div>

                        <form
                            onSubmit={submitEmailForm}
                            className="p-6 space-y-4"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Email Baru
                                </label>
                                <input
                                    type="email"
                                    value={emailForm.email}
                                    onChange={(e) =>
                                        setEmailForm("email", e.target.value)
                                    }
                                    placeholder="email@domain.com"
                                    className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none ${
                                        emailErrors.email
                                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                            : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                    }`}
                                />
                                {emailErrors.email && (
                                    <p className="text-xs text-red-500">
                                        {emailErrors.email}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
                                Setelah email diubah, sistem akan mengirim link
                                untuk set password awal kembali.
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeEmailForm}
                                    className="px-4 py-2 text-sm rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingEmail}
                                    className="px-4 py-2 text-sm rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {processingEmail
                                        ? "Menyimpan..."
                                        : "Simpan Email"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Account Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-lg bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-['Poppins']">
                                Create Account
                            </h2>
                            <button
                                onClick={closeCreateModal}
                                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={submitCreateForm}
                            className="p-6 space-y-4"
                        >
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={createForm.name}
                                    onChange={(e) =>
                                        setCreateForm("name", e.target.value)
                                    }
                                    placeholder="Nama lengkap"
                                    className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none ${
                                        createErrors.name
                                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                            : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                    }`}
                                />
                                {createErrors.name && (
                                    <p className="text-xs text-red-500">
                                        {createErrors.name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={createForm.email}
                                    onChange={(e) =>
                                        setCreateForm("email", e.target.value)
                                    }
                                    placeholder="email@domain.com"
                                    className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none ${
                                        createErrors.email
                                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                            : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                    }`}
                                />
                                {createErrors.email && (
                                    <p className="text-xs text-red-500">
                                        {createErrors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Role
                                </label>
                                <select
                                    value={createForm.role}
                                    onChange={(e) =>
                                        setCreateForm("role", e.target.value)
                                    }
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                >
                                    <option value="officer">Officer</option>
                                    <option value="owner">Owner</option>
                                    <option value="admin">Admin</option>
                                    <option value="user">User</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    RFID UID (Opsional)
                                </label>
                                <input
                                    type="text"
                                    value={createForm.rfid_uid}
                                    onChange={(e) =>
                                        setCreateForm(
                                            "rfid_uid",
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Scan / input RFID UID"
                                    className={`w-full px-4 py-2.5 rounded-xl border bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none ${
                                        createErrors.rfid_uid
                                            ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                                            : "border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5]"
                                    }`}
                                />
                                {createErrors.rfid_uid && (
                                    <p className="text-xs text-red-500">
                                        {createErrors.rfid_uid}
                                    </p>
                                )}
                            </div>

                            <div className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-4 py-3 text-xs text-blue-700 dark:text-blue-300">
                                Setelah akun dibuat, sistem akan mengirim link
                                aktivasi ke email user untuk set password awal.
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeCreateModal}
                                    className="px-4 py-2 text-sm rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processingCreate}
                                    className="px-4 py-2 text-sm rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {processingCreate
                                        ? "Menyimpan..."
                                        : "Buat Akun"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

Index.layout = (page) => <AdminLayout children={page} />;
