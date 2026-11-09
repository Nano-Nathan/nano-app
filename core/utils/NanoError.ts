/** Error of the framework: Node shows it as `[nano-app] [ERROR]: <message>`, and a handler answers its status */
export default class NanoError extends Error {
  public status?: number;

  /** Error with its message, and the status a handler answers (500 without one) */
  constructor(sMessage: string, iStatus?: number) {
    super(sMessage);
    this.status = iStatus;
  }

  /** Message of anything thrown: its `message` when it has one, else the value itself */
  public static messageOf(oError: unknown): string {
    // An object with a `message`: its message
    if (oError && typeof oError === 'object' && 'message' in oError) {
      return String(oError.message ?? oError);
    }

    // Anything else: the value itself
    return String(oError);
  }

  /** Prefix of the framework's messages, shown before the message */
  public override get name(): string {
    return '[nano-app] [ERROR]';
  }
}
