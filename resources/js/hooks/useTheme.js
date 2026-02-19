import { useEffect, useState } from "react";

export default function useTheme() {
    const [darkMode, setDarkMode] = useState(
        localStorage.getItem("theme") === "dark",
    );

    useEffect(() => {
        const root = window.document.documentElement;

        if (darkMode) {
            root.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            root.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }, [darkMode]);

    return { darkMode, setDarkMode };
}
