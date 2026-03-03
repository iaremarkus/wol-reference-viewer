import { build } from 'esbuild';

const isProd = process.argv.includes('--production');
const watchMode = process.argv.includes('--watch');

async function runBuild() {
    /**
     * @type {import('esbuild').BuildOptions}
     */
    const sharedConfig = {
        entryPoints: ['main.ts'],
        bundle: true,
        minify: isProd,
        format: 'cjs',
        target: 'es2018',
        external: ['obsidian', '@codemirror/view', '@codemirror/state'],
        outdir: '.',
    };

    if (watchMode) {
        let ctx = await build({
            ...sharedConfig,
            watch: {
                onRebuild(error, result) {
                    if (error) console.error('Watch build failed:', error);
                    else console.log('Watch build succeeded:', result);
                },
            },
        });
        console.log('Watching for changes...');
        return ctx;
    } else {
        return build(sharedConfig).catch((error) => {
            console.error(error);
            process.exit(1);
        });
    }
}

runBuild();