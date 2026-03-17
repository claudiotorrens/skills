---
name: polymarket-catastrophe-trader
description: Trades Polymarket prediction markets on hurricane seasons, earthquake probabilities, wildfire forecasts, and extreme weather records that trigger insurance and reinsurance markets.
metadata:
  author: Diagnostikon
  version: "1.0"
  displayName: Catastrophe & Extreme Risk Trader
  difficulty: advanced
---

# Catastrophe & Extreme Risk Trader

> **This is a template.**
> The default signal is keyword-based market discovery combined with probability-extreme detection — remix it with the data sources listed in the Edge Thesis below.
> The skill handles all the plumbing (market discovery, trade execution, safeguards). Your agent provides the alpha.

## Strategy Overview

NOAA seasonal outlooks + GFS/ECMWF model ensemble divergence as signal. NHC track cone as directional indicator for named storm markets.

## Edge Thesis

Catastrophe markets are uniquely mis-priced because retail traders anchor on the most recent disaster (availability bias) rather than historical base rates. NOAA publishes probabilistic seasonal forecasts (e.g. '60% chance of above-normal hurricane season') that directly translate to Polymarket prices — but the market often over- or under-reacts by 15–25%. The specific edge: the first tropical storm of the season causes a 20–40% repricing spike on subsequent named-storm markets, even when the forecast hasn't changed.

### Remix Signal Ideas
- **NOAA National Hurricane Center API**: https://www.nhc.noaa.gov/data/ — Track cone data, storm probability, seasonal outlooks
- **USGS Earthquake Hazards API**: https://earthquake.usgs.gov/fdsnws/event/1/ — Real-time seismic data — M2.5+ globally, seconds after event
- **NIFC Wildfire Statistics**: https://www.nifc.gov/fire-information/statistics — Year-to-date acres burned vs 10-year average

## Safety & Execution Mode

**The skill defaults to paper trading (`venue="sim"`). Real trades only with `--live` flag.**

| Scenario | Mode | Financial risk |
|---|---|---|
| `python trader.py` | Paper (sim) | None |
| Cron / automaton | Paper (sim) | None |
| `python trader.py --live` | Live (polymarket) | Real USDC |

`autostart: false` and `cron: null` — nothing runs automatically until you configure it in Simmer UI.

## Required Credentials

| Variable | Required | Notes |
|---|---|---|
| `SIMMER_API_KEY` | Yes | Trading authority. Treat as high-value credential. |

## Tunables (Risk Parameters)

All declared as `tunables` in `clawhub.json` and adjustable from the Simmer UI.

| Variable | Default | Purpose |
|---|---|---|
| `SIMMER_MAX_POSITION` | See clawhub.json | Max USDC per trade |
| `SIMMER_MIN_VOLUME` | See clawhub.json | Min market volume filter |
| `SIMMER_MAX_SPREAD` | See clawhub.json | Max bid-ask spread |
| `SIMMER_MIN_DAYS` | See clawhub.json | Min days until resolution |
| `SIMMER_MAX_POSITIONS` | See clawhub.json | Max concurrent open positions |

## Dependency

`simmer-sdk` by Simmer Markets (SpartanLabsXyz)
- PyPI: https://pypi.org/project/simmer-sdk/
- GitHub: https://github.com/SpartanLabsXyz/simmer-sdk
