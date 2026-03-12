---
name: magister
description: Fetch schedule, grades, and infractions from Magister portal
homepage: https://magister.net
metadata: {"clawdbot":{"emoji":"🇲","requires":{"bins":["python"],"env":["MAGISTER_HOST","MAGISTER_USER","MAGISTER_PASSWORD"]}}}
---

> **Note:** Undocumented API, may change without notice.

All API steps use `web_fetch` with header `Authorization: Bearer {token}`. Times are UTC.

> **Fallback:** If `web_fetch` returns 401, your implementation likely does not support custom headers.
> Use `curl` instead:
> ```bash
> curl -s -H "Authorization: Bearer {token}" {url}
> ```

# Obtain token

Write the following to `/tmp/magister_auth.py`:

```python
import http.cookiejar, json, os, re, secrets, urllib.parse, urllib.request

jar = http.cookiejar.CookieJar()

class Capture(urllib.request.HTTPRedirectHandler):
    token = ""
    def redirect_request(self, req, fp, code, msg, hdrs, newurl):
        p = urllib.parse.urlparse(newurl)
        if p.path.endswith("redirect_callback.html"):
            Capture.token = urllib.parse.parse_qs(p.fragment).get("access_token", [""])[0]
            return None
        return super().redirect_request(req, fp, code, msg, hdrs, newurl)

cap    = Capture()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar), cap)

qs = urllib.parse.urlencode({
    "client_id": f"M6-{os.environ['MAGISTER_HOST']}", "state": secrets.token_urlsafe(16),
    "redirect_uri": f"https://{os.environ['MAGISTER_HOST']}/oidc/redirect_callback.html",
    "response_type": "id_token token", "acr_values": f"tenant:{os.environ['MAGISTER_HOST']}",
    "nonce": secrets.token_urlsafe(16),
    "scope": "openid profile attendance.overview calendar.user grades.read",
})
resp      = opener.open(f"https://accounts.magister.net/connect/authorize?{qs}")
login_url = resp.geturl()
session_id = re.search(r"sessionId=([a-f0-9A-F-]+)", login_url).group(1)
return_url = urllib.parse.unquote(re.search(r"returnUrl=([^&]+)", login_url).group(1))

def challenge(path, extra):
    body = json.dumps({"sessionId": session_id, "returnUrl": return_url,
                       **extra}).encode()
    req  = urllib.request.Request(f"https://accounts.magister.net/challenges/{path}", data=body,
           headers={"Content-Type": "application/json",
                    "X-XSRF-TOKEN": urllib.parse.unquote(next((c.value for c in jar if c.name == "XSRF-TOKEN"), ""))})
    return json.loads(opener.open(req).read())

r = challenge("username", {"username": os.environ["MAGISTER_USER"]})
r = challenge("password", {"password": os.environ["MAGISTER_PASSWORD"]})

try: opener.open(f"https://accounts.magister.net{r['redirectURL']}")
except: pass

print(cap.token)
```

Then run:

```bash
python /tmp/magister_auth.py; rm /tmp/magister_auth.py
```

# Get parent ID

`web_fetch GET https://{MAGISTER_HOST}/api/account`

Use `Persoon.Id` (numeric integer) as `{parent_id}`.

# List children

`web_fetch GET https://{MAGISTER_HOST}/api/ouders/{parent_id}/kinderen`

Lowercase JSON, per `items[]`:
- `roepnaam`
- `achternaam`
- `id` — {child_id} (schedule/infractions)
- `actieveAanmeldingen[0].links.self.href` — `{aanmelding_id}` (grades)

# Schedule

`web_fetch GET https://{MAGISTER_HOST}/api/personen/{child_id}/afspraken?van=YYYY-MM-DD&tot=YYYY-MM-DD`

PascalCase JSON, per `Items[]` ignore `Status=5` (cancelled):
- `Start`
- `Einde`
- `Omschrijving`
- `Lokatie`
- `Vakken[0].Naam`
- `Docenten[0].Naam`


# Infractions

`web_fetch GET https://{MAGISTER_HOST}/api/personen/{child_id}/absenties?van=YYYY-MM-DD&tot=YYYY-MM-DD`

PascalCase JSON, per `Items[]`:
- `Omschrijving` (type)
- `Code` (`"TR"/"HV"/"AT"`)
- `Geoorloofd` (excused)
- `Afspraak.Omschrijving`

# Grades

`web_fetch GET https://{MAGISTER_HOST}/api/aanmeldingen/{aanmelding_id}/cijfers?top=50`

Lowercase JSON, per `items[]`:
- `waarde` (grade string)
- `isVoldoende`
- `teltMee`
- `kolom.omschrijving`
- `kolom.weegfactor`
- `kolom.type`: `"cijfer"/"gemiddelde"/"tekortpunten"/"som"`
