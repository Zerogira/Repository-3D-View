import logging
from typing import Optional
from fastapi import FastAPI, Header, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from github_service import GitHubService

# Configure logging without printing authorization tokens
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("gittree-backend")

app = FastAPI(
    title="GitTree Visualizer API",
    description="Backend service for processing GitHub repository structures into interactive 2D/3D graphs",
    version="1.0.0"
)

# Enable CORS for local Vite development frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows local Vite standard ports (5173, etc.)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """Health check endpoint for deployment monitoring."""
    return {"status": "ok", "service": "GitTree Visualizer API"}

@app.get("/api/tree")
async def get_repository_tree(
    repo: str = Query(..., description="Repository in owner/repo format, e.g. facebook/react"),
    x_github_token: Optional[str] = Header(None, alias="X-GitHub-Token")
):
    """
    Fetch repository tree, build node/link graph hierarchy, and return stats.
    Supports optional X-GitHub-Token header to avoid 60 req/h rate limits.
    """
    logger.info(f"Processing repository request for: '{repo}' (Token provided: {bool(x_github_token)})")
    
    if not repo or "/" not in repo:
        raise HTTPException(
            status_code=400,
            detail="Parâmetro 'repo' é obrigatório no formato 'usuario/repositorio'."
        )

    # Note: x_github_token is passed to service and NEVER logged or printed.
    graph_data = await GitHubService.fetch_repository_tree(repo_slug=repo, token=x_github_token)
    return graph_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
