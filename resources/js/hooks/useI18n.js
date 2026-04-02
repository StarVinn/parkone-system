import { usePage } from "@inertiajs/react";

export default function useI18n() {
    const { i18n } = usePage().props;
    const locale = i18n?.locale || "id";
    const strings = i18n?.strings || {};

    const t = (key, fallback = null, vars = null) => {
        if (!key) return "";

        if (Object.prototype.hasOwnProperty.call(strings, key)) {
            const value = strings[key];
            if (typeof value !== "string") return fallback ?? key;

            if (vars && typeof vars === "object") {
                return Object.keys(vars).reduce((acc, k) => {
                    const v = vars[k];
                    return acc.replaceAll(`{${k}}`, v == null ? "" : String(v));
                }, value);
            }

            return value;
        }

        if (typeof fallback === "string" && vars && typeof vars === "object") {
            return Object.keys(vars).reduce((acc, k) => {
                const v = vars[k];
                return acc.replaceAll(`{${k}}`, v == null ? "" : String(v));
            }, fallback);
        }

        return fallback ?? key;
    };

    return { locale, strings, t };
}
