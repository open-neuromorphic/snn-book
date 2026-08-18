# Convenience targets for the SNN book.

.PHONY: html pdf plots

html:
	uv run jupyter-book build --html

# Regenerate the static PNG fallbacks for the interactive {sgplot} plots into
# _static/sg/ (the PDF can't render the live widgets). Run this whenever the
# plot code in _widgets/surrogate-widget.mjs changes. OPTIONAL — you can also
# just screenshot the plots by hand. Needs: npm install && npx playwright install chromium.
plots:
	node scripts/capture-plots.mjs

# DYNSIM_STATIC=1 swaps the interactive anywidgets (dynsim / surrogate plots),
# which LaTeX cannot render, for static PNG fallbacks in _static/.
# The Inkscape env vars stop MyST's concurrent SVG->PDF conversions from crashing
# with "Gio::DBus::Error": when a session bus exists, Inkscape 1.4 tries to
# activate xdg-desktop-portal over it and dies when the portal can't mount.
# DBUS_SESSION_BUS_ADDRESS=disabled: removes the bus so Inkscape skips DBus
# entirely; GTK_USE_PORTAL=0 stops the portal lookup as a backstop.
pdf:
	DYNSIM_STATIC=1 GTK_USE_PORTAL=0 DBUS_SESSION_BUS_ADDRESS=disabled: uv run jupyter-book build --pdf
