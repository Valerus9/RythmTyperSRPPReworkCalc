ppFormulas = {
    originalCalculate(scoreData) {
        const notes = scoreData.notes;
        const od = scoreData.overallDifficulty;
        const acc = scoreData.accuracy / 100;
      
        const MIN_DT = 0.04;
        const ALPHA = 0.85;
        const HALF_LIFE = 0.25;
        const TAIL_FRAC = 0.10;
        const PP_PER_UNIT = 10;
        const OD_SLOPE = 0.08;
        const MAX_LEN_NOTES = 500;
        const MAX_LEN_BONUS = 1.25;
      
        const chordBonus = k =>
          1 + 1.6 * (1 - Math.exp(-0.6 * Math.max(0, k - 1)));
      
        const reusePenalty = d =>
          0.55 * Math.exp(-0.7 * (d - 1));
      
        /* build events */
      
        const byTime = {};
        for (const n of notes) {
          (byTime[n.startTime] ??= []).push(n.key);
        }
      
        const times = Object.keys(byTime).map(Number).sort((a, b) => a - b);
      
        const events = times.map(t => {
          const keys = [...new Set(byTime[t])];
          return { t, keys };
        });
      
        /* strain, EMA */
      
        let ema = 0;
        let lastT = times[0];
        const emaVals = [];
        const history = [];
      
        for (const e of events) {
          const dt = Math.max(MIN_DT, e.t - lastT);
          let strain = Math.pow(1 / dt, ALPHA);
      
          let reuse = 0;
          for (let d = 1; d <= history.length; d++) {
            if (e.keys.some(k => history[history.length - d].has(k))) {
              reuse += reusePenalty(d);
            }
          }
      
          strain *= Math.max(0.2, 1 - reuse);
          strain *= chordBonus(e.keys.length);
      
          const decay = Math.pow(0.5, dt / HALF_LIFE);
          ema = ema * decay + strain * (1 - decay);
          emaVals.push(ema);
      
          history.push(new Set(e.keys));
          if (history.length > 6) history.shift();
      
          lastT = e.t;
        }
      
        /* aggregate difficulty */
      
        emaVals.sort((a, b) => b - a);
        const take = Math.max(1, Math.floor(emaVals.length * TAIL_FRAC));
        const core =
          emaVals.slice(0, take).reduce((s, v) => s + v, 0) / take;
      
        /* final scaling */
      
        const x = Math.min(notes.length, MAX_LEN_NOTES);
        const lenBonus =
          1 +
          (MAX_LEN_BONUS - 1) *
            Math.log(1 + x) /
            Math.log(1 + MAX_LEN_NOTES);
      
        const odBonus = 1 + OD_SLOPE * (od - 5);
        const accBonus = Math.pow(acc, 5); 
      
        return core * lenBonus * PP_PER_UNIT * odBonus * accBonus;
      }
};