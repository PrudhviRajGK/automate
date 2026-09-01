{ pkgs }: {
  deps = [
    # Node toolchain for the SPA build + ingress/static server.
    pkgs.nodejs_22

    # uv/uvx pulls and runs the Python agent-server and automation backend
    # (openhands-agent-server, openhands-automation) with no clone required.
    pkgs.uv
    pkgs.python312

    # The agent server runs bash sessions inside tmux.
    pkgs.tmux

    # Agents shell out to these constantly.
    pkgs.git
    pkgs.ripgrep
    pkgs.curl

    # asyncpg / psycopg build inputs used by the automation backend.
    pkgs.postgresql
  ];
}
