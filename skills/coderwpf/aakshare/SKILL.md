---
name: akshare
description: Comprehensive free financial data library — A-shares, HK/US stocks, futures, options, funds, bonds, forex, macro, no API key required.
version: 1.0.0
homepage: https://github.com/akfamily/akshare
metadata: {"clawdbot":{"emoji":"💹","requires":{"bins":["python3"]}}}
---

# AKShare (开源财经数据接口库)

[AKShare](https://github.com/akfamily/akshare) is a comprehensive, free Python financial data library covering A-shares, HK/US stocks, futures, options, funds, bonds, forex, and macro data. No registration or API key needed. All functions return `pandas.DataFrame`.

> Docs: https://akshare.akfamily.xyz/

## Install

```bash
pip install akshare --upgrade
```

Requires Python 3.9+ (64-bit).

## Usage pattern

```python
import akshare as ak

df = ak.stock_zh_a_hist(symbol="000001", period="daily", start_date="20240101", end_date="20240630")
print(df)
```

## Function naming convention

```
{asset_class}_{market}_{data_type}_{source}
```

- **asset_class**: `stock`, `futures`, `fund`, `bond`, `forex`, `option`, `macro`, `index`
- **market**: `zh` (China), `us` (US), `hk` (Hong Kong), or exchange codes
- **data_type**: `spot` (real-time), `hist` (historical), `daily`, `minute`
- **source**: `em` (Eastmoney), `sina` (Sina Finance), exchange abbreviations

---

## Stock data (A-shares)

### Real-time quotes — all A-shares

```python
import akshare as ak

df = ak.stock_zh_a_spot_em()
# columns: 序号, 代码, 名称, 最新价, 涨跌幅, 涨跌额, 成交量, 成交额, 振幅, 最高, 最低, 今开, 昨收, 量比, 换手率, 市盈率, 市净率, ...
```

### Historical K-line

```python
df = ak.stock_zh_a_hist(
    symbol="000001",       # stock code (no prefix)
    period="daily",        # "daily", "weekly", "monthly"
    start_date="20240101", # YYYYMMDD
    end_date="20240630",
    adjust=""              # "": no adj, "qfq": forward, "hfq": backward
)
# columns: 日期, 开盘, 收盘, 最高, 最低, 成交量, 成交额, 振幅, 涨跌幅, 涨跌额, 换手率
```

### Minute K-line

```python
df = ak.stock_zh_a_hist_min_em(
    symbol="000001",
    period="5",            # "1", "5", "15", "30", "60"
    start_date="2024-01-02 09:30:00",
    end_date="2024-01-02 15:00:00",
    adjust=""
)
```

### Individual stock info

```python
df = ak.stock_individual_info_em(symbol="000001")
# Returns: 总市值, 流通市值, 行业, 上市时间, 股票代码, 股票简称, 总股本, 流通股 ...
```

---

## Hong Kong stocks

```python
# Real-time HK quotes
df = ak.stock_hk_spot_em()

# HK historical K-line
df = ak.stock_hk_hist(
    symbol="00700",        # Tencent
    period="daily",
    start_date="20240101",
    end_date="20240630",
    adjust="qfq"
)
```

---

## US stocks

```python
# US stock daily K-line
df = ak.stock_us_daily(symbol="AAPL", adjust="qfq")

# US stock spot quotes
df = ak.stock_us_spot_em()
```

---

## Index data

```python
# A-share index historical data (e.g. 上证指数 000001)
df = ak.stock_zh_index_daily_em(symbol="sh000001")

# Index constituents (e.g. 沪深300)
df = ak.index_stock_cons_csindex(symbol="000300")
```

---

## Fund data

```python
# ETF real-time quotes
df = ak.fund_etf_spot_em()

# ETF historical K-line
df = ak.fund_etf_hist_em(
    symbol="510300",
    period="daily",
    start_date="20240101",
    end_date="20240630",
    adjust="qfq"
)

# Open-end fund daily NAV
df = ak.fund_open_fund_daily_em(symbol="000001")

# Fund ratings
df = ak.fund_rating_all()
```

---

## Futures data

```python
# Futures daily data (aggregated across exchanges)
from akshare import get_futures_daily
df = get_futures_daily(start_date="20240101", end_date="20240102", market="CFFEX")
# market: "CFFEX", "SHFE", "DCE", "CZCE", "INE", "GFEX"

# Futures real-time quotes
df = ak.futures_zh_spot()

# Futures inventory
df = ak.futures_inventory_99(symbol="豆一")
```

---

## Options data

```python
# Exchange option historical data
df = ak.option_hist_dce(symbol="豆粕期权")

# SSE 50 ETF options
df = ak.option_sse_spot_price(symbol="510050")
```

---

## Bond data

```python
# Convertible bonds list
df = ak.bond_zh_cov()

# Convertible bond historical K-line
df = ak.bond_zh_hs_cov_daily(symbol="sz123456")

# China bond spot quotes
df = ak.bond_spot_quote()
```

---

## Forex data

```python
# Forex spot quotes (Eastmoney)
df = ak.forex_spot_em()

# FX spot quote (Chinamoney)
df = ak.fx_spot_quote()

# FX swap quote
df = ak.fx_swap_quote()
```

---

## Macro data

```python
# China CPI yearly
df = ak.macro_china_cpi_yearly()

# China GDP yearly
df = ak.macro_china_gdp_yearly()

# China PMI
df = ak.macro_china_pmi()

# US Non-farm payrolls
df = ak.macro_usa_non_farm()

# US CPI monthly
df = ak.macro_usa_cpi_monthly()
```

---

## News & sentiment

```python
# Financial news (Eastmoney)
df = ak.stock_news_em(symbol="000001")

# CCTV news
df = ak.news_cctv(date="20240101")
```

---

## Complete example: Download & plot candlestick

```python
import akshare as ak
import mplfinance as mpf  # pip install mplfinance

df = ak.stock_zh_a_hist(
    symbol="600519",
    period="daily",
    start_date="20240101",
    end_date="20240630",
    adjust="qfq"
)
df.index = pd.to_datetime(df["日期"])
df.rename(columns={"开盘": "Open", "收盘": "Close", "最高": "High", "最低": "Low", "成交量": "Volume"}, inplace=True)
mpf.plot(df, type="candle", mav=(5, 10, 20), volume=True)
```

## Tips

- **No API key or registration required** — works out of the box.
- All functions return **pandas DataFrame** — ready for analysis, export, and visualization.
- Column names are **Chinese** for A-share data, English for US/HK data.
- Use `--upgrade` to keep akshare current — interfaces change frequently as upstream sources evolve.
- For non-Python users, use [AKTools](https://aktools.readthedocs.io/) HTTP API wrapper.
- Data is for **academic research only** — not investment advice.
- Full API reference: https://akshare.akfamily.xyz/data/index.html
