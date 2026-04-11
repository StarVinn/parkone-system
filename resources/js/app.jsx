import "./bootstrap";
import { useEffect } from "react";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { route } from "ziggy-js";
import logo from "./Assets/Images/logo-parkone.png";

function InertiaRoot({ App, props }) {
    useEffect(() => {
        const head = document.head;
        let favicon = head.querySelector('link[rel="icon"]');

        if (!favicon) {
            favicon = document.createElement("link");
            favicon.rel = "icon";
            head.appendChild(favicon);
        }

        favicon.type = "image/png";
        favicon.href = logo;
    }, []);

    return <App {...props} />;
}

createInertiaApp({
    title: () => "PARKONE",
    resolve: (name) => {
        const pages = import.meta.glob("./Pages/**/*.jsx", { eager: true });
        return pages[`./Pages/${name}.jsx`];
    },

    setup({ el, App, props }) {
        window.route = (name, params, absolute) =>
            route(name, params, absolute, props.initialPage.props.ziggy);

        createRoot(el).render(<InertiaRoot App={App} props={props} />);
    },
});
