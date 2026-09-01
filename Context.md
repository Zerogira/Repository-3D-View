# Contexto do Projeto: GitTree Visualizer (Zerogira)

## 🎯 Objetivo
Criar uma aplicação web que recebe a URL de um repositório do GitHub e renderiza sua estrutura de pastas e arquivos em visualizações interativas em 2D e 3D utilizando grafos direcionados.

## 🛠️ Stack Tecnológica
- **Frontend:** React (inicializado via Vite)
- **Estilização:** Tailwind CSS
- **Animações da UI:** Framer Motion (transições suaves, modais, efeitos de hover)
- **Motor de Renderização 2D/3D:** `react-force-graph-2d` e `react-force-graph-3d`
- **Ícones:** `lucide-react`
- **Backend:** Python com FastAPI (para consumir a Trees API do GitHub com segurança e mapear os nós/arestas)
- **Requisições (Backend):** `httpx`

## 🎨 Identidade Visual (Cyberpunk Minimalista)
- **Tema Central:** Dark Mode absoluto.
- **Background Principal:** Tons profundos de azul/cinza escuro (ex: `bg-slate-950` ou `#0B0F19`).
- **Acento Primário (Ciano):** Representa pastas, conexões ativas e botões primários (Tailwind `cyan-400` / `#22d3ee`).
- **Acento Secundário (Rosa):** Representa arquivos, highlights, e botões secundários (Tailwind `pink-500` / `#ec4899`).
- **Vibe:** Interface limpa, com bordas arredondadas suaves, glows (sombras coloridas) usando Tailwind, e animações polidas que dão uma sensação futurista e tecnológica.

## 📂 Arquitetura do Repositório (Monorepo)
```text
/
├── frontend/       # App React + Vite
├── backend/        # API em FastAPI
├── docs/           # Imagens e diagramas da documentação
├── CONTEXT.md      # Este arquivo
└── README.md       # Documentação principal de execução