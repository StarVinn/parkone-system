export default {
    darkMode: "class",
    content: [
        "./resources/**/*.js",
        "./resources/**/*.jsx",
        "./resources/**/*.blade.php",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    blue: "#1E5EFF",
                    teal: "#1FD1A5",
                },
                darkbg: {
                    primary: "#0B1026",
                    secondary: "#121933",
                    card: "#1A2245",
                },
                lightbg: {
                    primary: "#F4F6FA",
                    secondary: "#E9EEF7",
                    card: "#FFFFFF",
                },
            },
        },
    },
    plugins: [],
};
