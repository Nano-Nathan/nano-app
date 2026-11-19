# Mantine

Layouts, views and pages of `@nano-app/mantine`, on [Mantine](https://mantine.dev). Layouts and pages are imported from `@nano-app/mantine/server`, components from `@nano-app/mantine`.

## Layouts

| Piece                                             | For                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| [`createLayout`](/reference/mantine#createlayout) | The root layout: Mantine, the stores, the color scheme and the toasts      |
| [`createShell`](/reference/mantine#createshell)   | The layout of signed-in pages: navbar, links, user, theme switch, sign-out |

## Pages

| Piece                                                         | For                                        |
| ------------------------------------------------------------- | ------------------------------------------ |
| [`createLoginPage`](/reference/mantine#createloginpage)       | Sign in and sign up, with social providers |
| [`createNotFoundPage`](/reference/mantine#createnotfoundpage) | The 404                                    |

## Components

| Piece                                       | Controller          | For                                       |
| ------------------------------------------- | ------------------- | ----------------------------------------- |
| [`Input`](/reference/mantine#components)    | `FieldController`   | A text input with its label and error     |
| [`Password`](/reference/mantine#components) | `FieldController`   | A password input with a toggle to show it |
| [`Form`](/reference/mantine#components)     | `FormController`    | A form from a list of fields              |
| [`Toasts`](/reference/mantine#components)   | `MessageController` | The messages of the backend as toasts     |
