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
                    pypkgs.matplotlib
                    pypkgs.numpy
                    pkgs.uv
                ];

                shellHook = ''
                    if [ ! -d .venv ]; then
                        python3 -m venv .venv
                    fi
                    source .venv/bin/activate
                    uv pip install -r requirements.txt
                '';
            };
        }
    );
}
