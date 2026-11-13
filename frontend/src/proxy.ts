import { NextResponse } from 'next/server';
import Logger from '@nano-app/core/utils/Logger';
import guard from './proxy/guard';
import target from './proxy/target';
import type { NextRequest } from 'next/server';

/** Sends `/api/<store>/<path>` to the backend of the store; guards the pages of `auth.routes` */
export async function proxy(oReq: NextRequest): Promise<Response> {
  // A request outside `/api/<store>` is a page of the app
  const oTarget = target(oReq);
  if (!oTarget) return guard(oReq);

  // Answers 500 with the env var that is missing
  if ('missing' in oTarget) {
    return NextResponse.json(
      {
        success: false,
        message: Logger.message(
          'ERROR',
          `The store "${oTarget.store}" needs the ${oTarget.missing} environment variable. Define it.`,
        ),
      },
      { status: 500 },
    );
  }

  // Next sends the request to the backend and answers
  return NextResponse.rewrite(oTarget.url, { request: { headers: oTarget.headers } });
}
