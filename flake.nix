{
    description = "A flake for a Python project with pandoc and jupyterbook";

    inputs = {
        nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
        flake-utils.url = "github:numtide/flake-utils";
    };

    outputs = { self, nixpkgs, flake-utils }:
        flake-utils.lib.eachDefaultSystem (system:
        let pkgs = nixpkgs.legacyPackages.${system};
            pypkgs = pkgs.python3Packages;

            # Everything the HTML build needs: MyST itself (via uv) plus node
            # for the build scripts under scripts/.
            htmlInputs = [
                pkgs.python313
                pkgs.nodejs
                pkgs.uv
            ];

            # The PDF additionally needs a LaTeX toolchain, and Inkscape:
            # MyST rasterizes SVG figures to PDF via Inkscape during
            # `make pdf`, and without it those figures fail to convert.
            pdfInputs = htmlInputs ++ [
                pkgs.pandoc
                pkgs.texliveTeTeX
                pkgs.texliveFull
                pkgs.inconsolata-lgc
                pkgs.inkscape
            ];

            bookShellHook = ''
                # numpy (and other manylinux wheels installed by uv) load
                # libstdc++.so.6 / libz.so.1 at runtime. Put them on the
                # loader path so `import numpy` works inside the devshell.
                export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib pkgs.zlib ]}''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}

                # Use uv to sync dependencies from pyproject.toml
                uv sync
                source .venv/bin/activate
            '';
        in {
            devShells.default = pkgs.mkShell {
                buildInputs = pdfInputs;
                shellHook = bookShellHook;
            };

            # The same book build minus the (very large) LaTeX closure, for
            # `make html`. CI uses this so the site job doesn't fetch texlive.
            devShells.html = pkgs.mkShell {
                buildInputs = htmlInputs;
                shellHook = bookShellHook;
            };

            devShells.test = pkgs.mkShell {
                buildInputs = [
                    pkgs.nodejs
                ];

                shellHook = ''
                    npm install
                '';
            };
        }
    );
}
