function parseCSV(text){
  return text
    .split(/\r?\n/)
    .map(line => line.split(","))
    .filter(row => row.length > 1);
}

const months = {
  "sty":0, "lut":1, "mar":2, "kwi":3,
  "maj":4, "cze":5, "lip":6, "sie":7,
  "wrz":8, "paź":9, "lis":10, "gru":11
};

function parseDateSafe(v){
  if(!v) return null;

  v = v.toString().trim().replace(/\s+/g, " ");

  let m1 = v.match(
    /^(\d{1,2})\s+([A-Za-zążźćńółęśĄŻŹĆŃÓŁĘŚ]+)\s+(\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/i
  );

  if(m1){
    const day = parseInt(m1[1], 10);
    const month = months[m1[2].toLowerCase()];
    const year = 2000 + parseInt(m1[3], 10);
    const hour = parseInt(m1[4], 10);
    const min = parseInt(m1[5], 10);
    const sec = parseInt(m1[6] || "0", 10);

    if(month == null) return null;
    return new Date(year, month, day, hour, min, sec);
  }

  let m2 = v.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/
  );

  if(m2){
    const day = parseInt(m2[1], 10);
    const month = parseInt(m2[2], 10) - 1;
    const year = parseInt(m2[3], 10);
    const hour = parseInt(m2[4], 10);
    const min = parseInt(m2[5], 10);
    const sec = parseInt(m2[6] || "0", 10);

    return new Date(year, month, day, hour, min, sec);
  }

  return null;
}

function num(v){
  if(!v) return NaN;
  return parseFloat(
    v.toString()
      .replace(",", ".")
      .replace(/[^\d.]/g, "")
  );
}

function bin30(date){
  let m = date.getHours() * 60 + date.getMinutes();
  let b = Math.floor(m / 30) * 30 % 1440;

  return String(Math.floor(b / 60)).padStart(2, "0") +
    ":" +
    String(b % 60).padStart(2, "0");
}

function generateTimeBins(){
  let arr = [];

  for(let m = 0; m < 1440; m += 30){
    let h = String(Math.floor(m / 60)).padStart(2, "0");
    let min = String(m % 60).padStart(2, "0");
    arr.push(`${h}:${min}`);
  }

  return arr;
}
const H24 = 24 * 60 * 60 * 1000;
const H48 = 48 * 60 * 60 * 1000;

function getMeasurementRange(rows){
  let min = null;
  let max = null;

  rows.forEach(r => {
    if(!r || r.length < 1) return;
    if(r[0].includes("Data i czas")) return;

    const t = parseDateSafe(r[0]);
    if(!t) return;

    const ts = t.getTime();

    if(min === null || ts < min) min = ts;
    if(max === null || ts > max) max = ts;
  });

  if(min === null || max === null){
    return null;
  }

  return {
    start: new Date(min),
    end: new Date(max),
    duration: max - min
  };
}

function filterRowsToCentralWindow(rows, targetMs){
  const range = getMeasurementRange(rows);

  if(!range) return [];

  if(range.duration <= targetMs){
    return rows;
  }

  const excess = range.duration - targetMs;

  const cutStart = range.start.getTime() + excess / 2;
  const cutEnd = range.end.getTime() - excess / 2;

  return rows.filter(r => {
    if(!r || r.length < 1) return false;
    if(r[0].includes("Data i czas")) return false;

    const t = parseDateSafe(r[0]);
    if(!t) return false;

    const ts = t.getTime();

    return ts >= cutStart && ts <= cutEnd;
  });
}

function getMeasurementDayIndex(date, measurementStart){
  const diff = date.getTime() - measurementStart.getTime();

  return Math.floor(diff / H24);
}
async function LOAD_PR_CSV(prId){
  try{
    const res = await fetch(`Pomiar_Ruchu/${prId}.csv`);
    if(!res.ok) throw new Error("Brak pliku CSV");

    const text = await res.text();

    const rawRows = parseCSV(text);

    const initialRange = getMeasurementRange(rawRows);

    if(!initialRange){
      throw new Error("Brak poprawnych danych czasowych");
    }

    let filteredRows = rawRows;

    if(
      initialRange.duration > H24 &&
      initialRange.duration <= (40 * 60 * 60 * 1000)
    ){
      filteredRows = filterRowsToCentralWindow(rawRows, H24);
    }
    
    if(initialRange.duration > H48){
      filteredRows = filterRowsToCentralWindow(rawRows, H48);
    }

    const finalRange = getMeasurementRange(filteredRows);

    PR_MEASUREMENT_START = finalRange.start;
    PR_MEASUREMENT_END = finalRange.end;
    PR_MEASUREMENT_DURATION = finalRange.duration;

    PR_CSV_RAW = filteredRows;

    PR_SPEED_HIST = {};
    PR_TIME_HIST = {};

    generateTimeBins().forEach(bin => {
      PR_TIME_HIST[bin] = 0;
    });
    
    const perDayTimeHist = {};
    const perDaySpeedHist = {};

    const useAverageMode =
      finalRange.duration > (40 * 60 * 60 * 1000);

    if(useAverageMode){
      PR_MEASUREMENT_MODE = "48H_AVG";
    }else{
      PR_MEASUREMENT_MODE = "24H";
    }

    filteredRows.forEach(r => {
      if(!r || r.length < 4) return;
      if(r[0].includes("Data i czas")) return;

      const t = parseDateSafe(r[0]);
      const sp = num(r[3]);

      if(!t || isNaN(sp)) return;

      const sb = Math.floor(sp / 10) * 10;
      const speedKey = `${sb}-${sb+9}`;
      
      const timeKey = bin30(t);
      
      if(!useAverageMode){
        PR_SPEED_HIST[speedKey] =
          (PR_SPEED_HIST[speedKey] || 0) + 1;
      
        PR_TIME_HIST[timeKey] =
          (PR_TIME_HIST[timeKey] || 0) + 1;
      
        return;
      }
      
      let dayIndex = getMeasurementDayIndex(
        t,
        finalRange.start
      );
      
      if(dayIndex < 0) dayIndex = 0;
      if(dayIndex > 1) dayIndex = 1;
      
      if(!perDaySpeedHist[speedKey]){
        perDaySpeedHist[speedKey] = {};
      }
      
      perDaySpeedHist[speedKey][dayIndex] =
        (perDaySpeedHist[speedKey][dayIndex] || 0) + 1;

      if(!perDayTimeHist[timeKey]){
        perDayTimeHist[timeKey] = {};
      }

      perDayTimeHist[timeKey][dayIndex] =
        (perDayTimeHist[timeKey][dayIndex] || 0) + 1;
    });

    if(useAverageMode){
      Object.keys(perDayTimeHist).forEach(timeKey => {
        const dayData = perDayTimeHist[timeKey];
    
        const values = Object.values(dayData);
    
        if(values.length === 0){
          PR_TIME_HIST[timeKey] = 0;
          return;
        }
    
        const sum = values.reduce((a, b) => a + b, 0);
    
        PR_TIME_HIST[timeKey] =
          Math.round(sum / values.length);
      });
    
      Object.keys(perDaySpeedHist).forEach(speedKey => {
        const dayData = perDaySpeedHist[speedKey];
    
        const values = Object.values(dayData);
    
        if(values.length === 0){
          PR_SPEED_HIST[speedKey] = 0;
          return;
        }
    
        const sum = values.reduce((a, b) => a + b, 0);
    
        PR_SPEED_HIST[speedKey] =
          Math.round(sum / values.length);
      });
    }

    return true;

  }catch(e){
    console.warn("CSV load error:", e);

    PR_CSV_RAW = null;

    PR_SPEED_HIST = {};
    PR_TIME_HIST = {};

    PR_MEASUREMENT_START = null;
    PR_MEASUREMENT_END = null;
    PR_MEASUREMENT_DURATION = null;

    return false;
  }
}
