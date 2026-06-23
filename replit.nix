{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nodePackages.node-gyp
    pkgs.python3
    pkgs.gcc
    pkgs.gnumake
  ];
}
