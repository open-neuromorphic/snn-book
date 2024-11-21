import dataclasses
import functools
import pathlib
import typing
import logging
import re
import yaml

import chevron
import numpy as np
import matplotlib.pyplot as plt

_header_re = re.compile(r"----*$(\n.*)$\n----*$", re.MULTILINE)

_GLOBAL_PLOT_ID = 0

@dataclasses.dataclass
class PlotConfig:
    template: str
    title: str = "No title"
    caption: str = "No caption"

    def __post_init__(self):
        global _GLOBAL_PLOT_ID
        self.id = _GLOBAL_PLOT_ID
        _GLOBAL_PLOT_ID += 1

@dataclasses.dataclass
class PlotResult:
    id: int
    plot_path: pathlib.Path

def _plot_png(config: PlotConfig, data: np.ndarray, plot_file: pathlib.Path) -> None:
    f = plt.figure(figsize=(6, 4), dpi=300)
    plt.scatter(np.arange(100), data)
    f.savefig(plot_file, bbox_inches="tight")
    plt.close(f)

def _render_plot(template: str, render: typing.Any, plot_path: pathlib.Path, results: typing.Dict[pathlib.Path, PlotResult]) -> str:
    yaml_header = _header_re.match(template)
    if yaml_header:
        config = yaml.safe_load(yaml_header.group(1))
        template = _header_re.sub("", template)
    else:
        config = {}
    config = PlotConfig(template=template, **config)
    
    # Set plot namespace
    global_namespace={
        "__builtins__": None, # Disable builtins
        "np": np,
    }
    local_namespace = {}

    # Execute the template and see if it defines a "simulate" function
    exec(template, global_namespace, local_namespace)
    if "simulate" in local_namespace:
        data = local_namespace["simulate"](np.arange(100), np.array([0.0]))
        plot_file = plot_path.absolute() / f"plot_{config.id}.png"
        _plot_png(config, data, plot_file)
    else:
        logging.warning("Cannot generate plot because the following template does not define a 'simulate' function", config.template)

    # Render text outputs
    results[plot_path] = PlotResult(config.id, plot_file)
    return rf"""
    \begin{{figure}}
        \centering
        \includegraphics[width=0.9\textwidth]{{{plot_file}}}
        \caption{{{config.caption}}}
    \end{{figure}}
        """

def flatten_paths(directory, pattern):
    # Get all files (not directories) recursively
    files = [p for p in directory.rglob(pattern) if p.is_file()]
        
    # Get the parts of each path as a list of strings
    path_parts = [list(p.parts) for p in files]
    
    # Find the index where paths start to differ
    # Zip the parts to compare each level
    common_prefix_len = 0
    for parts in zip(*path_parts):
        if len(set(parts)) == 1:
            common_prefix_len += 1
        else:
            break
    
    # Create new paths with common prefix removed
    flattened = [pathlib.Path(*p[common_prefix_len:]) for p in path_parts]
    
    return files, flattened

def parse_templates(source: pathlib.Path, target: pathlib.Path) -> typing.Dict[pathlib.Path, PlotResult]:
    source_files, target_files = flatten_paths(source, pattern="*.tex")
    # Filter out LaTeX template (style) files
    source_files = list(filter(lambda x: not "template/" in str(x), source_files))
    target_files = list(filter(lambda x: not "template/" in str(x), target_files))
    results = {}
    for f, f_target in zip(source_files, target_files):
        with open(f, "r") as fp:
            target_dir = target / f_target.parent
            if not target_dir.exists():
                target_dir.mkdir(parents=True)

            # Create mustache dict and parse
            local_render = functools.partial(_render_plot, plot_path=target_dir, results=results)
            mustach_dict = {
                "plot": local_render
            }

            with open(target / f_target, "w") as target_fp:
                content = chevron.render(fp, mustach_dict)
                target_fp.write(content)
    logging.info(f"Templates successfully parsed from {source} to {target}")
    return results