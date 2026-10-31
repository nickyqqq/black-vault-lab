# Research dossier

Checked 2026-10-31. This is a developing incident, not a settled forensic reconstruction.

## Primary sources

1. [Binance: Security Incident Update #2, 2026-10-30](https://www.binance.com/en/support/announcement/detail/d3306d9dca5243548c813b605e1d1751). Binance reports approximately $6.3 billion in unauthorized hot-wallet withdrawals. Its initial laptop-compromise hypothesis was followed by discovery of additional breach points. It reports no evidence of leaked wallet private keys and says the full attack sequence remains under investigation.
2. [TRM Labs: North Korea Steals USD 6.36 Billion From Binance, 2026-10-29](https://www.trmlabs.com/resources/blog/north-korea-steals-usd-6-36-billion-from-binance-in-the-largest-hack-in-history). TRM attributes the activity to TraderTraitor with high confidence. Its analysis describes Ethereum delegation abuse and ordinary signed transfers across other chains, and assesses compromise of hot-wallet signing infrastructure as the likely explanation. This is an investigator assessment; the exact initial entry and internal authorization failure are not established by that analysis.

## What the game models

The broad lesson is that an attacker may abuse a service authorized to request or produce signatures without obtaining a wallet's private key directly. The lab represents that authority with an in-memory session and fake ledger. It has no cryptographic signing or blockchain connectivity.

| Lab challenge | Status | Defensive lesson |
| --- | --- | --- |
| Unauthenticated debug bundle leaks a synthetic token | Invented teaching mechanism; not a documented Binance bug | Exclude secrets from diagnostics; limit exposure and rotate credentials |
| Client chooses withdrawal-admin role | Invented teaching mechanism | Resolve authorization using trusted server-side identity |
| Client supplies approved=true | Invented teaching mechanism | Require independent approval bound to the exact transaction |
| Exactly $6 billion objective | Rounded fictional target chosen for the game | It does not equal the reported $6.3–6.36 billion estimates |
| North Korea-linked attacker persona | Fictional role inspired by TRM attribution | Attribution does not establish these invented implementation details |

The game starts with an accessible synthetic artifact. It does not claim to recreate laptop compromise, malware delivery, container access, EIP-7702 authorizations, cross-chain withdrawals, laundering or asset recovery. There is insufficient verified public detail here to reproduce the real intrusion faithfully. A working game solution demonstrates only these local bugs.

The 2025 Bybit/Safe incident is a separate incident and is not substituted for the Binance attack in this lab.
