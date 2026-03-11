---
name: xtquant
description: XtQuant Python SDK for QMT/miniQMT — market data (xtdata) and trading (xttrade) interface for Chinese securities.
version: 1.0.0
homepage: http://dict.thinktrader.net/nativeApi/start_now.html
metadata: {"clawdbot":{"emoji":"⚡","requires":{"bins":["python3"]}}}
---

# XtQuant (迅投QMT Python SDK)

XtQuant is the Python SDK for [QMT/miniQMT](http://www.thinktrader.net) quantitative trading platform by 迅投科技. It consists of two core modules:

- **xtdata** — Market data (行情模块): real-time quotes, historical K-lines, tick data, Level2 data, financial data
- **xttrade** — Trading (交易模块): order placement, position/order queries, account management

> ⚠️ **Requires miniQMT or QMT client running locally**. XtQuant connects to the local QMT process via TCP. You need a broker account with QMT/miniQMT access enabled.

## Install

```bash
pip install xtquant
```

Or download from: http://dict.thinktrader.net/nativeApi/download_xtquant.html

## Architecture

```
Your Python Script
    ↓ (xtquant SDK)
    ├── xtdata  → miniQMT (market data server)
    └── xttrade → miniQMT (trading server)
         ↓
    Broker Trading System
```

## Quick start — Market data

```python
from xtquant import xtdata

# Connect to miniQMT (default localhost)
xtdata.connect()

# Download historical K-line
xtdata.download_history_data('000001.SZ', '1d', start_time='20240101', end_time='20240630')

# Get local K-line data
data = xtdata.get_market_data_ex([], ['000001.SZ'], period='1d', start_time='20240101', end_time='20240630')
print(data['000001.SZ'])
```

## Quick start — Trading

```python
from xtquant import xttrader
from xtquant.xttrader import XtQuantTrader
from xtquant.xttype import StockAccount

# Create trader instance
path = r'D:\国金证券QMT交易端\userdata_mini'  # miniQMT userdata path
session_id = 123456
xt_trader = XtQuantTrader(path, session_id)

# Connect and start
xt_trader.start()

# Create account
account = StockAccount('your_account_id')

# Place order: buy 100 shares of 000001.SZ
order_id = xt_trader.order_stock(account, '000001.SZ', xtconstant.STOCK_BUY, 100, xtconstant.FIX_PRICE, 11.5)

# Query positions
positions = xt_trader.query_stock_positions(account)
for pos in positions:
    print(pos.stock_code, pos.volume, pos.market_value)

# Query orders
orders = xt_trader.query_stock_orders(account)
```

## Stock code format

- Shanghai: `600000.SH`
- Shenzhen: `000001.SZ`
- Beijing: `430047.BJ`
- Index: `000001.SH` (上证指数)
- Futures: `IF2401.IF`
- Options: `10004358.SHO`

## Data periods

`tick`, `1m`, `5m`, `15m`, `30m`, `1h`, `1d`, `1w`, `1mon`

## Key modules reference

| Module | Import | Purpose |
|---|---|---|
| `xtdata` | `from xtquant import xtdata` | Market data retrieval |
| `xttrader` | `from xtquant import xttrader` | Trading operations |
| `xtconstant` | `from xtquant import xtconstant` | Constants (order types, directions) |
| `xttype` | `from xtquant.xttype import StockAccount` | Account types |

## Tips

- **miniQMT must be running** — xtquant connects to the local miniQMT process.
- Supports stocks, futures, options, ETFs, convertible bonds, funds.
- Level2 data available if your broker provides it.
- Financial data: balance sheet, income, cash flow, major indicators, top10 holders.
- Docs: http://dict.thinktrader.net/nativeApi/start_now.html
