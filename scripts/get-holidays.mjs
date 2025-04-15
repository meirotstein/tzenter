import { getHolidaysOnDate } from '@hebcal/core/dist/esm/holidays.js';

const date = new Date(process.argv[2]);
const il = process.argv[3] === 'true';

const result = getHolidaysOnDate(date, il);
console.log(JSON.stringify(result));
