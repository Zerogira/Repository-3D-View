# 🚀 GitTree Visualizer 3D

Uma aplicação web interativa desenvolvida com **React**, **Three.js / React Force Graph** e **FastAPI** para transformar qualquer repositório do GitHub em um mapa 3D/2D com física em tempo real.

![GitTree Visualizer](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20Three.js-cyan?style=for-the-badge)

---

## 🎨 Identidade Visual (Cyberpunk Minimalista)

* **Tema:** Dark Mode Absoluto (`#0b0f19`).
* **Cubos Ciano (`#22d3ee`):** Representam **Pastas e Diretórios**.
* **Esferas Rosa Neon (`#ec4899`):** Representam **Arquivos**.
* **Física Otimizada:** Cooldown automático de ticks para evitar travamentos de CPU.

---

## 🛠️ Requisitos Pré-requisitos

* **Node.js:** Versão 18+ e `npm`
* **Python:** Versão 3.10+

---

## ⚙️ Como Executar em Terminais Separados na IDE

Abra 2 abas de terminal na sua IDE (na raiz do projeto):

### 1. Terminal 1 (Backend - FastAPI):
```cmd
.\run_backend.bat
```
- Inicia e verifica o ambiente virtual Python (`venv`) e `requirements.txt`.
- Executa o servidor FastAPI na **Porta 8000** (`http://localhost:8000`).

---

### 2. Terminal 2 (Frontend - React + Vite):
```cmd
.\run_front.bat
```
- Inicia e verifica as dependências Node.js (`npm install`).
- Executa o servidor Vite na **Porta 5173** (`http://localhost:5173`).


---

## 🔐 Configuração do Token do GitHub (Opcional)

A API pública do GitHub possui um limite de **60 requisições/hora** para usuários anônimos.
Para navegar sem restrições (até **5.000 requisições/hora**):
1. Clique no botão **`API Token`** na barra superior da aplicação.
2. Insira um **GitHub Personal Access Token (PAT)**.
3. O token é salvo exclusivamente no seu `localStorage` e enviado de forma segura via headers ao backend local. O backend **nunca** imprime nem salva seu token em logs.

---

## ⚡ Recursos e Funcionalidades

- [x] **Visualização 3D e 2D:** Alterne entre modo tridimensional com Three.js ou bidimensional plano.
- [x] **Geometrias Distintas:** Pastas são renderizadas como Cubos 3D e Arquivos como Esferas 3D.
- [x] **Quick Presets:** Botões de 1 clique para testar repositórios populares (`facebook/react`, `vuejs/core`, `fastapi/fastapi`, `tailwindlabs/tailwindcss`).
- [x] **Filtro em Tempo Real:** Pesquise arquivos no próprio grafo; nós correspondentes permanecem acesos enquanto o restante diminui a opacidade.
- [x] **Cache In-Memory no Backend:** Respostas salvas por 5 minutos no FastAPI via TTLCache.
- [x] **Reconstrução Inteligente de Árvore:** Garante que pastas intermediárias vazias ou implícitas sejam criadas no grafo.
