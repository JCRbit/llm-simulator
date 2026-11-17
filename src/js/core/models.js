/** Illustrative per-1k-token prices (USD) and latency characteristics per model tier. */
export const MODELS = {
  small: { inPrice:0.0005, outPrice:0.0015, tpot:14, ttft:180 },
  base:  { inPrice:0.0030, outPrice:0.0060, tpot:28, ttft:280 },
  large: { inPrice:0.0100, outPrice:0.0300, tpot:52, ttft:420 },
};

/**
 * Cost of a request profile for a given model tier.
 * @returns {{costIn:number,costOut:number,costReq:number,daily:number,monthly:number}}
 */
export function computeCost(modelKey, inTok, outTok, reqDay){
  const model = MODELS[modelKey];
  const costIn = (inTok/1000)*model.inPrice;
  const costOut = (outTok/1000)*model.outPrice;
  const costReq = costIn+costOut;
  const daily = costReq*reqDay;
  return { costIn, costOut, costReq, daily, monthly: daily*30 };
}
