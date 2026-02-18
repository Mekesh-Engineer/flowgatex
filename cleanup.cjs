#!/usr/bin/env node
/**
 * FlowGateX Cleanup Script
 * Removes all cache, build artifacts, and temporary files
 * Usage: node cleanup.js [options]
 * Options:
 *   --all       Remove everything including node_modules
 *   --build     Remove only build outputs (default)
 *   --cache     Remove only cache files
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const mode = args[0] || '--build';

const paths = {
    build: [
        'dist',
        'functions/lib',
        '.firebase',
    ],
    cache: [
        '.firebase',
        '.venv',
        'functions/lib/tsconfig.tsbuildinfo',
    ],
    all: [
        'node_modules',
        'functions/node_modules',
        'dist',
        'functions/lib',
        '.firebase',
        '.venv',
        '.husky/_',
    ],
};

function deletePath(targetPath) {
    const fullPath = path.resolve(__dirname, targetPath);

    try {
        if (!fs.existsSync(fullPath)) {
            console.log(`⏭️  ${targetPath} (not found)`);
            return;
        }

        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
            console.log(`✅ Deleted folder: ${targetPath}`);
        } else {
            fs.unlinkSync(fullPath);
            console.log(`✅ Deleted file: ${targetPath}`);
        }
    } catch (error) {
        console.error(`❌ Failed to delete ${targetPath}:`, error.message);
    }
}

function showHelp() {
    console.log(`
FlowGateX Cleanup Script
========================

Usage: node cleanup.js [option]

Options:
  --build    Remove build outputs only (dist, functions/lib, .firebase) [default]
  --cache    Remove cache files only (.firebase, .venv, *.tsbuildinfo)
  --all      Remove everything (includes node_modules)
  --help     Show this help message

Examples:
  node cleanup.js              # Clean build outputs
  node cleanup.js --all        # Nuclear clean (everything)
  node cleanup.js --cache      # Clean caches only
`);
}

function main() {
    if (mode === '--help') {
        showHelp();
        return;
    }

    console.log(`\n🧹 FlowGateX Cleanup - Mode: ${mode}\n`);

    let targetPaths;
    switch (mode) {
        case '--all':
            targetPaths = paths.all;
            console.log('⚠️  WARNING: This will delete node_modules. Run npm install to restore.\n');
            break;
        case '--cache':
            targetPaths = paths.cache;
            break;
        case '--build':
        default:
            targetPaths = paths.build;
            break;
    }

    targetPaths.forEach(deletePath);

    console.log('\n✨ Cleanup complete!\n');

    if (mode === '--all') {
        console.log('💡 Next steps:');
        console.log('   npm install');
        console.log('   cd functions && npm install && cd ..');
        console.log('   npm run build\n');
    } else if (mode === '--build') {
        console.log('💡 To rebuild: npm run build\n');
    }
}

main();
