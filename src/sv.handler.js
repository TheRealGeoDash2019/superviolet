/**
 * @type {import('../sv').SupervioletCtor}
 */
const Superviolet = self.Superviolet;

/**
 * @type {import('../sv').SVClientCtor}
 */
const SVClient = self.SVClient;

/**
 * @type {import('../sv').SVConfig}
 */
const __sv$config = self.__sv$config;

/**
 * @type {import('@tomphttp/bare-client').BareManifest}
 */
const __sv$bareData = self.__sv$bareData;

/**
 * @type {string}
 */
const __sv$bareURL = self.__sv$bareURL;

/**
 * @type {string}
 */
const __sv$cookies = self.__sv$cookies;

if (
    typeof __sv$bareData !== 'object' ||
    typeof __sv$bareURL !== 'string' ||
    typeof __sv$cookies !== 'string'
)
    throw new TypeError('Unable to load global SV data');

if (!self.__sv) __svHook(self);

self.__svHook = __svHook;

/**
 *
 * @param {typeof globalThis} window
 * @returns
 */
function __svHook(window) {
    if ('__sv' in window && window.__sv instanceof Superviolet) return false;

    if (window.document && !!window.window) {
        window.document
            .querySelectorAll('script[__sv-script]')
            .forEach((node) => node.remove());
    }

    const worker = !window.window;
    const master = '__sv';
    const methodPrefix = '__sv$';
    const __sv = new Superviolet(__sv$config);

    /*if (typeof config.construct === 'function') {
        config.construct(__sv, worker ? 'worker' : 'window');
    }*/

    // websockets
    const bareClient = new Superviolet.BareClient(__sv$bareURL, __sv$bareData);

    const client = new SVClient(window, bareClient, worker);
    const {
        HTMLMediaElement,
        HTMLScriptElement,
        HTMLAudioElement,
        HTMLVideoElement,
        HTMLInputElement,
        HTMLEmbedElement,
        HTMLTrackElement,
        HTMLAnchorElement,
        HTMLIFrameElement,
        HTMLAreaElement,
        HTMLLinkElement,
        HTMLBaseElement,
        HTMLFormElement,
        HTMLImageElement,
        HTMLSourceElement,
    } = window;

    client.nativeMethods.defineProperty(window, '__sv', {
        value: __sv,
        enumerable: false,
    });

    __sv.meta.origin = location.origin;
    __sv.location = client.location.emulate(
        (href) => {
            if (href === 'about:srcdoc') return new URL(href);
            if (href.startsWith('blob:')) href = href.slice('blob:'.length);
            return new URL(__sv.sourceUrl(href));
        },
        (href) => {
            return __sv.rewriteUrl(href);
        }
    );

    let cookieStr = __sv$cookies;

    __sv.meta.url = __sv.location;
    __sv.domain = __sv.meta.url.host;
    __sv.blobUrls = new window.Map();
    __sv.referrer = '';
    __sv.cookies = [];
    __sv.localStorageObj = {};
    __sv.sessionStorageObj = {};

    if (__sv.location.href === 'about:srcdoc') {
        __sv.meta = window.parent.__sv.meta;
    }

    if (window.EventTarget) {
        __sv.addEventListener = window.EventTarget.prototype.addEventListener;
        __sv.removeListener = window.EventTarget.prototype.removeListener;
        __sv.dispatchEvent = window.EventTarget.prototype.dispatchEvent;
    }

    // Storage wrappers
    client.nativeMethods.defineProperty(
        client.storage.storeProto,
        '__sv$storageObj',
        {
            get() {
                if (this === client.storage.sessionStorage)
                    return __sv.sessionStorageObj;
                if (this === client.storage.localStorage)
                    return __sv.localStorageObj;
            },
            enumerable: false,
        }
    );

    if (window.localStorage) {
        for (const key in window.localStorage) {
            if (key.startsWith(methodPrefix + __sv.location.origin + '@')) {
                __sv.localStorageObj[
                    key.slice(
                        (methodPrefix + __sv.location.origin + '@').length
                    )
                ] = window.localStorage.getItem(key);
            }
        }

        __sv.lsWrap = client.storage.emulate(
            client.storage.localStorage,
            __sv.localStorageObj
        );
    }

    if (window.sessionStorage) {
        for (const key in window.sessionStorage) {
            if (key.startsWith(methodPrefix + __sv.location.origin + '@')) {
                __sv.sessionStorageObj[
                    key.slice(
                        (methodPrefix + __sv.location.origin + '@').length
                    )
                ] = window.sessionStorage.getItem(key);
            }
        }

        __sv.ssWrap = client.storage.emulate(
            client.storage.sessionStorage,
            __sv.sessionStorageObj
        );
    }

    let rawBase = window.document
        ? client.node.baseURI.get.call(window.document)
        : window.location.href;
    let base = __sv.sourceUrl(rawBase);

    client.nativeMethods.defineProperty(__sv.meta, 'base', {
        get() {
            if (!window.document) return __sv.meta.url.href;

            if (client.node.baseURI.get.call(window.document) !== rawBase) {
                rawBase = client.node.baseURI.get.call(window.document);
                base = __sv.sourceUrl(rawBase);
            }

            return base;
        },
    });

    __sv.methods = {
        setSource: methodPrefix + 'setSource',
        source: methodPrefix + 'source',
        location: methodPrefix + 'location',
        function: methodPrefix + 'function',
        string: methodPrefix + 'string',
        eval: methodPrefix + 'eval',
        parent: methodPrefix + 'parent',
        top: methodPrefix + 'top',
    };

    __sv.filterKeys = [
        master,
        __sv.methods.setSource,
        __sv.methods.source,
        __sv.methods.location,
        __sv.methods.function,
        __sv.methods.string,
        __sv.methods.eval,
        __sv.methods.parent,
        __sv.methods.top,
        methodPrefix + 'protocol',
        methodPrefix + 'storageObj',
        methodPrefix + 'url',
        methodPrefix + 'modifiedStyle',
        methodPrefix + 'config',
        methodPrefix + 'dispatched',
        'Superviolet',
        '__svHook',
    ];

    client.on('wrap', (target, wrapped) => {
        client.nativeMethods.defineProperty(
            wrapped,
            'name',
            client.nativeMethods.getOwnPropertyDescriptor(target, 'name')
        );
        client.nativeMethods.defineProperty(
            wrapped,
            'length',
            client.nativeMethods.getOwnPropertyDescriptor(target, 'length')
        );

        client.nativeMethods.defineProperty(wrapped, __sv.methods.string, {
            enumerable: false,
            value: client.nativeMethods.fnToString.call(target),
        });

        client.nativeMethods.defineProperty(wrapped, __sv.methods.function, {
            enumerable: false,
            value: target,
        });
    });

    client.fetch.on('request', (event) => {
        event.data.input = __sv.rewriteUrl(event.data.input);
    });

    client.fetch.on('requestUrl', (event) => {
        event.data.value = __sv.sourceUrl(event.data.value);
    });

    client.fetch.on('responseUrl', (event) => {
        event.data.value = __sv.sourceUrl(event.data.value);
    });

    // XMLHttpRequest
    client.xhr.on('open', (event) => {
        event.data.input = __sv.rewriteUrl(event.data.input);
    });

    client.xhr.on('responseUrl', (event) => {
        event.data.value = __sv.sourceUrl(event.data.value);
    });

    // Workers
    client.workers.on('worker', (event) => {
        event.data.url = __sv.rewriteUrl(event.data.url);
    });

    client.workers.on('addModule', (event) => {
        event.data.url = __sv.rewriteUrl(event.data.url);
    });

    client.workers.on('importScripts', (event) => {
        for (const i in event.data.scripts) {
            event.data.scripts[i] = __sv.rewriteUrl(event.data.scripts[i]);
        }
    });

    client.workers.on('postMessage', (event) => {
        let to = event.data.origin;

        event.data.origin = '*';
        event.data.message = {
            __data: event.data.message,
            __origin: __sv.meta.url.origin,
            __to: to,
        };
    });

    // Navigator
    client.navigator.on('sendBeacon', (event) => {
        event.data.url = __sv.rewriteUrl(event.data.url);
    });

    // Cookies
    client.document.on('getCookie', (event) => {
        event.data.value = cookieStr;
    });

    client.document.on('setCookie', (event) => {
        __sv.cookie.db().then((db) => {
            __sv.cookie.setCookies(event.data.value, db, __sv.meta);

            __sv.cookie.getCookies(db).then((cookies) => {
                cookieStr = __sv.cookie.serialize(cookies, __sv.meta, true);
            });
        });

        const cookie = __sv.cookie.setCookie(event.data.value)[0];

        if (!cookie.path) cookie.path = '/';
        if (!cookie.domain) cookie.domain = __sv.meta.url.hostname;

        if (__sv.cookie.validateCookie(cookie, __sv.meta, true)) {
            if (cookieStr.length) cookieStr += '; ';
            cookieStr += `${cookie.name}=${cookie.value}`;
        }

        event.respondWith(event.data.value);
    });

    // HTML
    client.element.on('setInnerHTML', (event) => {
        switch (event.that.tagName) {
            case 'SCRIPT':
                event.data.value = __sv.js.rewrite(event.data.value);
                break;
            case 'STYLE':
                event.data.value = __sv.rewriteCSS(event.data.value);
                break;
            default:
                event.data.value = __sv.rewriteHtml(event.data.value);
        }
    });

    client.element.on('getInnerHTML', (event) => {
        switch (event.that.tagName) {
            case 'SCRIPT':
                event.data.value = __sv.js.source(event.data.value);
                break;
            default:
                event.data.value = __sv.sourceHtml(event.data.value);
        }
    });

    client.element.on('setOuterHTML', (event) => {
        event.data.value = __sv.rewriteHtml(event.data.value, {
            document: event.that.tagName === 'HTML',
        });
    });

    client.element.on('getOuterHTML', (event) => {
        switch (event.that.tagName) {
            case 'HEAD':
                event.data.value = __sv
                    .sourceHtml(
                        event.data.value.replace(
                            /<head(.*)>(.*)<\/head>/s,
                            '<op-head$1>$2</op-head>'
                        )
                    )
                    .replace(
                        /<op-head(.*)>(.*)<\/op-head>/s,
                        '<head$1>$2</head>'
                    );
                break;
            case 'BODY':
                event.data.value = __sv
                    .sourceHtml(
                        event.data.value.replace(
                            /<body(.*)>(.*)<\/body>/s,
                            '<op-body$1>$2</op-body>'
                        )
                    )
                    .replace(
                        /<op-body(.*)>(.*)<\/op-body>/s,
                        '<body$1>$2</body>'
                    );
                break;
            default:
                event.data.value = __sv.sourceHtml(event.data.value, {
                    document: event.that.tagName === 'HTML',
                });
                break;
        }

        //event.data.value = __sv.sourceHtml(event.data.value, { document: event.that.tagName === 'HTML' });
    });

    client.document.on('write', (event) => {
        if (!event.data.html.length) return false;
        event.data.html = [__sv.rewriteHtml(event.data.html.join(''))];
    });

    client.document.on('writeln', (event) => {
        if (!event.data.html.length) return false;
        event.data.html = [__sv.rewriteHtml(event.data.html.join(''))];
    });

    client.element.on('insertAdjacentHTML', (event) => {
        event.data.html = __sv.rewriteHtml(event.data.html);
    });

    // EventSource

    client.eventSource.on('construct', (event) => {
        event.data.url = __sv.rewriteUrl(event.data.url);
    });

    client.eventSource.on('url', (event) => {
        event.data.url = __sv.rewriteUrl(event.data.url);
    });

    // IDB
    client.idb.on('idbFactoryOpen', (event) => {
        // Don't modify the Superviolet cookie database
        if (event.data.name === '__op') return;
        event.data.name = `${__sv.meta.url.origin}@${event.data.name}`;
    });

    client.idb.on('idbFactoryName', (event) => {
        event.data.value = event.data.value.slice(
            __sv.meta.url.origin.length + 1 /*the @*/
        );
    });

    // History
    client.history.on('replaceState', (event) => {
        if (event.data.url)
            event.data.url = __sv.rewriteUrl(
                event.data.url,
                '__sv' in event.that ? event.that.__sv.meta : __sv.meta
            );
    });
    client.history.on('pushState', (event) => {
        if (event.data.url)
            event.data.url = __sv.rewriteUrl(
                event.data.url,
                '__sv' in event.that ? event.that.__sv.meta : __sv.meta
            );
    });

    // Element get set attribute methods
    client.element.on('getAttribute', (event) => {
        if (
            client.element.hasAttribute.call(
                event.that,
                __sv.attributePrefix + '-attr-' + event.data.name
            )
        ) {
            event.respondWith(
                event.target.call(
                    event.that,
                    __sv.attributePrefix + '-attr-' + event.data.name
                )
            );
        }
    });

    // Message
    client.message.on('postMessage', (event) => {
        let to = event.data.origin;
        let call = __sv.call;

        if (event.that) {
            call = event.that.__sv$source.call;
        }

        event.data.origin = '*';
        event.data.message = {
            __data: event.data.message,
            __origin: (event.that || event.target).__sv$source.location.origin,
            __to: to,
        };

        event.respondWith(
            worker
                ? call(
                      event.target,
                      [event.data.message, event.data.transfer],
                      event.that
                  )
                : call(
                      event.target,
                      [
                          event.data.message,
                          event.data.origin,
                          event.data.transfer,
                      ],
                      event.that
                  )
        );
    });

    client.message.on('data', (event) => {
        const { value: data } = event.data;
        if (
            typeof data === 'object' &&
            '__data' in data &&
            '__origin' in data
        ) {
            event.respondWith(data.__data);
        }
    });

    client.message.on('origin', (event) => {
        const data = client.message.messageData.get.call(event.that);
        if (typeof data === 'object' && data.__data && data.__origin) {
            event.respondWith(data.__origin);
        }
    });

    client.overrideDescriptor(window, 'origin', {
        get: () => {
            return __sv.location.origin;
        },
    });

    client.node.on('baseURI', (event) => {
        if (event.data.value.startsWith(window.location.origin))
            event.data.value = __sv.sourceUrl(event.data.value);
    });

    client.element.on('setAttribute', (event) => {
        if (
            event.that instanceof HTMLMediaElement &&
            event.data.name === 'src' &&
            event.data.value.startsWith('blob:')
        ) {
            event.target.call(
                event.that,
                __sv.attributePrefix + '-attr-' + event.data.name,
                event.data.value
            );
            event.data.value = __sv.blobUrls.get(event.data.value);
            return;
        }

        if (__sv.attrs.isUrl(event.data.name)) {
            event.target.call(
                event.that,
                __sv.attributePrefix + '-attr-' + event.data.name,
                event.data.value
            );
            event.data.value = __sv.rewriteUrl(event.data.value);
        }

        if (__sv.attrs.isStyle(event.data.name)) {
            event.target.call(
                event.that,
                __sv.attributePrefix + '-attr-' + event.data.name,
                event.data.value
            );
            event.data.value = __sv.rewriteCSS(event.data.value, {
                context: 'declarationList',
            });
        }

        if (__sv.attrs.isHtml(event.data.name)) {
            event.target.call(
                event.that,
                __sv.attributePrefix + '-attr-' + event.data.name,
                event.data.value
            );
            event.data.value = __sv.rewriteHtml(event.data.value, {
                ...__sv.meta,
                document: true,
                injectHead: __sv.createHtmlInject(
                    __sv.handlerScript,
                    __sv.bundleScript,
                    __sv.clientScript,
                    __sv.configScript,
                    __sv$bareURL,
                    __sv$bareData,
                    cookieStr,
                    window.location.href
                ),
            });
        }

        if (__sv.attrs.isSrcset(event.data.name)) {
            event.target.call(
                event.that,
                __sv.attributePrefix + '-attr-' + event.data.name,
                event.data.value
            );
            event.data.value = __sv.html.wrapSrcset(
                event.data.value.toString()
            );
        }

        if (__sv.attrs.isForbidden(event.data.name)) {
            event.data.name = __sv.attributePrefix + '-attr-' + event.data.name;
        }
    });

    client.element.on('audio', (event) => {
        event.data.url = __sv.rewriteUrl(event.data.url);
    });

    // Element Property Attributes
    client.element.hookProperty(
        [HTMLAnchorElement, HTMLAreaElement, HTMLLinkElement, HTMLBaseElement],
        'href',
        {
            get: (target, that) => {
                return __sv.sourceUrl(target.call(that));
            },
            set: (target, that, [val]) => {
                client.element.setAttribute.call(
                    that,
                    __sv.attributePrefix + '-attr-href',
                    val
                );
                target.call(that, __sv.rewriteUrl(val));
            },
        }
    );

    client.element.hookProperty(
        [
            HTMLScriptElement,
            HTMLAudioElement,
            HTMLVideoElement,
            HTMLMediaElement,
            HTMLImageElement,
            HTMLInputElement,
            HTMLEmbedElement,
            HTMLIFrameElement,
            HTMLTrackElement,
            HTMLSourceElement,
        ],
        'src',
        {
            get: (target, that) => {
                return __sv.sourceUrl(target.call(that));
            },
            set: (target, that, [val]) => {
                if (
                    new String(val).toString().trim().startsWith('blob:') &&
                    that instanceof HTMLMediaElement
                ) {
                    client.element.setAttribute.call(
                        that,
                        __sv.attributePrefix + '-attr-src',
                        val
                    );
                    return target.call(that, __sv.blobUrls.get(val) || val);
                }

                client.element.setAttribute.call(
                    that,
                    __sv.attributePrefix + '-attr-src',
                    val
                );
                target.call(that, __sv.rewriteUrl(val));
            },
        }
    );

    client.element.hookProperty([HTMLFormElement], 'action', {
        get: (target, that) => {
            return __sv.sourceUrl(target.call(that));
        },
        set: (target, that, [val]) => {
            client.element.setAttribute.call(
                that,
                __sv.attributePrefix + '-attr-action',
                val
            );
            target.call(that, __sv.rewriteUrl(val));
        },
    });

    client.element.hookProperty([HTMLImageElement], 'srcset', {
        get: (target, that) => {
            return (
                client.element.getAttribute.call(
                    that,
                    __sv.attributePrefix + '-attr-srcset'
                ) || target.call(that)
            );
        },
        set: (target, that, [val]) => {
            client.element.setAttribute.call(
                that,
                __sv.attributePrefix + '-attr-srcset',
                val
            );
            target.call(that, __sv.html.wrapSrcset(val.toString()));
        },
    });

    client.element.hookProperty(HTMLScriptElement, 'integrity', {
        get: (target, that) => {
            return client.element.getAttribute.call(
                that,
                __sv.attributePrefix + '-attr-integrity'
            );
        },
        set: (target, that, [val]) => {
            client.element.setAttribute.call(
                that,
                __sv.attributePrefix + '-attr-integrity',
                val
            );
        },
    });

    client.element.hookProperty(HTMLIFrameElement, 'sandbox', {
        get: (target, that) => {
            return (
                client.element.getAttribute.call(
                    that,
                    __sv.attributePrefix + '-attr-sandbox'
                ) || target.call(that)
            );
        },
        set: (target, that, [val]) => {
            client.element.setAttribute.call(
                that,
                __sv.attributePrefix + '-attr-sandbox',
                val
            );
        },
    });

    // HTMLIFrameElement may not be defined (workers)
    const contentWindowGet =
        HTMLIFrameElement &&
        Object.getOwnPropertyDescriptor(
            HTMLIFrameElement.prototype,
            'contentWindow'
        ).get;

    function svInject(that) {
        const win = contentWindowGet.call(that);

        if (!win.__sv)
            try {
                __svHook(win);
            } catch (e) {
                console.error('catastrophic failure');
                console.error(e);
            }
    }

    client.element.hookProperty(HTMLIFrameElement, 'contentWindow', {
        get: (target, that) => {
            svInject(that);
            return target.call(that);
        },
    });

    client.element.hookProperty(HTMLIFrameElement, 'contentDocument', {
        get: (target, that) => {
            svInject(that);
            return target.call(that);
        },
    });

    client.element.hookProperty(HTMLIFrameElement, 'srcdoc', {
        get: (target, that) => {
            return (
                client.element.getAttribute.call(
                    that,
                    __sv.attributePrefix + '-attr-srcdoc'
                ) || target.call(that)
            );
        },
        set: (target, that, [val]) => {
            target.call(
                that,
                __sv.rewriteHtml(val, {
                    document: true,
                    injectHead: __sv.createHtmlInject(
                        __sv.handlerScript,
                        __sv.bundleScript,
                        __sv.clientScript,
                        __sv.configScript,
                        __sv$bareURL,
                        __sv$bareData,
                        cookieStr,
                        window.location.href
                    ),
                })
            );
        },
    });

    client.node.on('getTextContent', (event) => {
        if (event.that.tagName === 'SCRIPT') {
            event.data.value = __sv.js.source(event.data.value);
        }
    });

    client.node.on('setTextContent', (event) => {
        if (event.that.tagName === 'SCRIPT') {
            event.data.value = __sv.js.rewrite(event.data.value);
        }
    });

    // Until proper rewriting is implemented for service workers.
    // Not sure atm how to implement it with the already built in service worker
    if ('serviceWorker' in window.navigator) {
        delete window.Navigator.prototype.serviceWorker;
    }

    // Document
    client.document.on('getDomain', (event) => {
        event.data.value = __sv.domain;
    });
    client.document.on('setDomain', (event) => {
        if (
            !event.data.value
                .toString()
                .endsWith(__sv.meta.url.hostname.split('.').slice(-2).join('.'))
        )
            return event.respondWith('');
        event.respondWith((__sv.domain = event.data.value));
    });

    client.document.on('url', (event) => {
        event.data.value = __sv.location.href;
    });

    client.document.on('documentURI', (event) => {
        event.data.value = __sv.location.href;
    });

    client.document.on('referrer', (event) => {
        event.data.value = __sv.referrer || __sv.sourceUrl(event.data.value);
    });

    client.document.on('parseFromString', (event) => {
        if (event.data.type !== 'text/html') return false;
        event.data.string = __sv.rewriteHtml(event.data.string, {
            ...__sv.meta,
            document: true,
        });
    });

    // Attribute (node.attributes)
    client.attribute.on('getValue', (event) => {
        if (
            client.element.hasAttribute.call(
                event.that.ownerElement,
                __sv.attributePrefix + '-attr-' + event.data.name
            )
        ) {
            event.data.value = client.element.getAttribute.call(
                event.that.ownerElement,
                __sv.attributePrefix + '-attr-' + event.data.name
            );
        }
    });

    client.attribute.on('setValue', (event) => {
        if (__sv.attrs.isUrl(event.data.name)) {
            client.element.setAttribute.call(
                event.that.ownerElement,
                __sv.attributePrefix + '-attr-' + event.data.name,
                event.data.value
            );
            event.data.value = __sv.rewriteUrl(event.data.value);
        }

        if (__sv.attrs.isStyle(event.data.name)) {
            client.element.setAttribute.call(
                event.that.ownerElement,
                __sv.attributePrefix + '-attr-' + event.data.name,
                event.data.value
            );
            event.data.value = __sv.rewriteCSS(event.data.value, {
                context: 'declarationList',
            });
        }

        if (__sv.attrs.isHtml(event.data.name)) {
            client.element.setAttribute.call(
                event.that.ownerElement,
                __sv.attributePrefix + '-attr-' + event.data.name,
                event.data.value
            );
            event.data.value = __sv.rewriteHtml(event.data.value, {
                ...__sv.meta,
                document: true,
                injectHead: __sv.createHtmlInject(
                    __sv.handlerScript,
                    __sv.bundleScript,
                    __sv.clientScript,
                    __sv.configScript,
                    __sv$bareURL,
                    __sv$bareData,
                    cookieStr,
                    window.location.href
                ),
            });
        }

        if (__sv.attrs.isSrcset(event.data.name)) {
            client.element.setAttribute.call(
                event.that.ownerElement,
                __sv.attributePrefix + '-attr-' + event.data.name,
                event.data.value
            );
            event.data.value = __sv.html.wrapSrcset(
                event.data.value.toString()
            );
        }
    });

    // URL
    client.url.on('createObjectURL', (event) => {
        let url = event.target.call(event.that, event.data.object);
        if (url.startsWith('blob:' + location.origin)) {
            let newUrl =
                'blob:' +
                (__sv.meta.url.href !== 'about:blank'
                    ? __sv.meta.url.origin
                    : window.parent.__sv.meta.url.origin) +
                url.slice('blob:'.length + location.origin.length);
            __sv.blobUrls.set(newUrl, url);
            event.respondWith(newUrl);
        } else {
            event.respondWith(url);
        }
    });

    client.url.on('revokeObjectURL', (event) => {
        if (__sv.blobUrls.has(event.data.url)) {
            const old = event.data.url;
            event.data.url = __sv.blobUrls.get(event.data.url);
            __sv.blobUrls.delete(old);
        }
    });

    client.storage.on('get', (event) => {
        event.data.name =
            methodPrefix + __sv.meta.url.origin + '@' + event.data.name;
    });

    client.storage.on('set', (event) => {
        if (event.that.__sv$storageObj) {
            event.that.__sv$storageObj[event.data.name] = event.data.value;
        }
        event.data.name =
            methodPrefix + __sv.meta.url.origin + '@' + event.data.name;
    });

    client.storage.on('delete', (event) => {
        if (event.that.__sv$storageObj) {
            delete event.that.__sv$storageObj[event.data.name];
        }
        event.data.name =
            methodPrefix + __sv.meta.url.origin + '@' + event.data.name;
    });

    client.storage.on('getItem', (event) => {
        event.data.name =
            methodPrefix + __sv.meta.url.origin + '@' + event.data.name;
    });

    client.storage.on('setItem', (event) => {
        if (event.that.__sv$storageObj) {
            event.that.__sv$storageObj[event.data.name] = event.data.value;
        }
        event.data.name =
            methodPrefix + __sv.meta.url.origin + '@' + event.data.name;
    });

    client.storage.on('removeItem', (event) => {
        if (event.that.__sv$storageObj) {
            delete event.that.__sv$storageObj[event.data.name];
        }
        event.data.name =
            methodPrefix + __sv.meta.url.origin + '@' + event.data.name;
    });

    client.storage.on('clear', (event) => {
        if (event.that.__sv$storageObj) {
            for (const key of client.nativeMethods.keys.call(
                null,
                event.that.__sv$storageObj
            )) {
                delete event.that.__sv$storageObj[key];
                client.storage.removeItem.call(
                    event.that,
                    methodPrefix + __sv.meta.url.origin + '@' + key
                );
                event.respondWith();
            }
        }
    });

    client.storage.on('length', (event) => {
        if (event.that.__sv$storageObj) {
            event.respondWith(
                client.nativeMethods.keys.call(null, event.that.__sv$storageObj)
                    .length
            );
        }
    });

    client.storage.on('key', (event) => {
        if (event.that.__sv$storageObj) {
            event.respondWith(
                client.nativeMethods.keys.call(
                    null,
                    event.that.__sv$storageObj
                )[event.data.index] || null
            );
        }
    });

    client.websocket.on('websocket', async (event) => {
        const requestHeaders = Object.create(null);
        requestHeaders['Origin'] = __sv.meta.url.origin;
        requestHeaders['User-Agent'] = navigator.userAgent;

        if (cookieStr !== '') requestHeaders['Cookie'] = cookieStr.toString();

        event.respondWith(
            bareClient.createWebSocket(event.data.args[0], event.data.args[1], {
                headers: requestHeaders,
                readyStateHook: (socket, getReadyState) => {
                    socket.__sv$getReadyState = getReadyState;
                },
                sendErrorHook: (socket, getSendError) => {
                    socket.__sv$getSendError = getSendError;
                },
                urlHook: (socket, url) => {
                    socket.__sv$socketUrl = url;
                },
                protocolHook: (socket, getProtocol) => {
                    socket.__sv$getProtocol = getProtocol;
                },
                setCookiesCallback: (setCookies) => {
                    // document.cookie is hooked
                    // so we can just call it
                    for (const cookie of setCookies)
                        window.document.cookie = cookie;
                },
                webSocketImpl: event.target,
            })
        );
    });

    client.websocket.on('readyState', (event) => {
        if ('__sv$getReadyState' in event.that)
            event.data.value = event.that.__sv$getReadyState();
    });

    client.websocket.on('send', (event) => {
        if ('__sv$getSendError' in event.that) {
            const error = event.that.__sv$getSendError();
            if (error) throw error;
        }
    });

    client.websocket.on('url', (event) => {
        if ('__sv$socketUrl' in event.that)
            event.data.value = event.that.__sv$socketUrl.toString();
    });

    client.websocket.on('protocol', (event) => {
        if ('__sv$getProtocol' in event.that)
            event.data.value = event.that.__sv$getProtocol();
    });

    client.function.on('function', (event) => {
        event.data.script = __sv.rewriteJS(event.data.script);
    });

    client.function.on('toString', (event) => {
        if (__sv.methods.string in event.that)
            event.respondWith(event.that[__sv.methods.string]);
    });

    client.object.on('getOwnPropertyNames', (event) => {
        event.data.names = event.data.names.filter(
            (element) => !__sv.filterKeys.includes(element)
        );
    });

    client.object.on('getOwnPropertyDescriptors', (event) => {
        for (const forbidden of __sv.filterKeys) {
            delete event.data.descriptors[forbidden];
        }
    });

    client.style.on('setProperty', (event) => {
        if (client.style.dashedUrlProps.includes(event.data.property)) {
            event.data.value = __sv.rewriteCSS(event.data.value, {
                context: 'value',
                ...__sv.meta,
            });
        }
    });

    client.style.on('getPropertyValue', (event) => {
        if (client.style.dashedUrlProps.includes(event.data.property)) {
            event.respondWith(
                __sv.sourceCSS(
                    event.target.call(event.that, event.data.property),
                    {
                        context: 'value',
                        ...__sv.meta,
                    }
                )
            );
        }
    });

    if ('CSS2Properties' in window) {
        for (const key of client.style.urlProps) {
            client.overrideDescriptor(window.CSS2Properties.prototype, key, {
                get: (target, that) => {
                    return __sv.sourceCSS(target.call(that), {
                        context: 'value',
                        ...__sv.meta,
                    });
                },
                set: (target, that, val) => {
                    target.call(
                        that,
                        __sv.rewriteCSS(val, {
                            context: 'value',
                            ...__sv.meta,
                        })
                    );
                },
            });
        }
    } else if ('HTMLElement' in window) {
        client.overrideDescriptor(window.HTMLElement.prototype, 'style', {
            get: (target, that) => {
                const value = target.call(that);
                if (!value[methodPrefix + 'modifiedStyle']) {
                    for (const key of client.style.urlProps) {
                        client.nativeMethods.defineProperty(value, key, {
                            enumerable: true,
                            configurable: true,
                            get() {
                                const value =
                                    client.style.getPropertyValue.call(
                                        this,
                                        key
                                    ) || '';
                                return __sv.sourceCSS(value, {
                                    context: 'value',
                                    ...__sv.meta,
                                });
                            },
                            set(val) {
                                client.style.setProperty.call(
                                    this,
                                    client.style.propToDashed[key] || key,
                                    __sv.rewriteCSS(val, {
                                        context: 'value',
                                        ...__sv.meta,
                                    })
                                );
                            },
                        });
                        client.nativeMethods.defineProperty(
                            value,
                            methodPrefix + 'modifiedStyle',
                            {
                                enumerable: false,
                                value: true,
                            }
                        );
                    }
                }
                return value;
            },
        });
    }

    client.style.on('setCssText', (event) => {
        event.data.value = __sv.rewriteCSS(event.data.value, {
            context: 'declarationList',
            ...__sv.meta,
        });
    });

    client.style.on('getCssText', (event) => {
        event.data.value = __sv.sourceCSS(event.data.value, {
            context: 'declarationList',
            ...__sv.meta,
        });
    });

    // Proper hash emulation.
    __sv.addEventListener.call(window, 'hashchange', (event) => {
        if (event.__sv$dispatched) return false;
        event.stopImmediatePropagation();
        const hash = window.location.hash;
        client.history.replaceState.call(window.history, '', '', event.oldURL);
        __sv.location.hash = hash;
    });

    client.location.on('hashchange', (oldUrl, newUrl, ctx) => {
        if (ctx.HashChangeEvent && client.history.replaceState) {
            client.history.replaceState.call(
                window.history,
                '',
                '',
                __sv.rewriteUrl(newUrl)
            );

            const event = new ctx.HashChangeEvent('hashchange', {
                newURL: newUrl,
                oldURL: oldUrl,
            });

            client.nativeMethods.defineProperty(
                event,
                methodPrefix + 'dispatched',
                {
                    value: true,
                    enumerable: false,
                }
            );

            __sv.dispatchEvent.call(window, event);
        }
    });

    // Hooking functions & descriptors
    client.fetch.overrideRequest();
    client.fetch.overrideUrl();
    client.xhr.overrideOpen();
    client.xhr.overrideResponseUrl();
    client.element.overrideHtml();
    client.element.overrideAttribute();
    client.element.overrideInsertAdjacentHTML();
    client.element.overrideAudio();
    // client.element.overrideQuerySelector();
    client.node.overrideBaseURI();
    client.node.overrideTextContent();
    client.attribute.overrideNameValue();
    client.document.overrideDomain();
    client.document.overrideURL();
    client.document.overrideDocumentURI();
    client.document.overrideWrite();
    client.document.overrideReferrer();
    client.document.overrideParseFromString();
    client.storage.overrideMethods();
    client.storage.overrideLength();
    //client.document.overrideQuerySelector();
    client.object.overrideGetPropertyNames();
    client.object.overrideGetOwnPropertyDescriptors();
    client.idb.overrideName();
    client.idb.overrideOpen();
    client.history.overridePushState();
    client.history.overrideReplaceState();
    client.eventSource.overrideConstruct();
    client.eventSource.overrideUrl();
    client.websocket.overrideWebSocket();
    client.websocket.overrideProtocol();
    client.websocket.overrideURL();
    client.websocket.overrideReadyState();
    client.websocket.overrideProtocol();
    client.websocket.overrideSend();
    client.url.overrideObjectURL();
    client.document.overrideCookie();
    client.message.overridePostMessage();
    client.message.overrideMessageOrigin();
    client.message.overrideMessageData();
    client.workers.overrideWorker();
    client.workers.overrideAddModule();
    client.workers.overrideImportScripts();
    client.workers.overridePostMessage();
    client.style.overrideSetGetProperty();
    client.style.overrideCssText();
    client.navigator.overrideSendBeacon();
    client.function.overrideFunction();
    client.function.overrideToString();
    client.location.overrideWorkerLocation((href) => {
        return new URL(__sv.sourceUrl(href));
    });

    client.overrideDescriptor(window, 'localStorage', {
        get: (target, that) => {
            return (that || window).__sv.lsWrap;
        },
    });
    client.overrideDescriptor(window, 'sessionStorage', {
        get: (target, that) => {
            return (that || window).__sv.ssWrap;
        },
    });

    client.override(window, 'open', (target, that, args) => {
        if (!args.length) return target.apply(that, args);
        let [url] = args;

        url = __sv.rewriteUrl(url);

        return target.call(that, url);
    });

    __sv.$wrap = function (name) {
        if (name === 'location') return __sv.methods.location;
        if (name === 'eval') return __sv.methods.eval;
        return name;
    };

    __sv.$get = function (that) {
        if (that === window.location) return __sv.location;
        if (that === window.eval) return __sv.eval;
        if (that === window.parent) {
            return window.__sv$parent;
        }
        if (that === window.top) {
            return window.__sv$top;
        }
        return that;
    };

    __sv.eval = client.wrap(window, 'eval', (target, that, args) => {
        if (!args.length || typeof args[0] !== 'string')
            return target.apply(that, args);
        let [script] = args;

        script = __sv.rewriteJS(script);
        return target.call(that, script);
    });

    __sv.call = function (target, args, that) {
        return that ? target.apply(that, args) : target(...args);
    };

    __sv.call$ = function (obj, prop, args = []) {
        return obj[prop].apply(obj, args);
    };

    client.nativeMethods.defineProperty(window.Object.prototype, master, {
        get: () => {
            return __sv;
        },
        enumerable: false,
    });

    client.nativeMethods.defineProperty(
        window.Object.prototype,
        __sv.methods.setSource,
        {
            value: function (source) {
                if (!client.nativeMethods.isExtensible(this)) return this;

                client.nativeMethods.defineProperty(this, __sv.methods.source, {
                    value: source,
                    writable: true,
                    enumerable: false,
                });

                return this;
            },
            enumerable: false,
        }
    );

    client.nativeMethods.defineProperty(
        window.Object.prototype,
        __sv.methods.source,
        {
            value: __sv,
            writable: true,
            enumerable: false,
        }
    );

    client.nativeMethods.defineProperty(
        window.Object.prototype,
        __sv.methods.location,
        {
            configurable: true,
            get() {
                return this === window.document || this === window
                    ? __sv.location
                    : this.location;
            },
            set(val) {
                if (this === window.document || this === window) {
                    __sv.location.href = val;
                } else {
                    this.location = val;
                }
            },
        }
    );

    client.nativeMethods.defineProperty(
        window.Object.prototype,
        __sv.methods.parent,
        {
            configurable: true,
            get() {
                const val = this.parent;

                if (this === window) {
                    try {
                        return '__sv' in val ? val : this;
                    } catch (e) {
                        return this;
                    }
                }
                return val;
            },
            set(val) {
                this.parent = val;
            },
        }
    );

    client.nativeMethods.defineProperty(
        window.Object.prototype,
        __sv.methods.top,
        {
            configurable: true,
            get() {
                const val = this.top;

                if (this === window) {
                    if (val === this.parent) return this[__sv.methods.parent];
                    try {
                        if (!('__sv' in val)) {
                            let current = this;

                            while (current.parent !== val) {
                                current = current.parent;
                            }

                            return '__sv' in current ? current : this;
                        } else {
                            return val;
                        }
                    } catch (e) {
                        return this;
                    }
                }
                return val;
            },
            set(val) {
                this.top = val;
            },
        }
    );

    client.nativeMethods.defineProperty(
        window.Object.prototype,
        __sv.methods.eval,
        {
            configurable: true,
            get() {
                return this === window ? __sv.eval : this.eval;
            },
            set(val) {
                this.eval = val;
            },
        }
    );
}
