import * as KosherZmanim from "kosher-zmanim";
const { DateTime } = require("luxon");

describe.skip('temp', () => {
  it('should pass', () => {
    const z = KosherZmanim.getZmanimJson({
      date: new Date(),
      latitude: 32.08306639634274,
      longitude: 35.09424178691712,
      elevation: 0,
      timeZoneId: "Asia/Jerusalem",
    });
    const sunsetTime = DateTime.fromISO(z.BasicZmanim.Sunset, { zone: "Asia/Jerusalem" });
    const formattedSunset = sunsetTime.toFormat("hh:mm");
    expect(formattedSunset).toBe(({}));
  });
})