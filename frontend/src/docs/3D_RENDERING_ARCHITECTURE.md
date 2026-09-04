# 🌌 Arquitetura de Renderização 3D e Diretrizes de Performance (GitTree)

> **Documento Oficial de Engenharia Gráfica e Desempenho WebGL**  
> **Status**: Ativo & Obrigatório  
> **Meta de Performance**: 60 FPS cravados em repositórios com > 2.000 nós em hardware intermediário.  
> **Aviso Crítico**: Nenhuma alteração no pipeline 3D deve violar os mandamentos abaixo sem autorização prévia e validação formal via Profiler.

---

## 🏛️ 1. O Core da Renderização: Como o 3D se Comporta

O visualizador 3D do GitTree (`GraphViewer3D`) adota uma arquitetura em camadas otimizada para WebGL sobre **React Three Fiber (Three.js)** com processamento assíncrono em **Web Worker**:

```
[ Usuário / UI (React) ]
           │
           ▼
[ layout.worker.js ] ── (Anti-Freeze UI em Thread Separada)
     ├─ d3-force-3d / layoutEngine (Matemática Pura 3D)
     └─ Safe Zone Radial + Moat Central + Y-Squash
           │
           ▼
[ GraphViewer3D (Canvas R3F) ] ── (gl.powerPreference: "high-performance")
     │
     ├─ SceneSetup (Luzes Cyberpunk + OrbitControls liberado + Bússola)
     │   └─ FloorGrid (Piso vetorial estático 80 divisões)
     │
     └─ GraphRenderer
         ├─ NodesRender (Pastas e Arquivos via InstancedMesh) ───────► 2 Draw Calls
         ├─ EdgesRender (Troncos e Arquivos via lineSegments único) ─► 1 Draw Call
         ├─ OrbitRingsRender (Anéis de Órbitas via lineSegments) ───► 1 Draw Call
         └─ LabelsRender (Troika SDF Text com Proximity-LOD) ────────► 15 ~ 45 Draw Calls
```

---

## 🛡️ 2. Os 5 Mandamentos Inegociáveis de Performance

### Mandamento 1: Zero Tags HTML no Canvas 3D
- **Proibido**: Uso de `<Html>` do `@react-three/drei` dentro de nós, cards ou rótulos iterados.
- **Motivo**: Cada tag HTML gera recalculo de layout e mutações pesadas na CPU via CSS transforms a cada frame, congelando a thread principal.
- **Padrão Obrigatório**: Rótulos e textos devem utilizar exclusivamente `<Text>` do `@react-three/drei` (renderizados como malhas de distância assinada - SDF nativas na GPU).

### Mandamento 2: Single Draw Calls (Instancing & Segments)
- **Proibido**: Renderizar nós como `nodes.map(n => <mesh key={n.id} />)`.
- **Padrão Obrigatório**:
  - **Esferas/Planetas**: Devem utilizar impreterivelmente `<instancedMesh>` via `NodesRender.jsx`. Mesmo com 10.000 arquivos, o custo de desenho é de apenas **2 Draw Calls** (1 para pastas, 1 para arquivos).
  - **Conexões e Ramos**: Utilizar sempre `THREE.LineSegments` com um único `THREE.BufferGeometry` em `EdgesRender.jsx`. Nunca usar `<Line>` tubular poligonal para conexões em massa.

### Mandamento 3: Geometria Enxuta (Orçamento de Triângulos)
- O orçamento total da cena não deve exceder **100.000 triângulos**.
- **Esferas de Diretórios**: Máximo de `args={[2.0, 14, 14]}` (~350 tris).
- **Esferas de Arquivos**: Máximo de `args={[0.8, 10, 10]}` (~180 tris).
- Esferas com 24 ou 32 segmentos são estritamente proibidas para coleções de arquivos.

### Mandamento 4: Proximity-Based LOD (Level of Detail) Estrito
- Nem todos os rótulos de texto devem estar montados na GPU simultaneamente.
- **Teto (Cap) de Textos**:
  - **Pastas**: Apenas o Sol central e até 35 pastas mais próximas da câmera são montadas.
  - **Arquivos**: Apenas os 40 arquivos mais próximos da câmera (dentro do frustum de visualização) são montados.
- Ao afastar o zoom (visão macro), os textos desaparecem para manter 60 FPS contínuos, reaparecendo apenas no zoom focal.

### Mandamento 5: Desativação de Passes de Sombra no Canvas
- **Configuração do Canvas**: O `<Canvas>` principal **não deve possuir `shadows` ativo**, e as luzes direcionais não devem computar mapas de sombra (`castShadow={false}`).
- O ambiente do GitTree é puramente cibernético e estilizado com cores neon auto-iluminadas (`toneMapped={false}` e cores emissivas). Mapas de sombra gastam 30% a 50% da taxa de quadros sem benefício visual relevante.

---

## 🔬 3. O Profiler da GPU e Ferramenta de Diagnóstico

O arquivo `src/components/3d/Environment/PerformanceStatsOverlay.jsx` monitora em tempo real:
- **FPS & Frame Time (ms)**
- **Draw Calls reais** (`gl.info.render.calls` com `autoReset = false`)
- **Triângulos** (`gl.info.render.triangles`)
- **Texturas em VRAM** (`gl.info.memory.textures`)
- **Geometrias alocadas** (`gl.info.memory.geometries`)

### Ferramenta "Rodar Diagnóstico":
Qualquer desenvolvedor ou agente de IA pode clicar em "Rodar Diagnóstico" para aferir o impacto isolado de cada subsistema (Base -> Linhas -> Bolinhas -> Textos). Se uma nova funcionalidade reduzir o FPS para menos de 50 FPS em qualquer etapa, ela deve ser imediatamente rejeitada e reestruturada para seguir os mandamentos acima.
