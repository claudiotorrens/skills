from __future__ import annotations

import json
from pathlib import Path

from config import load_config
from project import get_current_version_dir
from state import StateManager
from project_queries import find_board_path, list_projects


HTML_TEMPLATE = """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DevTaskFlow Dashboard</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; background: #0b1020; color: #e8ecf3; }
    .wrap { max-width: 1200px; margin: 0 auto; padding: 24px; }
    .hero { display:flex; justify-content:space-between; gap:16px; align-items:flex-start; margin-bottom:24px; }
    .card { background:#121a2b; border:1px solid #25304a; border-radius:16px; padding:16px; box-shadow: 0 10px 30px rgba(0,0,0,.2); }
    h1,h2 { margin: 0 0 12px; }
    .muted { color:#9fb0d1; font-size:14px; }
    input { width:100%; padding:12px 14px; border-radius:12px; border:1px solid #31415f; background:#0f1728; color:#fff; }
    table { width:100%; border-collapse: collapse; margin-top: 12px; }
    th, td { text-align:left; padding:12px 10px; border-bottom:1px solid #22304c; vertical-align: top; }
    th { color:#9fb0d1; font-weight:600; }
    .pill { display:inline-block; padding:4px 10px; border-radius:999px; background:#1e2a45; color:#cfe0ff; font-size:12px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    .grid { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:16px; margin-bottom:20px; }
    .num { font-size:28px; font-weight:700; }
    details { margin-top: 8px; }
    a { color:#8cc8ff; text-decoration:none; }
    @media (max-width: 900px) { .grid { grid-template-columns:1fr; } .hero { flex-direction:column; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hero">
      <div>
        <h1>DevTaskFlow Dashboard</h1>
        <div class="muted">本地项目看板 / 查询界面 / 归档信息总览</div>
      </div>
      <div class="card" style="min-width:320px; flex:1; max-width:460px;">
        <div class="muted" style="margin-bottom:8px;">搜索项目名 / 状态 / 版本</div>
        <input id="q" placeholder="例如：socialhub / 迭代中 / v1.5.0" />
      </div>
    </div>

    <div class="grid">
      <div class="card"><div class="muted">项目总数</div><div class="num" id="count-all"></div></div>
      <div class="card"><div class="muted">迭代中</div><div class="num" id="count-active"></div></div>
      <div class="card"><div class="muted">看板文件</div><div class="mono" id="board-path"></div></div>
    </div>

    <div class="card">
      <h2>项目看板</h2>
      <div class="muted">支持直接查看项目、当前版本、状态，以及已归档的文档 / 源码 / 部署说明。</div>
      <table>
        <thead>
          <tr>
            <th>项目名</th>
            <th>状态</th>
            <th>最新版本</th>
            <th>路径</th>
            <th>最后更新</th>
            <th>归档信息</th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
  </div>
  <script>
    const DATA = __DATA__;
    const BOARD_PATH = __BOARD_PATH__;
    const rowsEl = document.getElementById('rows');
    const qEl = document.getElementById('q');
    document.getElementById('board-path').textContent = BOARD_PATH;
    document.getElementById('count-all').textContent = String(DATA.length);
    document.getElementById('count-active').textContent = String(DATA.filter(x => String(x.status || '').includes('迭代')).length);

    function esc(v){ return String(v ?? '').replace(/[&<>\"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
    function archiveBlock(item){
      if (!item.archive) return '<span class="muted">暂无</span>';
      const a = item.archive;
      const docs = (a.docs_files || []).map(x => `<li>${esc(x)}</li>`).join('');
      return `
        <details>
          <summary>查看归档</summary>
          <div class="muted" style="margin-top:8px;">当前任务：${esc(item.current_task || '-')}</div>
          <div class="mono">docs: ${esc(a.docs_dir || '-')}</div>
          <div class="mono">src: ${esc(a.src_dir || '-')}</div>
          <div class="mono">deploy: ${esc(a.deployment_file || '-')}</div>
          <div>文档：</div>
          <ul>${docs || '<li>无</li>'}</ul>
        </details>
      `;
    }
    function render(items){
      rowsEl.innerHTML = items.map(item => `
        <tr>
          <td><strong>${esc(item.name)}</strong></td>
          <td><span class="pill">${esc(item.status || '-')}</span></td>
          <td class="mono">${esc(item.current_version || '-')}</td>
          <td class="mono">${esc(item.path || '-')}</td>
          <td>${esc(item.updated_at || '-')}</td>
          <td>${archiveBlock(item)}</td>
        </tr>
      `).join('');
    }
    qEl.addEventListener('input', () => {
      const q = qEl.value.trim().toLowerCase();
      if (!q) return render(DATA);
      render(DATA.filter(item => JSON.stringify(item).toLowerCase().includes(q)));
    });
    render(DATA);
  </script>
</body>
</html>
"""


def enrich_projects(projects: list[dict], start: Path | None = None):
    enriched = []
    base = (start or Path.cwd()).resolve()
    for item in projects:
        row = dict(item)
        project_path = (base / item['path']).resolve() if item.get('path') not in (None, '.') else base
        try:
            config = load_config(project_path)
            version_dir = get_current_version_dir(project_path, config)
            if version_dir and (version_dir / '.state.json').exists():
                state = StateManager(version_dir)
                row['current_task'] = state.data.get('current_task')
                row['pipeline_status'] = state.data.get('status')
                row['archive'] = state.data.get('archive')
        except Exception:
            pass
        enriched.append(row)
    return enriched


def build_dashboard(start: Path | None = None) -> dict:
    board_path = find_board_path(start)
    projects = enrich_projects(list_projects(start), start)
    html_text = HTML_TEMPLATE.replace('__DATA__', json.dumps(projects, ensure_ascii=False))
    html_text = html_text.replace('__BOARD_PATH__', json.dumps(str(board_path), ensure_ascii=False))
    out_path = board_path.parent / 'dtflow-dashboard.html'
    out_path.write_text(html_text, encoding='utf-8')
    return {
        'board_path': str(board_path),
        'dashboard_path': str(out_path),
        'project_count': len(projects),
    }
