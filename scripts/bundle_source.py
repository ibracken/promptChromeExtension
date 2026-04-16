#!/usr/bin/env python3

import argparse
from pathlib import Path


DEFAULT_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".html",
    ".css",
    ".txt",
    ".py",
    ".sh",
}

DEFAULT_SKIP_DIRS = {
    ".git",
    ".idea",
    ".next",
    ".vscode",
    "dist",
    "node_modules",
}

DEFAULT_SKIP_FILES = {
    "package-lock.json",
    "promptfix-cws.zip",
    "source_compilation.txt",
}


def should_skip(path: Path, root: Path, output_path: Path) -> bool:
    if path.resolve() == output_path.resolve():
        return True

    relative = path.relative_to(root)

    if any(part in DEFAULT_SKIP_DIRS for part in relative.parts):
        return True

    if path.name in DEFAULT_SKIP_FILES:
        return True

    if path.suffix.lower() not in DEFAULT_EXTENSIONS:
        return True

    return False


def iter_source_files(root: Path, output_path: Path):
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if should_skip(path, root, output_path):
            continue
        yield path


def write_bundle(root: Path, output_path: Path) -> int:
    count = 0

    with output_path.open("w", encoding="utf-8") as outfile:
        outfile.write(f"PROJECT ROOT: {root}\n")
        outfile.write("SOURCE BUNDLE\n")

        for file_path in iter_source_files(root, output_path):
            relative_path = file_path.relative_to(root)
            count += 1

            outfile.write(f"\n{'=' * 80}\n")
            outfile.write(f"FILE: {relative_path.as_posix()}\n")
            outfile.write(f"{'=' * 80}\n\n")

            try:
                outfile.write(file_path.read_text(encoding="utf-8", errors="replace"))
            except OSError as exc:
                outfile.write(f"[Could not read file: {exc}]\n")

            outfile.write("\n")

    return count


def parse_args():
    parser = argparse.ArgumentParser(
        description="Bundle the repo's source files into a single text file for review or AI input."
    )
    parser.add_argument(
        "directory",
        nargs="?",
        default=".",
        help="Root directory to bundle. Defaults to the current directory.",
    )
    parser.add_argument(
        "output",
        nargs="?",
        default="source_compilation.txt",
        help="Output filename. Defaults to source_compilation.txt.",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    root = Path(args.directory).resolve()

    if not root.is_dir():
        raise SystemExit(f"Error: {root} is not a valid directory.")

    output_path = Path(args.output)
    if not output_path.is_absolute():
        output_path = (Path.cwd() / output_path).resolve()

    output_path.parent.mkdir(parents=True, exist_ok=True)

    count = write_bundle(root, output_path)
    print(f"Bundled {count} files into {output_path}")


if __name__ == "__main__":
    main()
