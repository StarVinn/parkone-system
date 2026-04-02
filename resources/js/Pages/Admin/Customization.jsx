import { router, useForm, usePage } from "@inertiajs/react";
import { Eye, EyeOff, GripVertical, Info, MoreVertical, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import AdminLayout from "../Layouts/AdminLayout";
import useI18n from "../../hooks/useI18n";

export default function Customization({ navbar, translations }) {
    const { flash } = usePage().props;
    const { t } = useI18n();
    const [tab, setTab] = useState("translations");
    const [translationSearch, setTranslationSearch] = useState("");
    const [translationPage, setTranslationPage] = useState(1);
    const pageSize = 15;

    const initialTranslations = useMemo(() => {
        const id = translations?.id ?? {};
        const en = translations?.en ?? {};
        const keys = Array.from(
            new Set([...Object.keys(id), ...Object.keys(en)]),
        ).sort();

        return keys.map((key) => ({
            key,
            id: id[key] ?? "",
            en: en[key] ?? "",
            isDefault: true,
        }));
    }, [translations]);

    const initialNav = useMemo(() => navbar ?? { items: [] }, [navbar]);

    const { processing, errors, clearErrors } = useForm({});

    const [localError, setLocalError] = useState(null);
    const [translationRows, setTranslationRows] = useState(initialTranslations);
    const [navState, setNavState] = useState(initialNav);
    const [openMenu, setOpenMenu] = useState(null);
    const [dragOverPath, setDragOverPath] = useState(null);

    const dragRef = useRef(null);

    const buildTranslationMap = (locale) => {
        const out = {};
        translationRows.forEach((row) => {
            const key = String(row.key || "").trim();
            if (!key) return;
            out[key] = String(locale === "id" ? row.id : row.en);
        });
        return out;
    };

    const saveTranslations = (locale) => {
        setLocalError(null);
        clearErrors();

        router.put(
            route("admin.customization.translations.update", locale),
            { translations: buildTranslationMap(locale) },
            { preserveScroll: true },
        );
    };

    const saveTranslationsAll = () => {
        setLocalError(null);
        clearErrors();

        router.put(
            route("admin.customization.translations.bulk"),
            { translations: { id: buildTranslationMap("id"), en: buildTranslationMap("en") } },
            { preserveScroll: true },
        );
    };

    const saveNavbar = () => {
        setLocalError(null);
        clearErrors();
        router.put(route("admin.customization.navbar.update"), { navbar: navState }, { preserveScroll: true });
    };

    const updateRow = (index, patch) => {
        setTranslationRows((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...patch };
            return next;
        });
    };

    const addRow = () => {
        setTranslationRows((prev) => [
            ...prev,
            { key: "", id: "", en: "", isDefault: false },
        ]);
    };

    const removeRow = (index) => {
        setTranslationRows((prev) => {
            const row = prev[index];
            if (row?.isDefault) return prev;
            return prev.filter((_, i) => i !== index);
        });
    };

    const toggleActive = (path) => {
        setNavState((prev) => {
            const next = structuredClone(prev);
            const [type, parentIndex, childIndex] = path;

            if (type === "item") {
                const item = next.items?.[parentIndex];
                if (item) item.active = !item.active;
            } else if (type === "child") {
                const child = next.items?.[parentIndex]?.children?.[childIndex];
                if (child) child.active = !child.active;
            }

            return next;
        });
    };

    const onDragStart = (path) => {
        dragRef.current = path;
        setDragOverPath(path);
    };

    const onDrop = (path) => {
        const from = dragRef.current;
        if (!from) return;

        const [fromType, fromParentIndex, fromChildIndex] = from;
        const [toType, toParentIndex, toChildIndex] = path;

        if (fromType !== toType) return;
        if (fromType === "child" && fromParentIndex !== toParentIndex) return;

        setNavState((prev) => {
            const next = structuredClone(prev);
            if (!Array.isArray(next.items)) next.items = [];

            if (fromType === "item") {
                const items = [...next.items];
                const [moved] = items.splice(fromParentIndex, 1);
                items.splice(toParentIndex, 0, moved);
                next.items = items;
            } else {
                const children = next.items?.[fromParentIndex]?.children ?? [];
                const nextChildren = [...children];
                const [moved] = nextChildren.splice(fromChildIndex, 1);
                nextChildren.splice(toChildIndex, 0, moved);
                next.items[fromParentIndex].children = nextChildren;
            }

            return next;
        });

        dragRef.current = null;
        setDragOverPath(null);
    };

    const renderMenuButton = (path, isActive) => (
        <div className="relative">
            <button
                type="button"
                onClick={() =>
                    setOpenMenu((prev) =>
                        prev && JSON.stringify(prev) === JSON.stringify(path)
                            ? null
                            : path,
                    )
                }
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-white/5 transition cursor-pointer"
            >
                <MoreVertical size={16} />
            </button>
            {openMenu && JSON.stringify(openMenu) === JSON.stringify(path) && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                    <button
                        type="button"
                        onClick={() => {
                            toggleActive(path);
                            setOpenMenu(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition"
                    >
                        {isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                        {isActive
                            ? t("customization.navbar.deactivate", "Nonaktifkan")
                            : t("customization.navbar.activate", "Aktifkan")}
                    </button>
                </div>
            )}
        </div>
    );

    const navItems = Array.isArray(navState?.items) ? navState.items : [];

    const filteredTranslationRows = useMemo(() => {
        const q = String(translationSearch || "").trim().toLowerCase();
        const indexed = translationRows.map((row, idx) => ({ row, idx }));
        if (!q) return indexed;

        return indexed.filter(({ row }) => {
            const key = String(row.key || "").toLowerCase();
            const id = String(row.id || "").toLowerCase();
            const en = String(row.en || "").toLowerCase();
            return key.includes(q) || id.includes(q) || en.includes(q);
        });
    }, [translationRows, translationSearch]);

    const translationTotal = filteredTranslationRows.length;
    const translationTotalPages = Math.max(
        1,
        Math.ceil(translationTotal / pageSize),
    );
    const safeTranslationPage = Math.min(
        Math.max(1, translationPage),
        translationTotalPages,
    );

    const pagedTranslationRows = useMemo(() => {
        const start = (safeTranslationPage - 1) * pageSize;
        return filteredTranslationRows.slice(start, start + pageSize);
    }, [filteredTranslationRows, safeTranslationPage]);

    const translationPageItems = useMemo(() => {
        const totalPages = translationTotalPages;
        const current = safeTranslationPage;
        const maxPages = 5;

        if (totalPages <= maxPages) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const items = [];
        const last = totalPages;

        const pushDotsIfNeeded = () => {
            if (items[items.length - 1] !== "…") items.push("…");
        };

        const pushPage = (p) => {
            if (items[items.length - 1] !== p) items.push(p);
        };

        // Always show first page
        pushPage(1);

        // Middle window size depends on current position (show up to 3 pages around current)
        let start = Math.max(2, current - 1);
        let end = Math.min(last - 1, current + 1);

        // If we're near the start, show first 4 pages then dots + last
        if (current <= 3) {
            start = 2;
            end = 4;
        }

        // If we're near the end, show dots + last 4 pages
        if (current >= last - 2) {
            start = last - 3;
            end = last - 1;
        }

        if (start > 2) pushDotsIfNeeded();
        for (let p = start; p <= end; p += 1) pushPage(p);
        if (end < last - 1) pushDotsIfNeeded();

        // Always show last page
        pushPage(last);

        // Enforce max page numbers (excluding dots) to 5 by trimming inner window if needed
        const pageNumbers = items.filter((it) => typeof it === "number");
        if (pageNumbers.length > maxPages) {
            // Fallback: simplest compact set: 1, …, current, …, last OR 1..4, …, last
            if (current <= 3) return [1, 2, 3, 4, "…", last];
            if (current >= last - 2) return [1, "…", last - 3, last - 2, last - 1, last];
            return [1, "…", current - 1, current, current + 1, "…", last];
        }

        return items;
    }, [translationTotalPages, safeTranslationPage]);

    return (
        <div className="p-4 sm:p-6 transition-colors duration-300">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-['Poppins']">
                        {t("customization.title", "Kustomisasi")}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {t("customization.description", "Atur terjemahan dan label navbar.")}
                    </p>
                </div>
            </div>

            {flash?.success && (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 mb-4 rounded-2xl text-sm animate-in fade-in slide-in-from-top-4">
                    <Info size={18} />
                    {flash.success}
                </div>
            )}

            {flash?.error && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 mb-4 rounded-2xl text-sm animate-in fade-in slide-in-from-top-4">
                    <Info size={18} />
                    {flash.error}
                </div>
            )}
            {localError && (
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 p-4 mb-4 rounded-2xl text-sm">
                    {localError}
                </div>
            )}

            <div className="flex items-center gap-2 mb-4">
                <button
                    type="button"
                    onClick={() => setTab("translations")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                        tab === "translations"
                            ? "bg-[#1E5EFF] text-white"
                            : "bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
                >
                    {t("customization.tab.translations", "Terjemahan")}
                </button>
                <button
                    type="button"
                    onClick={() => setTab("navbar")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                        tab === "navbar"
                            ? "bg-[#1E5EFF] text-white"
                            : "bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
                >
                    {t("customization.tab.navbar", "Navbar")}
                </button>
            </div>

            {tab === "translations" ? (
                <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white">
                                {t("customization.translations.title", "Terjemahan")}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {t(
                                    "customization.translations.help",
                                    "Edit langsung tanpa JSON. Tambah baris untuk key baru.",
                                )}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={saveTranslationsAll}
                                disabled={processing}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#1E5EFF] hover:bg-[#194FD8] transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {t("actions.save", "Simpan")}
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="w-full sm:max-w-md">
                            <input
                                type="text"
                                value={translationSearch}
                                onChange={(e) => {
                                    setTranslationSearch(e.target.value);
                                    setTranslationPage(1);
                                }}
                                placeholder={t(
                                    "customization.translations.search_placeholder",
                                    "Cari key / ID / EN...",
                                )}
                                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5] text-sm"
                            />
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                {t(
                                    "filters.auto_apply",
                                    "Filter dijalankan otomatis setelah selesai mengetik.",
                                )}
                            </p>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                            {t(
                                "pagination.showing",
                                "Menampilkan {from} - {to} dari {total} data",
                                {
                                    from:
                                        translationTotal === 0
                                            ? 0
                                            : (safeTranslationPage - 1) *
                                                  pageSize +
                                              1,
                                    to: Math.min(
                                        safeTranslationPage * pageSize,
                                        translationTotal,
                                    ),
                                    total: translationTotal,
                                },
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/10">
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[28%]">
                                        {t("customization.translations.key", "Key")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[36%]">
                                        {t("customization.translations.id", "ID")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[36%]">
                                        {t("customization.translations.en", "EN")}
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[1%]">
                                        &nbsp;
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                                {pagedTranslationRows.map(({ row, idx }) => (
                                    <tr key={`${row.key}-${idx}`}>
                                        <td className="px-4 py-3">
                                            <input
                                                value={row.key}
                                                onChange={(e) =>
                                                    updateRow(idx, {
                                                        key: e.target.value,
                                                    })
                                                }
                                                placeholder={t(
                                                    "customization.translations.key_placeholder",
                                                    "contoh: nav.dashboard",
                                                )}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5] text-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                value={row.id}
                                                onChange={(e) =>
                                                    updateRow(idx, {
                                                        id: e.target.value,
                                                    })
                                                }
                                                placeholder={t(
                                                    "customization.translations.id_placeholder",
                                                    "Dashboard / Kendaraan / ...",
                                                )}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5] text-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                value={row.en}
                                                onChange={(e) =>
                                                    updateRow(idx, {
                                                        en: e.target.value,
                                                    })
                                                }
                                                placeholder={t(
                                                    "customization.translations.en_placeholder",
                                                    "Dashboard / Vehicle / ...",
                                                )}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5] text-sm"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            {!row.isDefault && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeRow(idx)
                                                    }
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition cursor-pointer"
                                                    title={t(
                                                        "customization.translations.remove_row",
                                                        "Hapus baris",
                                                    )}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {translationTotalPages > 1 && (
                        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                            <button
                                type="button"
                                onClick={() =>
                                    setTranslationPage((p) =>
                                        Math.max(1, p - 1),
                                    )
                                }
                                disabled={safeTranslationPage <= 1}
                                className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {t("pagination.prev", "Prev")}
                            </button>

                            <div className="flex items-center gap-1 flex-wrap">
                                {translationPageItems.map((it, idx) =>
                                    typeof it === "number" ? (
                                        <button
                                            key={`page-${it}`}
                                            type="button"
                                            onClick={() => setTranslationPage(it)}
                                            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                                                it === safeTranslationPage
                                                    ? "bg-[#1E5EFF] text-white border-[#1E5EFF]"
                                                    : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                            }`}
                                        >
                                            {it}
                                        </button>
                                    ) : (
                                        <span
                                            key={`dots-${idx}`}
                                            className="px-2 text-sm text-slate-400 dark:text-slate-500 select-none"
                                        >
                                            {it}
                                        </span>
                                    ),
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setTranslationPage((p) =>
                                        Math.min(translationTotalPages, p + 1),
                                    )
                                }
                                disabled={safeTranslationPage >= translationTotalPages}
                                className="px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {t("pagination.next", "Next")}
                            </button>
                        </div>
                    )}

                    {errors?.translations && (
                        <p className="text-xs text-red-500 mt-3">
                            {errors.translations}
                        </p>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-[#111633] border border-slate-200 dark:border-white/10 rounded-2xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div>
                            <h2 className="font-semibold text-slate-900 dark:text-white">
                                {t("customization.navbar.title", "Navbar")}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {t(
                                    "customization.navbar.help",
                                    "Drag untuk mengurutkan. Klik titik-3 untuk aktif/nonaktif.",
                                )}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={saveNavbar}
                            disabled={processing}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-[#1E5EFF] hover:bg-[#194FD8] transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {t("actions.save", "Simpan")}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] p-4">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                {t(
                                    "customization.navbar.preview_title",
                                    "Preview Sidebar (editable)",
                                )}
                            </div>
                            <div className="space-y-2">
                                {navItems.map((item, idx) => {
                                    const path = ["item", idx, null];
                                    const isGroup = item.type === "group";
                                    const isDragOver =
                                        dragOverPath &&
                                        JSON.stringify(dragOverPath) ===
                                            JSON.stringify(path);
                                    return (
                                        <div
                                            key={item.key || idx}
                                            draggable
                                            onDragStart={() =>
                                                onDragStart(path)
                                            }
                                            onDragEnter={() =>
                                                setDragOverPath(path)
                                            }
                                            onDragEnd={() => {
                                                dragRef.current = null;
                                                setDragOverPath(null);
                                            }}
                                            onDragOver={(e) =>
                                                e.preventDefault()
                                            }
                                            onDrop={() => onDrop(path)}
                                            className={`rounded-xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.02] transition-shadow ${
                                                isDragOver
                                                    ? "ring-2 ring-[#1FD1A5]/40 shadow-lg shadow-[#1FD1A5]/10"
                                                    : "shadow-sm"
                                            } ${
                                                item.active
                                                    ? ""
                                                    : "opacity-60"
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2 px-3 py-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-slate-400">
                                                        <GripVertical
                                                            size={16}
                                                        />
                                                    </span>
                                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                                        {item.label_key ||
                                                            item.key}
                                                    </span>
                                                    {item.active ? null : (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                                                            {t(
                                                                "customization.navbar.inactive",
                                                                "inactive",
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                {renderMenuButton(
                                                    path,
                                                    Boolean(item.active),
                                                )}
                                            </div>

                                            {isGroup &&
                                                Array.isArray(item.children) && (
                                                    <div className="pb-2 pl-6 pr-3 space-y-1">
                                                        {item.children.map(
                                                            (child, cIdx) => {
                                                                const cPath = [
                                                                    "child",
                                                                    idx,
                                                                    cIdx,
                                                                ];
                                                                const isChildDragOver =
                                                                    dragOverPath &&
                                                                    JSON.stringify(
                                                                        dragOverPath,
                                                                    ) ===
                                                                        JSON.stringify(
                                                                            cPath,
                                                                        );
                                                                return (
                                                                    <div
                                                                        key={
                                                                            child.key ||
                                                                            cIdx
                                                                        }
                                                                        draggable
                                                                        onDragStart={() =>
                                                                            onDragStart(
                                                                                cPath,
                                                                            )
                                                                        }
                                                                        onDragEnter={() =>
                                                                            setDragOverPath(
                                                                                cPath,
                                                                            )
                                                                        }
                                                                        onDragEnd={() => {
                                                                            dragRef.current =
                                                                                null;
                                                                            setDragOverPath(
                                                                                null,
                                                                            );
                                                                        }}
                                                                        onDragOver={(
                                                                            e,
                                                                        ) =>
                                                                            e.preventDefault()
                                                                        }
                                                                        onDrop={() =>
                                                                            onDrop(
                                                                                cPath,
                                                                            )
                                                                        }
                                                                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition ${
                                                                            isChildDragOver
                                                                                ? "ring-2 ring-[#1FD1A5]/40 bg-slate-100/70 dark:bg-white/[0.03]"
                                                                                : ""
                                                                        } ${
                                                                            child.active
                                                                                ? ""
                                                                                : "opacity-60"
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-2 min-w-0">
                                                                            <span className="text-slate-400">
                                                                                <GripVertical
                                                                                    size={
                                                                                        14
                                                                                    }
                                                                                />
                                                                            </span>
                                                                            <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                                                                                {child.label_key ||
                                                                                    child.key}
                                                                            </span>
                                                                        </div>
                                                                        {renderMenuButton(
                                                                            cPath,
                                                                            Boolean(
                                                                                child.active,
                                                                            ),
                                                                        )}
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111633] p-4">
                            <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                {t(
                                    "customization.navbar.label_key",
                                    "Label Key / URL",
                                )}
                            </div>
                            <div className="space-y-3">
                                {navItems.map((item, idx) => (
                                    <div
                                        key={`edit-${item.key || idx}`}
                                        className="rounded-xl border border-slate-200 dark:border-white/10 p-3"
                                    >
                                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                                            {item.type === "group"
                                                ? t(
                                                      "customization.navbar.group",
                                                      "Group",
                                                  )
                                                : t(
                                                      "customization.navbar.link",
                                                      "Link",
                                                  )}
                                        </div>
                                        <input
                                            value={item.label_key || ""}
                                            onChange={(e) =>
                                                setNavState((prev) => {
                                                    const next =
                                                        structuredClone(prev);
                                                    next.items[idx].label_key =
                                                        e.target.value;
                                                    return next;
                                                })
                                            }
                                            placeholder={t(
                                                "customization.navbar.label_key_placeholder",
                                                "contoh: nav.vehicle",
                                            )}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5] text-sm"
                                        />
                                        {item.type !== "group" && (
                                            <input
                                                value={item.href || ""}
                                                onChange={(e) =>
                                                    setNavState((prev) => {
                                                        const next =
                                                            structuredClone(
                                                                prev,
                                                            );
                                                        next.items[idx].href =
                                                            e.target.value;
                                                        return next;
                                                    })
                                                }
                                                placeholder={t(
                                                    "customization.navbar.href_placeholder",
                                                    "/admin/vehicles",
                                                )}
                                                className="w-full mt-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B1026] text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#1FD1A5]/50 focus:border-[#1FD1A5] text-sm"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {errors?.navbar && (
                        <p className="text-xs text-red-500 mt-3">
                            {errors.navbar}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

Customization.layout = (page) => <AdminLayout children={page} />;
