# Black Vault

A playable, localhost-only security CTF with a fictional Binance-inspired exchange and **$6 billion in fake funds**. Play a fictional attacker inspired by North Korea-linked threat reporting, discover three deliberately vulnerable Python code paths, then replay against patched defenses.

This is an independent educational project, not affiliated with Binance. It contains no Binance source code. The challenges are invented; they are **not a reconstruction of the real intrusion**. See [RESEARCH.md](RESEARCH.md) for sources, confidence, and limitations.

## Play

Requires Python 3.10+; no packages, accounts, wallet, API keys, or network downloads needed.

```sh
python server.py
```

Open http://127.0.0.1:8765. On Windows, `py server.py` also works. If the port is occupied: `python server.py --port 8766`. Stop with Ctrl+C.

1. Inspect the debug artifact in the request workbench.
2. Discover how the service decides your permissions.
3. Bypass the fake withdrawal approval and move the full balance to `lab:player`.

Each mission has three progressive hints and a vulnerable-code tab. Copy credentials from the JSON responses into the next request. Tokens change after a reset. Switching missions preserves your drafts. The endpoint selector, request JSON, status responses, ledger, audit trail, and completion screen are live server-backed behavior.

Choose **Try patched mode** to reset into fail-closed defenses. The first exploit is blocked. Unit tests additionally isolate the later controls so that a blocked first stage does not conceal a broken second defense. No legitimate withdrawal workflow is implemented in patched mode.

## Design and boundaries

- Python standard-library server; plain HTML, CSS and JavaScript frontend.
- Server binds exclusively to `127.0.0.1`; there is intentionally no public bind option.
- Host, Origin, fetch-site and JSON content-type checks limit unsolicited browser requests.
- No arbitrary shell commands, file reads, code execution, blockchain RPC, real addresses, external API calls, malware, phishing infrastructure or real transfers.
- State is in memory, shared across tabs, and reset on restart. Designed for one local learner, not multi-user hosting.
- This is intentionally vulnerable training software. Publish the source, not a running public instance; do not tunnel or reverse-proxy the lab to the internet.
- Only the selected static files and server source are exposed by the HTTP server. Research links require internet only if you choose to open them.

## Tests

```sh
python -m unittest discover -s tests -v
```

Tests cover the full simulated heist, independent patched controls, failed attempts, amount validation, reset invalidation, and HTTP containment. CI runs the same suite on Linux and Windows.

## Where to read

- `server.py`: vulnerable and patched handlers, in-memory ledger, local HTTP guards.
- `app.js`: missions, hints, editable requests and UI state.
- [RESEARCH.md](RESEARCH.md): dated source analysis and fictional-mechanic mapping.
- [WALKTHROUGH.md](WALKTHROUGH.md): full solution and defensive lessons (spoilers).

MIT licensed. Use only against the supplied local training environment.

## Live headquarters

An offline, dependency-free isometric 3D office shows eight employees, desks, monitors, server racks and an incident station. Rotate the view, adjust zoom, pause motion or inspect a team. The scene follows actual server responses: normal operations, credential exposure, privilege anomaly, partial outflow, depleted vault and patched containment. Staff move toward the incident station as the attack advances; screens, status lighting and treasury balances update with the ledger. Reset restores the office. Reduced-motion preferences disable animation. The office and staff reactions are fictional, not a real Binance floor plan or response timeline.

## Difficulty

Use the Normal / Hard selector above the mission toolbar. Normal includes progressive hints and a code viewer. Hard disables both in the UI, blocks the server source route, and removes the debug artifact teaching note. Both use the same vulnerabilities and keep editable request templates. Switching difficulty resets the ledger and invalidates credentials; ordinary resets and patched-mode changes preserve the selected difficulty. This is a self-directed learning challenge, not an anti-cheat system: the open-source repository and frontend assets remain readable.

## Game flow

The title screen opens with Play. Choose Normal or Hard, read the three-part mission briefing, and enter headquarters. Starting an operation resets the existing local run. The objective panel tells you what to investigate; Open mission terminal jumps to the active challenge. After a successful stage, a next-mission button guides progression. Menu and Resume preserve the current run while the page stays open. Reloading returns to the title screen. Play again opens difficulty selection.
