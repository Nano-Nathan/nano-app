---
status: todo
owner: null
depends_on: [scheduler]
updated: 2026-10-28
---

# Mail

## Goal

An app sends an email through an official plugin instead of its own `nodemailer` setup: the SMTP credentials are options of the plugin and the app calls one function. Optionally, a private route sends an email for the signed-in users the app allows.

## Scope

- An official plugin, `import mail from '@nano-app/plugins/mail'`, with `nodemailer` underneath. `mail({ transport, from, route })`: `transport` is the SMTP options of nodemailer (`service`, `host`, `auth`), `from` the default sender and `route` the optional route below. The app reads its credentials from the environment and passes them: the plugin reads no environment variable.
- `sendMail({ to, subject, html, text, from })`, exported from the same path and importable from any route or job (`from` overrides the default one). It resolves when the server accepts the message and rejects with the transport error when it does not. Called before the plugin is mounted, it rejects with a clear error. Whatever sends an email in the app, a job, a route of the app or the route below, goes through it.
- The plugin creates the transporter once, in `callbacks.onMount`, and keeps it at module level, like the emitter of [sse](sse.md): the function is imported, not injected.
- A route of the plugin, off by default: `POST <basePath>` with the body `{ to, subject, html, text }` sends one message through `sendMail`. It exists only when the app passes `route: { authorize, basePath }` (`basePath` defaults to `'/mail'`). Without `route` the plugin mounts no route at all: it is the plugin without routes of [scheduler](scheduler.md), which makes `routesDir` optional.
- It is never an open relay:
  - It is never public. The plugin mounts at `stage: 'after'`, behind the guard of Better Auth (the `before` plugins stay public), and its handler also answers `401` itself when `params.session` is missing, so an app with Better Auth off, or one that moves the plugin, still does not relay.
  - `authorize(session)` is required when `route` is set, and answers `403` when it returns false. The session is the one of Better Auth, `{ user, session }`. A session alone is not enough: with `emailAndPassword` anyone can sign up, and every signed-in user would send mail from the app's sender.
  - The sender is always the default `from`: the body has no `from`. `to` is one address or a list, `subject` is a string and at least one of `html` and `text` is present; anything else answers `400` with `{ status: 400, message }` of the response contract. The `10kb` limit of `express.json` and the global `rateLimit` of the backend still apply.
- nano-app has no roles or permissions per route: Better Auth gives a session and its README leaves roles to the handlers. So the role check is `authorize`, written by the app (for example `session => session.user.role === 'admin'`, with the field the app adds to `user`). A role or permission system in the framework is not tracked here; if it appears, `authorize` is the place that would use it.
- The domain endpoint stays in personal-app: `POST /send_mails` with `{ userId? }`, the debt summary of a user or of all of them, and the minimum role (`2`) it checks on its own. It only changes the call that sends, from its own `nodemailer` to `sendMail`. The route of the plugin is generic (a message in, a message out) and knows nothing about debts.
- No database and no migrations: the message is sent in the request or job that asks for it and the result goes back to the caller, who decides what a failure means. An outbox (a table of pending messages with retries) would need a `nano_mail` schema and a worker; nothing in personal-app needs it, so it is left out until an app does.
- To decide with the maintainer: who may use the route. Options: (1) `route` off by default and `authorize` required when on, as above (cost: one callback to write per app; recommended, because no default can say who may send); (2) on by default with only the session (cost: open relay for anyone who signs up, rejected); (3) a list of allowed recipients instead of `authorize`, or besides it (cost: a second option and a rule for addresses and domains; useful for an app that mails only its own users, not needed to start).

## Out of scope

Templates: the HTML is built by the app (the debt summary of personal-app stays there). Queue, retries, bounces, attachments, tracking. Providers other than SMTP (SES, Resend and the like). A public route to send, a sender chosen by the request, roles or permissions in the framework.

## Done when

`plugins/tests` covers it with the `jsonTransport` of nodemailer: `sendMail` resolves with the message (`from`, `to`, `subject`, `html`), the per-message `from` wins over the default, a failing transport makes it reject, and calling it before mounting rejects. The route, with a session stubbed in `res.locals`: without a session it answers `401` and sends nothing; with `authorize` returning false, `403`; with a session and `authorize` true it sends the message with the default `from` (a `from` in the body is ignored); an invalid body answers `400` with `success: false` and its message; without the `route` option `POST /mail` is a `404`. A test app lists `mail()` and a route of the app sends through `sendMail`. The README of `plugins/` documents the options, that the route is opt-in and why `authorize` is required.

## Notes

- Where personal-app is today (`/home/node/projects/nano-app/personal-app`, branch `prd`): `backend/src/endpoints/mail/SendMails.ts` builds a gmail transporter (`service: 'gmail'`, `process.env.MAIL`, `process.env.MAIL_PASS`), has the sender hardcoded (`to.apps.subscriptions@gmail.com`) and wraps the callback of `sendMail` in a Promise by hand.
- That file is the endpoint `POST /send_mails` (`super('send_mails', 2)`, body `{ userId? }`). The level is checked in `lib/Http.ts`: if `minRole` is above 0 and `req.user.rolId` is lower, it throws a `403`. The role comes from its own login (`rolId` of its Prisma `user`, a `role` cookie set in `lib/App.ts`), not from Better Auth. The `Scheduler` of `lib/App.ts` extends this endpoint and calls `sendMails` in process, without that check.
- `sendMails` there runs `Promise.all` over the users: one failure rejects the whole batch, and the other results are lost. With the plugin the app decides (`Promise.allSettled`); the plugin does not batch.
- `backend/src/endpoints/mail/objects/templates.ts`, `resumen.ts` and `_const.ts` hold the HTML (inline styles, Spanish text). They stay in the app and only change the call that sends.
- Checked in the backend: the guard of Better Auth is built by the main plugin and mounted with `oApp.use` only when `packages.betterAuth` is set, so it covers what is mounted after it (`stage: 'after'` plugins and the app's routes) and nothing before; handlers receive the session in `params.session`. Without Better Auth there is no guard. There is no role or permission in `backend/src` or `core`.
- `backend/package.json` has `nodemailer ^7.0.12`: use the same major in `plugins/`.
- Moving personal-app onto the plugin is not tracked here (see `features/README.md`). It would also need its login on Better Auth to use the route of the plugin; the `send_mails` endpoint does not need it, it only calls `sendMail`.

## Log
