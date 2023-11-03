import { rimraf } from 'rimraf';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { build } from 'esbuild';

// read version from package.json
const pkg = JSON.parse(await readFile('package.json'));
process.env.SUPERVIOLET_VERSION = pkg.version;

const isDevelopment = process.argv.includes('--dev');

await rimraf('dist');
await mkdir('dist');

// don't compile these files
await copyFile('src/sw.js', 'dist/sw.js');
await copyFile('src/sv.config.js', 'dist/sv.config.js');

await build({
    platform: 'browser',
    sourcemap: true,
    minify: !isDevelopment,
    entryPoints: {
        'sv.bundle': './src/rewrite/index.js',
        'sv.client': './src/client/index.js',
        'sv.handler': './src/sv.handler.js',
        'sv.sw': './src/sv.sw.js',
    },
    define: {
        'process.env.SUPERVIOLET_VERSION': JSON.stringify(
            process.env.SUPERVIOLET_VERSION
        ),
    },
    bundle: true,
    outdir: 'dist/',
});
