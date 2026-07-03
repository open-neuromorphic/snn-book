"""
Generator for the two computational-graph figures in the surrogate-gradients
chapter of *Practical Spiking Neural Networks*:

  1. unrolled_lif.png  -- recurrent LIF neuron + unrolled computational graph
  2. bptt.png          -- backpropagation through time over the unrolled graph

Both are redrawn to match Jason Eshraghian's original diagrams exactly, but in
the book's notation (membrane V[t], spike S[t], input I_in[t], threshold V_thr).
Pure matplotlib so the output stays crisp at any size and is reproducible.
"""

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from matplotlib.path import Path
import matplotlib.patches as mpatches

# ---------------------------------------------------------------- palette
C_BLUE_F, C_BLUE_E = "#dbeaf4", "#6f9fc4"     # X, I_in  (nn.Linear boxes)
C_V_F,    C_V_E    = "#fcecd6", "#c99a52"     # V  (membrane)
C_S_F,    C_S_E    = "#f9dcb4", "#bd8836"     # S  (spike)
C_L_F,    C_L_E    = "#f2d5d5", "#9a8a8a"     # loss
C_BETA             = "#3e7cb1"                # beta recurrence arrows
C_RESET            = "#8a6d1f"                # -V_thr reset arrows
C_GRAD             = "#e85838"                # backward gradient arrows (Jason's orange)
C_GREY_F           = "#dcdcdc"                # caption / title boxes
C_EDGE             = "#2b2b2b"                # default box edge / forward arrows
C_LEAKY_FILL       = "#ededed"                # shaded snn.Leaky region

FS = 15          # base label font size
plt.rcParams.update({
    "font.family": "DejaVu Sans",
    "mathtext.fontset": "dejavusans",
})

BW, BH = 1.5, 0.72   # box width / height


# ---------------------------------------------------------------- helpers
def rbox(ax, cx, cy, text, fc, ec, w=BW, h=BH, fs=FS, lw=1.6, tcol="black"):
    ax.add_patch(FancyBboxPatch(
        (cx - w / 2, cy - h / 2), w, h,
        boxstyle="round,pad=0,rounding_size=0.14",
        linewidth=lw, edgecolor=ec, facecolor=fc, zorder=3))
    ax.text(cx, cy, text, ha="center", va="center",
            fontsize=fs, color=tcol, zorder=4)


def arrow(ax, x0, y0, x1, y1, color=C_EDGE, lw=1.8, ls="-", z=2,
          mut=13, dashed=False):
    style = (0, (4, 3)) if dashed else ls
    ax.add_patch(FancyArrowPatch(
        (x0, y0), (x1, y1), arrowstyle="-|>", mutation_scale=mut,
        linewidth=lw, color=color, linestyle=style, zorder=z,
        shrinkA=0, shrinkB=0, joinstyle="miter", capstyle="round"))


def _brace_profile(a0, a1, n=401, beta_scale=30.0):
    """Return (a, p): coordinate samples `a` along the brace span and a
    perpendicular profile `p` in [0,1] that is 0 at the two tips, ~0.5 along
    the arms, and 1 at the central cusp -- the classic curly-brace shape.
    Uses a sum of four logistics (two per half) so the arms form a flat
    plateau and the cusp/tips are distinct rather than one round bump.
    """
    span = abs(a1 - a0)
    beta = beta_scale / max(span, 0.4)
    a = np.linspace(a0, a1, n)
    ah = a[: n // 2 + 1]
    p_half = (1.0 / (1.0 + np.exp(-beta * (ah - ah[0])))
              + 1.0 / (1.0 + np.exp(-beta * (ah - ah[-1]))))
    p = np.concatenate([p_half, p_half[-2::-1]])
    p -= p.min()
    p /= p.max()
    return a, p


def curly(ax, x, y0, y1, label, side="right", fs=15, col="black",
          w=0.32, lw=2.4, rot=0):
    """Vertical curly brace spanning y0->y1 at x, cusp pointing to `side`.
    `rot` rotates the label (use 90 for a vertical label as in the original)."""
    ymin, ymax = min(y0, y1), max(y0, y1)
    y, p = _brace_profile(ymin, ymax)
    sign = 1 if side == "right" else -1
    X = x + sign * w * p
    ax.plot(X, y, color=col, lw=lw, solid_capstyle="round",
            solid_joinstyle="round", clip_on=False, zorder=5)
    if rot:
        ax.text(x + sign * (w + 0.26), (ymin + ymax) / 2, label, rotation=rot,
                ha="center", va="center", fontsize=fs, color=col)
    else:
        ax.text(x + sign * (w + 0.28), (ymin + ymax) / 2, label,
                ha="left" if side == "right" else "right",
                va="center", fontsize=fs, color=col)


def underbrace(ax, x0, x1, ytop, label, w=0.26, lw=2.4, fs=14, col="black"):
    """Horizontal curly brace under [x0,x1], cusp pointing down; label below."""
    x, p = _brace_profile(x0, x1)
    Y = ytop - w * p
    ax.plot(x, Y, color=col, lw=lw, solid_capstyle="round",
            solid_joinstyle="round", clip_on=False, zorder=5)
    ax.text((x0 + x1) / 2, ytop - w - 0.12, label, ha="center", va="top",
            fontsize=fs, color=col)


def sq_bracket_down(ax, x0, x1, y, label, col=C_GRAD, fs=14):
    """Square bracket opening upward (spanning columns), label centred below."""
    drop = 0.18
    ax.plot([x0, x0, x1, x1], [y + drop, y, y, y + drop],
            color=col, lw=2.0, zorder=5)
    ax.text((x0 + x1) / 2, y - 0.28, label, ha="center", va="top",
            fontsize=fs, color=col)


def dots(ax, x, y, col=C_EDGE):
    ax.text(x, y, r"$\cdots$", ha="center", va="center",
            fontsize=FS + 3, color=col)


def dashed_arrow(ax, x0, y0, x1, y1, color=C_EDGE, lw=1.8,
                 dash=(0, (4, 2.8)), head=24, z=4):
    """Dotted/dashed shaft with a SOLID filled triangle head (the head is drawn
    separately so it never renders dashed/broken)."""
    ax.plot([x0, x1], [y0, y1], color=color, lw=lw, linestyle=dash,
            zorder=z, solid_capstyle="round", clip_on=False)
    d = np.hypot(x1 - x0, y1 - y0)
    ux, uy = (x1 - x0) / d, (y1 - y0) / d
    ax.add_patch(FancyArrowPatch((x1 - ux * 0.22, y1 - uy * 0.22), (x1, y1),
                 arrowstyle="-|>", mutation_scale=head, color=color, lw=lw,
                 zorder=z + 0.1, shrinkA=0, shrinkB=0))


def _trim(path, pad=16):
    """Crop a saved PNG to its ink bounding box plus uniform padding, so the
    content has even margins (no bottom gap) and is horizontally centered."""
    from PIL import Image, ImageChops
    im = Image.open(path).convert("RGB")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bbox = ImageChops.difference(im, bg).getbbox()
    if bbox:
        b = (max(0, bbox[0] - pad), max(0, bbox[1] - pad),
             min(im.size[0], bbox[2] + pad), min(im.size[1], bbox[3] + pad))
        im.crop(b).save(path)


# ================================================================ FIGURE 3
def draw_bptt(path):
    fig, ax = plt.subplots(figsize=(10.6, 8.8))
    cols = [1.7, 4.7, 7.7]
    xd = 8.75
    yX, yI, yV, yS, yL = 1.0, 2.7, 4.5, 6.1, 7.7
    top = 8.4

    # shaded snn.Leaky region behind V & S rows
    # (symmetric margin left & right; right side clears the ... dots)
    # left margin matches the small gap after the ... dots on the right
    ax.add_patch(FancyBboxPatch(
        (0.40, yV - BH / 2 - 0.35), 8.90, (yS - yV) + BH + 0.7,
        boxstyle="round,pad=0,rounding_size=0.35",
        fc=C_LEAKY_FILL, ec="black", lw=2.6, linestyle=(0, (6, 4)), zorder=1))

    # forward vertical arrows (black) per column; W label sits opposite the
    # orange backward path (right for cols 0/1, left for col 2)
    for i, cx in enumerate(cols):
        arrow(ax, cx, yX + BH / 2, cx, yI - BH / 2)              # X -> I_in
        wx = cx - 0.34 if i == 2 else cx + 0.34
        ax.text(wx, (yX + yI) / 2, r"$W$", fontsize=FS, va="center", ha="center")
        arrow(ax, cx, yI + BH / 2, cx, yV - BH / 2)              # I_in -> V
        arrow(ax, cx, yV + BH / 2, cx, yS - BH / 2)              # V -> S
        arrow(ax, cx, yS + BH / 2, cx, yL - BH / 2)              # S -> L

    # beta recurrence (blue) along V row
    for a, b in zip(cols[:-1], cols[1:]):
        arrow(ax, a + BW / 2, yV, b - BW / 2, yV, color=C_BETA, lw=2.2, mut=15)
        ax.text((a + b) / 2, yV + 0.17, r"$\beta$", color=C_BETA,
                fontsize=FS + 1, ha="center")

    # --- backward gradient (orange dashed), gradient of L[2] ---
    # Each path is a continuous dashed line with a SINGLE arrowhead at its end
    # (matching Jason's original). Immediate influence runs down the RIGHT of
    # column 2; prior influence down the LEFT of columns 0 and 1.
    def og_line(x0, y0, x1, y1):
        ax.plot([x0, x1], [y0, y1], color=C_GRAD, lw=2.0,
                linestyle=(0, (4, 3)), zorder=4, clip_on=False)

    def og_arrow(x0, y0, x1, y1):
        arrow(ax, x0, y0, x1, y1, color=C_GRAD, lw=2.2, dashed=True, z=4, mut=20)

    d = 0.24
    c0, c1, c2 = cols
    yg = yV - BH / 2                   # horizontal grad line at the V-row base
    xr = c2 + d                        # immediate path, right of column 2

    # immediate influence: down column 2, arrowhead only just above dL/dW[2]
    og_line(xr, yL - BH / 2, xr, yS + BH / 2)
    og_line(xr, yS - BH / 2, xr, yV + BH / 2)
    og_line(xr, yV - BH / 2, xr, yI + BH / 2)
    og_line(xr, yI - BH / 2, xr, yX + BH / 2)
    og_arrow(xr, yX - BH / 2, xr, 0.12)

    # horizontal hop back along the V-row base
    og_line(xr, yg, c0 - d, yg)

    # prior influence: down the LEFT of columns 0 and 1
    for cx in (c0, c1):
        xl = cx - d
        og_line(xl, yg, xl, yI + BH / 2)
        og_line(xl, yI - BH / 2, xl, yX + BH / 2)
        og_arrow(xl, yX - BH / 2, xl, 0.12)

    # solid joins to close the dashed-line gap at each horizontal/vertical corner
    for jx in (c0 - d, c1 - d, xr):
        ax.plot([jx], [yg], marker="o", ms=2.6, color=C_GRAD,
                markeredgewidth=0, zorder=5, clip_on=False)

    # above the loss boxes: black and orange run up to the SAME height
    ytop = top + 0.5
    for i, cx in enumerate(cols):
        if i == 2:
            arrow(ax, cx, yL + BH / 2, cx, ytop, color=C_EDGE, lw=1.8)   # forward output, UP arrow
            og_line(xr, ytop, xr, yL + BH / 2)                          # orange, NO arrowhead on L[2]
        else:
            ax.plot([cx, cx], [yL + BH / 2, ytop], color=C_EDGE, lw=1.8)  # black line up (same length)
            og_arrow(cx + d, ytop, cx + d, yL + BH / 2)                 # orange, DOWN into loss

    # boxes
    for i, cx in enumerate(cols):
        rbox(ax, cx, yX, rf"$X[{i}]$", C_BLUE_F, C_BLUE_E)
        rbox(ax, cx, yI, rf"$I_\mathrm{{in}}[{i}]$", C_BLUE_F, C_BLUE_E)
        rbox(ax, cx, yV, rf"$V[{i}]$", C_V_F, C_V_E)
        rbox(ax, cx, yS, rf"$S_\mathrm{{out}}[{i}]$", C_S_F, C_S_E, fs=FS - 1)
        rbox(ax, cx, yL, rf"$\mathcal{{L}}[{i}]$", C_L_F, C_L_E)

    # trailing dots
    for y in (yX, yI, yV, yS):
        dots(ax, xd, y)

    # right curly brackets (sit just outside the dashed box); vertical labels
    curly(ax, 9.65, yV - BH / 2 - 0.3, yS + BH / 2 + 0.3, "snn.Leaky", rot=270)
    curly(ax, 9.65, yX - BH / 2 - 0.15, yI + BH / 2 + 0.15, "nn.Linear", rot=270)

    # bottom gradient labels (sit just below the arrowheads)
    for i, cx in enumerate(cols):
        ax.text(cx + 0.05, 0.04,
                rf"$\dfrac{{\partial\mathcal{{L}}[2]}}{{\partial W[{i}]}}$",
                ha="center", va="top", fontsize=14, color=C_GRAD)

    # influence braces (curly, opening upward)
    underbrace(ax, cols[0] - 0.55, cols[1] + 0.55, -0.74, "prior influence", col=C_GRAD)
    underbrace(ax, cols[2] - 0.7, cols[2] + 0.7, -0.74, "immediate influence", col=C_GRAD)

    ax.set_xlim(-0.45, 11.3)
    ax.set_ylim(-2.25, 9.25)
    ax.set_aspect("equal")
    ax.axis("off")
    fig.savefig(path, dpi=200, bbox_inches="tight", pad_inches=0.05,
                facecolor="white")
    plt.close(fig)
    _trim(path)                     # even margins -> no bottom gap, centered
    print("wrote", path)


# ================================================================ FIGURE 2
def draw_unrolled(path):
    fig, ax = plt.subplots(figsize=(13.5, 6.6))

    # box size + font bumped so Figure 2's on-screen text matches Figure 3
    bw2, bh2, fs2 = 1.9, 0.9, FS + 4

    # ---------- right panel : unrolled computational graph ----------
    cols = [7.7, 11.2, 14.7]          # spacing 3.5 (room for -V_thr)
    xd = 15.95                         # trailing dots
    yX, yI, yV, yS = 1.0, 2.7, 4.5, 6.1
    top = 7.75                          # exit-arrow top (longer, clears box)

    # dashed shaded box around V & S rows (more top/bottom breathing room)
    pad = 0.62
    boxL = cols[0] - bw2 / 2 - 0.55
    boxR = xd + 0.55
    ax.add_patch(FancyBboxPatch(
        (boxL, yV - bh2 / 2 - pad), boxR - boxL, (yS - yV) + bh2 + 2 * pad,
        boxstyle="round,pad=0,rounding_size=0.4",
        fc=C_LEAKY_FILL, ec="black", lw=2.6, linestyle=(0, (6, 4)), zorder=1))

    # forward arrows + W labels (bigger heads to match the dashed arrows)
    ah = 20                                             # solid arrowhead size
    for cx in cols:
        arrow(ax, cx, yX + bh2 / 2, cx, yI - bh2 / 2, mut=ah)
        ax.text(cx + 0.4, (yX + yI) / 2, r"$W$", fontsize=fs2, va="center",
                ha="center")
        arrow(ax, cx, yI + bh2 / 2, cx, yV - bh2 / 2, mut=ah)
        arrow(ax, cx, yV + bh2 / 2, cx, yS - bh2 / 2, mut=ah)
        arrow(ax, cx, yS + bh2 / 2, cx, top, mut=ah)       # exit up out of S

    # beta recurrence (blue)
    for a, b in zip(cols[:-1], cols[1:]):
        arrow(ax, a + bw2 / 2, yV, b - bw2 / 2, yV, color=C_BETA, lw=2.2, mut=ah)
        ax.text((a + b) / 2, yV + 0.2, r"$\beta$", color=C_BETA,
                fontsize=fs2 + 1, ha="center")
    # -V_thr diagonal reset arrows  S[t] -> V[t+1] (dotted shaft, solid head
    # landing cleanly on the V box top-left corner)
    for a, b in zip(cols[:-1], cols[1:]):
        dashed_arrow(ax, a + bw2 / 2 - 0.05, yS - bh2 / 2 - 0.05,
                     b - bw2 / 2 + 0.28, yV + bh2 / 2 - 0.02,
                     color=C_RESET, lw=2.2, dash=(0, (2, 2.5)), head=17)
        ax.text((a + b) / 2 - 0.1, (yS + yV) / 2 + 0.32, r"$-V_\mathrm{thr}$",
                color=C_RESET, fontsize=FS, ha="center")

    # boxes + time labels
    for i, cx in enumerate(cols):
        rbox(ax, cx, yX, rf"$X[{i}]$", C_BLUE_F, C_BLUE_E, w=bw2, h=bh2, fs=fs2)
        rbox(ax, cx, yI, rf"$I_\mathrm{{in}}[{i}]$", C_BLUE_F, C_BLUE_E, w=bw2, h=bh2, fs=fs2)
        rbox(ax, cx, yV, rf"$V[{i}]$", C_V_F, C_V_E, w=bw2, h=bh2, fs=fs2)
        rbox(ax, cx, yS, rf"$S_\mathrm{{out}}[{i}]$", C_S_F, C_S_E, w=bw2, h=bh2, fs=fs2 - 1)
        ax.text(cx, 0.30, rf"$t\!=\!{i}$", ha="center", va="top", fontsize=fs2)

    for y in (yX, yI, yV, yS):
        dots(ax, xd, y)

    # ---------- left panel : single spiking neuron (bold; matches Visio) ----------
    lx = 1.9
    B = dict(fontweight="bold")
    nb_x, nb_y, nb_w, nb_h = lx - 1.45, 2.15, 2.9, 3.9     # neuron body (wide)
    body_top = nb_y + nb_h
    sy, thy = 3.12, 5.07                                     # soma / threshold
    # subtle drop shadow + bold neuron body
    ax.add_patch(FancyBboxPatch((nb_x + 0.07, nb_y - 0.07), nb_w, nb_h,
                 boxstyle="round,pad=0,rounding_size=0.35",
                 fc="#c9c9c9", ec="none", zorder=2.5))
    ax.add_patch(FancyBboxPatch((nb_x, nb_y), nb_w, nb_h,
                 boxstyle="round,pad=0,rounding_size=0.35",
                 fc="white", ec="black", lw=3.0, zorder=3))
    # vertical signal path (thin, behind soma/box/labels)
    ax.plot([lx, lx], [sy + 0.33, thy - 0.34], color="black", lw=2.2, zorder=3.5)
    ax.plot([lx, lx], [thy + 0.34, body_top], color="black", lw=2.2, zorder=3.5)
    # input  I_in -> soma
    ax.text(lx, 0.92, r"$I_\mathrm{in}$", ha="center", va="top", fontsize=FS + 4)
    arrow(ax, lx, 1.3, lx, sy - 0.33, color="black", lw=2.2, mut=20, z=3.6)
    # soma : crosshair sphere
    ax.add_patch(plt.Circle((lx, sy), 0.33, fc="#cfcfcf", ec="black",
                            lw=2.2, zorder=6))
    ax.plot([lx - 0.33, lx + 0.33], [sy, sy], color="black", lw=1.3, zorder=7)
    ax.plot([lx, lx], [sy - 0.33, sy + 0.33], color="black", lw=1.3, zorder=7)
    # beta self-loop (implicit recurrence): near-circular loop exiting the top
    # of the soma, curving clockwise around the right, arrowhead back into the
    # soma bottom-right (matches Jason's original)
    bcx, bcy, br = lx + 0.30, sy + 0.06, 0.34
    ax.add_patch(mpatches.Arc((bcx, bcy), 2 * br, 2 * br, angle=0,
                 theta1=-78, theta2=118, color=C_BETA, lw=2.2, zorder=7))
    t1, t2 = np.radians(-60), np.radians(-78)          # arrowhead at bottom
    ax.add_patch(FancyArrowPatch(
        (bcx + br * np.cos(t1), bcy + br * np.sin(t1)),
        (bcx + br * np.cos(t2), bcy + br * np.sin(t2)),
        arrowstyle="-|>", mutation_scale=15, color=C_BETA, lw=2.2, zorder=7))
    ax.text(bcx + br + 0.24, bcy - 0.02, r"$\beta$", color=C_BETA,
            fontsize=FS + 6, va="center", ha="center")
    # membrane label : to the LEFT of the line (not overlapping it)
    ax.text(lx - 0.16, 4.1, r"$V[t]$", ha="right", va="center", fontsize=FS + 4)
    # threshold box
    ax.add_patch(FancyBboxPatch((lx - 0.8, thy - 0.35), 1.6, 0.7,
                 boxstyle="round,pad=0,rounding_size=0.16",
                 fc="white", ec="black", lw=2.4, zorder=7))
    ax.text(lx, thy, r"$>\!V_\mathrm{thr}$", ha="center", va="center",
            fontsize=FS + 3, zorder=8)
    # long output arrow ; S_out label to the LEFT of it
    out_top = 7.45
    arrow(ax, lx, body_top, lx, out_top, color="black", lw=2.2, mut=20)
    ax.text(lx - 0.14, out_top - 0.22, r"$S_\mathrm{out}$",
            ha="right", va="center", fontsize=FS + 5)
    # explicit recurrence : dashed, rounded caps, 3 arrows (left, down, soma)
    fb_x = nb_x - 0.6
    sout_y = out_top - 0.9
    dash = (0, (4, 2.8))
    ymid = (sout_y + sy) / 2
    dashed_arrow(ax, lx - 0.05, sout_y, fb_x, sout_y, color="black",
                 dash=dash, head=26)                                # 1 left
    dashed_arrow(ax, fb_x, sout_y, fb_x, ymid, color="black",
                 dash=dash, head=26)                                # 2 down
    ax.plot([fb_x, fb_x], [ymid, sy], color="black", lw=1.8,
            linestyle=dash, zorder=4, solid_capstyle="round")
    dashed_arrow(ax, fb_x, sy, lx - 0.33, sy, color="black",
                 dash=dash, head=26)                                # 3 into soma
    # recurrence braces (Explicit vertical/black, Implicit horizontal/teal)
    curly(ax, fb_x - 0.38, sy - 0.3, sout_y + 0.05, "Explicit Recurrence",
          side="left", fs=16, rot=90, lw=2.4)
    curly(ax, lx + 1.6, sy - 0.5, sy + 0.5, "Implicit\nRecurrence",
          side="right", fs=14, col=C_BETA, lw=2.4)

    # panel labels (a) / (b)
    ax.text(lx, -0.55, "(a)", ha="center", va="center", fontsize=fs2)
    ax.text(sum(cols) / len(cols), -0.55, "(b)", ha="center", va="center",
            fontsize=fs2)

    ax.set_xlim(-1.55, xd + 1.1)
    ax.set_ylim(-1.1, 7.7)
    ax.set_aspect("equal")
    ax.axis("off")
    fig.savefig(path, dpi=200, bbox_inches="tight", pad_inches=0.05,
                facecolor="white")
    plt.close(fig)
    _trim(path)
    print("wrote", path)


# ================================================================ FIGURE 1
def draw_heaviside(path):
    """Heaviside spike step  S = Theta(V - V_thr), styled like Jason's original
    (orange axis arrows, teal V_thr marker, dotted guides). Fonts/notation match
    Figures 2 & 3 (DejaVu Sans, V/V_thr)."""
    C_THR = "#2e7d8a"                       # teal threshold marker
    x0, xr, vthr = -2.0, 2.55, 0.0          # axis origin, right end, threshold
    fig, ax = plt.subplots(figsize=(6.6, 4.6))

    # orange dashed axes with solid arrowheads (like Jason's)
    dashed_arrow(ax, x0, 0, xr, 0, color=C_GRAD, lw=2.0,
                 dash=(0, (4, 3)), head=20, z=2)                 # V axis
    dashed_arrow(ax, x0, -0.28, x0, 1.5, color=C_GRAD, lw=2.0,
                 dash=(0, (4, 3)), head=20, z=2)                 # S axis

    # y ticks 0 and 1
    for yv in (0, 1):
        ax.plot([x0 - 0.07, x0 + 0.07], [yv, yv], color="black", lw=1.6, zorder=3)
        ax.text(x0 - 0.16, yv, f"{yv}", ha="right", va="center", fontsize=FS + 1)

    # Heaviside step (thick black) + discontinuity circles
    ax.plot([x0, vthr], [0, 0], color="black", lw=3.4, solid_capstyle="butt", zorder=4)
    ax.plot([vthr, xr - 0.25], [1, 1], color="black", lw=3.4, solid_capstyle="butt", zorder=4)
    ax.plot(vthr, 0, marker="o", ms=12, mfc="white", mec="black", mew=2.4, zorder=6)
    ax.plot(vthr, 1, marker="o", ms=12, mfc="black", mec="black", zorder=6)

    # teal dotted threshold guide + label
    ax.plot([vthr, vthr], [0, 1], color=C_THR, lw=2.0, ls=(0, (1.5, 2.5)), zorder=5)
    ax.text(vthr, -0.14, r"$V_\mathrm{thr}$", ha="center", va="top",
            fontsize=FS + 2, color=C_THR)

    # axis labels (orange, like Jason's S / U)
    ax.text(x0 + 0.02, 1.62, r"$S$", ha="center", va="center",
            fontsize=FS + 4, color=C_GRAD)
    ax.text(xr + 0.02, -0.16, r"$V$", ha="center", va="top",
            fontsize=FS + 4, color=C_GRAD)

    # equation placed INSIDE the plot (upper-right empty region), not as a title
    ax.text(xr - 0.15, 1.55, r"$S = \Theta(V - V_\mathrm{thr})$",
            ha="right", va="center", fontsize=FS + 3)

    ax.set_xlim(x0 - 0.7, xr + 0.4)
    ax.set_ylim(-0.7, 1.8)
    ax.set_aspect("auto")
    ax.axis("off")
    fig.savefig(path, dpi=200, bbox_inches="tight", pad_inches=0.05,
                facecolor="white")
    plt.close(fig)
    _trim(path)
    print("wrote", path)


if __name__ == "__main__":
    import sys
    outdir = sys.argv[1] if len(sys.argv) > 1 else "."
    draw_heaviside(f"{outdir}/spike_heaviside.png")
    draw_bptt(f"{outdir}/bptt.png")
    draw_unrolled(f"{outdir}/unrolled_lif.png")
