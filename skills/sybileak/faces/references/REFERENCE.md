# Full command reference

```
faces auth:login        --email  --password
faces auth:logout
faces auth:register     --email  --password  --username  [--name]  [--invite-key]
faces auth:whoami
faces auth:refresh
faces auth:connect      <provider>  [--manual]
faces auth:disconnect   <provider>
faces auth:connections

faces face:create       --name  --username  [--formula EXPR | --attr KEY=VALUE... --tool NAME...]
faces face:list
faces face:get          <face_id>
faces face:update       <face_id>  [--name]  [--formula EXPR]  [--attr KEY=VALUE]...
faces face:delete       <face_id>  [--yes]
faces face:stats
faces face:upload       <face_id>  --file PATH  --kind document|thread
faces face:diff         --face USERNAME  --face USERNAME  [--face USERNAME]...
faces face:neighbors    <face_id>  [--k N]  [--component face|beta|delta|epsilon]  [--direction nearest|furthest]

faces chat:chat         <face_username>  -m MSG  [--llm MODEL]  [--system]  [--stream]
                        [--max-tokens N]  [--temperature F]  [--file PATH]
faces chat:messages     <face@model | model>  -m MSG  [--system]  [--stream]  [--max-tokens N]
faces chat:responses    <face@model | model>  -m MSG  [--instructions]  [--stream]

faces compile:import       <face_id>  --url YOUTUBE_URL  [--type document|thread]  [--perspective first-person|third-person]  [--face-speaker LABEL]

faces compile:doc:create   <face_id>  [--label]  (--content TEXT | --file PATH)
faces compile:doc:list     <face_id>
faces compile:doc:get      <doc_id>
faces compile:doc:prepare  <doc_id>
faces compile:doc:sync     <doc_id>  [--yes]
faces compile:doc:delete   <doc_id>

faces compile:thread:create   <face_id>  [--label]
faces compile:thread:list     <face_id>
faces compile:thread:message  <thread_id>  -m MSG
faces compile:thread:sync     <thread_id>

faces keys:create   --name  [--expires-days N]  [--budget F]  [--face USERNAME]...  [--model NAME]...
faces keys:list
faces keys:revoke   <key_id>  [--yes]
faces keys:update   <key_id>  [--name]  [--budget F]  [--reset-spent]

faces billing:balance
faces billing:subscription
faces billing:quota
faces billing:usage      [--group-by api_key|model|llm|date]  [--from DATE]  [--to DATE]
faces billing:topup      --amount F  [--payment-ref REF]
faces billing:checkout   --plan standard|pro
faces billing:card-setup
faces billing:llm-costs  [--provider openai|anthropic|...]

faces account:state

faces config:set    <key> <value>
faces config:show
faces config:clear  [--yes]
```

## Global flags

Any command accepts these flags:

```
faces [--base-url URL] [--token JWT] [--api-key KEY] [--json] COMMAND
```

## Environment variables

| Variable | Purpose |
|---|---|
| `FACES_BASE_URL` | Override API base URL (default: `api.faces.sh`) |
| `FACES_TOKEN` | JWT authentication token |
| `FACES_API_KEY` | API key authentication |
