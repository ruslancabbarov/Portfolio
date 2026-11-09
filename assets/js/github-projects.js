const GH_USER = "ruslancabbarov";
const GH_TOPIC = "portfolio";
const GH_CACHE_KEY = "gh_repos_v1";
const GH_CACHE_MS = 30 * 60 * 1000;

function ghEscape(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ghCacheGet() {
  try {
    const raw = sessionStorage.getItem(GH_CACHE_KEY);
    if (!raw) return null;
    const { t, data } = JSON.parse(raw);
    return Date.now() - t < GH_CACHE_MS ? data : null;
  } catch { return null; }
}

function ghCacheSet(data) {
  try {
    sessionStorage.setItem(GH_CACHE_KEY, JSON.stringify({ t: Date.now(), data }));
  } catch {}
}

async function loadGithubProjects() {
  const box = document.getElementById("githubProjects");
  if (!box) return;

  try {
    let repos = ghCacheGet();
    if (!repos) {
      const res = await fetch(
        `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`
      );
      if (!res.ok) throw new Error("GitHub API " + res.status);
      repos = await res.json();
      ghCacheSet(repos);
    }

    const list = repos.filter(
      (r) => !r.fork && !r.archived && (r.topics || []).includes(GH_TOPIC)
    );

    if (!list.length) {
      box.innerHTML = `<p class="text-slate-500 text-sm">Add the "${GH_TOPIC}" topic to a GitHub repo to show it here.</p>`;
      return;
    }

    box.innerHTML = list.map((r) => {
      const tags = (r.topics || [])
        .filter((t) => t !== GH_TOPIC)
        .slice(0, 4)
        .map((t) => `<span class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-mono">${ghEscape(t)}</span>`)
        .join("");
      return `
        <a href="${ghEscape(r.html_url)}" target="_blank" rel="noopener"
           class="glass-card glass-card-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-mono text-emerald-400">${ghEscape(r.language || "Code")}</span>
              <span class="text-xs text-slate-500"><i class="fa-regular fa-star"></i> ${r.stargazers_count}</span>
            </div>
            <h5 class="font-bold text-slate-100 mb-2">${ghEscape(r.name)}</h5>
            <p class="text-slate-400 text-xs leading-relaxed mb-4">${ghEscape(r.description || "No description yet.")}</p>
          </div>
          <div class="flex flex-wrap gap-1.5">${tags}</div>
        </a>`;
    }).join("");
  } catch (err) {
    console.error(err);
    box.innerHTML = `<p class="text-slate-500 text-sm">Projects could not be loaded right now. See <a class="text-emerald-400 underline" href="https://github.com/${GH_USER}" target="_blank">GitHub</a>.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadGithubProjects);