# Convenience targets for the SNN book.

.PHONY: html pdf

html:
	uv run jupyter-book build --html

# Static dynsim fallbacks (_static/dynsim/<label>.png) replace the interactive
# widgets, which LaTeX cannot render.
pdf:
	DYNSIM_STATIC=1 uv run jupyter-book build --pdf
