/**
 * English dictionary.
 * Values that need runtime interpolation are functions instead of strings;
 * callers invoke them directly (e.g. L().lab1.exp2.alert(total, max, label)).
 */
export default {
  nav: { tokens:'01 Tokens', costs:'02 Costs', latency:'03 Latency', limits:'04 Limits', challenge:'05 Production' },
  status: {
    tokens:'Tokens', cost:'Cost / request', latency:'Latency', rate:'Rate limit',
    overLimit:' over limit', nearLimit:' near limit', withinCapacity:'within capacity'
  },
  common: { lessonTag:'EXPLANATION', on:'ON', off:'OFF' },
  hero: {
    eyebrow:'Learn by changing the system',
    title:'Interactive experiments for LLM production constraints.',
    desc:'Tokens, cost, latency and rate limits aren\u2019t abstract — they\u2019re numbers that move when you change a request. Each lab below is a small, working system. Change an input, watch the consequence.',
    stat1:'LABS', stat2:'EXPERIMENTS', stat3:'SLIDES'
  },
  lab1: {
    kicker:'LAB 01', title:'Token Anatomy',
    desc:'See how implementation choices — text length, chat history, retrieved context — change token consumption before a model ever generates a word.',
    theory: {
      tag:'THEORY / fundamentals', h3:'What is a token, and why does it matter?',
      body:`<p>A <b>token</b> is the smallest unit of text an LLM processes internally — not quite a word, but a fragment produced by a tokenizer (typically <b>BPE</b>-based or a variant). In English, the rough conversion is <b>1 token ≈ 0.75 words</b> (about 4 characters); in languages with richer morphology or accented characters, a single word often spans more than one token, so the same idea can cost noticeably more tokens depending on the language.</p>
<p>Every API call moves two kinds of tokens: <b>input</b> tokens (prompt, chat history, retrieved context) and <b>output</b> tokens (whatever the model generates). Both count against the same limit and, as the cost lab shows, they are not priced the same.</p>
<p>That limit is the <b>context window</b>: the maximum number of tokens (input + output) a model can handle in a single interaction. With a 128,000-token window and a 100,000-token input document, only <b>28,000 tokens</b> remain for the response — no matter how long it "should" be.</p>
<p>Once a conversation outgrows the window, something has to give:</p>
<ul>
<li><b>Truncation:</b> drop the oldest turns. Free and instant, but the model silently forgets the start of the conversation.</li>
<li><b>Sliding window:</b> keep only the most recent N turns on every request — the same effect as truncation, framed as an ongoing policy.</li>
<li><b>Context summarization:</b> a small, fast model compresses older turns into a short recap, shrinking thousands of tokens into a few hundred at the cost of some latency and precision.</li>
<li><b>Retrieval (RAG):</b> instead of dragging the whole history along, only the relevant fragments are pulled from a vector database.</li>
<li><b>Prompt pruning:</b> stripping filler words, whitespace and redundant formatting from the system prompt before the HTTP request goes out.</li>
</ul>`
    },
    exp1: {
      tag:'EXPERIMENT 1 / context window', h3:'Type something, watch it become tokens',
      placeholder:'Explain how an API rate limit works...',
      defaultText:'Explain how an API rate limit works and why it matters for production systems.',
      tokCount:'Tokens (approx.)', charsPerToken:'Characters/token', charCount:'Characters', ctxUsage:'Context usage (4,096 max)',
      lesson:'Tokenization is not word counting. Punctuation, whitespace and rare or long words are frequently split into multiple pieces — this text box uses a simplified visual approximation, but the principle holds for every production tokenizer.'
    },
    exp2: {
      tag:'EXPERIMENT 2 / context overflow', h3:'What happens when a conversation outgrows the context window',
      convLen:'Conversation length', ctxWindow:'Context window',
      overflowQ:'How should we handle the overflow?',
      choices:{ truncate:'Truncate', sliding:'Sliding window', summarize:'Summarize', retrieve:'Retrieve relevant' },
      lessons:{
        truncate:'Truncating simply drops the oldest turns. It\u2019s free and instant, but the model silently forgets the start of the conversation — including anything important the user said early on.',
        sliding:'A sliding window keeps only the most recent N turns, recalculated every request. It behaves like truncation but is framed as an ongoing policy rather than a one-off emergency fix.',
        summarize:'Summarizing compresses older turns into a short recap instead of deleting them outright. It costs a little latency and some accuracy, but preserves the gist of everything that came before.',
        retrieve:'Retrieving relevant context skips linear history entirely: it searches past turns for what\u2019s actually related to the current question and injects only that, regardless of how old it is.'
      },
      alert:(total,max,strategyLabel)=>`CONTEXT OVERFLOW — requested ${total} tokens against a ${max} limit. Strategy applied: ${strategyLabel}.`
    },
    exp3: {
      tag:'EXPERIMENT 3 / language density', h3:'Same idea, two languages: how many tokens do you spend?',
      labelEs:'Spanish', labelEn:'English', tokUnit:'tokens',
      result:(pct)=> pct>=0
        ? `Spanish uses <b>+${pct}%</b> more tokens than English for the same idea.`
        : `Spanish uses <b>${pct}%</b> fewer tokens than English for the same idea.`,
      lesson:'Spanish (and many other non-English languages) typically needs 20\u201340% more tokens to express the same idea, because BPE vocabularies are built from training data where English words and word-pieces are overrepresented. Accented characters and \u201c\u00f1\u201d also tend to split into smaller pieces, since they appear less frequently in the training corpus.'
    },
    exp4: {
      tag:'EXPERIMENT 4 / payload efficiency', h3:'JSON vs Markdown: same data, different cost',
      labelJson:'JSON', labelMarkdown:'Markdown', tokUnit:'tokens',
      result:(pct)=> pct>=0
        ? `The JSON version uses <b>+${pct}%</b> more tokens than the Markdown version for the same data.`
        : `The JSON version uses <b>${pct}%</b> fewer tokens than the Markdown version for the same data.`,
      lesson:'JSON\u2019s punctuation \u2014 braces, quotes, colons, commas \u2014 adds a hidden token overhead on every request. At scale, choosing a leaner format for structured data can meaningfully reduce input token cost.'
    }
  },
  lab2: {
    kicker:'LAB 02', title:'Cost Engineering',
    desc:'Understand how model choice, context size and caching turn into an infrastructure bill — per request, per day, per month.',
    theory: {
      tag:'THEORY / pricing and infrastructure', h3:'How inference actually gets billed',
      body:`<p>Most providers (OpenAI, Anthropic, Google Cloud, and others) bill under a <b>pay-per-token</b> model. One detail matters a lot: <b>output tokens typically cost 3-4x more</b> than input tokens, because generating text requires sequential, autoregressive compute on the GPU — each new token depends on the previous one — while the input prompt can be processed in parallel in a single pass.</p>
<p>Two very different infrastructure models exist:</p>
<ul>
<li><b>Serverless API:</b> you pay exactly for the tokens consumed. Ideal for variable or modest traffic, with no fixed cost.</li>
<li><b>Dedicated infrastructure (self-hosted):</b> renting GPUs (H100, A100, or newer generations like the B200) to run open-weight models such as Llama or Mistral. You pay per GPU-hour regardless of whether it receives requests — it only pays off at high, sustained volume.</li>
</ul>
<p>Three levers cut the bill without touching perceived quality:</p>
<ul>
<li><b>RAG (Retrieval-Augmented Generation):</b> instead of sending an entire document (thousands of input tokens), only the 3-4 relevant chunks are retrieved from a vector database.</li>
<li><b>Prompt caching:</b> if the system prompt or a context document doesn't change between requests, its processing can be cached at a discount of up to <b>50-90%</b>.</li>
<li><b>Model routing:</b> simple queries (classification, extraction) go to a small, cheap model; advanced models are reserved for complex tasks.</li>
</ul>`
    },
    exp1: {
      tag:'EXPERIMENT 1 / cost per request', h3:'Price a single request',
      model:'Model', reqDay:'Requests / day', inTok:'Input tokens', outTok:'Output tokens',
      input:'Input', output:'Output', request:'Request', daily:'Daily', monthly:'Monthly',
      models:{
        small:'Nova Small — $0.0005 / $0.0015 per 1K',
        base:'Nova Base — $0.0030 / $0.0060 per 1K',
        large:'Nova Large — $0.0100 / $0.0300 per 1K'
      },
      lesson:'Every token in the context has a cost, not just the ones the model generates. Long conversations, verbose system prompts and unnecessary retrieved documents can quietly dominate the bill even when the final answer is one sentence.'
    },
    exp2: {
      tag:'EXPERIMENT 2 / optimize the request', h3:'Same application, different engineering',
      sub:'A support-bot answering the same question, engineered two different ways.',
      before:'BEFORE', after:'AFTER', context:'Context', output:'Output', caching:'Caching', model:'Model', costReq:'Cost / request',
      delta:'↓ 74% per request, same task',
      lesson:'Trimming the system prompt, caching repeated context, capping output length and routing simple queries to a smaller model compound — each change is modest, but together they cut cost by three quarters without changing what the user sees.'
    }
  },
  lab3: {
    kicker:'LAB 03', title:'Latency Control',
    desc:'Latency is not a single number. Break a request into measurable stages before deciding what to optimize.',
    theory: {
      tag:'THEORY / performance metrics', h3:'TTFT, TPOT and total latency',
      body:`<p>Latency for an LLM request isn't a single number — it breaks down into two independent metrics worth measuring separately.</p>
<ul>
<li><b>TTFT (Time to First Token):</b> the time from sending the request to receiving the first generated token. It depends mostly on the size of the input prompt and how long the GPU takes to "read" it before it starts generating.</li>
<li><b>TPOT (Time Per Output Token):</b> the average time the model takes to produce each subsequent token, once it has already started responding.</li>
</ul>
<div class="formula">Total latency = TTFT + (TPOT × output tokens)</div>
<p>This formula explains why doubling the length of a response roughly doubles the generation portion, but barely touches TTFT. Three techniques target each term:</p>
<ul>
<li><b>Streaming (Server-Sent Events):</b> transmit the response token by token instead of waiting for generation to finish. It doesn't reduce total latency, but it dramatically improves <em>perceived</em> latency.</li>
<li><b>Tuning max_tokens:</b> explicitly capping output length prevents unnecessarily long responses that inflate the TPOT × output term.</li>
<li><b>Distilled or quantized models (8-bit, 4-bit):</b> smaller variants that use less GPU memory and generate each token faster, at some cost to quality.</li>
</ul>`
    },
    exp1: {
      tag:'EXPERIMENT 1 / request breakdown', h3:'Send a request, watch where the time goes',
      sendBtn:'Send request', network:'Network', retrieval:'Retrieval', generation:'Generation', total:'TOTAL', output:'Output',
      lesson:'Latency usually hides four different bottlenecks: network round-trip, retrieval or tool calls, time-to-first-token, and raw generation speed. Optimizing the wrong stage wastes engineering effort.'
    },
    exp2: {
      tag:'EXPERIMENT 2 / streaming vs blocking', h3:'Two ways to deliver the same answer',
      runBtn:'Simulate', blocking:'BLOCKING', streaming:'STREAMING',
      responseAfter:'Response after', firstAfter:'First tokens after',
      answerText:'The response involves several processing stages and may take a few seconds to complete. In streaming mode, the user starts receiving chunks almost immediately and can read them while the rest of the response continues to arrive.',
      lesson:'Streaming does not reduce total generation time. It reduces <em>perceived</em> latency by delivering the first tokens earlier, so the user starts reading while the rest of the answer is still being produced.'
    }
  },
  lab4: {
    kicker:'LAB 04', title:'Rate Limits',
    desc:'See what happens when traffic exceeds the capacity of a model endpoint, and how a retry strategy changes the outcome.',
    theory: {
      tag:'THEORY / API quotas', h3:'RPM, TPM, TPD and the 429 error',
      body:`<p><b>Rate limits</b> are the restrictions a provider imposes to protect the stability of its shared infrastructure and prevent abuse. They're measured across three dimensions that usually apply at once:</p>
<ul>
<li><b>RPM</b> (Requests Per Minute): total requests allowed per minute.</li>
<li><b>TPM</b> (Tokens Per Minute): total volume of tokens processed per minute.</li>
<li><b>TPD</b> (Tokens Per Day): a cumulative daily cap.</li>
</ul>
<p>When an application exceeds any of these, the API responds with an HTTP <b>429 Too Many Requests</b> error. The system doesn't degrade gracefully — it simply starts rejecting requests. Three patterns keep production systems running around this:</p>
<ul>
<li><b>Exponential backoff with jitter:</b> after a failure, wait a time that grows exponentially (1s, 2s, 4s, 8s…) plus a small random margin, so thousands of clients don't retry at the exact same millisecond.</li>
<li><b>Message queue:</b> tools like Redis or RabbitMQ hold requests and release them only once capacity is confirmed, without exceeding the provider's TPM/RPM.</li>
<li><b>Multi-provider fallback:</b> reroute traffic to another account or a secondary provider as soon as the primary one runs out of quota.</li>
</ul>`
    },
    exp1: {
      tag:'EXPERIMENT 1 / traffic vs capacity', h3:'Push traffic against a fixed limit',
      traffic:'Traffic', limit:'Limit', limitTag:'LIMIT',
      exceeded:(pct)=>`RATE LIMIT EXCEEDED — 429 Too Many Requests. Roughly ${pct}% of traffic is being rejected.`,
      ok:(headroom)=>`Traffic within capacity. ${headroom} RPM of headroom remaining.`,
      lesson:'A rate limit protects the provider\u2019s infrastructure. Once traffic crosses it, every extra request fails with a 429 — the system doesn\u2019t slow down gracefully, it starts rejecting outright.'
    },
    exp2: {
      tag:'EXPERIMENT 2 / retry strategy', h3:'What should we do with a 429?',
      choices:{ immediate:'Immediate retry', backoff:'Exponential backoff', jitter:'Backoff + jitter', queue:'Queue', fallback:'Fallback' },
      simulateBtn:'Simulate', placeholder:'Pick a strategy and hit "Simulate" to send a burst of 40 requests at an endpoint with instantaneous capacity for 8.',
      running:'Launching the burst…',
      legend:{ success:'success', queued:'queued', failed:'failed (429)', fallback:'fallback' },
      summary:{ succeeded:'succeeded', failed:'failed (429)', pending:'pending' },
      timelineNoJitter:'Each dot is a client retrying. Without jitter, every client computes the same wait and retries at the same instant — a second wave as synchronized as the first.',
      timelineJitter:'Each dot is a client retrying. With jitter, each one waits a slightly different amount, so retries spread out instead of colliding again.',
      lessons:{
        immediate:'Immediate retry hammers an already-overloaded endpoint with the same request pattern that caused the 429 in the first place — it rarely succeeds and can make the overload worse for everyone sharing the limit.',
        backoff:'Exponential backoff retries in rounds: each round only has room for as many requests as the endpoint\u2019s capacity, the rest fail again and have to wait twice as long as the previous round before trying again.',
        jitter:'Adding random jitter spreads each round\u2019s retries out instead of letting them all land at the same instant — lowering the odds that the whole round collides with the endpoint\u2019s capacity again.',
        queue:'Queueing holds the request locally and releases it only when capacity is confirmed available, trading a longer wait for a near-guaranteed single attempt.',
        fallback:'Falling back reroutes the request to a different model or region entirely, sacrificing consistency for immediate availability.'
      },
      done:{
        immediate:(ok,fail)=>`Done: ${ok} requests succeeded, ${fail} failed — with no retry, those ${fail} are simply lost.`,
        backoff:(n,rounds,cap)=>`Done: the ${n} failed requests recovered over ${rounds} retry rounds — only ${cap} get through per round, and the rest fail again and wait twice as long as the round before.`,
        jitter:(n,rounds,cap)=>`Done: the ${n} failed requests recovered over ${rounds} rounds, with each round's retries spread out over time by jitter instead of landing all at once.`,
        queue:(n)=>`Done: all ${n} requests were served in order as the endpoint freed up capacity — none failed.`,
        fallback:(n)=>`Done: ${n} requests hit a 429 on the primary model and were successfully rerouted to a fallback model.`
      }
    }
  },
  lab5: {
    kicker:'LAB 05', title:'Your LLM just entered production',
    desc:'A real incident: diagnose it, make decisions and stabilize the system without breaking one metric to fix another.',
    theory:{tag:'FINAL CHALLENGE / production',h3:'Don’t chase a perfect metric. Build a stable system.',body:`<p>In production, <b>tokens, cost, latency and rate limits are connected</b>. This challenge simulates an incident: diagnose first, change one lever, then observe which other metrics move.</p><p>Your goal is not the lowest possible number. It is to <b>meet all SLOs at once</b> with reasonable complexity.</p>`},
    incident:{tag:'INCIDENT #001',h3:'Your application just scaled from 5,000 to 100,000 users.',copy:'The last few minutes show signs that the system is not production-ready. Find out what is happening and stabilize it.',time:'09:00 — PRODUCTION',badge:'INCIDENT ACTIVE'},
    progress:'INCIDENT PROGRESS',consequence:{label:'CONSEQUENCES OF YOUR DECISION'},continue:'Continue →',live:{title:'SYSTEM IN PRODUCTION',closed:'INCIDENT CLOSED'},
    finalTag:'RESULT',final:{model:'Model',context:'Context',cache:'Prompt caching',rateStrategy:'Rate limiting'},metricCost:'Cost / month',metricLatency:'P95 Latency <span class="metric-help"></span>',metricTPM:'Tokens / min',metricRate:'429 rate',pass:'SYSTEM PRODUCTION READY',fail:'INCIDENT STILL OPEN',
    whatLearnedTag:'WHAT DID YOU LEARN?',whatLearned:`<p><b>MODEL</b> changes cost, latency and capacity pressure.</p><p><b>CONTEXT</b> is work: more tokens mean more cost, latency and TPM.</p><p><b>CACHING</b> removes repeated work and reduces consumption.</p><p><b>RATE LIMITING</b> protects availability, but protection strategies introduce trade-offs.</p><p><b>Core idea:</b> real LLM systems are not optimized metric by metric. You design the balance.</p>`,
    steps:{diagnosis:{phase:'DIAGNOSIS',question:'Where would you start investigating?',hint:'Do not change anything yet. Interpret the signals first.',choices:{tokens:'Tokens / context',latency:'Latency',rate:'Rate limit / 429',all:'All four signals'},answer:'The symptoms are connected, but context and model are structural levers: they affect work, cost, latency and quota consumption.',wrong:{tokens:'Looking only at tokens misses the simultaneous P95 and 429 signals. The incident is coupled, so you need the four signals together.',latency:'Latency is important, but treating it as an isolated symptom can hide the token load and rate-limit pressure driving it.',rate:'A 429 is a symptom of overload. Investigating only the rate limit does not explain the high token volume, cost and P95.'},breakdown:{system:'System prompt',history:'Chat history',rag:'Retrieved RAG',output:'Max output',total:'Total per request'}},model:{phase:'DECISION 1 / MODEL',question:'Choose the model for this load.',hint:'Think about cost and latency, but also capacity pressure.',choices:{large:'Large — maximum capability',base:'Base — balanced',small:'Small — fast and cheap'},lesson:'A smaller model reduces cost and latency, as long as it still solves the task correctly.',wrong:{large:'Keeping Large increases monthly cost, latency and capacity pressure exactly when the system is already overloaded.',base:'Base is better than Large, but the scenario needs a stronger reduction in cost, latency and capacity pressure to reach all targets.'}},context:{phase:'DECISION 2 / CONTEXT',question:'Average context is 7,200 tokens. What would you cut?',hint:'You do not need to keep everything retrieved to answer well.',choices:{keep:'Keep everything',history:'Reduce history',rag:'Reduce RAG',summarize:'Summarize history + RAG'},lesson:'Context is work. Reducing input tokens frees cost, latency and TPM at the same time.',wrong:{keep:'Keeping all 7,200 tokens preserves the main source of unnecessary work, so cost, latency and TPM remain too high.',history:'Reducing history helps, but the retrieved RAG block is the larger removable chunk in this incident, so the system remains above the target profile.',summarize:'Summarizing both areas can reduce tokens, but it adds another processing step and can lose detail. In this incident, the more direct and controllable fix is to reduce unnecessary RAG context first.'}},cache:{phase:'DECISION 3 / CACHING',question:'Much of the system prompt and context repeats. Would you enable prompt caching?',hint:'Repetition is an opportunity to avoid paying for and processing the same work again.',choices:{off:'Keep OFF',on:'Enable caching'},lesson:'Caching removes repeated work. It does not fix a traffic spike by itself, but it reduces consumption and cost.',wrong:{off:'The prompt and context are repetitive, so leaving caching OFF means paying for and processing the same work on every request.'}},rate:{phase:'DECISION 4 / RATE LIMITING',question:'Peak traffic already exceeds available capacity. How do you protect the system?',hint:'A 429 is not a recovery strategy.',choices:{reject:'Reject immediately',queue:'Queue requests',backoff:'Exponential backoff + jitter',fallback:'Fallback to another model / region'},lesson:'Backoff with jitter avoids synchronized retry storms. Fallback can improve availability, but adds complexity and cost.',wrong:{reject:'Immediate rejection protects capacity but turns overload directly into lost requests and does not recover the traffic gracefully.',queue:'A queue smooths bursts, but in this scenario the target is to reduce synchronized retries and 429s with a lighter intervention.',fallback:'Fallback adds a second execution path and can increase cost and complexity. The incident is better solved by controlling retries against the existing capacity.'}},verify:{phase:'VERIFICATION',question:'Would you accept this configuration for production?',hint:'Do not look at one metric in isolation. Check the whole system.',choices:{accept:'Accept and close incident','continue':'Keep optimizing'},lesson:'Production is ready when the important constraints fit together, not when one metric looks great.',wrong:{continue:'The configuration already satisfies the challenge targets. Continuing to optimize would add changes without solving an outstanding incident.'}}},
    bonus:{kicker:'BONUS / MARKETING CAMPAIGN',h3:'Now break your own solution.',copy:'Production has been stable for 20 minutes. Marketing just multiplied traffic ×3. What do you do now?',resultTag:'RESULT',choices:{reduce:'Reduce context / tokens',limit:'Limit traffic and protect capacity',model:'Lower model during the spike',all:'Combine several measures'},result:{reduce:'A good first lever: fewer tokens per request lowers TPM and cost, but by itself it does not remove a ×3 RPM spike.',limit:'You protect infrastructure and prevent saturation from becoming a 429 cascade. The trade-off is that some traffic must wait or degrade.',model:'A smaller model can reduce cost, latency and TPM, but the capacity bottleneck remains if you keep the same request volume.',all:'Exactly the production approach: there is no silver bullet. Combine work reduction, traffic control and capacity measures according to the bottleneck.'}}
  },      footer:'LLM Simulator.'
};
