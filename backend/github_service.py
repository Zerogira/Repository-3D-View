import os
import re
import httpx
from dotenv import load_dotenv
from cachetools import TTLCache
from fastapi import HTTPException
from typing import Dict, Any, List, Optional

# Load environment variables from .env file if present
load_dotenv()

# In-memory TTL Cache (5 minutes expiration, max 200 repositories)
tree_cache: TTLCache = TTLCache(maxsize=200, ttl=300)


MAX_NODES_LIMIT = 10000

class GitHubService:
    @staticmethod
    async def fetch_repository_tree(repo_slug: str, token: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetches repository details and recursive Git Tree from GitHub API,
        reconstructs full directory hierarchy (including implicit parent folders),
        and caches results in memory.
        """
        # Clean and parse repository slug or URL (e.g. 'https://github.com/owner/repo.git', 'owner/repo')
        cleaned = repo_slug.strip()
        cleaned = re.sub(r'^(https?://)?(www\.)?github\.com/', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'^git@github\.com:', '', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\.git$', '', cleaned, flags=re.IGNORECASE)
        cleaned = cleaned.strip('/')
        
        parts = [p for p in cleaned.split('/') if p]
        if len(parts) < 2:
            raise HTTPException(
                status_code=400,
                detail="Formato de repositório inválido. Use 'usuario/repositorio' ou a URL completa do GitHub."
            )
        
        owner, repo = parts[0], parts[1]
        clean_slug = f"{owner}/{repo}"
        
        # Build cache key based on repo slug (lowercased) and whether a custom token was provided
        cache_key = f"{owner.lower()}/{repo.lower()}:has_token={bool(token)}"
        if cache_key in tree_cache:
            return tree_cache[cache_key]

        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitTree-Visualizer-App"
        }
        
        # Prioritize token passed via header, fallback to backend env var if set
        active_token = token or os.getenv("GITHUB_TOKEN")
        if active_token and active_token.strip():
            headers["Authorization"] = f"Bearer {active_token.strip()}"

        async with httpx.AsyncClient(timeout=15.0) as client:
            # 1. Fetch Repository metadata to discover default branch
            repo_url = f"https://api.github.com/repos/{owner}/{repo}"
            try:
                repo_resp = await client.get(repo_url, headers=headers)
            except httpx.RequestError:
                raise HTTPException(
                    status_code=503,
                    detail="Falha de conexão com a API do GitHub. Verifique sua conexão com a internet."
                )

            if repo_resp.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail=f"Repositório '{clean_slug}' não foi encontrado ou é privado. Se for privado, informe um Token válido."
                )
            elif repo_resp.status_code == 403:
                raise HTTPException(
                    status_code=403,
                    detail="Limite de requisições da API do GitHub excedido (60 req/h para anônimos). Insira um Personal Access Token."
                )
            elif repo_resp.status_code != 200:
                raise HTTPException(
                    status_code=repo_resp.status_code,
                    detail=f"Erro na API do GitHub: {repo_resp.status_code}"
                )

            repo_data = repo_resp.json()
            default_branch = repo_data.get("default_branch", "main")
            repo_stars = repo_data.get("stargazers_count", 0)

            # 2. Fetch full recursive tree for default branch
            tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
            tree_resp = await client.get(tree_url, headers=headers)

            if tree_resp.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail=f"Árvore do repositório na branch '{default_branch}' não foi encontrada."
                )
            elif tree_resp.status_code == 403:
                raise HTTPException(
                    status_code=403,
                    detail="Limite de requisições da API do GitHub excedido. Insira um Personal Access Token nas configurações."
                )
            elif tree_resp.status_code != 200:
                raise HTTPException(
                    status_code=tree_resp.status_code,
                    detail=f"Erro ao buscar estrutura do repositório: HTTP {tree_resp.status_code}"
                )

            tree_data = tree_resp.json()
            raw_tree = tree_data.get("tree", [])
            is_truncated = tree_data.get("truncated", False)

            if len(raw_tree) > MAX_NODES_LIMIT:
                raise HTTPException(
                    status_code=409,
                    detail=f"Repositório muito grande ({len(raw_tree)} arquivos). O limite atual para visualização fluida é de {MAX_NODES_LIMIT} elementos."
                )

            # 3. Process & Reconstruct full folder hierarchy
            parsed_graph = GitHubService._build_graph_structure(
                raw_tree=raw_tree,
                repo_slug=clean_slug,
                default_branch=default_branch,
                stars=repo_stars,
                is_truncated=is_truncated
            )

            # Save in TTL Cache
            tree_cache[cache_key] = parsed_graph
            return parsed_graph

    @staticmethod
    def _build_graph_structure(
        raw_tree: List[Dict[str, Any]],
        repo_slug: str,
        default_branch: str,
        stars: int,
        is_truncated: bool
    ) -> Dict[str, Any]:
        """
        Reconstructs explicit folder hierarchy from GitHub's flat tree list.
        Generates nodes and directional parent->child links.
        """
        nodes_map: Dict[str, Dict[str, Any]] = {}
        links: List[Dict[str, str]] = []
        extension_counts: Dict[str, int] = {}
        
        root_id = "root"
        root_name = repo_slug.split("/")[-1]
        
        nodes_map[root_id] = {
            "id": root_id,
            "name": root_name,
            "path": "",
            "type": "folder",
            "extension": "",
            "size": 0,
            "depth": 0,
            "val": 12  # Root node visual weight
        }

        total_files = 0
        total_folders = 1
        max_depth = 0

        for item in raw_tree:
            item_path = item.get("path", "")
            item_type = "folder" if item.get("type") == "tree" else "file"
            item_size = item.get("size", 0)

            if not item_path:
                continue

            parts = item_path.split("/")
            current_depth = len(parts)
            if current_depth > max_depth:
                max_depth = current_depth

            # Ensure all parent directory nodes exist
            current_path_acc = ""
            parent_id = root_id

            for i, part in enumerate(parts):
                is_last = (i == len(parts) - 1)
                current_path_acc = f"{current_path_acc}/{part}" if current_path_acc else part
                node_id = current_path_acc

                if node_id not in nodes_map:
                    if is_last:
                        node_kind = item_type
                    else:
                        node_kind = "folder"

                    ext = ""
                    if node_kind == "file" and "." in part and not part.startswith("."):
                        ext = f".{part.rsplit('.', 1)[-1].lower()}"
                    elif node_kind == "file" and part.startswith("."):
                        ext = part.lower()

                    if node_kind == "file":
                        total_files += 1
                        if ext:
                            extension_counts[ext] = extension_counts.get(ext, 0) + 1
                    else:
                        total_folders += 1

                    nodes_map[node_id] = {
                        "id": node_id,
                        "name": part,
                        "path": current_path_acc,
                        "type": node_kind,
                        "extension": ext,
                        "size": item_size if is_last and node_kind == "file" else 0,
                        "depth": i + 1,
                        "val": 7 if node_kind == "folder" else 4
                    }

                    links.append({
                        "source": parent_id,
                        "target": node_id
                    })

                parent_id = node_id

        # Update folder node values according to child density
        for link in links:
            source_node = nodes_map.get(link["source"])
            if source_node and source_node["type"] == "folder" and source_node["id"] != root_id:
                source_node["val"] += 0.5

        sorted_extensions = sorted(
            [{"ext": k, "count": v} for k, v in extension_counts.items()],
            key=lambda x: x["count"],
            reverse=True
        )[:8]

        return {
            "repo": repo_slug,
            "default_branch": default_branch,
            "stars": stars,
            "is_truncated": is_truncated,
            "nodes": list(nodes_map.values()),
            "links": links,
            "stats": {
                "total_nodes": len(nodes_map),
                "total_files": total_files,
                "total_folders": total_folders,
                "max_depth": max_depth,
                "top_extensions": sorted_extensions
            }
        }
