/**
 * Deterministic pseudo-tokenizer used for teaching purposes.
 * Splits text on words/punctuation/whitespace and chops long alphanumeric
 * runs into 4-character chunks. It is NOT a real BPE tokenizer.
 */
export function pseudoTokenize(text){
  const raw = text.match(/ ?[A-Za-z0-9]+| ?[^\sA-Za-z0-9]|\n+| +/g) || [];
  const tokens = [];
  raw.forEach(chunk=>{
    const lead = chunk.startsWith(' ') ? ' ' : '';
    const rest = lead ? chunk.slice(1) : chunk;
    if(/^[A-Za-z0-9]+$/.test(rest) && rest.length > 4){
      for(let i=0;i<rest.length;i+=4) tokens.push((i===0?lead:'')+rest.slice(i,i+4));
    } else {
      tokens.push(chunk);
    }
  });
  return tokens.filter(t=>t.length>0);
}
export function countTokens(text){ return pseudoTokenize(text).filter(t=>!/^\s+$/.test(t)).length; }
