# Arc Contribution Journal

Local-first activity tracker for Arc Testnet and multi-wallet workflows.

## Live Demo
https://torgashev775-svg.github.io/arc-contribution-journal/

## What It Does
Arc Contribution Journal helps track wallet activity, proof links, and contribution logs in a structured way.

It is designed for:
- testnet activity tracking
- proof-based reporting
- multi-wallet organization
- manual and imported transaction logging

## Features
- multi-wallet workspaces
- address book
- manual activity entries
- Arcscan-based wallet transaction import
- tx hash and proof link tracking
- status and network filters
- JSON import/export
- CSV export
- Markdown report export
- local browser storage
- entry editing and deletion

## Core Fields
Each entry can store:
- date
- category
- action
- status
- network
- wallet
- tx hash
- notes
- proof url

## Workspaces
Use workspaces to separate activity by wallet, role, or account set.

Examples:
- Main
- Test Wallet
- Research
- Test Wallet 2

## Address Book
Save frequently used wallet addresses with:
- label
- address
- network
- notes

Saved addresses can be reused when creating entries.

## Wallet Import
The app can load recent wallet transactions from Arcscan and convert them into journal-ready entries.

Imported data includes:
- date
- wallet
- tx hash
- proof link
- network
- inferred action
- status

## Reports
Selected entries can be exported as:
- JSON
- CSV
- Markdown report

This makes it easier to reuse activity logs for:
- forum posts
- contribution reports
- internal tracking
- research notes

## Storage
All data is stored locally in the browser using `localStorage`.

Notes:
- data stays on the current browser/device
- clearing browser storage removes saved data
- use JSON export for backup

## Positioning
This project is a local proof and activity journal for Arc Testnet workflows.

It is not an automated farming tool and does not execute transactions.

## Stack
- HTML
- CSS
- JavaScript
- GitHub Pages

## Roadmap
Possible next improvements:
- search
- timeline view
- richer report builder
- stronger transaction classification
- import merge mode
