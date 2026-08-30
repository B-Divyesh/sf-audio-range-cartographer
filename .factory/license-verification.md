# License verification behavior

Cartographer Pro uses the Sociobot product verification URL only after a buyer
returns with a license token or explicitly presses **Verify license**. Project
data is never part of that request.

The browser pauses a sixth verification attempt after **five attempts in 60
seconds**. This local safeguard stops repeated clicks before they reach the
billing service and tells the buyer when to try again. It is not presented as a
server response. When an upstream `429` makes `Retry-After` available to the
browser, that wait time is honored too. There is no automatic retry loop.

This static PWA cannot set a gateway-wide limit on `api.sociobot.in`; the local
pacing prevents one browser from hammering that endpoint. The controlled
browser test `@claim:license-check-pacing` proves five routed attempts, then
the local wait behavior. The unit test verifies the exact remaining duration.

## Operator-gated shared gateway check

The shared Sociobot gateway is operated outside this static repository. Its
documented per-client policy is 20 requests per second with a burst allowance
of 40. This is not product copy or a visitor promise. Operators verify it with
a concurrent burst greater than 40, not with six requests:

```sh
SOCIOBOT_OPERATOR_GATEWAY_CHECK=1 npm run test:gateway
```

The check sends 64 fresh invalid tokens, requires at least one upstream HTTP
429 with `Retry-After`, and reports the status summary. It is deliberately
opt-in so regular local and CI test runs do not load the shared gateway.
