import argparse
from pathlib import Path

from config import find_project_root, load_config, validate_config, ConfigError
from doctor import run_doctor
from scaffold import init_project_structure
from analyze import run_analyze
from project import get_current_version_dir
from state import StateManager
from write_flow import run_write
from review_flow import run_review
from fix_flow import run_fix
from release_flow import run_deploy, run_seal
from version_flow import create_version
from project_queries import list_projects, get_project_by_name, bump_version
from dashboard import build_dashboard
from serve import run_serve
from workspace_layout import resolve_project_init_path
from project_board import find_workspace_root


BASE_DIR = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = BASE_DIR / 'templates'


def cmd_init_project(args):
    workspace_root = find_workspace_root(Path.cwd())
    project_root = resolve_project_init_path(workspace_root, args.path, args.name)
    result = init_project_structure(project_root, TEMPLATES_DIR, project_name=args.name)
    print('✅ DevTaskFlow 项目初始化完成')
    for k, v in result.items():
        print(f'- {k}: {v}')
    print('\n下一步：')
    print('1. 编辑 .dtflow/config.json')
    print('2. 配置环境变量或 .env')
    print('3. 执行 dtflow doctor')
    return 0


def cmd_doctor(args):
    checks = run_doctor()
    ok = True
    print('DevTaskFlow Doctor')
    print('=' * 24)
    for name, passed, detail in checks:
        mark = '✅' if passed else '❌'
        print(f'{mark} {name}: {detail}')
        if not passed:
            ok = False
    return 0 if ok else 1


def cmd_status(args):
    root = find_project_root()
    if not root:
        print('未找到 .dtflow/config.json，当前目录不是 DevTaskFlow 项目')
        return 1
    try:
        config = load_config(root)
        validate_config(config)
    except ConfigError as e:
        print(f'配置错误: {e}')
        return 1
    print('DevTaskFlow Status')
    print('=' * 24)
    print(f'project_root: {root}')
    print(f'project_name: {config["project"].get("name")}')
    print(f'language: {config["project"].get("language")}')
    print(f'versions_dir: {config["pipeline"].get("versions_dir")}')
    print(f'orchestration: {config["adapters"].get("orchestration")}')
    version_dir = get_current_version_dir(root, config)
    if version_dir and (version_dir / '.state.json').exists():
        state = StateManager(version_dir)
        print(f'version: {version_dir.name}')
        print(f'status: {state.data.get("status")}')
        print(f'current_task: {state.data.get("current_task")}')
    try:
        project = get_project_by_name(config['project']['name'], root)
        print(f'board_status: {project.get("status")}')
        print(f'board_version: {project.get("current_version")}')
    except Exception:
        pass
    return 0


def cmd_project_list(args):
    projects = list_projects(Path.cwd())
    print('DevTaskFlow Projects')
    print('=' * 24)
    if not projects:
        print('暂无项目')
        return 0
    for idx, project in enumerate(projects, start=1):
        print(f"{idx}. {project['name']}")
        print(f"   - status: {project.get('status', '-')}")
        print(f"   - version: {project.get('current_version', '-')}")
        print(f"   - path: {project.get('path', '-')}")
        print(f"   - updated_at: {project.get('updated_at', '-')}")
        if project.get('note'):
            print(f"   - note: {project.get('note')}")
    return 0


def cmd_project_status(args):
    if not args.name:
        print('请通过 --name 指定项目名')
        return 1
    try:
        project = get_project_by_name(args.name, Path.cwd())
    except Exception as e:
        print(f'project-status 失败: {e}')
        return 1
    print('DevTaskFlow Project Status')
    print('=' * 24)
    for key in ['name', 'status', 'current_version', 'path', 'updated_at', 'note']:
        print(f'{key}: {project.get(key, "-")}')
    return 0


def cmd_next_version(args):
    if not args.version:
        print('请通过 --version 指定当前版本号')
        return 1
    try:
        next_version = bump_version(args.version, args.bump)
    except Exception as e:
        print(f'next-version 失败: {e}')
        return 1
    print(next_version)
    return 0


def cmd_dashboard(args):
    try:
        result = build_dashboard(Path.cwd())
    except Exception as e:
        print(f'dashboard 失败: {e}')
        return 1
    print('✅ dashboard 已生成')
    print(f"- board_path: {result['board_path']}")
    print(f"- dashboard_path: {result['dashboard_path']}")
    print(f"- project_count: {result['project_count']}")
    return 0


def cmd_serve(args):
    try:
        server, result = run_serve(Path.cwd(), port=args.port)
    except Exception as e:
        print(f'serve 失败: {e}')
        return 1
    print('✅ 本地看板服务已启动')
    print(f"- url: {result['url']}")
    print(f"- dashboard_path: {result['dashboard_path']}")
    print('按 Ctrl+C 停止')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n已停止')
    finally:
        server.server_close()
    return 0


def cmd_start_version(args):
    root = find_project_root()
    if not root:
        print('未找到 .dtflow/config.json，当前目录不是 DevTaskFlow 项目')
        return 1
    if not args.version:
        print('请通过 --version 指定版本号，例如 v0.1.0')
        return 1
    mode = 'new' if args.new_project else 'iterate'
    try:
        config = load_config(root)
        validate_config(config)
        result = create_version(root, config, args.version, mode=mode)
    except Exception as e:
        print(f'start-version 失败: {e}')
        return 1
    print('✅ 版本已启动')
    print(f"- mode: {result['mode']}")
    print(f"- version_dir: {result['version_dir']}")
    print(f"- requirements_file: {result['requirements_file']}")
    print('下一步：填写 REQUIREMENTS.md，然后执行 dtflow analyze')
    return 0


def cmd_analyze(args):
    root = find_project_root()
    if not root:
        print('未找到 .dtflow/config.json，当前目录不是 DevTaskFlow 项目')
        return 1
    try:
        config = load_config(root)
        validate_config(config)
        result = run_analyze(root, config)
    except Exception as e:
        print(f'analyze 失败: {e}')
        return 1
    print('✅ analyze 完成')
    print(f"- plan_file: {result['plan_file']}")
    print(f"- task_count: {result['task_count']}")
    for task in result['tasks'][:10]:
        print(f"  - [{task['id']}] {task['name']} ({task['priority']})")
    print('\n下一步：dtflow confirm 或 dtflow revise --feedback "..."')
    return 0


def cmd_confirm(args):
    root = find_project_root()
    if not root:
        print('未找到 .dtflow/config.json，当前目录不是 DevTaskFlow 项目')
        return 1
    try:
        config = load_config(root)
        version_dir = get_current_version_dir(root, config)
        if not version_dir:
            raise RuntimeError('没有找到当前版本目录')
        state = StateManager(version_dir)
        if state.data.get('status') != 'pending_confirm':
            raise RuntimeError(f"当前状态不是 pending_confirm，而是 {state.data.get('status')}")
        state.data['architecture_confirmed'] = True
        state.data['status'] = 'confirmed'
        tasks = state.data.get('tasks', [])
        state.data['current_task'] = tasks[0]['id'] if tasks else None
        state.save()
    except Exception as e:
        print(f'confirm 失败: {e}')
        return 1
    print('✅ 方案已确认')
    print(f"- current_task: {state.data.get('current_task')}")
    print('下一步：dtflow write')
    return 0


def cmd_revise(args):
    root = find_project_root()
    if not root:
        print('未找到 .dtflow/config.json，当前目录不是 DevTaskFlow 项目')
        return 1
    if not args.feedback:
        print('请通过 --feedback 提供修改意见')
        return 1
    try:
        config = load_config(root)
        version_dir = get_current_version_dir(root, config)
        if not version_dir:
            raise RuntimeError('没有找到当前版本目录')
        state = StateManager(version_dir)
        state.data['revision_feedback'] = args.feedback
        state.save()
    except Exception as e:
        print(f'revise 失败: {e}')
        return 1
    print('✅ 已记录反馈')
    print(f'- feedback: {args.feedback}')
    print('请重新执行 dtflow analyze')
    return 0


def cmd_write(args):
    root = find_project_root()
    if not root:
        print('未找到 .dtflow/config.json，当前目录不是 DevTaskFlow 项目')
        return 1
    try:
        config = load_config(root)
        validate_config(config)
        result = run_write(root, config, task_id=args.task_id)
    except Exception as e:
        print(f'write 失败: {e}')
        return 1
    print('✅ write 完成')
    print(f"- task: [{result['task_id']}] {result['task_name']}")
    print(f"- files_written: {result['count']}")
    for item in result['files'][:20]:
        print(f"  - {item['action']}: {item['path']}")
    print('\n下一步：dtflow review')
    return 0


def cmd_review(args):
    root = find_project_root()
    if not root:
        print('未找到 .dtflow/config.json，当前目录不是 DevTaskFlow 项目')
        return 1
    try:
        config = load_config(root)
        validate_config(config)
        result = run_review(root, config)
    except Exception as e:
        print(f'review 失败: {e}')
        return 1
    print('✅ review 完成')
    print(f"- review_file: {result['review_file']}")
    print(f"- passed: {result['passed']}")
    print('下一步：' + ('继续下一个任务 / dtflow deploy' if result['passed'] else 'dtflow fix'))
    return 0


def cmd_fix(args):
    root = find_project_root()
    if not root:
        print('未找到 .dtflow/config.json，当前目录不是 DevTaskFlow 项目')
        return 1
    try:
        config = load_config(root)
        validate_config(config)
        result = run_fix(root, config)
    except Exception as e:
        print(f'fix 失败: {e}')
        return 1
    print('✅ fix 完成')
    print(f"- task: [{result['task_id']}] {result['task_name']}")
    print(f"- files_written: {result['count']}")
    for item in result['files'][:20]:
        print(f"  - {item['action']}: {item['path']}")
    print('下一步：dtflow review')
    return 0


def cmd_deploy(args):
    root = find_project_root()
    if not root:
        print('未找到 .dtflow/config.json，当前目录不是 DevTaskFlow 项目')
        return 1
    try:
        config = load_config(root)
        validate_config(config)
        result = run_deploy(root, config)
    except Exception as e:
        print(f'deploy 失败: {e}')
        return 1
    print('✅ deploy 完成')
    print(f"- version: {result['version']}")
    print(f"- mode: {result['mode']}")
    print(f"- note: {result['message']}")
    print('下一步：dtflow seal')
    return 0


def cmd_seal(args):
    root = find_project_root()
    if not root:
        print('未找到 .dtflow/config.json，当前目录不是 DevTaskFlow 项目')
        return 1
    try:
        config = load_config(root)
        validate_config(config)
        result = run_seal(root, config)
    except Exception as e:
        print(f'seal 失败: {e}')
        return 1
    print('✅ seal 完成')
    print(f"- version: {result['version']}")
    print(f"- docs_dir: {result['docs_dir']}")
    print(f"- src_dir: {result['src_dir']}")
    print(f"- deployment_file: {result['deployment_file']}")
    print(f"- docs_files: {', '.join(result['docs_files'])}")
    print(f"- src_items: {result['src_items']}")
    return 0


def main():
    parser = argparse.ArgumentParser(description='DevTaskFlow CLI')
    subparsers = parser.add_subparsers(dest='command')

    p_init = subparsers.add_parser('init-project', help='初始化 DevTaskFlow 项目')
    p_init.add_argument('--path', help='项目路径，默认当前目录')
    p_init.add_argument('--name', help='项目名称，默认取目录名')
    p_init.set_defaults(func=cmd_init_project)

    p_project_list = subparsers.add_parser('project-list', help='查看当前工作区项目看板')
    p_project_list.set_defaults(func=cmd_project_list)

    p_project_status = subparsers.add_parser('project-status', help='查看单个项目状态')
    p_project_status.add_argument('--name', required=True, help='项目名')
    p_project_status.set_defaults(func=cmd_project_status)

    p_next_version = subparsers.add_parser('next-version', help='计算下一个语义化版本号')
    p_next_version.add_argument('--version', required=True, help='当前版本号，例如 v1.2.3')
    p_next_version.add_argument('--bump', choices=['major', 'minor', 'patch'], default='patch', help='递增类型')
    p_next_version.set_defaults(func=cmd_next_version)

    p_dashboard = subparsers.add_parser('dashboard', help='生成本地 HTML 看板界面')
    p_dashboard.set_defaults(func=cmd_dashboard)

    p_serve = subparsers.add_parser('serve', help='启动本地看板服务')
    p_serve.add_argument('--port', type=int, default=8765, help='端口，默认 8765')
    p_serve.set_defaults(func=cmd_serve)

    p_start_version = subparsers.add_parser('start-version', help='在当前项目中启动一个新版本开发')
    p_start_version.add_argument('--version', required=True, help='版本号，例如 v0.1.0')
    p_start_version.add_argument('--new-project', action='store_true', help='标记为新项目首个版本')
    p_start_version.set_defaults(func=cmd_start_version)

    p_doctor = subparsers.add_parser('doctor', help='检查环境与项目结构')
    p_doctor.set_defaults(func=cmd_doctor)

    p_status = subparsers.add_parser('status', help='查看项目状态')
    p_status.set_defaults(func=cmd_status)

    p_analyze = subparsers.add_parser('analyze', help='执行需求分析，生成 DEV_PLAN.md')
    p_analyze.set_defaults(func=cmd_analyze)

    p_confirm = subparsers.add_parser('confirm', help='确认分析方案')
    p_confirm.set_defaults(func=cmd_confirm)

    p_revise = subparsers.add_parser('revise', help='记录修改意见')
    p_revise.add_argument('--feedback', required=True, help='修改意见')
    p_revise.set_defaults(func=cmd_revise)

    p_write = subparsers.add_parser('write', help='根据任务计划生成代码')
    p_write.add_argument('--task-id', help='指定任务 ID，默认当前任务')
    p_write.set_defaults(func=cmd_write)

    p_review = subparsers.add_parser('review', help='审查当前任务代码')
    p_review.set_defaults(func=cmd_review)

    p_fix = subparsers.add_parser('fix', help='根据审查结果修复代码')
    p_fix.set_defaults(func=cmd_fix)

    p_deploy = subparsers.add_parser('deploy', help='推进到部署状态')
    p_deploy.set_defaults(func=cmd_deploy)

    p_seal = subparsers.add_parser('seal', help='封版并归档当前工作区')
    p_seal.set_defaults(func=cmd_seal)

    args = parser.parse_args()
    if not hasattr(args, 'func'):
        parser.print_help()
        return 1
    return args.func(args)
