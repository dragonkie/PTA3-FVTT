/**
 * A specialized subclass of ContextMenu that places the menu in a fixed position.
 * @extends {ContextMenu}
 */
export default class PtaContextMenu extends foundry.applications.ux.ContextMenu.implementation {
    /** @override */
    _setPosition(html, target, { event } = {}) {
        // Sets up the positioning
        document.body.appendChild(html);
        const { clientWidth, clientHeight } = document.documentElement;
        const { width, height } = html.getBoundingClientRect();
        const { clientX, clientY } = event;
        const left = Math.min(clientX, clientWidth - width) + 1;
        const direction = clientY + height > clientHeight;

        // Adds classes to match the given position
        html.classList.add("pta");
        html.classList.toggle("expand-up", direction);
        html.classList.toggle("expand-down", !direction);
        html.style.visibility = "";
        html.style.left = `${left}px`;

        if (direction) html.style.bottom = `${clientHeight - clientY}px`;
        else html.style.top = `${clientY + 1}px`;

        target.classList.add("context");
        html.style.zIndex = `${foundry.applications.api.ApplicationV2._maxZ + 1}`;
    }
}