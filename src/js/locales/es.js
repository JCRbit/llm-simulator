/**
 * Spanish dictionary (default language).
 * Values that need runtime interpolation are functions instead of strings;
 * callers invoke them directly (e.g. L().lab1.exp2.alert(total, max, label)).
 */
export default {
  nav: { tokens:'01 Tokens', costs:'02 Costes', latency:'03 Latencia', limits:'04 Límites', challenge:'05 Reto' },
  status: {
    tokens:'Tokens', cost:'Coste / petición', latency:'Latencia', rate:'Límite de uso',
    overLimit:' fuera de límite', nearLimit:' cerca del límite', withinCapacity:'dentro de la capacidad'
  },
  common: { lessonTag:'EXPLICACIÓN', on:'ACTIVADA', off:'DESACTIVADA' },
  hero: {
    eyebrow:'',
    title:'Experimentos interactivos sobre las restricciones de producción de los LLM.',
    desc:'Los tokens, el coste, la latencia y los <em>límites de uso</em> varían de forma directa según la estructura de la petición. Los siguientes laboratorios son <strong>simulaciones interactivas creadas para aproximarse al comportamiento real de la infraestructura de LLMs</strong>. Aunque están calibrados para ser lo más realistas posible, representan modelos de estimación. Modifica los controles de entrada y observa cómo evoluciona cada métrica en tiempo real.',
    stat1:'LABORATORIOS', stat2:'EXPERIMENTOS', stat3:'DIAPOSITIVAS'
  },
  lab1: {
    kicker:'LABORATORIO 01', title:'Anatomía de los tokens',
    desc:'Descubre cómo decisiones de implementación —longitud del texto, historial de chat, contexto recuperado— cambian el consumo de tokens antes de que el modelo genere una sola palabra.',
    theory: {
      tag:'TEORÍA / fundamentos', h3:'¿Qué es un token y por qué importa?',
      body:`<p>Un <b>token</b> es la unidad mínima de texto que un LLM procesa internamente: no es exactamente una palabra, sino un fragmento generado por un tokenizador (normalmente basado en <b>BPE</b> o variantes). En inglés, la equivalencia aproximada es de <b>1 token ≈ 0,75 palabras</b> (unos 4 caracteres); en español, por los acentos, la morfología verbal y los plurales, una palabra suele repartirse en <b>1,3–2 tokens</b>, lo que hace que el mismo texto consuma más presupuesto que su versión en inglés.</p>
<p>Cada llamada a la API mueve dos tipos de tokens: los de <b>entrada</b> (prompt, historial de conversación, contexto recuperado) y los de <b>salida</b> (lo que genera el modelo). Ambos cuentan con el mismo límite y, como se ve en el laboratorio de costes, no valen lo mismo.</p>
<p>Ese límite es la <b>ventana de contexto</b>: el número máximo de tokens (entrada + salida) que el modelo puede manejar en una sola interacción. Si usas un modelo con una ventana de 128.000 tokens y envías un documento de 100.000 tokens de entrada, solo quedan <b>28.000 tokens</b> disponibles para la respuesta — por muy larga que "debiera" ser.</p>
<p>Cuando una conversación crece más que la ventana, hay que decidir qué sacrificar:</p>
<ul>
<li><b>Truncado:</b> descarta las interacciones más antiguas. Gratis e instantáneo, pero el modelo olvida el inicio de la conversación sin avisar.</li>
<li><b>Ventana móvil:</b> conserva solo los N interacciones más recientes en cada petición, como política continua en vez de parche puntual.</li>
<li><b>Resumen de contexto:</b> un modelo pequeño y rápido comprime las interacciones antiguas en un breve recap, reduciendo miles de tokens a unos pocos cientos a cambio de algo de latencia y precisión.</li>
<li><b>Recuperación (RAG):</b> en vez de arrastrar todo el historial, se buscan solo los fragmentos relevantes en una base de datos vectorial.</li>
<li><b>Poda de prompts:</b> eliminar relleno, espacios y formateo redundante del system prompt antes de realizar la petición HTTP.</li>
</ul>`
    },
    exp1: {
      tag:'EXPERIMENTO 1 / ventana de contexto', h3:'Escribe algo y obsérvalo convertirse en tokens',
      placeholder:'Explica cómo funciona un límite de uso de una API...',
      defaultText:'Explica cómo funciona un límite de uso de una API y por qué importa en los sistemas de producción.',
      tokCount:'Tokens (aprox.)', charsPerToken:'Caracteres/token', charCount:'Caracteres', ctxUsage:'Uso de contexto (máx. 4096)',
      lesson:'La tokenización no es contar palabras. La puntuación, los espacios y las palabras largas o poco frecuentes suelen dividirse en varias piezas — este cuadro de texto usa una aproximación visual simplificada, pero el principio se cumple en cualquier tokenizador de producción.'
    },
    exp2: {
      tag:'EXPERIMENTO 2 / desbordamiento de contexto', h3:'Qué ocurre cuando una conversación supera la ventana de contexto',
      convLen:'Longitud de la conversación', ctxWindow:'Ventana de contexto',
      overflowQ:'¿Cómo deberíamos gestionar el desbordamiento?',
      choices:{ truncate:'Truncar', sliding:'Ventana móvil', summarize:'Resumir', retrieve:'Recuperar relevante' },
      lessons:{
        truncate:'Truncar simplemente elimina las interacciones antiguas. Es gratis e instantáneo, pero el modelo olvida en silencio el inicio de la conversación — incluyendo cualquier cosa importante que el usuario dijera al principio.',
        sliding:'Una ventana móvil conserva solo las N interacciones más recientes, recalculados en cada petición. Se comporta como el truncado, pero se plantea como una política continua en lugar de un parche de emergencia puntual.',
        summarize:'Resumir comprime las interacciones antiguas en un breve recap en lugar de eliminarlos por completo. Cuesta algo de latencia y precisión, pero conserva la esencia de todo lo anterior.',
        retrieve:'Recuperar contexto relevante se salta el historial lineal por completo: busca en las interacciones pasadas lo que realmente se relaciona con la pregunta actual e inyecta solo eso, sin importar su antigüedad.'
      },
      alert:(total,max,strategyLabel)=>`DESBORDAMIENTO DE CONTEXTO — se solicitaron ${total} tokens frente a un límite de ${max}. Estrategia aplicada: ${strategyLabel}.`
    },
    exp3: {
      tag:'EXPERIMENTO 3 / densidad por idioma', h3:'La misma idea, dos idiomas: ¿cuántos tokens gastas?',
      labelEs:'Español', labelEn:'Inglés', tokUnit:'tokens',
      result:(pct)=> pct>=0
        ? `El español usa <b>+${pct}%</b> más tokens que el inglés para transmitir la misma idea.`
        : `El español usa <b>${pct}%</b> menos tokens que el inglés para transmitir la misma idea.`,
      lesson:'El español (y muchos otros idiomas no ingleses) suele necesitar entre un 20% y un 40% más tokens para expresar la misma idea, porque los vocabularios BPE se entrenan sobre datos donde las palabras y sub-palabras en inglés están sobrerrepresentadas. Los acentos y la "ñ" tienden además a partirse en fragmentos más pequeños, porque aparecen con menos frecuencia en el corpus de entrenamiento.'
    },
    exp4: {
      tag:'EXPERIMENTO 4 / eficiencia del payload', h3:'JSON frente a Markdown: el mismo dato, distinto coste',
      labelJson:'JSON', labelMarkdown:'Markdown', tokUnit:'tokens',
      result:(pct)=> pct>=0
        ? `La versión en JSON usa <b>+${pct}%</b> más tokens que la versión en Markdown para el mismo dato.`
        : `La versión en JSON usa <b>${pct}%</b> menos tokens que la versión en Markdown para el mismo dato.`,
      lesson:'La puntuación de JSON —llaves, comillas, dos puntos, comas— añade un sobrecoste de tokens oculto en cada petición. A escala, elegir un formato más ligero para datos estructurados puede reducir de forma notable el coste de los tokens de entrada.'
    }
  },
  lab2: {
    kicker:'LABORATORIO 02', title:'Ingeniería de costes',
    desc:'Comprende cómo el modelo elegido, el tamaño del contexto y la caché se convierten en una factura de infraestructura — por petición, por día y por mes.',
    theory: {
      tag:'TEORÍA / precios e infraestructura', h3:'Cómo se factura realmente la inferencia',
      body:`<p>La mayoría de proveedores (OpenAI, Anthropic, Google Cloud, entre otros) cobran bajo un modelo de <b>pago por uso</b> basado en tokens procesados. Un matiz importante: los <b>tokens de salida suelen costar entre 3 y 4 veces más</b> que los de entrada, porque generar texto exige cómputo autoregresivo secuencial en la GPU —cada nuevo token depende del anterior— mientras que el prompt de entrada se procesa en paralelo de una sola vez.</p>
<p>Existen dos modelos de infraestructura muy distintos:</p>
<ul>
<li><b>API serverless:</b> pagas exactamente por token consumido. Ideal para tráfico variable o volúmenes reducidos, sin coste fijo.</li>
<li><b>Infraestructura dedicada (self-hosted):</b> alquilar GPUs (H100, A100, o generaciones más recientes como la B200) para ejecutar modelos de código abierto como Llama o Mistral. Pagas por hora de GPU encendida, reciba o no peticiones — solo compensa con volumen alto y sostenido.</li>
</ul>
<p>Tres palancas reducen la factura sin tocar la calidad que percibe el usuario:</p>
<ul>
<li><b>RAG (Retrieval-Augmented Generation):</b> en lugar de enviar un documento entero (miles de tokens de entrada), se recuperan de una base de datos vectorial solo los 3 o 4 fragmentos relevantes.</li>
<li><b>Caché de prompts:</b> si el system prompt o un documento de contexto no cambia entre peticiones, su procesamiento se puede cachear con descuentos de hasta el <b>50%-90%</b>.</li>
<li><b>Enrutamiento de modelos:</b> las consultas sencillas (clasificación, extracción) se envían a un modelo pequeño y económico; los modelos avanzados se reservan para tareas complejas.</li>
</ul>`
    },
    exp1: {
      tag:'EXPERIMENTO 1 / coste por petición', h3:'Calcula el precio de una petición',
      model:'Modelo', reqDay:'Peticiones / día', inTok:'Tokens de entrada', outTok:'Tokens de salida',
      input:'Entrada', output:'Salida', request:'Petición', daily:'Diario', monthly:'Mensual',
      models:{
        small:'Nova Small — $0.0005 / $0.0015 por 1K',
        base:'Nova Base — $0.0030 / $0.0060 por 1K',
        large:'Nova Large — $0.0100 / $0.0300 por 1K'
      },
      lesson:'Cada token del contexto tiene un coste, no solo los que genera el modelo. Las conversaciones largas, los system prompts verbosos y los documentos recuperados innecesarios pueden dominar silenciosamente la factura aunque la respuesta final sea una sola frase.'
    },
    exp2: {
      tag:'EXPERIMENTO 2 / optimizar la petición', h3:'La misma aplicación, distinta ingeniería',
      sub:'Un bot de soporte respondiendo la misma pregunta, diseñado de dos formas distintas.',
      before:'ANTES', after:'DESPUÉS', context:'Contexto', output:'Salida', caching:'Caché', model:'Modelo', costReq:'Coste / petición',
      delta:'↓ 74% por petición, misma tarea',
      lesson:'Recortar el system prompt, cachear contexto repetido, limitar la longitud de salida y enrutar consultas simples a un modelo más pequeño se combinan — cada cambio es modesto, pero juntos reducen el coste en tres cuartas partes sin cambiar lo que ve el usuario.'
    }
  },
  lab3: {
    kicker:'LABORATORIO 03', title:'Control de latencia',
    desc:'La latencia no es un único número. Divide una petición en etapas medibles antes de decidir qué optimizar.',
    theory: {
      tag:'TEORÍA / métricas de rendimiento', h3:'TTFT, TPOT y la latencia total',
      body:`<p>La latencia de una petición a un LLM no es un único número: se descompone en dos métricas independientes que conviene medir por separado.</p>
<ul>
<li><b>TTFT (Time to First Token):</b> el tiempo que transcurre desde que se envía la petición hasta que llega el primer token generado. Depende sobre todo del tamaño del prompt de entrada y de cuánto tarda la GPU en "leerlo" antes de empezar a generar.</li>
<li><b>TPOT (Time Per Output Token):</b> el tiempo medio que tarda el modelo en producir cada token sucesivo, una vez ya ha empezado a responder.</li>
</ul>
<div class="formula">Latencia total = TTFT + (TPOT × tokens de salida)</div>
<p>Esta fórmula explica por qué duplicar la longitud de una respuesta multiplica aproximadamente por dos la parte de generación, pero apenas afecta al TTFT. Tres técnicas atacan cada término:</p>
<ul>
<li><b>Streaming (Server-Sent Events):</b> transmite la respuesta token por token en lugar de esperar a que termine toda la generación. No reduce la latencia total, pero mejora drásticamente la latencia <em>percibida</em> por el usuario.</li>
<li><b>Ajuste de max_tokens:</b> limitar explícitamente el número máximo de tokens de salida evita respuestas innecesariamente largas que inflan el término TPOT × salida.</li>
<li><b>Modelos destilados o cuantizados (8-bit, 4-bit):</b> versiones reducidas que ocupan menos memoria de GPU y generan cada token más rápido, a cambio de algo de calidad.</li>
</ul>`
    },
    exp1: {
      tag:'EXPERIMENTO 1 / desglose de la petición', h3:'Envía una petición y observa en qué se va el tiempo',
      sendBtn:'Enviar petición', network:'Red', retrieval:'Recuperación', generation:'Generación', total:'TOTAL', output:'Salida',
      lesson:'Latencia suele esconder cuatro cuellos de botella distintos: el viaje de red, la recuperación o las llamadas a herramientas, el tiempo hasta el primer token y la velocidad bruta de generación. Optimizar la etapa equivocada desperdicia esfuerzo de ingeniería.'
    },
    exp2: {
      tag:'EXPERIMENTO 2 / streaming frente a blocking', h3:'Dos formas de entregar la misma respuesta',
      runBtn:'Simular', blocking:'BLOCKING', streaming:'STREAMING',
      responseAfter:'Respuesta tras', firstAfter:'Primeros tokens tras',
      answerText:'La respuesta contiene varias etapas de procesamiento y puede tardar unos segundos en completarse. En modo streaming, el usuario empieza a recibir fragmentos casi de inmediato y puede leerlos mientras el resto de la respuesta continúa llegando.',
      lesson:'El streaming permite que el cliente comience a mostrar la respuesta tan pronto como el primer token está listo, en lugar de esperar a que el modelo termine de generar cada token antes de que aparezca algo en pantalla. Es por esto que una interfaz de chat se siente instantánea incluso cuando la respuesta completa tarda varios segundos en finalizar.'
    }
  },
  lab4: {
    kicker:'LABORATORIO 04', title:'Límites de uso',
    desc:'Observa qué ocurre cuando el tráfico supera la capacidad de un endpoint, y cómo cambia el resultado según la estrategia de reintentos.',
    theory: {
      tag:'TEORÍA / cuotas de la API', h3:'RPM, TPM, TPD y el error 429',
      body:`<p>Los <b>límites de uso</b> son las restricciones que impone un proveedor para garantizar la estabilidad de su infraestructura compartida y prevenir abusos. Se miden en tres dimensiones que suelen convivir a la vez:</p>
<ul>
<li><b>RPM</b> (Requests Per Minute): peticiones totales permitidas por minuto.</li>
<li><b>TPM</b> (Tokens Per Minute): volumen total de tokens procesados por minuto.</li>
<li><b>TPD</b> (Tokens Per Day): límite acumulado a lo largo del día.</li>
</ul>
<p>Cuando una aplicación supera cualquiera de estos límites, la API responde con un error HTTP <b>429 Too Many Requests</b>. El sistema no se degrada con elegancia: simplemente empieza a rechazar peticiones. Tres patrones se usan en producción para gestionarlo:</p>
<ul>
<li><b>Reintento con backoff exponencial y jitter:</b> tras un fallo, la aplicación espera un tiempo que aumenta exponencialmente (1s, 2s, 4s, 8s…) sumando un margen aleatorio para que miles de peticiones no reintenten exactamente en el mismo milisegundo.</li>
<li><b>Cola de mensajes:</b> herramientas como Redis o RabbitMQ retienen las peticiones y las liberan solo cuando hay capacidad confirmada, sin rebasar el TPM/RPM del proveedor.</li>
<li><b>Fallback multi-proveedor:</b> redirigir el tráfico a otra cuenta o a un proveedor secundario en cuanto el principal agota su cuota.</li>
</ul>`
    },
    exp1: {
      tag:'EXPERIMENTO 1 / tráfico frente a capacidad', h3:'Aumenta el tráfico contra un límite fijo',
      traffic:'Tráfico', limit:'Límite', limitTag:'LÍMITE',
      exceeded:(pct)=>`LÍMITE DE USO SUPERADO — 429 Too Many Requests. Aproximadamente el ${pct}% del tráfico está siendo rechazado.`,
      ok:(headroom)=>`Tráfico dentro de la capacidad. Quedan ${headroom} RPM de margen.`,
      lesson:'Un límite de uso protege la infraestructura del proveedor. En cuanto el tráfico lo supera, cada petición adicional falla con un 429 — el sistema no se ralentiza con elegancia, empieza a rechazar directamente.'
    },
    exp2: {
      tag:'EXPERIMENTO 2 / estrategia de reintentos', h3:'¿Qué deberíamos hacer ante un error HTTP 429 Too Many Requests?',
      choices:{ immediate:'Reintento inmediato', backoff:'Backoff exponencial', jitter:'Backoff + jitter', queue:'Cola', fallback:'Fallback' },
      simulateBtn:'Simular', placeholder:'Elige una estrategia y pulsa «Simular» para lanzar una ráfaga de 40 peticiones contra un endpoint con capacidad instantánea para 8.',
      running:'Lanzando la ráfaga…',
      legend:{ success:'éxito', queued:'en cola', failed:'fallo (429)', fallback:'fallback' },
      summary:{ succeeded:'con éxito', failed:'fallidas (429)', pending:'pendientes' },
      timelineNoJitter:'Cada punto es un cliente reintentando. Sin jitter, todos calculan la misma espera y reintentan en el mismo instante — una segunda oleada tan sincronizada como la primera.',
      timelineJitter:'Cada punto es un cliente reintentando. Con jitter, cada uno espera un tiempo ligeramente distinto, así que los reintentos se reparten en vez de colisionar de nuevo.',
      lessons:{
        immediate:'El reintento inmediato golpea un endpoint ya saturado con el mismo patrón de peticiones que provocó el 429 en primer lugar — rara vez tiene éxito y puede empeorar la saturación para todos los que comparten el límite.',
        backoff:'El backoff exponencial reintenta en rondas: en cada ronda solo caben las peticiones que entren en la capacidad del endpoint, el resto vuelve a fallar y tiene que esperar el doble de tiempo que la ronda anterior antes de volver a intentarlo.',
        jitter:'Añadir aleatoriedad (jitter) reparte los reintentos de cada ronda en vez de dejar que todos lleguen en el mismo instante — reduce la probabilidad de que la ronda entera vuelva a colisionar contra la capacidad del endpoint.',
        queue:'Poner en cola retiene la petición localmente y solo la libera cuando se confirma capacidad disponible, cambiando una espera más larga por un intento prácticamente garantizado.',
        fallback:'El fallback redirige la petición a un modelo o región distintos por completo, sacrificando consistencia a cambio de disponibilidad inmediata.'
      },
      done:{
        immediate:(ok,fail)=>`Completado: ${ok} peticiones con éxito, ${fail} fallidas — sin reintento, esas ${fail} se pierden.`,
        backoff:(n,rounds,cap)=>`Completado: las ${n} peticiones fallidas se recuperaron en ${rounds} rondas de reintento — en cada ronda solo pasan ${cap}, y el resto vuelve a fallar y espera el doble que la ronda anterior.`,
        jitter:(n,rounds,cap)=>`Completado: las ${n} peticiones fallidas se recuperaron en ${rounds} rondas, con los reintentos de cada ronda repartidos en el tiempo por el jitter en lugar de coincidir todos a la vez.`,
        queue:(n)=>`Completado: las ${n} peticiones se sirvieron en orden a medida que el endpoint liberaba capacidad — ninguna falló.`,
        fallback:(n)=>`Completado: ${n} peticiones recibieron un 429 en el modelo principal y se redirigieron con éxito a un modelo de respaldo.`
      }
    }
  },
  lab5: {
    kicker:'LABORATORIO 05', title:'Tu LLM acaba de entrar en producción',
    desc:'Un incidente real: diagnostica, toma decisiones y estabiliza el sistema sin romper una métrica para arreglar otra.',
    theory:{tag:'RETO FINAL / producción',h3:'No persigas una métrica perfecta. Construye un sistema estable.',body:`<p>En producción, <b>tokens, coste, latencia y límites de uso están conectados</b>. Este reto simula un incidente: primero diagnostica, después cambia una palanca y observa qué otras métricas se mueven.</p><p>Tu objetivo no es conseguir el número más bajo posible. Es <b>cumplir todos los SLO (Objetivos de Nivel de Servicio) a la vez</b> con una complejidad razonable.</p>`},
    incident:{tag:'INCIDENTE #001',h3:'Tu aplicación acaba de escalar de 5.000 a 100.000 usuarios.',copy:'Los últimos minutos muestran señales de que el sistema no está listo para producción. Averigua qué ocurre y estabilízalo.',time:'09:00 — PRODUCCIÓN',badge:'INCIDENTE ACTIVO'},
    progress:'PROGRESO DEL INCIDENTE',consequence:{label:'CONSECUENCIAS DE TU DECISIÓN'},continue:'Continuar →',live:{title:'SISTEMA EN PRODUCCIÓN',closed:'INCIDENTE CERRADO'},
    finalTag:'RESULTADO',final:{model:'Modelo',context:'Contexto',cache:'Prompt caching',rateStrategy:'Limitación de uso'},metricCost:'Coste / mes',metricLatency:'Latencia P95',metricTPM:'Tokens / min',metricRate:'Tasa 429',pass:'SISTEMA LISTO PARA PRODUCCIÓN',fail:'INCIDENTE AÚN ABIERTO',
    whatLearnedTag:'¿QUÉ HAS APRENDIDO?',whatLearned:`<p><b>MODELO</b> cambia coste, latencia y presión de capacidad.</p><p><b>CONTEXTO</b> es trabajo: más tokens significan más coste, latencia y TPM.</p><p><b>CACHÉ</b> evita trabajo repetido y reduce consumo.</p><p><b>LIMITACIÓN DE USO</b> protege la disponibilidad, pero las estrategias de protección introducen trade-offs.</p><p><b>Idea central:</b> los sistemas LLM reales no se optimizan métrica por métrica. Se diseña el equilibrio.</p>`,
    steps:{
      diagnosis:{phase:'DIAGNÓSTICO',question:'¿Dónde empezarías a investigar?',hint:'No toques nada todavía. Primero interpreta las señales.',choices:{tokens:'Los tokens / contexto',latency:'La latencia',rate:'El límite de uso / 429',all:'Las cuatro señales a la vez'},answer:'Los síntomas están relacionados, pero contexto y modelo son palancas estructurales: afectan trabajo, coste, latencia y cuota.',wrong:{tokens:'Mirar solo los tokens deja fuera las señales simultáneas de P95 y 429. El incidente está acoplado, así que necesitas las cuatro señales.',latency:'La latencia importa, pero tratarla como un síntoma aislado puede ocultar la carga de tokens y la presión sobre el límite de uso que la provocan.',rate:'Un 429 es un síntoma de saturación. Investigar solo el límite de uso no explica el volumen de tokens, el coste y el P95 altos.'},breakdown:{system:'System prompt',history:'Historial',rag:'RAG recuperado',output:'Salida máxima',total:'Total por petición'}},
      model:{phase:'DECISIÓN 1 / MODELO',question:'Elige el modelo para esta carga.',hint:'Piensa en coste, latencia y presión de capacidad.',choices:{large:'Large — máxima capacidad',base:'Base — equilibrio',small:'Small — rápido y económico'},lesson:'Un modelo más pequeño reduce coste y latencia si sigue resolviendo correctamente la tarea.',wrong:{large:'Mantener Large aumenta coste mensual, latencia y presión de capacidad justo cuando el sistema ya está saturado.',base:'Base mejora frente a Large, pero el escenario necesita una reducción mayor de coste, latencia y presión de capacidad para alcanzar todos los objetivos.'}},
      context:{phase:'DECISIÓN 2 / CONTEXTO',question:'El contexto medio es de 7.200 tokens. ¿Qué recortarías?',hint:'No necesitas conservar todo lo recuperado para responder bien.',choices:{keep:'Mantener todo',history:'Reducir historial',rag:'Reducir RAG',summarize:'Resumir historial + RAG'},lesson:'El contexto es trabajo: reducir tokens de entrada libera coste, latencia y TPM a la vez.',wrong:{keep:'Mantener los 7.200 tokens conserva la principal fuente de trabajo innecesario, así que coste, latencia y TPM siguen demasiado altos.',history:'Reducir historial ayuda, pero el bloque RAG recuperado es el recorte más importante en este incidente, por lo que el perfil sigue fuera de objetivo.',summarize:'Resumir ambas áreas puede reducir tokens, pero introduce una etapa adicional de procesamiento y puede perder detalle. En este incidente, el recorte más directo y controlable es reducir el RAG innecesario.'}},
      cache:{phase:'DECISIÓN 3 / CACHÉ',question:'Gran parte del system prompt y del contexto se repite. ¿Activarías prompt caching?',hint:'La repetición es una oportunidad para evitar trabajo duplicado.',choices:{off:'Dejar OFF',on:'Activar caching'},lesson:'La caché elimina trabajo repetido. No arregla por sí sola un pico de tráfico, pero reduce consumo y coste.',wrong:{off:'El prompt y el contexto son repetitivos, así que dejar la caché desactivada implica pagar y procesar el mismo trabajo en cada petición.'}},
      rate:{phase:'DECISIÓN 4 / LIMITACIÓN DE USO',question:'El tráfico de pico ya supera la capacidad disponible. ¿Cómo proteges el sistema?',hint:'Un 429 no es una estrategia de recuperación.',choices:{reject:'Rechazar inmediatamente',queue:'Poner en cola',backoff:'Backoff exponencial + jitter',fallback:'Fallback a otro modelo / región'},lesson:'El backoff con jitter evita tormentas sincronizadas. El fallback puede mejorar disponibilidad, pero añade complejidad y coste.',wrong:{reject:'Rechazar inmediatamente protege capacidad, pero convierte la saturación directamente en peticiones perdidas y no recupera el tráfico de forma elegante.',queue:'Una cola suaviza picos, pero en este escenario el objetivo es reducir reintentos sincronizados y 429 con una intervención más ligera.',fallback:'El fallback añade otra ruta de ejecución y puede aumentar coste y complejidad. El incidente se resuelve mejor controlando los reintentos contra la capacidad existente.'}},
      verify:{phase:'VERIFICACIÓN',question:'¿Aceptarías esta configuración como producción?',hint:'No mires una métrica aislada. Comprueba el sistema completo.',choices:{accept:'Aceptar y cerrar incidente','continue':'Seguir optimizando'},lesson:'Producción está lista cuando las restricciones importantes caben a la vez, no cuando una sola métrica luce bien.',wrong:{continue:'La configuración ya cumple los objetivos del reto. Seguir optimizando añadiría cambios sin resolver ningún problema pendiente.'}}
    },
    bonus:{kicker:'BONUS / CAMPAÑA DE MARKETING',h3:'Ahora rompe tu propia solución.',copy:'Producción lleva 20 minutos estable. Marketing acaba de multiplicar el tráfico ×3. ¿Qué harías ahora?',resultTag:'RESULTADO',choices:{reduce:'Reducir contexto / tokens',limit:'Limitar tráfico y proteger capacidad',model:'Bajar modelo durante el pico',all:'Combinar varias medidas'},result:{reduce:'Buena primera palanca: reducir tokens por petición baja TPM y coste, pero por sí sola no elimina un pico de RPM de ×3.',limit:'Proteges la infraestructura y evitas que la saturación se convierta en una cascada de 429. La contrapartida es que parte del tráfico tendrá que esperar o degradarse.',model:'Un modelo menor puede aliviar coste, latencia y TPM, pero el cuello de botella de capacidad sigue existiendo si mantienes el mismo número de peticiones.',all:'Exactamente el enfoque de producción: no existe una bala de plata. Combinas reducción de trabajo, control de tráfico y capacidad según el cuello de botella.'}}
  },      footer:'LLM Lab Simulator'
};
