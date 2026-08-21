import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const LOGS_DIR = path.join(ROOT, 'diagnostic_logs');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_FILE = path.join(LOGS_DIR, `diagnostic_${TIMESTAMP}.txt`);

if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

let logContent = '';

const stats = {
    errors: 0,
    warnings: 0,
    infos: 0,
    files: 0,
    syntaxErrors: 0,
    importErrors: 0,
    packageErrors: 0,
    databaseErrors: 0
};

function log(message = '') {
    console.log(message);
    logContent += message + '\n';
}

function section(title) {
    const line = '='.repeat(70);
    log(`\n${line}`);
    log(title);
    log(line);
}

function success(label, value = '') {
    log(`[OK] ${label}${value ? `: ${value}` : ''}`);
}

function warning(label, value = '') {
    stats.warnings++;
    log(`[WARN] ${label}${value ? `: ${value}` : ''}`);
}

function error(label, value = '') {
    stats.errors++;
    log(`[ERROR] ${label}${value ? `: ${value}` : ''}`);
}

function info(label, value = '') {
    stats.infos++;
    log(`[INFO] ${label}${value ? `: ${value}` : ''}`);
}

function formatRelative(filePath) {
    return path.relative(ROOT, filePath).replace(/\\/g, '/');
}

function getLineInfo(content, index) {
    const before = content.slice(0, index);
    const line = before.split('\n').length;
    const lastNewLine = before.lastIndexOf('\n');
    const column = index - lastNewLine;

    return { line, column };
}

function getLineContent(content, lineNumber) {
    const lines = content.split(/\r?\n/);
    return (lines[lineNumber - 1] || '').trim();
}

function runCommand(command, options = {}) {
    try {
        return execSync(command, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true,
            ...options
        }).trim();
    } catch (err) {
        return {
            failed: true,
            stdout: err.stdout?.toString()?.trim() || '',
            stderr: err.stderr?.toString()?.trim() || '',
            status: err.status ?? null
        };
    }
}

function scanDirectory(directory, extension = '') {
    const files = [];

    function scan(dir, depth = 0) {
        if (depth > 8) return;

        let entries;

        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }

        for (const entry of entries) {
            if ([
                'node_modules',
                '.git',
                'dist',
                'build',
                'coverage',
                'diagnostic_logs'
            ].includes(entry.name)) {
                continue;
            }

            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                scan(fullPath, depth + 1);
            } else if (!extension || entry.name.endsWith(extension)) {
                files.push(fullPath);
            }
        }
    }

    if (fs.existsSync(directory)) {
        scan(directory);
    }

    return files;
}

function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch {
        return null;
    }
}

function isExternalImport(specifier) {
    return !specifier.startsWith('.') && !specifier.startsWith('/');
}

function resolveImport(fromFile, specifier) {
    if (isExternalImport(specifier)) {
        return {
            external: true,
            exists: true
        };
    }

    const base = path.resolve(path.dirname(fromFile), specifier);

    const candidates = [
        base,
        `${base}.js`,
        `${base}.mjs`,
        `${base}.cjs`,
        `${base}.json`,
        path.join(base, 'index.js'),
        path.join(base, 'index.mjs'),
        path.join(base, 'index.cjs')
    ];

    for (const candidate of candidates) {
        try {
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                return {
                    external: false,
                    exists: true,
                    path: candidate
                };
            }
        } catch {}
    }

    return {
        external: false,
        exists: false,
        path: base
    };
}

function extractImports(content) {
    const imports = [];

    const patterns = [
        /import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g,
        /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
        /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    ];

    for (const regex of patterns) {
        let match;

        while ((match = regex.exec(content)) !== null) {
            imports.push({
                specifier: match[1],
                index: match.index
            });
        }
    }

    return imports;
}

function extractExports(content) {
    const exports = [];

    const patterns = [
        /export\s+default\b/g,
        /export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g,
        /export\s*\{([^}]+)\}/g
    ];

    for (const regex of patterns) {
        let match;

        while ((match = regex.exec(content)) !== null) {
            exports.push({
                index: match.index,
                value: match[1] || 'default'
            });
        }
    }

    return exports;
}

function findSyntaxError(filePath) {
    const result = runCommand(`node --check "${filePath}"`);

    if (!result?.failed) {
        return null;
    }

    const output = result.stderr || result.stdout || '';

    let line = null;
    let column = null;
    let message = output.trim();

    const match = output.match(/(?:^|\n).*?:([0-9]+)(?::([0-9]+))?\s*\n([\s\S]*)/);

    if (match) {
        line = Number(match[1]);
        column = match[2] ? Number(match[2]) : null;
        message = match[3]?.trim() || message;
    }

    return {
        line,
        column,
        message
    };
}

function analyzeSyntax(filePath) {
    const result = findSyntaxError(filePath);

    if (!result) {
        return true;
    }

    stats.syntaxErrors++;
    stats.errors++;

    const relative = formatRelative(filePath);

    if (result.line) {
        const sourceLine = getLineContent(readFile(filePath) || '', result.line);

        log(`[ERROR] ${relative}`);
        log(`  Ligne ${result.line}${result.column ? `, colonne ${result.column}` : ''}: Erreur de syntaxe`);
        log(`  ${result.message}`);

        if (sourceLine) {
            log(`  Code: ${sourceLine}`);
        }
    } else {
        error(relative, `Erreur de syntaxe: ${result.message}`);
    }

    return false;
}

function analyzeImports(filePath, content) {
    const imports = extractImports(content);
    let valid = true;

    for (const imported of imports) {
        if (isExternalImport(imported.specifier)) {
            continue;
        }

        const result = resolveImport(filePath, imported.specifier);

        if (!result.exists) {
            const position = getLineInfo(content, imported.index);
            const relative = formatRelative(filePath);

            stats.importErrors++;
            stats.errors++;

            log(`[ERROR] ${relative}`);
            log(`  Ligne ${position.line}, colonne ${position.column}: Import introuvable`);
            log(`  Module: ${imported.specifier}`);

            valid = false;
        }
    }

    return valid;
}

function analyzePromises(filePath, content) {
    const lines = content.split(/\r?\n/);
    const relative = formatRelative(filePath);

    const suspicious = [];

    lines.forEach((line, index) => {
        const lineNumber = index + 1;

        if (
            /\b(client|channel|guild|member|message|interaction|fetch|send|reply|edit|delete|create|update|set)\w*\s*\(/.test(line) &&
            /\.then\s*\(/.test(line) === false &&
            /\bawait\b/.test(line) === false &&
            !line.includes('//') &&
            !line.includes('function') &&
            !line.includes('=>')
        ) {
            if (
                /\.(fetch|send|reply|edit|delete|create|update|set|ban|kick|timeout)\s*\(/.test(line)
            ) {
                suspicious.push({
                    line: lineNumber,
                    text: line.trim()
                });
            }
        }
    });

    for (const item of suspicious) {
        warning(
            `${relative}:${item.line}`,
            'Appel asynchrone potentiellement non attendu'
        );
        log(`  Code: ${item.text}`);
    }
}

function analyzeAwait(filePath, content) {
    const lines = content.split(/\r?\n/);
    const relative = formatRelative(filePath);

    let braceDepth = 0;
    let asyncDepths = [];

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        const functionMatch = trimmed.match(
            /(?:async\s+)?(?:function\s+[A-Za-z_$][\w$]*\s*\([^)]*\)|(?:async\s+)?\([^)]*\)\s*=>|(?:async\s+)?[A-Za-z_$][\w$]*\s*=>)/
        );

        const isAsyncFunction =
            /\basync\s+function\b/.test(trimmed) ||
            /\basync\s*\([^)]*\)\s*=>/.test(trimmed) ||
            /\basync\s+[A-Za-z_$][\w$]*\s*=>/.test(trimmed);

        if (functionMatch && isAsyncFunction) {
            asyncDepths.push(braceDepth);
        }

        if (/\bawait\b/.test(line) && asyncDepths.length === 0) {
            error(
                `${relative}:${index + 1}`,
                'await détecté hors d’une fonction async'
            );
        }

        const opens = (line.match(/{/g) || []).length;
        const closes = (line.match(/}/g) || []).length;

        braceDepth += opens - closes;

        asyncDepths = asyncDepths.filter(depth => braceDepth > depth);
    });
}

function analyzeDangerousPatterns(filePath, content) {
    const relative = formatRelative(filePath);
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        if (
            /process\.env\[['"][^'"]+['"]\]/.test(trimmed) === false &&
            /\b(token|password|passwd|secret|apiKey|api_key)\s*=\s*['"][^'"]{15,}['"]/i.test(trimmed)
        ) {
            warning(
                `${relative}:${index + 1}`,
                'Possible secret ou token écrit en dur'
            );
        }

        if (/client\.login\s*\(\s*['"][^'"]+['"]\s*\)/.test(trimmed)) {
            warning(
                `${relative}:${index + 1}`,
                'Token Discord potentiellement écrit directement dans le code'
            );
        }

        if (/\beval\s*\(/.test(trimmed)) {
            warning(
                `${relative}:${index + 1}`,
                'Utilisation de eval()'
            );
        }
    });
}

function analyzeDiscordPatterns(filePath, content) {
    const relative = formatRelative(filePath);

    const discordPatterns = [
        {
            regex: /\.send\s*\(\s*\{\s*content\s*:/g,
            description: 'Vérification manuelle recommandée pour le contenu envoyé'
        }
    ];

    for (const pattern of discordPatterns) {
        const matches = [...content.matchAll(pattern.regex)];

        for (const match of matches) {
            const position = getLineInfo(content, match.index);
            info(
                `${relative}:${position.line}`,
                pattern.description
            );
        }
    }

    if (
        content.includes('ephemeral: true') &&
        content.includes('flags:') &&
        content.includes('MessageFlags')
    ) {
        info(
            relative,
            'Utilisation de plusieurs méthodes de flags/ephemeral détectée'
        );
    }
}

function analyzeFile(filePath) {
    const content = readFile(filePath);

    if (content === null) {
        error(formatRelative(filePath), 'Impossible de lire le fichier');
        return null;
    }

    return {
        content,
        lines: content.split(/\r?\n/).length
    };
}

function analyzeSourceFile(filePath, options = {}) {
    const analysis = analyzeFile(filePath);

    if (!analysis) {
        return null;
    }

    stats.files++;

    const syntaxValid = analyzeSyntax(filePath);

    if (syntaxValid) {
        analyzeImports(filePath, analysis.content);
        analyzeAwait(filePath, analysis.content);
        analyzeDangerousPatterns(filePath, analysis.content);

        if (options.discord) {
            analyzeDiscordPatterns(filePath, analysis.content);
        }
    }

    return analysis;
}

function printFileStatus(filePath, analysis, beforeErrors) {
    if (!analysis) {
        return;
    }

    const relative = formatRelative(filePath);
    const newErrors = stats.errors - beforeErrors;

    if (newErrors > 0) {
        log(`  ❌ ${path.basename(filePath)}: ${analysis.lines} lignes`);
        return;
    }

    log(`  ✓ ${path.basename(filePath)}: ${analysis.lines} lignes`);
}

function analyzeDirectory(directory, label, options = {}) {
    section(`ANALYSE DES ${label.toUpperCase()}`);

    if (!fs.existsSync(directory)) {
        warning(label, 'Dossier introuvable');
        return {
            total: 0,
            errors: 0
        };
    }

    const files = scanDirectory(directory, '.js');

    log(`\n📋 ${label} trouvés: ${files.length}`);

    const startErrors = stats.errors;

    for (const file of files) {
        const beforeErrors = stats.errors;
        const analysis = analyzeSourceFile(file, options);

        if (analysis) {
            printFileStatus(file, analysis, beforeErrors);
        }
    }

    const errors = stats.errors - startErrors;

    success(
        `Analyse ${label.toLowerCase()}`,
        `${files.length} fichiers scannés`
    );

    return {
        total: files.length,
        errors
    };
}

function checkPackageJson() {
    section('PACKAGE.JSON');

    const packagePath = path.join(ROOT, 'package.json');

    if (!fs.existsSync(packagePath)) {
        error('package.json', 'Fichier introuvable');
        stats.packageErrors++;
        return null;
    }

    let pkg;

    try {
        pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    } catch (err) {
        error('package.json', `JSON invalide: ${err.message}`);
        stats.packageErrors++;
        return null;
    }

    success('package.json', 'JSON valide');

    if (!pkg.name) {
        warning('package.json', 'Champ "name" absent');
    } else {
        info('Nom', pkg.name);
    }

    if (!pkg.version) {
        warning('package.json', 'Champ "version" absent');
    } else {
        info('Version', pkg.version);
    }

    if (!pkg.type) {
        warning(
            'package.json',
            'Champ "type" absent. Vérifier que le mode CommonJS/ESM est volontaire.'
        );
    } else {
        info('Type', pkg.type);
    }

    const dependencies = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {})
    };

    const requiredDiscordPackages = [
        'discord.js'
    ];

    for (const dependency of requiredDiscordPackages) {
        if (!dependencies[dependency]) {
            warning(
                'Dépendance',
                `${dependency} absente du package.json`
            );
        }
    }

    return pkg;
}

function checkDependencies(packageJson) {
    section('DÉPENDANCES');

    if (!packageJson) {
        warning('Dépendances', 'package.json indisponible');
        return;
    }

    const dependencies = packageJson.dependencies || {};
    const devDependencies = packageJson.devDependencies || {};

    log(`\n📦 Dépendances: ${Object.keys(dependencies).length}`);
    log(`🔧 Dev dépendances: ${Object.keys(devDependencies).length}`);

    const allDependencies = {
        ...dependencies,
        ...devDependencies
    };

    for (const dependency of Object.keys(allDependencies)) {
        try {
            const packagePath = require.resolve(
                `${dependency}/package.json`,
                { paths: [ROOT] }
            );

            if (packagePath) {
                success(dependency, 'installée');
            }
        } catch {
            error(
                dependency,
                'présente dans package.json mais introuvable dans node_modules'
            );
        }
    }
}

function checkStructure() {
    section('STRUCTURE DU PROJET');

    const structure = {
        'src': 'Répertoire source',
        'src/commands': 'Dossier commandes',
        'src/events': 'Dossier événements',
        'src/utils': 'Dossier utilitaires',
        'data': 'Dossier données'
    };

    const optionalStructure = {
        'config': 'Dossier configuration'
    };

    for (const [folder, desc] of Object.entries(structure)) {
        const fullPath = path.join(ROOT, folder);

        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
            success(folder, desc);
        } else {
            error(folder, 'Dossier requis manquant');
        }
    }

    for (const [folder, desc] of Object.entries(optionalStructure)) {
        const fullPath = path.join(ROOT, folder);

        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
            success(folder, desc);
        } else {
            warning(folder, `Dossier optionnel absent (${desc})`);
        }
    }
}

function checkDatabases() {
    section('BASES DE DONNÉES');

    const dataDir = path.join(ROOT, 'data');

    if (!fs.existsSync(dataDir)) {
        warning('Dossier data', 'introuvable');
        return;
    }

    const dbFiles = fs.readdirSync(dataDir, { withFileTypes: true })
        .filter(
            entry =>
                entry.isFile() &&
                (
                    entry.name.endsWith('.sqlite') ||
                    entry.name.endsWith('.sqlite3') ||
                    entry.name.endsWith('.db')
                )
        );

    if (dbFiles.length === 0) {
        info('Bases SQLite', 'aucune trouvée');
        return;
    }

    log(`\n📊 Bases de données: ${dbFiles.length}`);

    for (const db of dbFiles) {
        const filePath = path.join(dataDir, db.name);

        try {
            const fileStats = fs.statSync(filePath);
            const sizeKB = (fileStats.size / 1024).toFixed(2);
            const sizeMB = (fileStats.size / 1024 / 1024).toFixed(2);

            if (fileStats.size === 0) {
                warning(db.name, 'base vide (0 octet)');
            } else {
                log(`  📁 ${db.name}: ${sizeMB} MB`);
                success(db.name, `${sizeKB} KB`);
            }

            try {
                const sqliteCheck = runCommand(`sqlite3 "${filePath}" "PRAGMA integrity_check;"`);

                if (
                    typeof sqliteCheck === 'string' &&
                    sqliteCheck.toLowerCase() === 'ok'
                ) {
                    success(db.name, 'intégrité SQLite OK');
                }
            } catch {}
        } catch (err) {
            stats.databaseErrors++;
            error(db.name, err.message);
        }
    }
}

function checkNodeVersion() {
    section('SYSTÈME');

    success('OS', `${os.type()} ${os.release()}`);
    success('Architecture', os.arch());
    success('Plateforme', process.platform);
    success('Node.js', process.version);
    success('CPU', `${os.cpus().length} cores`);
    success(
        'RAM',
        `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`
    );

    const major = Number(process.versions.node.split('.')[0]);

    if (major < 18) {
        error(
            'Node.js',
            `Version ${process.version} trop ancienne pour un bot Discord.js moderne`
        );
    } else if (major >= 22) {
        success(
            'Node.js',
            'Version compatible avec les versions modernes de Discord.js'
        );
    }
}

function checkProject() {
    section('PROJET');

    success('Répertoire', ROOT);

    const packagePath = path.join(ROOT, 'package.json');

    if (fs.existsSync(packagePath)) {
        success('package.json trouvé');
    } else {
        error('package.json', 'introuvable');
    }

    const gitPath = path.join(ROOT, '.git');

    if (fs.existsSync(gitPath)) {
        success('Git', 'dépôt détecté');
    } else {
        info('Git', 'aucun dépôt Git détecté');
    }

    const envPath = path.join(ROOT, '.env');

    if (fs.existsSync(envPath)) {
        warning(
            '.env',
            'fichier présent. Vérifier qu’il est bien ignoré par Git.'
        );
    }
}

function checkEntryPoint(packageJson) {
    section('POINT D’ENTRÉE');

    if (!packageJson) {
        return;
    }

    const candidates = [];

    if (packageJson.main) {
        candidates.push(packageJson.main);
    }

    candidates.push(
        'index.js',
        'src/index.js',
        'src/main.js',
        'src/bot.js',
        'src/client.js',
        'src/app.js'
    );

    const uniqueCandidates = [...new Set(candidates)];

    let found = false;

    for (const candidate of uniqueCandidates) {
        const filePath = path.join(ROOT, candidate);

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            success('Point d’entrée', candidate);
            found = true;
            break;
        }
    }

    if (!found) {
        warning(
            'Point d’entrée',
            'Impossible d’identifier automatiquement le fichier principal'
        );
    }
}

function runESLintIfAvailable() {
    section('LINT JAVASCRIPT');

    const eslintPath = path.join(
        ROOT,
        'node_modules',
        '.bin',
        process.platform === 'win32' ? 'eslint.cmd' : 'eslint'
    );

    if (!fs.existsSync(eslintPath)) {
        info(
            'ESLint',
            'non installé. Aucun lint externe exécuté.'
        );
        return;
    }

    const result = runCommand(`"${eslintPath}" .`);

    if (!result?.failed) {
        success('ESLint', 'aucune erreur détectée');
        return;
    }

    const output = result.stderr || result.stdout || '';

    if (output) {
        log(output);
    }

    warning(
        'ESLint',
        'des problèmes ont été détectés par ESLint'
    );
}

function checkGitIgnore() {
    section('GIT / FICHIERS SENSIBLES');

    const gitignorePath = path.join(ROOT, '.gitignore');

    if (!fs.existsSync(gitignorePath)) {
        warning('.gitignore', 'fichier absent');
        return;
    }

    const content = readFile(gitignorePath) || '';

    const requiredEntries = [
        'node_modules',
        '.env',
        'diagnostic_logs'
    ];

    for (const entry of requiredEntries) {
        const regex = new RegExp(
            `(^|\\n)\\s*${entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(\\n|$)`
        );

        if (regex.test(content)) {
            success('.gitignore', `${entry} ignoré`);
        } else {
            warning(
                '.gitignore',
                `${entry} n’est pas explicitement ignoré`
            );
        }
    }
}

function checkCommandFiles() {
    section('VALIDATION DES COMMANDES');

    const commandsDir = path.join(ROOT, 'src', 'commands');

    if (!fs.existsSync(commandsDir)) {
        error('Commandes', 'dossier introuvable');
        return {
            total: 0,
            errors: 0
        };
    }

    const files = scanDirectory(commandsDir, '.js');

    log(`\n📋 Commandes trouvées: ${files.length}`);

    const startErrors = stats.errors;

    for (const file of files) {
        const beforeErrors = stats.errors;
        const analysis = analyzeSourceFile(file, {
            discord: true
        });

        if (analysis) {
            printFileStatus(file, analysis, beforeErrors);
        }
    }

    const errors = stats.errors - startErrors;

    success(
        'Analyse commandes',
        `${files.length} fichiers scannés`
    );

    return {
        total: files.length,
        errors
    };
}

function checkEventFiles() {
    section('VALIDATION DES ÉVÉNEMENTS');

    const eventsDir = path.join(ROOT, 'src', 'events');

    if (!fs.existsSync(eventsDir)) {
        error('Événements', 'dossier introuvable');
        return {
            total: 0,
            errors: 0
        };
    }

    const files = scanDirectory(eventsDir, '.js');

    log(`\n📋 Événements trouvés: ${files.length}`);

    const startErrors = stats.errors;

    for (const file of files) {
        const beforeErrors = stats.errors;
        const analysis = analyzeSourceFile(file, {
            discord: true
        });

        if (analysis) {
            printFileStatus(file, analysis, beforeErrors);
        }
    }

    const errors = stats.errors - startErrors;

    success(
        'Analyse événements',
        `${files.length} fichiers scannés`
    );

    return {
        total: files.length,
        errors
    };
}

function checkUtilsFiles() {
    section('VALIDATION DES UTILITAIRES');

    const utilsDir = path.join(ROOT, 'src', 'utils');

    if (!fs.existsSync(utilsDir)) {
        error('Utilitaires', 'dossier introuvable');
        return {
            total: 0,
            errors: 0
        };
    }

    const files = scanDirectory(utilsDir, '.js');

    log(`\n📋 Utilitaires trouvés: ${files.length}`);

    const startErrors = stats.errors;

    for (const file of files) {
        const beforeErrors = stats.errors;
        const analysis = analyzeSourceFile(file);

        if (analysis) {
            printFileStatus(file, analysis, beforeErrors);
        }
    }

    const errors = stats.errors - startErrors;

    success(
        'Analyse utilitaires',
        `${files.length} fichiers scannés`
    );

    return {
        total: files.length,
        errors
    };
}

function checkDuplicateFiles() {
    section('FICHIERS DUPLIQUÉS');

    const jsFiles = scanDirectory(ROOT, '.js');
    const names = new Map();

    for (const file of jsFiles) {
        const name = path.basename(file).toLowerCase();

        if (!names.has(name)) {
            names.set(name, []);
        }

        names.get(name).push(file);
    }

    let duplicates = 0;

    for (const [name, files] of names) {
        if (files.length > 1) {
            duplicates++;

            warning(
                name,
                `${files.length} fichiers portant le même nom`
            );

            for (const file of files) {
                log(`  - ${formatRelative(file)}`);
            }
        }
    }

    if (duplicates === 0) {
        success('Doublons', 'aucun nom de fichier dupliqué détecté');
    }
}

function checkLargeFiles() {
    section('FICHIERS VOLUMINEUX');

    const jsFiles = scanDirectory(ROOT, '.js');

    let found = false;

    for (const file of jsFiles) {
        const content = readFile(file);

        if (!content) {
            continue;
        }

        const lines = content.split(/\r?\n/).length;

        if (lines >= 2000) {
            found = true;

            warning(
                formatRelative(file),
                `${lines} lignes — fichier très volumineux`
            );
        }
    }

    if (!found) {
        success(
            'Taille des fichiers',
            'aucun fichier JavaScript dépassant 2000 lignes'
        );
    }
}

function checkConfigFiles() {
    section('CONFIGURATION');

    const configCandidates = [
        'config.js',
        'config.json',
        '.env',
        'src/config.js',
        'src/config.json',
        'src/utils/config.js',
        'src/utils/guildConfig.js'
    ];

    let found = false;

    for (const candidate of configCandidates) {
        const filePath = path.join(ROOT, candidate);

        if (fs.existsSync(filePath)) {
            success('Configuration', candidate);
            found = true;
        }
    }

    if (!found) {
        warning(
            'Configuration',
            'Aucun fichier de configuration standard identifié'
        );
    }
}

function printSummary(commandStats, eventStats, utilStats) {
    section('RÉSUMÉ DU DIAGNOSTIC');

    log('\n📈 STATISTIQUES:');

    log(
        `  • Commandes: ${commandStats.total} fichiers (${commandStats.errors} erreurs générées par les vérifications)`
    );

    log(
        `  • Événements: ${eventStats.total} fichiers (${eventStats.errors} erreurs générées par les vérifications)`
    );

    log(
        `  • Utilitaires: ${utilStats.total} fichiers (${utilStats.errors} erreurs générées par les vérifications)`
    );

    log(`  • Fichiers analysés: ${stats.files}`);
    log(`  • Erreurs de syntaxe: ${stats.syntaxErrors}`);
    log(`  • Imports locaux invalides: ${stats.importErrors}`);
    log(`  • Erreurs package.json: ${stats.packageErrors}`);
    log(`  • Erreurs bases de données: ${stats.databaseErrors}`);
    log(`  • Warnings: ${stats.warnings}`);
    log(`  • Informations: ${stats.infos}`);

    log('\n' + '-'.repeat(70));

    if (stats.errors === 0 && stats.warnings === 0) {
        success(
            'RÉSULTAT',
            'Aucune erreur ou anomalie détectée par les vérifications effectuées'
        );
    } else if (stats.errors === 0) {
        warning(
            'RÉSULTAT',
            `${stats.warnings} warning(s), mais aucune erreur bloquante détectée`
        );
    } else {
        error(
            'RÉSULTAT',
            `${stats.errors} erreur(s) détectée(s) par les vérifications effectuées`
        );
    }

    log('\n' + '='.repeat(70));
    log('Diagnostic terminé');
    log('='.repeat(70));
}

function saveReport() {
    fs.writeFileSync(LOG_FILE, logContent, 'utf8');
    console.log(`\n💾 Rapport sauvegardé: ${LOG_FILE}`);
}

async function main() {
    log('╔════════════════════════════════════════════════════════════════════╗');
    log('║              DIAGNOSTIC COMPLET - BOT DISCORD                     ║');
    log('╚════════════════════════════════════════════════════════════════════╝');
    log(`\nAnalyse générée: ${new Date().toLocaleString()}\n`);

    checkNodeVersion();
    checkProject();

    const packageJson = checkPackageJson();

    checkStructure();
    checkEntryPoint(packageJson);
    checkDependencies(packageJson);
    checkGitIgnore();
    checkConfigFiles();

    const commandStats = checkCommandFiles();
    const eventStats = checkEventFiles();
    const utilStats = checkUtilsFiles();

    checkDatabases();
    checkDuplicateFiles();
    checkLargeFiles();
    runESLintIfAvailable();

    printSummary(
        commandStats,
        eventStats,
        utilStats
    );

    saveReport();
}

main().catch(err => {
    error(
        'Diagnostic',
        `Erreur inattendue: ${err.stack || err.message}`
    );

    saveReport();
    process.exitCode = 1;
});
