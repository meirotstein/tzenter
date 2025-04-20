import { calendar } from '@hebcal/core/dist/esm/calendar';

const date = new Date(process.argv[2]);

const options = {
  omer: true,
  il: true,
  start: date,
  end: date,
};

const result = calendar(options);
// this is crucial as gets read by another process
console.log(JSON.stringify(result));
