/**
 * @typedef {Object} ContextMenuEntry
 * @prop {String} name
 * @prop {String} icon
 * @prop {String} classes
 * @prop {String} group
 * @prop {CallableFunction} callback
 * @prop {Boolean} condition
 */

/**
 * A specialized subclass of ContextMenu that places the menu in a fixed position.
 * @extends {ContextMenu}
 */
export default class PtaContextMenu extends foundry.applications.ux.ContextMenu.implementation {

    /**
     * Reference to the constructor setup in core foundry as reference
     * @param {HTMLElement} element - Target element to contain the context menu in
     * @param {string} selector - CSS selector for what can pull up the menu
     * @param {ContextMenuEntry} menuItems - default menu items for the popup
     * @param {Object} options - additional config options to use
     * @param {string} options.eventName
     * @param {CallableFunction} options.onOpen
     * @param {CallableFunction} options.onClose
     * @param {Boolean} [options.jQuery=true]
     * @param {Boolean} [options.fixed=false]
     */
    constructor(element, selector, menuItems, options) {
        super(element, selector, menuItems, options)
    }

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