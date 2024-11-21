#!/usr/bin/env python3

import argparse
import dataclasses
import pathlib
import logging
import tempfile
import subprocess

import template


@dataclasses.dataclass
class BookConfig:
    source_path: pathlib.Path
    target_path: pathlib.Path
    
    def __post_init__(self):
        self.latex_path = self.target_path / "latex_generated"
        self.markdown_path = self.target_path / "markdown_generated"
        self.html_path = self.target_path / "html_generated"
        self.template_path = (self.source_path / "template").absolute()
        self.images_path = (self.source_path / "images").absolute()

def compile_latex_pandoc(source: pathlib.Path, target: pathlib.Path):
    s = subprocess.run(["pandoc", source, "-o", target], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if len(s.stderr) > 0:
        raise RuntimeError(f"Failed to compile LaTex file from {source} to {target}, {s.stderr}")

def generate_jupyter_toc(sections, output_file):
    """Generate a Jupyter Book table of contents YAML file."""
    with open(output_file, 'w') as f:
        f.write("# Table of contents\nformat: jb-book\nroot: preface\n\nparts:\n")
        
        for section_name in sorted(sections.keys()):
            files = sections[section_name]
            f.write(f"- caption: {section_name}\n  chapters:\n")
            
            for file in files:
                # Strip file extension
                file_base = file.rsplit('.', 1)[0] if '.' in file else file
                f.write(f"  - file: {section_name}/{file_base}\n")
    
    logging.debug(f"- Jupyter TOC written to {output_file}")

def generate_html(config: BookConfig, plots):
    logging.info(f"Generating HTML files at {config.html_path}")
    # Build preface
    compile_latex_pandoc(config.template_path / "book" / "preface.tex", 
                         config.markdown_path / "preface.md")

    sections = {}

    # Loop over all sections
    for section_dir in config.latex_path.glob("sections/*"):
        logging.debug(f"- processing section {section_dir}")

        # Ensure parent directory exists
        target_dir = config.markdown_path / section_dir.name
        target_dir.mkdir(parents=True, exist_ok=True)

        # Add section to dictionary
        sections[section_dir.name] = []

        # Loop over all files in section
        for tex_file in section_dir.glob("**/*.tex"):
            compile_latex_pandoc(tex_file, target_dir / (str(tex_file.stem) + ".md"))
            sections[section_dir.name].append(tex_file.name)

    # Create a table of content
    generate_jupyter_toc(sections, config.markdown_path / "_toc.yml")

    # Generate the book with Jupyter book
    logging.debug(f"- building Jupyter book at {config.html_path}")
    s = subprocess.run(f"jupyter book build {config.markdown_path} --path-output {config.html_path}".split(" "), 
                       stderr=subprocess.PIPE, stdout=subprocess.PIPE)
    if b"error" in s.stderr.lower():
        raise RuntimeError("Failed to generate Jupyter Book: ", s.stderr)

def generate_pdf(config: BookConfig):
    logging.info(f"Building LaTeX files at {config.latex_path}")
    s = subprocess.run(["latexmk", "-lualatex", "light"],
                       stderr=subprocess.PIPE, stdout=subprocess.PIPE, cwd=config.latex_path)
    if b"error" in s.stderr.lower():
        raise RuntimeError("Failed to compile Latex", s.stderr)


def build_book(config: BookConfig) -> None:
    # First symlink the template folder
    config.target_path.mkdir(parents=True, exist_ok=True)
    config.latex_path.mkdir(parents=True, exist_ok=True)
    config.markdown_path.mkdir(parents=True, exist_ok=True)
    config.html_path.mkdir(parents=True, exist_ok=True)
    latex_template_path = (config.latex_path / "template")
    latex_images_path = (config.latex_path / "images")
    try:
        latex_template_path.symlink_to(config.template_path.absolute(), target_is_directory=True)
        latex_images_path.symlink_to(config.images_path.absolute(), target_is_directory=True)
    except FileExistsError:
        pass # Ignore symlinks that already exist

    # Parse templates in LaTex files
    plots = template.parse_templates(config.source_path, config.latex_path)

    # Compile LaTeX
    generate_pdf(config)

    # Generate HTML files
    generate_html(config, plots)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=pathlib.Path, help="Source directory of the book")
    parser.add_argument("--target", type=pathlib.Path, required=False, help="Target directory for the generated book, default to a temporary directory")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    args = parser.parse_args()

    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
        logging.getLogger("matplotlib").setLevel(logging.WARNING)
        logging.getLogger("PIL").setLevel(logging.WARNING)

    path = pathlib.Path(args.source)
    if not args.target:
        target = pathlib.Path(tempfile.mkdtemp())
    else:
        target = pathlib.Path(args.target)
        target.mkdir(exist_ok=True)
    if not target.is_dir():
        raise AssertionError("The given target directory is not a directory")

    config = BookConfig(source_path=path, target_path=target)
    build_book(config = config)


if __name__ == "__main__":
    main()
