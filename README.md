#   Arc Contribution Journal

Arc Contribution Journal is a local-first tool for documenting Arc Testnet activity, validation runs, and proof-based reports.

It helps organize wallet-related actions, explorer links, transaction references, and session notes in one place, with export options for JSON, CSV, and Markdown.

##  Live Demo
https://torgashev775-svg.github.io/arc-contribution-journal/

## Repository
https://github.com/torgashev775-svg/arc-contribution-journal

## Use Cases
- testnet validation logs
- wallet activity documentation
- proof-based reporting
- local research and tracking

## Features
- local-first storage in the browser
- workspaces for separate validation runs or research contexts
- address book for saved wallet references
- manual activity entries
- Arcscan-based wallet transaction import
- transaction hash and proof link tracking
- status and network filters
- JSON import/export
- CSV export
- Markdown report export
- entry editing and deletion

## Entry Fields
Each entry can include:
- date
- category
- action
- status
- network
- wallet
- tx hash
- notes
- proof url

## Wallet Import
The app can load recent transactions for a wallet from Arcscan and convert them into structured journal entries.

Imported fields include:
- date
- wallet
- tx hash
- proof link
- network
- inferred action
- status

## Exports
Selected or stored data can be exported as:
- JSON
- CSV
- Markdown report

This can be useful for:
- validation logs
- forum summaries
- contribution notes
- internal tracking

## Storage
All data is stored locally in the browser using `localStorage`.

Important notes:
- data stays on the current browser/device
- clearing browser storage removes saved data
- use JSON export for backup

## Positioning
This project is a local validation and activity journal for Arc Testnet workflows.

It does not execute transactions and is intended for documentation, proof tracking, and reporting.

## Stack
- HTML
- CSS
- JavaScript
- GitHub Pages
