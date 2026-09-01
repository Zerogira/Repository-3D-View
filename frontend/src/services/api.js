const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchRepositoryGraph(repoSlug, token = null) {
  const cleanRepo = repoSlug.trim();
  const storedToken = token || localStorage.getItem('gittree_github_token');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (storedToken && storedToken.trim()) {
    headers['X-GitHub-Token'] = storedToken.trim();
  }

  const url = `${API_BASE_URL}/api/tree?repo=${encodeURIComponent(cleanRepo)}`;

  const response = await fetch(url, { headers });

  if (!response.ok) {
    let errorDetail = `Erro HTTP ${response.status}`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        errorDetail = errData.detail;
      }
    } catch (e) {
      // JSON parse error fallback
    }

    const err = new Error(errorDetail);
    err.status = response.status;
    throw err;
  }

  return await response.json();
}
