# SoPra FS26 – Group 21 · Frontend

Next.js 15 / TypeScript client for the SoPra FS26 Group 21 project.
Deployed on **Vercel** · Connects to the Spring Boot backend on port `8080`.

---

## Prerequisites

- **macOS / Linux / WSL** — ensure `git` and `curl` are available.
- **Windows** — WSL 2 (Ubuntu) is required. Install it by running the provided [`windows.ps1`](./windows.ps1) script in an elevated PowerShell terminal:
  ```powershell
  C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass -File .\windows.ps1
  ```
  After installation, keep the repository inside the WSL filesystem (not the Windows drive) to avoid severe I/O performance degradation.

---

## Installation

```bash
git clone https://github.com/<your-org>/sopra-fs26-group-21-client
cd sopra-fs26-group-21-client
source setup.sh   # installs Nix, direnv, Node, and Deno
```

The setup script takes a few minutes. If it fails, re-run it in a fresh terminal. See the [manual troubleshooting steps](#troubleshooting) below if the issue persists.

---

## Development

```bash
npm run dev       # start dev server at http://localhost:3000 (Turbopack, hot reload)
npm run build     # production build
npm run lint      # ESLint
npm run fmt       # format with Deno formatter
```

All commands are also available via the Deno runtime (`deno task dev`, `deno task build`, etc.).

**Environment:** create `.env.local` and set `NEXT_PUBLIC_PROD_API_URL` to point to the production backend URL. Without this variable, the app always targets `http://localhost:8080`.

---

## Docker

Push to `main` automatically builds and pushes a Docker image to Docker Hub via GitHub Actions.

**One-time setup** (one team member):
1. Create a [Docker Hub](https://hub.docker.com/) account (include the group number in the username, e.g. `sopra_group_21`).
2. Create a repository on Docker Hub with the same name as the GitHub repository.
3. Add the following [repository secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository):
   - `dockerhub_username`
   - `dockerhub_password` — a Docker Hub [personal access token](https://docs.docker.com/docker-hub/access-tokens/) with read/write access
   - `dockerhub_repo_name`

**Run locally:**
```bash
docker pull <dockerhub_username>/<dockerhub_repo_name>
docker run -p 3000:3000 <dockerhub_username>/<dockerhub_repo_name>
```

---

## Adding Dev Tools via Nix

This project uses [Determinate Nix](https://github.com/DeterminateSystems/nix-installer) to manage the development environment. To add a package, edit [`flake.nix`](./flake.nix):

1. Add the package to `nativeBuildInputs`:
   ```nix
   nativeBuildInputs = with pkgs; [ nodejs git deno watchman <new-package> ];
   ```
2. Export its binary path in `shellHook`:
   ```nix
   export PATH="${pkgs.<new-package>}/bin:$PATH"
   ```
3. Apply the changes:
   ```bash
   direnv reload
   ```

To pin a specific package version, use the `overlays` section in `flake.nix`.

---

## Troubleshooting

If `source setup.sh` fails repeatedly, run the following steps manually in a fresh terminal:

```bash
curl --proto '=https' --tlsv1.2 -ssf --progress-bar -L https://install.determinate.systems/nix -o install-nix.sh
sh install-nix.sh install --determinate --no-confirm --verbose
nix profile install nixpkgs#direnv
direnv allow
```

Hook `direnv` into your shell following the [official guide](https://github.com/direnv/direnv/blob/master/docs/hook.md) if `direnv` is not recognized after installation.
