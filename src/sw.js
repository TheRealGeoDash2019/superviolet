/*global SVServiceWorker,__sv$config*/
/*
 * Stock service worker script.
 * Users can provide their own sw.js if they need to extend the functionality of the service worker.
 * Ideally, this will be registered under the scope in sv.config.js so it will not need to be modified.
 * However, if a user changes the location of sv.bundle.js/sv.config.js or sw.js is not relative to them, they will need to modify this script locally.
 */
importScripts('sv.bundle.js');
importScripts('sv.config.js');
importScripts(__sv$config.sw || 'sv.sw.js');

const sw = new SVServiceWorker();

self.addEventListener('fetch', (event) => event.respondWith(sw.fetch(event)));
