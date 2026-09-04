const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const nodeModules = path.join(rootDir, 'node_modules');
const pkgPath = path.join(rootDir, 'package.json');
const cachePath = path.join(nodeModules, '.install_cache.json');

// Modo para salvar o cache apos npm install
if (process.argv.includes('--save-cache')) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!fs.existsSync(nodeModules)) {
      fs.mkdirSync(nodeModules, { recursive: true });
    }
    const current = JSON.stringify({
      deps: pkg.dependencies || {},
      devDeps: pkg.devDependencies || {}
    });
    fs.writeFileSync(cachePath, current, 'utf8');
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
}

// Modo de verificacao
if (!fs.existsSync(nodeModules) || !fs.existsSync(pkgPath)) {
  process.exit(1);
}

try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const deps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });

  // 1. Verifica se todas as dependencias declaradas existem fisicamente na pasta node_modules
  const missing = deps.filter((dep) => !fs.existsSync(path.join(nodeModules, dep)));
  if (missing.length > 0) {
    console.log('[FRONTEND] Pacotes ausentes detectados:', missing.join(', '));
    process.exit(1);
  }

  // 2. Verifica se o cache existe
  if (!fs.existsSync(cachePath)) {
    process.exit(1);
  }

  // 3. Verifica se houve alteracao nas dependencias em relacao a ultima instalacao bem-sucedida
  const cache = fs.readFileSync(cachePath, 'utf8');
  const current = JSON.stringify({
    deps: pkg.dependencies || {},
    devDeps: pkg.devDependencies || {}
  });

  if (cache !== current) {
    console.log('[FRONTEND] Alteracao nas dependencias do package.json detectada.');
    process.exit(1);
  }

  process.exit(0);
} catch (err) {
  process.exit(1);
}
