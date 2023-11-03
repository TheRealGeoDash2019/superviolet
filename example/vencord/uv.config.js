/*global Superviolet*/
self.__sv$config = {
    /**
     * The prefix for SV (Superviolet) resources.
     * @type {string}
     */
    prefix: '/~/sv/',

    /**
     * The bare path.
     * @type {string}
     */
    bare: '/bare/',

    /**
     * Function to encode URLs using Superviolet's XOR codec.
     * @type {function}
     * @param {string} url - The URL to encode.
     * @returns {string} The encoded URL.
     */
    encodeUrl: Superviolet.codec.xor.encode,

    /**
     * Function to decode URLs using Superviolet's XOR codec.
     * @type {function}
     * @param {string} url - The URL to decode.
     * @returns {string} The decoded URL.
     */
    decodeUrl: Superviolet.codec.xor.decode,

    /**
     * The handler path.
     * @type {string}
     */
    handler: '/sv/sv.handler.js',

    /**
     * The client path.
     * @type {string}
     */
    client: '/sv/sv.client.js',

    /**
     * The bundle path.
     * @type {string}
     */
    bundle: '/sv/sv.bundle.js',

    /**
     * The config path.
     * @type {string}
     */
    config: '/sv/sv.config.js',

    /**
     * The service worker path.
     * @type {string}
     */
    sw: '/sv/sv.sw.js',

    /**
     * Function to inject scripts into the doc Head
     * @type {function}
     * @param {URL} url - The URL for the rewrite function.
     * @returns {string} - The script to inject.
     */
    inject: async (url) => {
        if (url.host === 'discord.com') {
            return `
                <script src="https://raw.githubusercontent.com/Vencord/builds/main/browser.js"></script>
                <link rel="stylesheet" href="https://raw.githubusercontent.com/Vencord/builds/main/browser.css">
              `;
        }

        return ``;
    },
};
