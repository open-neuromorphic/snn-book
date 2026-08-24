# Convenience targets for the SNN book.

.PHONY: html pdf plots

# The second step stamps the Umami analytics tag into every built page; MyST
# has no site option for a self-hosted Umami, so it happens after the build.
html:
	uv run jupyter-book build --html
	node scripts/inject-analytics.mjs

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
#
# PDF_EXPORT=1 additionally enables _plugins/pdf-fixups.mjs, which rewrites
# cross-page references so they resolve in print instead of emitting dead
# \href{/topics/...} links.
pdf:
	PDF_EXPORT=1 DYNSIM_STATIC=1 GTK_USE_PORTAL=0 DBUS_SESSION_BUS_ADDRESS=disabled: uv run jupyter-book build --pdf
