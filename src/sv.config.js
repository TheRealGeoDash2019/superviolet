/*global Superviolet*/
self.__sv$config = {
    prefix: '/service/',
    bare: '/bare/',
    encodeUrl: Superviolet.codec.xor.encode,
    decodeUrl: Superviolet.codec.xor.decode,
    handler: '/sv.handler.js',
    client: '/sv.client.js',
    bundle: '/sv.bundle.js',
    config: '/sv.config.js',
    sw: '/sv.sw.js',
};
