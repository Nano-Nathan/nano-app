# Controllers

Frontend controllers of `@nano-app/controllers`. Every one is imported from `@nano-app/controllers`, used with `createView`, and changed by extending it.

| Controller                                                      | For                                              | Mantine view                                                                                             |
| --------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| [`AuthController`](/reference/controllers#authcontroller)       | Sign up, sign in and sign out with Better Auth   | [`createLoginPage`](/reference/mantine#createloginpage), [`createShell`](/reference/mantine#createshell) |
| [`FieldController`](/reference/controllers#fieldcontroller)     | One input of a form: value, validation and error | [`Input`, `Password`](/reference/mantine#components)                                                     |
| [`FormController`](/reference/controllers#formcontroller)       | A form from a list of fields                     | [`Form`](/reference/mantine#components)                                                                  |
| [`TableController`](/reference/controllers#tablecontroller)     | The rows of a backend path                       | [`DataTable`](/reference/mantine#components)                                                             |
| [`NavController`](/reference/controllers#navcontroller)         | The active link and the open menu                | [`createShell`](/reference/mantine#createshell)                                                          |
| [`MessageController`](/reference/controllers#messagecontroller) | The messages of the backend                      | [`Toasts`](/reference/mantine#components)                                                                |

To change one, see [Change a ready controller](/guides/extend-a-controller).
