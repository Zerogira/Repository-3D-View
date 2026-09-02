<div align="center">

# 🌌 GitTree Visualizer 3D

  <p align="center">
    <b>Transforme qualquer repositório do GitHub em um universo tridimensional interativo e hiper-otimizado.</b>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/WebGL-Three.js-blueviolet?style=for-the-badge&logo=three.js" alt="Three.js" />
    <img src="https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite-cyan?style=for-the-badge&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/State-Zustand-pink?style=for-the-badge" alt="Zustand" />
    <img src="https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python-emerald?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  </p>

</div>

---

## 🎨 Identidade Visual (Cyberpunk Cosmic Space)

A interface foi projetada sob uma paleta **Cosmic Dark Absoluta** (`#010409`), combinando elementos neon com alta legibilidade espacial:

<table align="center" width="100%">
  <tr>
    <th width="33%" align="center">🗂️ Diretórios e Módulos</th>
    <th width="33%" align="center">📄 Arquivos do Repositório</th>
    <th width="33%" align="center">🌌 Universo & Perspectiva</th>
  </tr>
  <tr>
    <td align="center">
      <b>Cubos 3D Chanfrados</b><br/>
      <code style="color: #22d3ee;">#22d3ee (Cyan Neon)</code><br/>
      Com anéis de órbita giratórios e tamanho proporcional à profundidade.
    </td>
    <td align="center">
      <b>Esferas Neon Cristalinas</b><br/>
      <code style="color: #f472b6;">#f472b6 (Pink Magenta)</code><br/>
      Representando a massa de código com brilho emissivo.
    </td>
    <td align="center">
      <b>Chão Espaço-Tempo</b><br/>
      <code style="color: #1d4ed8;">#1d4ed8 (Cobalt Blue)</code><br/>
      Grade de referência horizontal e campo de 5.000 estrelas rotativo.
    </td>
  </tr>
</table>

---

## 🚀 Arquitetura de Alto Desempenho 3D (60 FPS Constant)

Um dos maiores desafios em visualizadores tridimensionais de código é manter a navegação **lisa e sem travamentos**, mesmo em computadores sem placa de vídeo dedicada (GPU integrada de escritório). 

Para alcançar **60 FPS cravados**, o **GitTree Visualizer 3D** utiliza um fluxo de engenharia tridimensional avançado:

```
                               ┌──────────────────────────────────────────────┐
                               │  Worker Thread (Background)                  │
  [GitHub API] ──► [FastAPI] ──┼─► layout.worker.js ──► computeLayout()     │
                               └──────────────────────┬───────────────────────┘
                                                      │ Posições (x, y, z)
                               ┌──────────────────────▼───────────────────────┐
                               │  Main Thread (GPU Renderer)                  │
                               │  ├── NodesRender   ──► InstancedMesh (1 Call)│
                               │  ├── EdgesRender   ──► LineSegments  (1 Call)│
                               │  └── LabelsRender  ──► WebGL Sprite  (LOD)   │
                               └──────────────────────────────────────────────┘
```

### ⚡ As 4 Técnicas de Otimização Utilizadas:

1. 💎 **Instanced Mesh Rendering (`InstancedMesh` Nulo de Draw Calls):**
   - *Problema Tradicional:* Criar um objeto 3D separado para cada arquivo geraria centenas de chamadas de desenho (*Draw Calls*), travando a GPU.
   - *Nossa Solução:* Todas as pastas são desenhadas em **apenas 1 única Draw Call**, e todos os arquivos em **outra 1 Draw Call**, independente se o repositório possui 100 ou 5.000 nós.

2. 🧵 **Processamento Assíncrono via Web Worker (`layout.worker.js`):**
   - *Problema Tradicional:* Calcular a trigonometria do mapa 3D na thread da interface congela a tela do usuário.
   - *Nossa Solução:* O cálculo matemático do arranjo cilíndrico roda **fora da thread principal** em um Web Worker em background. A interface do usuário fica 100% solta e fluida.

3. ⚡ **Linhas e Arestas Compiladas em Lote Nulo (`LineSegments` + `Float32Array`):**
   - Todas as linhas de ligação entre diretórios e arquivos são compiladas em uma única matriz de memória compartilhada (`Float32Array`) renderizada via `<lineSegments>`.

4. 📐 **Algoritmo de Layout Cilíndrico Determinístico (Sem Física de Repulsão):**
   - Eliminamos o consumo contínuo de CPU da física de repulsão aleatória (`d3-force-3d`). As posições de profundidade ascende em $Y$ e distribuem-se em leques circulares $X-Z$ pré-calculados apenas 1 vez na carga do projeto.

---

## ✨ Recursos e Funcionalidades

- [x] **Modo Galaxy 3D & Visualização 2D Plano:** Alterne instantaneamente entre a galáxia tridimensional WebGL e a árvore plana 2D.
- [x] **Névoa Mínima e Câmera com Restrição Polar:** Trava `maxPolarAngle` que impede a câmera de virar de ponta-cabeça abaixo do chão, mantendo a perspectiva espacial perfeita.
- [x] **Painel de Filtro por Extensão (`.js`, `.tsx`, `.py`, etc.):** Checkboxes laterais retráteis para ocultar ou isolar tipos específicos de arquivos do grafo em tempo real.
- [x] **Busca Dinâmica por Texto com Esmaecimento:** Pesquise arquivos no próprio mapa; os arquivos correspondentes permanecem acesos enquanto os demais diminuem a opacidade.
- [x] **Minimapa 2D em SVG:** Canvas de radar top-down no canto inferior direito com posicionamento relativo de todos os nós.
- [x] **Cache In-Memory no Backend (FastAPI):** O backend armazena árvores processadas em memória por 5 minutos, evitando chamadas repetidas à API do GitHub.

---

## 🛠️ Requisitos Pré-requisitos

- **Node.js:** Versão 18+ e `npm`
- **Python:** Versão 3.10+

---

## ⚙️ Como Executar o Projeto

Inicie a aplicação utilizando as automações `.bat` pré-configuradas em dois terminais separados:

### 1️⃣ Terminal 1 (Backend - FastAPI):
```cmd
.\run_backend.bat
```
> Instala/verifica o ambiente Python (`venv`), instala o `requirements.txt` e inicia a API em **`http://localhost:8000`**.

### 2️⃣ Terminal 2 (Frontend - React 18 + Vite):
```cmd
.\run_front.bat
```
> Sincroniza as dependências `npm` automaticamente e inicia a interface web na porta **`http://localhost:5173`**.

---

## 🔐 Configuração de Token da API do GitHub (Opcional)

A API pública do GitHub possui um limite de **60 requisições/hora** para requisições anônimas.

Para navegar em repositórios grandes sem restrições (até **5.000 requisições/hora**):
1. Clique no botão **`API Token`** na barra superior da aplicação.
2. Insira um **GitHub Personal Access Token (PAT)**.
3. O token é salvo exclusivamente no seu `localStorage` e enviado de forma segura ao seu backend local. O backend nunca imprime nem armazena seu token em disco.

---

<div align="center">
  <sub>Desenvolvido com foco em alta performance gráfica 3D e visualização interativa de código.</sub>
</div>
