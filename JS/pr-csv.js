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
  let b = Math.round(m / 30) * 30 % 1440;

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

async function LOAD_PR_CSV(prId){
  try{
    const res = await fetch(`Pomiar_Ruchu/${prId}.csv`);
    if(!res.ok) throw new Error("Brak pliku CSV");

    const text = await res.text();
    PR_CSV_RAW = parseCSV(text);

    PR_SPEED_HIST = {};
    PR_TIME_HIST = {};

    PR_CSV_RAW.forEach(r => {
      if(!r || r.length < 4) return;
      if(r[0].includes("Data i czas")) return;

      const t = parseDateSafe(r[0]);
      const sp = num(r[3]);

      if(!t || isNaN(sp)) return;

      const sb = Math.floor(sp / 10) * 10;
      const speedKey = `${sb}-${sb+9}`;
      PR_SPEED_HIST[speedKey] = (PR_SPEED_HIST[speedKey] || 0) + 1;

      const timeKey = bin30(t);
      PR_TIME_HIST[timeKey] = (PR_TIME_HIST[timeKey] || 0) + 1;
    });

    return true;
  }catch(e){
    console.warn("CSV load error:", e);

    PR_CSV_RAW = null;
    PR_SPEED_HIST = {};
    PR_TIME_HIST = {};

    return false;
  }
}
