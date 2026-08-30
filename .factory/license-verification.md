# License verification allowance

Cartographer Pro uses the Sociobot product verification URL only after a buyer
returns with a license token or explicitly presses **Verify license**. Project
data is never part of that request.

The browser applies a rolling allowance of **five verification attempts per 60
seconds**. The sixth attempt is stopped before it reaches the billing service
and is represented as an HTTP **429 Too Many Requests** response with a
`Retry-After` header for the remaining window. The interface tells the buyer
when to try again. If the Sociobot API itself returns `429`, its `Retry-After`
value is honored too. There is no automatic retry loop.

This static PWA cannot set a gateway-wide limit on `api.sociobot.in`; the local
allowance prevents one browser from hammering that endpoint and gives the same
standards-based response contract to the product code. The controlled browser
test `@claim:license-rate-limit` proves five routed attempts, then the local
429/retry behavior. The unit test verifies the exact response status and header.
