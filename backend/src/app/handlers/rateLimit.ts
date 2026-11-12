import { ipKeyGenerator } from 'express-rate-limit';
import type { RequestHandler } from 'express';
import type { Bucket, RateLimitConfig } from '../../types/app';

/** Rate limit per client IP: each request spends a token of the client's bucket, refilled over time */
export default function rateLimit({
  capacity = 100,
  refillPerSecond = 1,
  message = 'Too many requests, please try again later.',
}: RateLimitConfig): RequestHandler {
  // Tokens of a bucket at a time, refilled up to the capacity
  const fnRefill = (oBucket: Bucket, iNow: number): number =>
    Math.min(capacity, oBucket.iTokens + ((iNow - oBucket.iTime) / 1000) * refillPerSecond);

  // Buckets by client: a client with none has a full one
  const oBuckets = new Map<string, Bucket>();

  // Every minute, forgets the buckets that are full again
  setInterval(() => {
    const iNow = Date.now();
    for (const [sIp, oBucket] of oBuckets) {
      if (fnRefill(oBucket, iNow) >= capacity) oBuckets.delete(sIp);
    }
  }, 60_000).unref();

  // Spends a token of the client on each request
  return (oReq, oRes, fnNext) => {
    // Refills the bucket of the client: an IPv6 one is its /56
    const sIp = ipKeyGenerator(oReq.ip ?? '');
    const iNow = Date.now();
    const iTokens = fnRefill(oBuckets.get(sIp) ?? { iTokens: capacity, iTime: iNow }, iNow);

    // Without a token: 429, with the seconds until the next one
    if (iTokens < 1) {
      oRes.set('Retry-After', String(Math.ceil((1 - iTokens) / refillPerSecond)));
      return fnNext({ status: 429, message });
    }

    // Spends a token
    oBuckets.set(sIp, { iTokens: iTokens - 1, iTime: iNow });
    fnNext();
  };
}
