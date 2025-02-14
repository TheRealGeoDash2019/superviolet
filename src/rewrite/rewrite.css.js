/**
 * @typedef {import('./index').default} Superviolet
 */

/**
 *
 * @param {Superviolet} ctx
 */
function url(ctx) {
    const { css } = ctx;
    css.on('Url', (node, data, type) => {
        node.value =
            type === 'rewrite'
                ? ctx.rewriteUrl(node.value)
                : ctx.sourceUrl(node.value);
    });
}

/**
 *
 * @param {Superviolet} ctx
 */
function importStyle(ctx) {
    const { css } = ctx;
    css.on('Atrule', (node, data, type) => {
        if (node.name !== 'import') return false;
        const { data: url } = node.prelude.children.head;
        // Already handling Url's
        if (url.type === 'Url') return false;
        url.value =
            type === 'rewrite'
                ? ctx.rewriteUrl(url.value)
                : ctx.sourceUrl(url.value);
    });
}

export { url, importStyle };
