# Plugins

Backend plugins of `@nano-app/plugins`. Each one is imported from its own path and mounted in `plugins.before` or `plugins.after` of `createNanoApp`.

| Plugin                                      | Import                        | What it gives                                                                              |
| ------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------ |
| [`health`](/reference/plugins#health)       | `@nano-app/plugins/health`    | `GET /health` for the probes, public                                                       |
| [`scheduler`](/reference/plugins#scheduler) | `@nano-app/plugins/scheduler` | Functions on a cron, in a timezone                                                         |
| [`crud`](/reference/plugins#crud)           | `@nano-app/plugins/crud`      | `GET`, `QUERY`, `POST`, `PUT` and `DELETE` for each table, with permissions and validation |

To write your own, see [Write a plugin](/guides/write-a-plugin).
