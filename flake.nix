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
        in {
            devShells.default = pkgs.mkShell {
                buildInputs = [
                    pkgs.python313
                    pkgs.pandoc
                    pkgs.texliveTeTeX
                    pkgs.texliveFull
                    pkgs.inconsolata-lgc
                    pkgs.nodejs
                    pkgs.uv
                ];

                shellHook = ''
                    # numpy (and other manylinux wheels installed by uv) load
                    # libstdc++.so.6 / libz.so.1 at runtime. Put them on the
                    # loader path so `import numpy` works inside the devshell.
                    export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib pkgs.zlib ]}''${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}

                    # Use uv to sync dependencies from pyproject.toml
                    uv sync
                    source .venv/bin/activate
                '';
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
