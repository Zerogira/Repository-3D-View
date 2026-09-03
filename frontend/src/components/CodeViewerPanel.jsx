import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  FileCode,
  Folder,
  FileText,
  Code2,
  HardDrive,
  Layers,
  AlertCircle,
  Loader2,
} from 'lucide-react';

/**
 * Detecta a linguagem para o SyntaxHighlighter baseado na extensão do arquivo
 */
function detectLanguage(filename = '') {
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  const langMap = {
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.vue': 'vue',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.json': 'json',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.php': 'php',
    '.rb': 'ruby',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.sql': 'sql',
    '.prisma': 'prisma',
    '.graphql': 'graphql',
    '.gql': 'graphql',
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'bash',
    '.dockerfile': 'dockerfile',
    '.xml': 'xml',
    '.svg': 'xml',
  };

  return langMap[ext] || 'text';
}

/**
 * src/components/CodeViewerPanel.jsx
 * 
 * Drawer retrátil lateral direito de visualização de código em Glassmorphism Dark:
 * - Desliza suavemente da direita (translateX) sem quebrar o contexto 3D.
 * - Busca de código assíncrona na API pública raw.githubusercontent.com.
 * - Skeleton Loading e tratamento de erro de fetch / arquivos binários.
 * - Syntax Highlighting via Prism (oneDark adaptado à paleta neon ciano e rosa).
 * - Ações rápidas: Copiar Código, Link direto para o GitHub e Fechar.
 */
export default function CodeViewerPanel({
  node,
  repoSlug,
  defaultBranch = 'main',
  onClose,
}) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const isFolder = node?.type === 'dir' || node?.type === 'folder' || node?.isDir;

  useEffect(() => {
    if (!node || isFolder) {
      setCode('');
      setError(null);
      return;
    }

    const branch = defaultBranch || 'main';
    const filePath = node.path || node.id || '';
    const rawUrl = `https://raw.githubusercontent.com/${repoSlug}/${branch}/${filePath}`;

    setIsLoading(true);
    setError(null);
    setCode('');
    setCopied(false);

    let isMounted = true;

    fetch(rawUrl)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Não foi possível carregar o arquivo (${res.status} ${res.statusText})`);
        }
        return res.text();
      })
      .then((text) => {
        if (isMounted) {
          setCode(text);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Falha ao buscar conteúdo do arquivo');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [node, repoSlug, defaultBranch, isFolder]);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (!node) return null;

  const branch = defaultBranch || 'main';
  const filePath = node.path || node.name || '';
  const githubFileUrl = `https://github.com/${repoSlug}/${isFolder ? 'tree' : 'blob'}/${branch}/${filePath}`;
  const language = detectLanguage(node.name);

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-xl md:max-w-2xl bg-slate-950/95 border-l border-slate-800 shadow-2xl backdrop-blur-2xl flex flex-col pointer-events-auto"
      >
        {/* Top Header com Caminho Completo e Ações */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`p-2 rounded-xl border shrink-0 ${
                isFolder
                  ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400'
                  : 'bg-pink-950/60 border-pink-500/40 text-pink-400'
              }`}
            >
              {isFolder ? <Folder className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 uppercase">
                  {isFolder ? 'Diretório' : language}
                </span>
                {node.size && (
                  <span className="text-[10px] font-mono text-slate-400">
                    {(node.size / 1024).toFixed(1)} KB
                  </span>
                )}
              </div>
              <h2
                className="text-xs font-mono font-bold text-slate-100 truncate mt-1 select-all"
                title={node.path || node.name}
              >
                {node.path || node.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Botão Copiar Código */}
            {!isFolder && (
              <button
                onClick={handleCopy}
                disabled={isLoading || !code}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-cyan-300'
                }`}
                title="Copiar código"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            )}

            {/* Link para o GitHub */}
            <a
              href={githubFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-pink-400 rounded-xl transition-all"
              title="Abrir no GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            {/* Fechar Drawer */}
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-400 rounded-xl transition-all cursor-pointer ml-1"
              title="Fechar (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Área Central: Skeleton Loading, Erro ou Syntax Highlighting */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {isFolder ? (
            <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center h-full text-slate-400">
              <Folder className="w-12 h-12 text-cyan-400/60" />
              <h3 className="text-sm font-bold text-slate-200">Pasta / Diretório</h3>
              <p className="text-xs max-w-xs text-slate-400">
                Selecione uma esfera (arquivo) no ambiente 3D para inspecionar e ler o código-fonte correspondente.
              </p>
            </div>
          ) : isLoading ? (
            /* Skeleton Loading cibernético */
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 pb-2 border-b border-slate-800/60">
                <Loader2 className="w-4 h-4 animate-spin text-pink-400" />
                <span>Buscando código em raw.githubusercontent.com...</span>
              </div>
              <div className="space-y-2.5 animate-pulse">
                <div className="h-4 bg-slate-800/50 rounded w-1/3"></div>
                <div className="h-4 bg-slate-800/70 rounded w-4/5"></div>
                <div className="h-4 bg-slate-800/40 rounded w-2/3"></div>
                <div className="h-4 bg-slate-800/60 rounded w-full"></div>
                <div className="h-4 bg-slate-800/30 rounded w-1/2"></div>
                <div className="h-4 bg-slate-800/70 rounded w-3/4"></div>
                <div className="h-4 bg-slate-800/50 rounded w-5/6"></div>
                <div className="h-4 bg-slate-800/30 rounded w-2/5"></div>
                <div className="h-4 bg-slate-800/60 rounded w-4/5"></div>
              </div>
            </div>
          ) : error ? (
            /* Mensagem de Erro com fallback amigável */
            <div className="p-8 text-center space-y-3 flex flex-col items-center justify-center h-full">
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-2xl text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Arquivo Indisponível</h3>
              <p className="text-xs text-slate-400 max-w-sm">{error}</p>
              <a
                href={githubFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 px-4 py-2 bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
              >
                <span>Visualizar no GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            /* Syntax Highlighter */
            <div className="text-xs font-mono">
              <SyntaxHighlighter
                language={language}
                style={oneDark}
                showLineNumbers={true}
                wrapLines={true}
                customStyle={{
                  margin: 0,
                  padding: '1.25rem',
                  background: 'transparent',
                  fontSize: '0.75rem',
                  lineHeight: '1.45',
                }}
                lineNumberStyle={{
                  color: '#475569',
                  paddingRight: '1rem',
                  minWidth: '2.5rem',
                }}
              >
                {code || '// Arquivo vazio.'}
              </SyntaxHighlighter>
            </div>
          )}
        </div>

        {/* Rodapé Tático */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>{code ? `${code.split('\n').length} linhas` : 'Pronto'}</span>
          </div>
          <span className="text-slate-500">{repoSlug}</span>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
