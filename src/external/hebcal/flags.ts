export const flags = {
  /** Chag, yontiff, yom tov */
  CHAG: 0x000001,
  /** Light candles 18 minutes before sundown */
  LIGHT_CANDLES: 0x000002,
  /** End of holiday (end of Yom Tov)  */
  YOM_TOV_ENDS: 0x000004,
  /** Observed only in the Diaspora (chutz l'aretz)  */
  CHUL_ONLY: 0x000008,
  /** Observed only in Israel */
  IL_ONLY: 0x000010,
  /** Light candles in the evening at Tzeit time (3 small stars) */
  LIGHT_CANDLES_TZEIS: 0x000020,
  /** Candle-lighting for Chanukah */
  CHANUKAH_CANDLES: 0x000040,
  /** Rosh Chodesh, beginning of a new Hebrew month */
  ROSH_CHODESH: 0x000080,
  /** Minor fasts like Tzom Tammuz, Ta'anit Esther, ... */
  MINOR_FAST: 0x000100,
  /** Shabbat Shekalim, Zachor, ... */
  SPECIAL_SHABBAT: 0x000200,
  /** Weekly sedrot on Saturdays */
  PARSHA_HASHAVUA: 0x000400,
  /** Daily page of Talmud (Bavli) */
  DAF_YOMI: 0x000800,
  /** Days of the Omer */
  OMER_COUNT: 0x001000,
  /** Yom HaShoah, Yom HaAtzma'ut, ... */
  MODERN_HOLIDAY: 0x002000,
  /** Yom Kippur and Tish'a B'Av */
  MAJOR_FAST: 0x004000,
  /** On the Saturday before Rosh Chodesh */
  SHABBAT_MEVARCHIM: 0x008000,
  /** Molad */
  MOLAD: 0x010000,
  /** Yahrzeit or Hebrew Anniversary */
  USER_EVENT: 0x020000,
  /** Daily Hebrew date ("11th of Sivan, 5780") */
  HEBREW_DATE: 0x040000,
  /** A holiday that's not major, modern, rosh chodesh, or a fast day */
  MINOR_HOLIDAY: 0x080000,
  /** Evening before a major or minor holiday */
  EREV: 0x100000,
  /** Chol haMoed, intermediate days of Pesach or Sukkot */
  CHOL_HAMOED: 0x200000,
  /** Mishna Yomi */
  MISHNA_YOMI: 0x400000,
  /** Yom Kippur Katan, minor day of atonement on the day preceeding each Rosh Chodesh */
  YOM_KIPPUR_KATAN: 0x800000,
  /** Daily page of Jerusalem Talmud (Yerushalmi) */
  YERUSHALMI_YOMI: 0x1000000,
  /** Nach Yomi */
  NACH_YOMI: 0x2000000,
  /** Daily Learning */
  DAILY_LEARNING: 0x4000000,
  /** Yizkor */
  YIZKOR: 0x8000000,
};
