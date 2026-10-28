---
status: todo
owner: null
depends_on: []
updated: 2026-10-28
---

# Mail

## Goal

An app sends an email through an official plugin instead of its own `nodemailer` setup: the SMTP credentials are options of the plugin and the app calls one function.

## Scope

- An official plugin, `import mail from '@nano-app/plugins/mail'`, with `nodemailer` underneath. `mail({ transport, from })`: `transport` is the SMTP options of nodemailer (`service`, `host`, `auth`) and `from` the default sender. The app reads its credentials from the environment and passes them: the plugin reads no environment variable.
- `sendMail({ to, subject, html, text, from })`, exported from the same path and importable from any route or job (`from` overrides the default one). It resolves when the server accepts the message and rejects with the transport error when it does not. Called before the plugin is mounted, it rejects with a clear error.
- The plugin creates the transporter once, in `callbacks.onMount`, and keeps it at module level, like the emitter of [sse](sse.md): the function is imported, not injected.
- No database and no migrations: the message is sent in the request or job that asks for it and the result goes back to the caller, who decides what a failure means. An outbox (a table of pending messages with retries) would need a `nano_mail` schema and a worker; nothing in personal-app needs it, so it is left out until an app does.
- To decide with the maintainer: the plugin has no routes (sending over HTTP would be an open relay, and the sender is always the app's code). Does the plugin contract accept a plugin without `routesDir`, or should the plugin ship an empty one, or should this live in `@nano-app/backend` as a plain export?

## Out of scope

Templates: the HTML is built by the app (the debt summary of personal-app stays there). Queue, retries, bounces, attachments, tracking. Providers other than SMTP (SES, Resend and the like). An HTTP endpoint to send.

## Done when

`plugins/tests` covers it with the `jsonTransport` of nodemailer: `sendMail` resolves with the message (`from`, `to`, `subject`, `html`), the per-message `from` wins over the default, a failing transport makes it reject, and calling it before mounting rejects. A test app lists `mail()` and a route sends through it. The README of `plugins/` documents the options.

## Notes

- Where personal-app is today (`/home/node/projects/nano-app/personal-app`, branch `prd`): `backend/src/endpoints/mail/SendMails.ts` builds a gmail transporter (`service: 'gmail'`, `process.env.MAIL`, `process.env.MAIL_PASS`), has the sender hardcoded (`to.apps.subscriptions@gmail.com`) and wraps the callback of `sendMail` in a Promise by hand.
- `sendMails` there runs `Promise.all` over the users: one failure rejects the whole batch, and the other results are lost. With the plugin the app decides (`Promise.allSettled`); the plugin does not batch.
- `backend/src/endpoints/mail/objects/templates.ts`, `resumen.ts` and `_const.ts` hold the HTML (inline styles, Spanish text). They stay in the app and only change the call that sends.
- `backend/package.json` has `nodemailer ^7.0.12`: use the same major in `plugins/`.
- Moving personal-app onto the plugin is not tracked here (see `features/README.md`).

## Log
