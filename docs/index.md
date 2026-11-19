---
layout: home

hero:
  name: Nano-App
  text: Full-stack apps from files in the right folders
  tagline: A route is a file. A store is a file. Sign-in, CRUD and pages come ready. TypeScript, Express 5, Next.js and Mantine.
  image:
    src: /logo.svg
    alt: Nano-App
  actions:
    - theme: brand
      text: Start the tutorial
      link: /tutorial/
    - theme: alt
      text: Reference
      link: /reference/backend
    - theme: alt
      text: GitHub
      link: https://github.com/Nano-Nathan/nano-app

features:
  - title: Routes are files
    details: Write src/routes/notes.route.ts and GET /notes answers. No router to register, and a wrong file stops the startup.
  - title: Database and sign-in when you ask
    details: PostgreSQL through Drizzle and users through Better Auth, turned on with one option each.
  - title: CRUD in one line
    details: The crud plugin gives GET, QUERY, POST, PUT and DELETE for every table you list, with permissions and validation.
  - title: State without hooks
    details: The frontend keeps its state in stores and its logic in controller classes. Views only render.
  - title: Ready pages
    details: Login, a navbar shell, a 404, forms and toasts of the backend's messages, on Mantine.
  - title: One command to start
    details: pnpm create @nano-app my-app gives a backend, a frontend and their Docker images.
---

## Where to go

| You want to…                          | Read                               |
| ------------------------------------- | ---------------------------------- |
| Learn nano-app by building an app     | [Tutorial](/tutorial/)             |
| Get a specific task done              | [Guides](/guides/permissions)      |
| See everything that comes ready       | [Catalog](/catalog/)               |
| Look up an option, a method or a type | [Reference](/reference/backend)    |
| Understand how the pieces fit         | [Concepts](/concepts/architecture) |

nano-app is `0.x`: its public API can still change between minor versions.
