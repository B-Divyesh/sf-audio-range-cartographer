# License verification allowance

Cartographer Pro uses the Sociobot product verification URL only after a buyer
returns with a license token or explicitly presses **Verify license**. Project
data is never part of that request.

The browser pauses a sixth verification attempt after **five attempts in 60
seconds**. This local safeguard stops repeated clicks before they reach the
billing service and tells the buyer when to try again. It is not presented as a
server response. If the Sociobot API itself returns `429`, its `Retry-After`
value is honored too. There is no automatic retry loop.

This static PWA cannot set a gateway-wide limit on `api.sociobot.in`; the local
allowance prevents one browser from hammering that endpoint. The controlled
browser test `@claim:license-check-pacing` proves five routed attempts, then
the local wait behavior. The unit test verifies the exact remaining duration.
