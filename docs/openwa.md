# OpenWA WhatsApp service

SmartyAI treats OpenWA as a separate service. The OpenWA source is not copied into this repository, and browsers never receive its API key or webhook secret.

## Required SmartyAI environment

Set these values in the server deployment environment or `.env.local`:

```dotenv
OPENWA_BASE_URL=http://127.0.0.1:2785/api
OPENWA_API_KEY=replace-with-at-least-32-random-characters
OPENWA_WEBHOOK_SECRET=replace-with-a-separate-random-secret
OPENWA_WEBHOOK_URL=http://host.docker.internal:3001/api/whatsapp/webhook
```

- `OPENWA_BASE_URL` must include OpenWA's `/api` prefix and be reachable from the Next.js server. Do not expose it to client code with a `NEXT_PUBLIC_` prefix.
- `OPENWA_API_KEY` is sent only as the server-side `X-API-Key` header. Use the same value for `API_MASTER_KEY` in OpenWA.
- `OPENWA_WEBHOOK_SECRET` signs exact webhook request bytes with HMAC-SHA256. Do not reuse the API key.
- `OPENWA_WEBHOOK_URL` must be reachable from OpenWA. With the provided local Docker Compose setup, use `http://host.docker.internal:3001/api/whatsapp/webhook`; `host.docker.internal` is the only private callback host allowed by the container. Production deployments must use an HTTPS URL.

Generate independent secrets with:

```bash
openssl rand -hex 32
```

## Start OpenWA

The dedicated Compose file builds directly from the upstream OpenWA Git repository and stores sessions in a named Docker volume:

```bash
export OPENWA_API_KEY='replace-with-at-least-32-random-characters'
export OPENWA_API_KEY_PEPPER='replace-with-a-separate-random-secret'
docker compose -f compose.openwa.yml up -d --build
```

Alternatively, pass a dedicated Compose environment file with `docker compose --env-file <path> -f compose.openwa.yml up -d --build`. The service binds to loopback on port `2785` by default. Set `OPENWA_PORT` when that port is already occupied. Keep the service private in production and route only the SmartyAI webhook endpoint publicly.

## Account lifecycle

1. Open the desktop `Messages` app and select the account footer.
2. Grant the requested WhatsApp scopes and generate a QR code.
3. In WhatsApp, open **Linked devices**, choose **Link a device**, and scan the code.
4. SmartyAI maps the OpenWA session to the authenticated user, syncs contacts/chats/messages into user-scoped MongoDB collections, and processes signed OpenWA events.
5. Disconnecting logs out and removes the OpenWA session plus that user's normalized WhatsApp data.

Webhook deliveries require `X-OpenWA-Signature`, `X-OpenWA-Idempotency-Key`, and a timestamp no more than five minutes old. Duplicate idempotency keys are acknowledged without reprocessing.

## Call handling

SmartyAI subscribes to OpenWA's `call.received`, `call.accepted`, `call.rejected`, and `call.missed` events. A ringing incoming call is shown in the WhatsApp app and can be rejected there. The account panel also controls OpenWA's per-session `autoRejectCalls` setting.

OpenWA's call API handles incoming-call events and rejection, and can create shareable WhatsApp call links. Outgoing controls create an official `call.whatsapp.com` room, send its link to the selected direct contact, and open it in the browser. WhatsApp Web requests its own microphone, camera, and notification permissions; browsers normally remember allowed permissions, but WhatsApp still requires the user to select Join.

OpenWA does not expose an endpoint to initiate a direct outgoing ringing call to a selected contact, accept a call, or transport call media. Creating and sharing a room gives the contact an actionable invitation message, but it does not produce a native incoming-call ring. Incoming alerts open WhatsApp Web, where the linked WhatsApp account must expose and answer the active call.

## Privacy boundary

Only normalized WhatsApp data for the authenticated SmartyAI account is returned by `/api/whatsapp/account/*`. OpenWA credentials remain server-side, session IDs are mapped through MongoDB, and no local computer files are exposed. Existing Telegram career automation, bot routes, Contacts, and Phone integrations are independent and remain enabled.