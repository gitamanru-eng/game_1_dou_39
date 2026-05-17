from __future__ import annotations

import argparse
import re
from pathlib import Path
from typing import Iterable


CSS_LINK_RE = re.compile(
    r"<link\s+[^>]*rel=[\"']stylesheet[\"'][^>]*href=[\"']([^\"']+)[\"'][^>]*>",
    re.IGNORECASE,
)
SCRIPT_SRC_RE = re.compile(
    r"<script\s+[^>]*src=[\"']([^\"']+)[\"'][^>]*></script>",
    re.IGNORECASE,
)
IMPORT_FROM_RE = re.compile(
    r"^\s*import\s+(?:[^;]*?)\s+from\s+[\"']([^\"']+)[\"']\s*;?\s*$", re.MULTILINE
)
IMPORT_SIDE_EFFECT_RE = re.compile(r"^\s*import\s+[\"']([^\"']+)[\"']\s*;?\s*$", re.MULTILINE)
EXPORT_NAMED_RE = re.compile(r"^\s*export\s+\{[^}]*}\s*;?\s*$", re.MULTILINE)


def is_local_asset(path: str) -> bool:
    lower = path.lower()
    return not (
        lower.startswith("http://")
        or lower.startswith("https://")
        or lower.startswith("//")
        or lower.startswith("data:")
    )


def minify_css(css: str) -> str:
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)
    css = re.sub(r"\s+", " ", css)
    css = re.sub(r"\s*([{}:;,>+~])\s*", r"\1", css)
    css = re.sub(r";}", "}", css)
    return css.strip()


def strip_js_comments(js: str) -> str:
    out: list[str] = []
    i = 0
    n = len(js)
    in_single = False
    in_double = False
    in_template = False

    while i < n:
        c = js[i]
        nxt = js[i + 1] if i + 1 < n else ""

        if in_single:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(js[i + 1])
                i += 2
                continue
            if c == "'":
                in_single = False
            i += 1
            continue

        if in_double:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(js[i + 1])
                i += 2
                continue
            if c == '"':
                in_double = False
            i += 1
            continue

        if in_template:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(js[i + 1])
                i += 2
                continue
            if c == "`":
                in_template = False
            i += 1
            continue

        if c == "'":
            in_single = True
            out.append(c)
            i += 1
            continue
        if c == '"':
            in_double = True
            out.append(c)
            i += 1
            continue
        if c == "`":
            in_template = True
            out.append(c)
            i += 1
            continue

        if c == "/" and nxt == "/":
            i += 2
            while i < n and js[i] not in "\r\n":
                i += 1
            continue

        if c == "/" and nxt == "*":
            i += 2
            while i + 1 < n and not (js[i] == "*" and js[i + 1] == "/"):
                i += 1
            i += 2
            continue

        out.append(c)
        i += 1

    return "".join(out)


def minify_js(js: str) -> str:
    js = strip_js_comments(js)
    lines = [line.strip() for line in js.splitlines() if line.strip()]
    return "\n".join(lines)


def minify_html(html: str) -> str:
    html = re.sub(r"<!--(?!\[if).*?-->", "", html, flags=re.DOTALL)
    html = re.sub(r">\s+<", "><", html)
    html = re.sub(r"\n{2,}", "\n", html)
    return html.strip() + "\n"


def resolve_import_path(source_file: Path, import_path: str) -> Path:
    return (source_file.parent / import_path).resolve()


def gather_module_order(entry_file: Path) -> list[Path]:
    ordered: list[Path] = []
    visited: set[Path] = set()

    def visit(file_path: Path) -> None:
        file_path = file_path.resolve()
        if file_path in visited:
            return
        visited.add(file_path)

        source = file_path.read_text(encoding="utf-8")
        imports = IMPORT_FROM_RE.findall(source) + IMPORT_SIDE_EFFECT_RE.findall(source)
        for module_path in imports:
            if not module_path.endswith(".js"):
                continue
            dependency = resolve_import_path(file_path, module_path)
            if not dependency.exists():
                raise FileNotFoundError(f"Не найден модуль: {module_path} (из {file_path})")
            visit(dependency)

        ordered.append(file_path)

    visit(entry_file)
    return ordered


def strip_module_syntax(js: str) -> str:
    js = IMPORT_FROM_RE.sub("", js)
    js = IMPORT_SIDE_EFFECT_RE.sub("", js)
    js = EXPORT_NAMED_RE.sub("", js)

    js = re.sub(r"\bexport\s+(class|function|const|let|var)\b", r"\1", js)
    js = re.sub(r"\bexport\s+default\b", "", js)
    return js


def build_js_bundle(entry_file: Path) -> str:
    ordered_files = gather_module_order(entry_file)
    chunks: list[str] = []

    for module_file in ordered_files:
        source = module_file.read_text(encoding="utf-8")
        source = strip_module_syntax(source)
        source = minify_js(source)
        relative = module_file.name
        chunks.append(f"/* {relative} */\n{source}")

    return "\n".join(chunks)


def inline_css(html: str, project_root: Path) -> str:
    matches = list(CSS_LINK_RE.finditer(html))
    if not matches:
        return html

    css_parts: list[str] = []
    for match in matches:
        href = match.group(1)
        if not is_local_asset(href):
            continue
        css_file = (project_root / href).resolve()
        if not css_file.exists():
            raise FileNotFoundError(f"Не найден CSS файл: {href}")
        css_parts.append(minify_css(css_file.read_text(encoding="utf-8")))

    html = CSS_LINK_RE.sub("", html)
    if css_parts:
        style_tag = f"<style>{''.join(css_parts)}</style>"
        html = html.replace("</head>", style_tag + "</head>")

    return html


def inline_js(html: str, project_root: Path) -> str:
    matches = list(SCRIPT_SRC_RE.finditer(html))
    if not matches:
        return html

    js_bundle_parts: list[str] = []
    for match in matches:
        src = match.group(1)
        if not is_local_asset(src):
            continue
        js_file = (project_root / src).resolve()
        if not js_file.exists():
            raise FileNotFoundError(f"Не найден JS файл: {src}")

        js_bundle_parts.append(build_js_bundle(js_file))

    html = SCRIPT_SRC_RE.sub("", html)
    if js_bundle_parts:
        script_tag = f"<script>{minify_js(''.join(js_bundle_parts))}</script>"
        html = html.replace("</body>", script_tag + "</body>")

    return html


def build_bundle(input_html: Path, output_dir: Path, output_name: str) -> Path:
    project_root = input_html.parent.resolve()
    html = input_html.read_text(encoding="utf-8")

    html = inline_css(html, project_root)
    html = inline_js(html, project_root)
    html = minify_html(html)

    output_dir.mkdir(parents=True, exist_ok=True)
    output_file = output_dir / output_name
    output_file.write_text(html, encoding="utf-8")
    return output_file


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Собирает standalone HTML (все CSS/JS внутри) с минификацией"
    )
    parser.add_argument("--input", default="index.html", help="Путь к исходному HTML")
    parser.add_argument(
        "--output-dir",
        default="dist",
        help="Папка для результата (по умолчанию: dist)",
    )
    parser.add_argument(
        "--output-name",
        default="bundle.html",
        help="Имя итогового HTML файла",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    input_html = Path(args.input).resolve()
    if not input_html.exists():
        raise FileNotFoundError(f"Исходный HTML не найден: {input_html}")

    output_path = build_bundle(
        input_html=input_html,
        output_dir=Path(args.output_dir).resolve(),
        output_name=args.output_name,
    )

    print(f"Готово: {output_path}")


if __name__ == "__main__":
    main()
