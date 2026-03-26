import { useState, useRef, useEffect } from "react";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { products, Product } from "@/data/products";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: "¡Hola! 👋 Soy Sora, Ejecutiva y Asistente Personal de Grupo PSI. Estoy aquí para apoyarte con lo que necesites: productos, precios, normatividad, manuales de seguridad o cualquier duda técnica. ¿En qué te ayudo?",
  },
];

function searchProducts(query: string): Product[] {
  const lower = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.category.toLowerCase().includes(lower) ||
      p.description.toLowerCase().includes(lower)
  );
}

function formatPrice(p: Product): string {
  const final = p.discount ? p.priceOriginalMxn * (1 - p.discount) : p.priceOriginalMxn;
  const discountText = p.discount ? ` (${(p.discount * 100).toFixed(0)}% desc.)` : "";
  return `$${final.toFixed(2)} MXN${discountText}`;
}

// ── Knowledge base: normas y especificaciones técnicas ──
const NORMS_KB: { keywords: string[]; answer: string }[] = [
  // ── EXTINTORES ──
  {
    keywords: ["nom-154", "nom 154", "recarga extintor", "norma extintor recarga"],
    answer:
      "**NOM-154-SCFI-2005** — Equipos contra incendio: extintores, servicio de mantenimiento y recarga.\n\n" +
      "• Establece las condiciones de seguridad y los requisitos para el servicio de mantenimiento y recarga de extintores portátiles y sobre ruedas.\n" +
      "• Obliga a que el prestador de servicio cuente con personal capacitado, herramientas calibradas y agente extintor certificado.\n" +
      "• El extintor debe portar etiqueta de servicio con fecha de recarga, próxima revisión, agente utilizado y datos del prestador.",
  },
  {
    keywords: ["nom-100", "nom 100", "norma extintor fabricacion", "extintor portátil norma"],
    answer:
      "**NOM-100-STPS-1994** — Extintores contra incendio a base de polvo químico seco con presión contenida.\n\n" +
      "• Define requisitos de fabricación, capacidad, agente extintor, presión de operación y prueba hidrostática.\n" +
      "• Los extintores deben cumplir clasificación UL (A, B, C o combinaciones) según el tipo de fuego.\n" +
      "• La prueba hidrostática se realiza a 1.5 veces la presión de servicio cada 5 años (6 años para CO₂).",
  },
  {
    keywords: ["nom-106", "nom 106", "extintor co2", "dióxido de carbono extintor"],
    answer:
      "**NOM-106-STPS-1994** — Extintores de CO₂.\n\n" +
      "• Aplica a extintores portátiles y sobre ruedas cargados con dióxido de carbono.\n" +
      "• Prueba hidrostática cada 5 años; recarga cuando pierde más del 10 % de su peso nominal.\n" +
      "• El cilindro debe cumplir con DOT o NOM-009-SESH equivalente.",
  },
  {
    keywords: ["clasificacion fuego", "tipo fuego", "clase a", "clase b", "clase c", "clase d", "clase k"],
    answer:
      "**Clasificación de fuegos (NFPA 10 / NOM-100)**:\n\n" +
      "• **Clase A** — Sólidos combustibles (madera, papel, tela).\n" +
      "• **Clase B** — Líquidos y gases inflamables (gasolina, solventes, gas LP).\n" +
      "• **Clase C** — Equipos eléctricos energizados.\n" +
      "• **Clase D** — Metales combustibles (magnesio, titanio, sodio).\n" +
      "• **Clase K** — Aceites y grasas de cocina.\n\n" +
      "El agente PQS ABC cubre las tres primeras clases; el CO₂ es ideal para B y C sin residuo.",
  },
  {
    keywords: ["prueba hidrostática", "hidrostatica extintor", "cada cuánto prueba"],
    answer:
      "**Prueba hidrostática de extintores**:\n\n" +
      "• PQS / agua / espuma: cada **5 años** a 1.5× presión de servicio.\n" +
      "• CO₂: cada **5 años** conforme DOT.\n" +
      "• Unidades móviles (>50 lb): misma periodicidad, requiere equipo especializado.\n" +
      "• Si el cilindro presenta corrosión, abolladuras o soldadura dañada se debe retirar del servicio.",
  },
  // ── SCBA (Equipos de Respiración Autónoma) ──
  {
    keywords: ["scba", "equipo respiración autónoma", "respiracion autonoma", "aire respirable", "nom-116", "nom 116"],
    answer:
      "**SCBA — Equipo de Respiración Autónoma** (NOM-116-STPS-2009 / NFPA 1981):\n\n" +
      "• Suministra aire respirable de un cilindro portátil a presiones de **2216 PSI (150 BAR)** a **4500 PSI (300 BAR)**.\n" +
      "• Autonomía típica: **30 min** (estándar) y **45–60 min** (alta capacidad).\n" +
      "• El aire debe cumplir **CGA Grado D**: O₂ 19.5–23.5 %, CO ≤ 10 ppm, CO₂ ≤ 1 000 ppm, sin olor ni partículas de aceite.\n" +
      "• Prueba hidrostática del cilindro: fibra de carbono cada **5 años** (vida útil 15 años), acero/aluminio cada **5 años**.\n" +
      "• Mantenimiento anual obligatorio: revisión de válvula, regulador, máscara (prueba de sello positivo y negativo) y arnés.",
  },
  {
    keywords: ["cilindro scba", "cilindro fibra", "cilindro aluminio", "presion scba", "4500 psi", "2216 psi"],
    answer:
      "**Cilindros SCBA**:\n\n" +
      "• **Aluminio (2216 PSI / 150 BAR)**: más pesados, vida útil indefinida con prueba hidrostática cada 5 años.\n" +
      "• **Fibra de carbono (4500 PSI / 300 BAR)**: ligeros, vida útil de **15 años** desde fecha de fabricación, prueba hidrostática cada 5 años.\n" +
      "• Capacidades comunes: 30, 45 y 60 minutos.\n" +
      "• El cilindro debe tener grabada la fecha de fabricación, presión de servicio y número DOT/TC.",
  },
  {
    keywords: ["nfpa 1981", "nfpa scba"],
    answer:
      "**NFPA 1981** — Estándar para equipos de respiración autónoma de circuito abierto para bomberos.\n\n" +
      "• Define pruebas de rendimiento: flujo mínimo, resistencia a calor, impacto y vibración.\n" +
      "• Exige alarma PASS integrada (alerta de no-movimiento).\n" +
      "• Máscara con visor que soporte 260 °C sin deformarse.\n" +
      "• Complementa con NFPA 1852 para selección, cuidado y mantenimiento.",
  },
  // ── DETECTORES MULTIGAS ──
  {
    keywords: ["detector multigas", "detector gas", "monitor gas", "detector 4 gases", "lel", "h2s", "co detector"],
    answer:
      "**Detectores Multigas** (NOM-113-STPS-2009 referencia / OSHA 29 CFR 1910.146):\n\n" +
      "• Típicamente detectan **4 gases**: LEL (explosividad), O₂, H₂S y CO.\n" +
      "• Deben calibrarse con gas patrón certificado según la frecuencia del fabricante (usualmente cada **180 días** o antes de cada uso en espacios confinados).\n" +
      "• **Bump test** diario recomendado: exponer brevemente al gas de prueba para verificar respuesta del sensor.\n" +
      "• Sensores electroquímicos tienen vida útil de **2–3 años**; catalíticos (LEL) de **3–5 años**.\n" +
      "• Marcas comunes: MSA Altair, Honeywell BW, RAE Systems, Dräger.\n" +
      "• Son obligatorios en espacios confinados, áreas clasificadas y operaciones con riesgo de atmósfera peligrosa.",
  },
  {
    keywords: ["calibracion detector", "calibración gas", "bump test", "gas patrón"],
    answer:
      "**Calibración y Bump Test de detectores**:\n\n" +
      "• **Bump test**: verificación rápida diaria exponiendo los sensores a concentración conocida. Confirma que la alarma responde.\n" +
      "• **Calibración completa**: ajuste con gas patrón certificado y trazable. Frecuencia recomendada: cada **90–180 días** o según fabricante.\n" +
      "• Gas patrón típico (4-gas mix): 50 % LEL CH₄, 25 ppm H₂S, 100 ppm CO, balance N₂.\n" +
      "• Registrar cada calibración: fecha, concentraciones, equipo usado y técnico responsable.",
  },
  // ── SISTEMA DE CASCADA ──
  {
    keywords: ["cascada", "sistema cascada", "cga g-7.1", "cga g7", "banco cilindros", "llenado cilindros"],
    answer:
      "**Sistema de Cascada / Banco de Cilindros** (CGA G-7.1 / CGA C-6):\n\n" +
      "• Sistema de almacenamiento de aire comprimido a alta presión (hasta **6000 PSI / 414 BAR**) para llenado de cilindros SCBA.\n" +
      "• Se compone de cilindros de alta capacidad interconectados, válvulas de transferencia, mangueras y panel de control.\n" +
      "• El aire debe cumplir **CGA Grado D**: O₂ 19.5–23.5 %, CO ≤ 10 ppm, CO₂ ≤ 1 000 ppm, punto de rocío ≤ –65 °F, sin aceite.\n" +
      "• Prueba hidrostática de cilindros del banco: cada **5 años** (acero/aluminio) o según marcado DOT.\n" +
      "• Mantenimiento incluye: verificación de fugas, estado de mangueras, calibración de manómetros y análisis de calidad de aire semestral.",
  },
  {
    keywords: ["compresor aire respirable", "compresor grado d", "calidad aire grado d"],
    answer:
      "**Compresor de Aire Respirable — Grado D** (CGA G-7.1):\n\n" +
      "• Debe producir aire que cumpla: O₂ 19.5–23.5 %, CO ≤ 10 ppm, CO₂ ≤ 1 000 ppm, punto de rocío ≤ –65 °F, sin aceite ni partículas.\n" +
      "• Etapas de filtración: separador de condensados, filtro coalescente, carbón activado, tamiz molecular y monitor de CO.\n" +
      "• Análisis de calidad de aire: mínimo **cada 3 meses** con laboratorio certificado.\n" +
      "• Mantenimiento preventivo: cambio de filtros según horas de operación (100–250 h según fabricante), revisión de válvulas de alivio y verificación de presión.",
  },
  // ── EPP (Equipo de Protección Personal) ──
  {
    keywords: ["nom-113", "nom 113", "calzado seguridad", "calzado protección", "bota seguridad norma"],
    answer:
      "**NOM-113-STPS-2009** — Calzado de protección.\n\n" +
      "• Clasifica el calzado según el riesgo: **Tipo I** (impacto en punta), **Tipo II** (impacto + compresión), **Tipo III** (dieléctrico), etc.\n" +
      "• Casquillo de acero o composite debe soportar impacto de **22.7 kg desde 1 m** y compresión de **1 134 kg**.\n" +
      "• Suela antiderrapante con coeficiente mínimo de fricción según el ambiente de trabajo.\n" +
      "• El calzado debe portar marcado permanente con tipo, clase, talla y nombre del fabricante.",
  },
  {
    keywords: ["nom-017", "nom 017", "epp seleccion", "equipo proteccion personal norma", "selección epp"],
    answer:
      "**NOM-017-STPS-2008** — EPP: Selección, uso y manejo en los centros de trabajo.\n\n" +
      "• El patrón debe realizar un **análisis de riesgos** para determinar el EPP requerido por puesto.\n" +
      "• El EPP debe cumplir con las normas mexicanas o internacionales aplicables a cada tipo.\n" +
      "• Incluye: protección de cabeza, ojos, oídos, vías respiratorias, manos, pies y cuerpo entero.\n" +
      "• Se debe capacitar al trabajador en uso, cuidado, mantenimiento, limitaciones y reposición del EPP.",
  },
  {
    keywords: ["nom-115", "nom 115", "casco seguridad", "protección cabeza"],
    answer:
      "**NOM-115-STPS-2009** — Cascos de protección.\n\n" +
      "• **Tipo I**: protección superior. **Tipo II**: superior y lateral.\n" +
      "• **Clase E** (eléctrica): soporta hasta 20 000 V. **Clase G** (general): hasta 2 200 V. **Clase C**: sin protección eléctrica.\n" +
      "• Debe soportar impacto de objeto de 3.6 kg a 1.5 m y penetración de punzón de 1 kg a 1 m.\n" +
      "• Vida útil: **5 años** desde fabricación (suspensión: reemplazar cada **12 meses**).",
  },
  {
    keywords: ["nom-116 respiratoria", "protección respiratoria", "respirador", "mascarilla norma"],
    answer:
      "**NOM-116-STPS-2009** — Equipos de protección respiratoria.\n\n" +
      "• Clasifica equipos en: purificadores de aire (mascarillas con filtro) y suministradores de aire (SCBA, línea de aire).\n" +
      "• Factor de protección asignado varía: media cara (10×), cara completa (50×), SCBA presión positiva (10 000×).\n" +
      "• Filtros NIOSH: serie N (no resistente a aceite), R (resistente), P (a prueba de aceite); eficiencias 95, 99, 100 %.\n" +
      "• Prueba de ajuste (fit test) obligatoria: cualitativa o cuantitativa según el tipo de respirador.",
  },
  {
    keywords: ["nom-004", "nom 004", "guante protección", "protección manos"],
    answer:
      "**NOM-004-STPS (ref)** / **EN 388** — Guantes de protección.\n\n" +
      "• Clasificación EN 388: resistencia a abrasión, corte, desgarro y perforación (niveles 1–4/5).\n" +
      "• Tipos: guantes de nitrilo (químicos), carnaza (calor/corte), aislantes (eléctricos NOM-029), anticorte (ANSI A1–A9).\n" +
      "• Para riesgo eléctrico existen clases 00 a 4 (hasta 36 000 V).\n" +
      "• Inspección visual antes de cada uso; prueba neumática para guantes dieléctricos.",
  },
  {
    keywords: ["overol ignifugo", "overol fr", "ropa ignífuga", "nfpa 2112", "ropa resistente fuego", "flash fire"],
    answer:
      "**Ropa Ignífuga / FR** (NFPA 2112 / ASTM F1506):\n\n" +
      "• NFPA 2112: ropa de protección contra flash fire. El tejido debe auto-extinguirse en ≤ 2 seg y no derretirse sobre la piel.\n" +
      "• ASTM F1506: protección contra arco eléctrico. Se clasifica por **ATPV** (cal/cm²): Cat 1 (4), Cat 2 (8), Cat 3 (25), Cat 4 (40).\n" +
      "• Materiales comunes: Nomex®, Indura®, algodón FR tratado.\n" +
      "• Nuestros overoles FR Mod. 9000 cumplen con estas normas y están disponibles desde talla CH hasta XXG.",
  },
  // ── NFPA GENERAL ──
  {
    keywords: ["nfpa 10", "norma extintor nfpa"],
    answer:
      "**NFPA 10** — Estándar para Extintores Portátiles Contra Incendios.\n\n" +
      "• Define la selección, instalación, inspección, mantenimiento y prueba de extintores.\n" +
      "• **Inspección visual**: mensual. **Mantenimiento**: anual. **Prueba hidrostática**: cada 5–12 años según tipo.\n" +
      "• Distancias máximas de recorrido: Clase A (22.9 m), Clase B (15.25 m), Clase C (según A o B presente).\n" +
      "• Altura de montaje: máx. 1.53 m (extintores >18 kg) o 1.07 m para el asa.",
  },
  {
    keywords: ["nfpa 1852", "mantenimiento scba"],
    answer:
      "**NFPA 1852** — Selección, Cuidado y Mantenimiento de SCBA de Circuito Abierto.\n\n" +
      "• Inspección antes y después de cada uso: válvulas, arnés, máscara, cilindro.\n" +
      "• Limpieza y desinfección de máscara después de cada uso.\n" +
      "• Mantenimiento preventivo anual completo por técnico certificado.\n" +
      "• Retiro de servicio: si falla prueba hidrostática, daño por calor, o excede vida útil del cilindro.",
  },
  {
    keywords: ["espacio confinado", "nom-033", "nom 033", "atmósfera peligrosa"],
    answer:
      "**NOM-033-STPS-2015** — Espacios confinados.\n\n" +
      "• Define espacio confinado: acceso restringido, no diseñado para ocupación continua, riesgo de atmósfera peligrosa.\n" +
      "• Obliga monitoreo continuo con **detector multigas** antes y durante el ingreso.\n" +
      "• Requiere: permiso de trabajo, vigía externo, plan de rescate, ventilación y SCBA disponible.\n" +
      "• Límites: O₂ 19.5–23.5 %, LEL < 10 %, H₂S < 10 ppm, CO < 25 ppm.",
  },
  // ── Norma general de incendios ──
  {
    keywords: ["nom-002", "nom 002", "prevención incendios", "condiciones seguridad incendio"],
    answer:
      "**NOM-002-STPS-2010** — Condiciones de seguridad, prevención y protección contra incendios.\n\n" +
      "• Clasifica el riesgo de incendio del centro de trabajo: ordinario, alto o extra.\n" +
      "• Define la cantidad, tipo y ubicación de extintores según la clase de fuego y superficie.\n" +
      "• Obliga a formar brigadas contra incendio y realizar simulacros al menos **una vez al año**.\n" +
      "• Incluye requerimientos de señalización, rutas de evacuación e hidrantes.",
  },
  // ── MANUALES DE SEGURIDAD ──
  {
    keywords: ["manual seguridad", "manuales seguridad", "para qué sirve un manual", "para que sirve un manual", "por qué manual", "porque manual", "importancia manual"],
    answer:
      "**Manuales de Seguridad Industrial — ¿Qué son y por qué son esenciales?**\n\n" +
      "Un manual de seguridad es el documento rector que establece **políticas, procedimientos y protocolos** para prevenir accidentes y proteger la vida de los trabajadores.\n\n" +
      "**¿Para qué sirven?**\n" +
      "• 📋 Definen procedimientos paso a paso para operaciones de riesgo.\n" +
      "• 🛡️ Establecen el EPP requerido por actividad y área.\n" +
      "• 🚨 Contienen planes de emergencia y evacuación.\n" +
      "• 📊 Reducen incidentes hasta un **60 %** cuando se implementan correctamente.\n" +
      "• ⚖️ Cumplen con el marco legal (STPS, IMSS, Protección Civil).\n\n" +
      "**¿Por qué son obligatorios?**\n" +
      "La **NOM-030-STPS-2009** obliga a todo centro de trabajo a contar con servicios preventivos de seguridad y salud, lo que incluye documentación actualizada de procedimientos.",
  },
  {
    keywords: ["manual extintor", "manual extintores", "procedimiento extintor"],
    answer:
      "**Manual de Seguridad — Extintores** 🧯\n\n" +
      "**Contenido esencial:**\n" +
      "• Inventario y ubicación de todos los extintores del centro de trabajo.\n" +
      "• Clasificación por tipo de fuego (A, B, C, D, K) y agente extintor.\n" +
      "• **Procedimiento de inspección mensual**: presión, sello, etiqueta, estado físico.\n" +
      "• **Calendario de mantenimiento anual** conforme NOM-154.\n" +
      "• **Programa de prueba hidrostática** (cada 5 años PQS, 5 años CO₂).\n" +
      "• Técnica de uso: **P.A.S.S.** (Pull, Aim, Squeeze, Sweep / Jalar, Apuntar, Apretar, Barrer).\n" +
      "• Registro de capacitación de brigada contra incendio.\n" +
      "• Formatos de bitácora de inspección y recarga.",
  },
  {
    keywords: ["manual scba", "manual respiración", "procedimiento scba"],
    answer:
      "**Manual de Seguridad — SCBA** 🫁\n\n" +
      "**Contenido esencial:**\n" +
      "• Inventario de equipos: marca, modelo, presión, capacidad y fecha de fabricación del cilindro.\n" +
      "• **Procedimiento de colocación**: arnés, regulador, máscara, verificación de sello (presión positiva/negativa).\n" +
      "• **Checklist pre-uso**: presión del cilindro (≥90 % capacidad), alarma de baja presión, estado de la máscara.\n" +
      "• Cálculo de autonomía según presión y consumo (aprox. 40 L/min en esfuerzo moderado).\n" +
      "• Programa de mantenimiento anual (NFPA 1852).\n" +
      "• Calendario de prueba hidrostática de cilindros.\n" +
      "• Plan de descontaminación y limpieza de máscara post-uso.\n" +
      "• Registro de capacitación y certificación de usuarios.",
  },
  {
    keywords: ["manual detector", "manual detectores", "procedimiento detector"],
    answer:
      "**Manual de Seguridad — Detectores Multigas** 🔬\n\n" +
      "**Contenido esencial:**\n" +
      "• Inventario: marca, modelo, gases detectados, fecha de sensores.\n" +
      "• **Procedimiento de bump test diario**: exposición a gas patrón, verificación de alarma.\n" +
      "• **Calendario de calibración** (cada 90–180 días con gas certificado).\n" +
      "• Valores de alarma: LEL (10 % alarma baja, 20 % alarma alta), H₂S (10/15 ppm), CO (35/200 ppm), O₂ (19.5/23.5 %).\n" +
      "• Procedimiento para espacios confinados (NOM-033): monitoreo previo, continuo y posterior.\n" +
      "• Vida útil de sensores y programa de reemplazo.\n" +
      "• Registro de calibraciones y bump tests.\n" +
      "• Protocolo de acción ante alarma (evacuación, ventilación, rescate).",
  },
  {
    keywords: ["manual cascada", "manual compresor", "procedimiento cascada", "procedimiento compresor"],
    answer:
      "**Manual de Seguridad — Sistema de Cascada y Compresores** 🏗️\n\n" +
      "**Contenido esencial:**\n" +
      "• Diagrama del sistema: cilindros, válvulas, manifold, panel de llenado y compresor.\n" +
      "• **Procedimiento de llenado de cilindros SCBA**: secuencia de válvulas, velocidad de llenado, verificación de presión final.\n" +
      "• **Programa de análisis de calidad de aire** (trimestral, Grado D CGA G-7.1).\n" +
      "• Calendario de cambio de filtros según horas de operación.\n" +
      "• Prueba hidrostática de cilindros del banco (cada 5 años).\n" +
      "• Registro de presiones, temperaturas y horas de operación del compresor.\n" +
      "• Procedimiento de purga y drenado de condensados.\n" +
      "• Plan de mantenimiento preventivo: válvulas de alivio, mangueras, manómetros.",
  },
  {
    keywords: ["manual epp", "manual equipo protección", "procedimiento epp"],
    answer:
      "**Manual de Seguridad — EPP (Equipo de Protección Personal)** 🦺\n\n" +
      "**Contenido esencial:**\n" +
      "• **Matriz de EPP por puesto**: resultado del análisis de riesgos (NOM-017).\n" +
      "• Especificaciones de cada EPP: norma aplicable, vida útil, criterios de reemplazo.\n" +
      "• **Procedimientos de inspección** antes de cada uso por tipo de equipo.\n" +
      "• Almacenamiento correcto: cascos (sin sol directo), guantes dieléctricos (en bolsa sellada), SCBA (vertical, limpio).\n" +
      "• Programa de capacitación: uso, cuidado, limitaciones y ajuste.\n" +
      "• Formato de entrega de EPP firmado por el trabajador.\n" +
      "• Bitácora de inspección y reposición.\n" +
      "• Procedimiento de desecho de EPP dañado o fuera de vida útil.",
  },
  {
    keywords: ["nom-030", "nom 030", "servicios preventivos"],
    answer:
      "**NOM-030-STPS-2009** — Servicios preventivos de seguridad y salud en el trabajo.\n\n" +
      "• Obliga a designar un responsable de servicios preventivos (interno o externo).\n" +
      "• Requiere diagnóstico de seguridad y salud del centro de trabajo.\n" +
      "• Programa de seguridad con acciones preventivas y correctivas documentadas.\n" +
      "• Los manuales de seguridad son parte fundamental del cumplimiento de esta norma.",
  },
  {
    keywords: ["nom-026", "nom 026", "señalización", "señalizacion", "colores seguridad"],
    answer:
      "**NOM-026-STPS-2008** — Colores y señales de seguridad.\n\n" +
      "• 🔴 **Rojo**: prohibición, equipo contra incendio.\n" +
      "• 🟡 **Amarillo**: precaución, riesgo.\n" +
      "• 🟢 **Verde**: condición segura, primeros auxilios, rutas de evacuación.\n" +
      "• 🔵 **Azul**: obligación (uso de EPP).\n" +
      "• Tuberías: color según contenido (rojo = contra incendio, amarillo = gases, verde = agua).\n" +
      "• Es parte esencial de cualquier manual de seguridad.",
  },
  // ── IDENTIDAD DE SORA ──
  {
    keywords: ["quién eres", "quien eres", "qué eres", "que eres", "eres robot", "eres ia", "eres inteligencia artificial", "eres bot", "eres humana"],
    answer:
      "Soy **Sora**, Ejecutiva y Asistente Personal de **Grupo PSI** 💼. Formo parte del equipo como cualquier otro compañero. " +
      "Mi trabajo es ayudarte con todo lo relacionado a nuestros productos, servicios de mantenimiento, normatividad mexicana e internacional, manuales de seguridad y lo que necesites. " +
      "¡Estoy aquí para que el equipo funcione mejor! 🤝",
  },
  {
    keywords: ["grupo psi", "qué es grupo psi", "que es grupo psi", "a qué se dedica", "a que se dedica"],
    answer:
      "**Grupo PSI** es una empresa especializada en **seguridad industrial y protección contra incendios**. Nos dedicamos a:\n\n" +
      "• 🧯 Venta y recarga de extintores (PQS, CO₂, portátiles y móviles).\n" +
      "• 🫁 Mantenimiento de SCBA y sistemas de aire respirable.\n" +
      "• 🔬 Calibración de detectores multigas.\n" +
      "• 🏗️ Servicio a compresores y sistemas de cascada.\n" +
      "• 🦺 Venta de EPP, uniformes industriales y calzado de seguridad.\n" +
      "• 📋 Asesoría en normatividad y manuales de seguridad.\n\n" +
      "Somos tu aliado en seguridad industrial. ¿En qué te puedo apoyar?",
  },
];

// ── Recomendación inteligente de EPP según tipo de trabajo/riesgo ──
const EPP_RECOMMENDATIONS: { keywords: string[]; risk: string; epp: string }[] = [
  {
    keywords: ["soldadura", "soldar", "soldador"],
    risk: "Soldadura",
    epp:
      "🦺 **EPP recomendado para Soldadura:**\n\n" +
      "• **Careta de soldador** con filtro según proceso (sombra 10–13 para arco eléctrico).\n" +
      "• **Guantes de carnaza** largos (hasta codo).\n" +
      "• **Peto y mangas de carnaza** para protección contra chispas.\n" +
      "• **Overol FR ignífugo** (NFPA 2112) o ropa 100 % algodón.\n" +
      "• **Botas de seguridad** con casquillo (NOM-113).\n" +
      "• **Respirador con filtros P100** para humos metálicos.\n" +
      "• **Tapones auditivos** NRR ≥ 25 dB.\n\n" +
      "⚠️ En espacios confinados agregar: detector multigas + SCBA disponible.",
  },
  {
    keywords: ["altura", "trabajos en altura", "andamio", "arnés", "arnes", "caída", "caida"],
    risk: "Trabajos en Altura",
    epp:
      "🦺 **EPP recomendado para Trabajos en Altura** (NOM-009-STPS):\n\n" +
      "• **Arnés de cuerpo completo** con anillo dorsal.\n" +
      "• **Línea de vida** con absorbedor de impacto (≤ 1.8 m).\n" +
      "• **Casco Tipo II Clase E** con barbiquejo (NOM-115).\n" +
      "• **Botas antiderrapantes** con casquillo (NOM-113).\n" +
      "• **Guantes antideslizantes**.\n" +
      "• **Lentes de seguridad** claros o ámbar.\n\n" +
      "⚠️ A partir de 1.80 m de altura, el arnés y línea de vida son OBLIGATORIOS.",
  },
  {
    keywords: ["espacio confinado", "confinado", "tanque", "cisterna", "registro", "alcantarilla"],
    risk: "Espacios Confinados",
    epp:
      "🦺 **EPP recomendado para Espacios Confinados** (NOM-033-STPS):\n\n" +
      "• **Detector multigas** (LEL, O₂, H₂S, CO) — monitoreo continuo.\n" +
      "• **SCBA** o línea de aire con escape de 5 min.\n" +
      "• **Arnés de rescate** con anillo dorsal y esternal.\n" +
      "• **Trípode de rescate** con malacate.\n" +
      "• **Casco con lámpara** intrínsecamente segura.\n" +
      "• **Overol antiestático**.\n" +
      "• **Botas con casquillo** antichispa.\n\n" +
      "⚠️ Obligatorio: permiso de trabajo, vigía externo y plan de rescate.",
  },
  {
    keywords: ["químico", "quimico", "sustancia", "ácido", "acido", "solvente", "corrosivo"],
    risk: "Manejo de Químicos",
    epp:
      "🦺 **EPP recomendado para Manejo de Químicos:**\n\n" +
      "• **Gogles** antisalpicadura (sellados).\n" +
      "• **Respirador media cara** con cartuchos según sustancia (orgánico, ácido, multigas).\n" +
      "• **Guantes de nitrilo o neopreno** resistentes al químico específico.\n" +
      "• **Mandil o traje Tyvek** según nivel de exposición.\n" +
      "• **Botas de PVC** o neopreno.\n" +
      "• **Regadera de emergencia** y lavaojos accesibles.\n\n" +
      "⚠️ Consultar la Hoja de Datos de Seguridad (HDS) del producto para EPP específico.",
  },
  {
    keywords: ["eléctrico", "electrico", "electricidad", "alta tensión", "tension", "tablero", "arco"],
    risk: "Riesgo Eléctrico",
    epp:
      "🦺 **EPP recomendado para Riesgo Eléctrico** (NOM-029-STPS):\n\n" +
      "• **Casco dieléctrico Clase E** (hasta 20,000 V).\n" +
      "• **Guantes dieléctricos** clase según voltaje (00 a 4) + sobreguante de carnaza.\n" +
      "• **Lentes con protección UV** y anti-arco.\n" +
      "• **Ropa FR** con rating ATPV según categoría de arco (NFPA 70E).\n" +
      "• **Botas dieléctricas** (NOM-113).\n" +
      "• **Tapete aislante** y pértiga.\n" +
      "• **Detector de voltaje sin contacto**.\n\n" +
      "⚠️ Realizar análisis de riesgo de arco eléctrico antes de intervenir equipos energizados.",
  },
  {
    keywords: ["incendio", "bombero", "brigada", "fuego", "emergencia contra incendio"],
    risk: "Combate de Incendios / Brigada",
    epp:
      "🦺 **EPP recomendado para Brigada Contra Incendio:**\n\n" +
      "• **SCBA** con cilindro de 30–45 min (NFPA 1981).\n" +
      "• **Traje de bombero** (bunker gear) o ropa FR Cat 4.\n" +
      "• **Casco de bombero** con visor (NOM-115 / NFPA 1971).\n" +
      "• **Guantes de bombero** resistentes a calor.\n" +
      "• **Botas de bombero** con puntera y plantilla.\n" +
      "• **Radio comunicación**.\n" +
      "• Extintores PQS y/o CO₂ según clase de fuego.\n\n" +
      "⚠️ Todo brigadista debe estar capacitado y realizar simulacros anuales (NOM-002).",
  },
  {
    keywords: ["ruido", "audición", "oído", "oido", "decibel", "db", "tapones"],
    risk: "Exposición a Ruido",
    epp:
      "🦺 **EPP recomendado para Protección Auditiva** (NOM-011-STPS):\n\n" +
      "• **85–95 dB**: tapones auditivos NRR ≥ 25 dB.\n" +
      "• **95–105 dB**: orejeras NRR ≥ 30 dB.\n" +
      "• **> 105 dB**: doble protección (tapones + orejeras).\n\n" +
      "📋 La exposición máxima permitida es **90 dB por 8 horas** (cada +5 dB reduce el tiempo a la mitad).\n" +
      "Se requiere estudio de ruido y programa de conservación auditiva.",
  },
  {
    keywords: ["corte", "sierra", "esmeril", "amoladora", "rebaba", "metal"],
    risk: "Corte y Esmerilado",
    epp:
      "🦺 **EPP recomendado para Corte/Esmerilado:**\n\n" +
      "• **Careta facial completa** o gogles de seguridad.\n" +
      "• **Guantes anticorte** nivel ANSI A4–A6.\n" +
      "• **Mandil de carnaza**.\n" +
      "• **Overol FR** o ropa de algodón (sin poliéster).\n" +
      "• **Botas con casquillo** (NOM-113).\n" +
      "• **Tapones auditivos** NRR ≥ 25 dB.\n" +
      "• **Respirador** con filtro P100 para partículas metálicas.\n\n" +
      "⚠️ Verificar guardas de la herramienta y bloqueo de energía (LOTO) antes de cambiar disco.",
  },
  {
    keywords: ["pintura", "pintar", "cabina pintura", "solvente pintura", "aerosol"],
    risk: "Aplicación de Pintura",
    epp:
      "🦺 **EPP recomendado para Pintura Industrial:**\n\n" +
      "• **Respirador cara completa** con cartuchos para vapores orgánicos (OV) + P100.\n" +
      "• **Traje Tyvek** desechable o overol de algodón.\n" +
      "• **Guantes de nitrilo** resistentes a solventes.\n" +
      "• **Gogles** antisalpicadura (si no usa careta completa).\n" +
      "• **Botas de seguridad** con casquillo.\n\n" +
      "⚠️ En cabinas cerradas puede requerirse línea de aire o SCBA. Ventilación obligatoria.",
  },
  {
    keywords: ["construcción", "construccion", "obra", "albañil", "albañilería"],
    risk: "Construcción General",
    epp:
      "🦺 **EPP básico para Construcción:**\n\n" +
      "• **Casco Tipo I Clase E** (NOM-115).\n" +
      "• **Lentes de seguridad** claros.\n" +
      "• **Chaleco de alta visibilidad**.\n" +
      "• **Guantes de carnaza** o multifuncionales.\n" +
      "• **Botas con casquillo** antiderrapantes (NOM-113).\n" +
      "• **Tapones auditivos** si hay maquinaria.\n" +
      "• **Arnés** si trabaja a más de 1.80 m (NOM-009).\n\n" +
      "📋 Complementar con análisis de riesgos por actividad específica (NOM-017).",
  },
];

function getSmartResponse(input: string): string {
  const lower = input.toLowerCase();

  // ── Check EPP recommendations first ──
  if (lower.includes("epp") || lower.includes("protección") || lower.includes("proteccion") || lower.includes("equipo") || lower.includes("qué necesito") || lower.includes("que necesito") || lower.includes("recomienda")) {
    for (const rec of EPP_RECOMMENDATIONS) {
      if (rec.keywords.some((kw) => lower.includes(kw))) {
        return rec.epp;
      }
    }
    // Generic EPP recommendation question
    if (lower.includes("recomienda") || lower.includes("qué epp") || lower.includes("que epp") || lower.includes("qué necesito") || lower.includes("que necesito")) {
      return "Para recomendarte el EPP adecuado, dime **qué tipo de trabajo** vas a realizar. Por ejemplo:\n\n" +
        "• ⚡ Trabajo eléctrico\n" +
        "• 🔥 Soldadura\n" +
        "• 🏗️ Altura\n" +
        "• 🕳️ Espacio confinado\n" +
        "• 🧪 Manejo de químicos\n" +
        "• 🔨 Corte/esmerilado\n" +
        "• 🎨 Pintura industrial\n" +
        "• 🏗️ Construcción general\n" +
        "• 🔊 Exposición a ruido\n" +
        "• 🧯 Brigada contra incendio\n\n" +
        "Describe tu actividad y te doy la recomendación completa con normas aplicables.";
    }
  }

  // ── Check EPP by work description (without EPP keyword) ──
  for (const rec of EPP_RECOMMENDATIONS) {
    if (rec.keywords.some((kw) => lower.includes(kw)) && (lower.includes("necesito") || lower.includes("requiero") || lower.includes("usar") || lower.includes("llevar") || lower.includes("trabajo"))) {
      return rec.epp;
    }
  }

  // ── Check norms/technical knowledge ──
  for (const entry of NORMS_KB) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return entry.answer;
    }
  }

  // General norms question
  if (
    (lower.includes("norma") || lower.includes("nfpa") || lower.includes("nom") || lower.includes("regulación") || lower.includes("regulacion") || lower.includes("certificación") || lower.includes("certificacion")) &&
    !lower.includes("precio")
  ) {
    // Try to identify topic
    if (lower.includes("extintor")) {
      return "Para extintores aplicamos las siguientes normas:\n\n• **NOM-100-STPS-1994** — Fabricación de extintores PQS.\n• **NOM-106-STPS-1994** — Extintores de CO₂.\n• **NOM-154-SCFI-2005** — Mantenimiento y recarga.\n• **NOM-002-STPS-2010** — Prevención de incendios.\n• **NFPA 10** — Estándar internacional para extintores portátiles.\n\n¿Sobre cuál quieres más detalle?";
    }
    if (lower.includes("scba") || lower.includes("respiración") || lower.includes("respiracion")) {
      return "Para SCBA y protección respiratoria:\n\n• **NOM-116-STPS-2009** — Equipos de protección respiratoria.\n• **NFPA 1981** — Estándar para SCBA.\n• **NFPA 1852** — Cuidado y mantenimiento de SCBA.\n• **CGA G-7.1** — Calidad de aire Grado D.\n\n¿Quieres detalle de alguna?";
    }
    if (lower.includes("detector") || lower.includes("gas") || lower.includes("multigas")) {
      return "Para detectores de gas:\n\n• Calibración conforme a fabricante (**90–180 días**).\n• **Bump test** diario recomendado.\n• **NOM-033-STPS-2015** — Espacios confinados (uso obligatorio).\n\nPregúntame sobre calibración, bump test o sensores.";
    }
    if (lower.includes("epp") || lower.includes("protección personal") || lower.includes("proteccion personal")) {
      return "Normas de EPP que manejamos:\n\n• **NOM-017-STPS-2008** — Selección y uso de EPP.\n• **NOM-113-STPS-2009** — Calzado de protección.\n• **NOM-115-STPS-2009** — Cascos.\n• **NOM-116-STPS-2009** — Protección respiratoria.\n• **NFPA 2112 / ASTM F1506** — Ropa FR.\n\n¿Cuál te interesa?";
    }
    if (lower.includes("cascada") || lower.includes("compresor")) {
      return "Para sistemas de cascada y compresores:\n\n• **CGA G-7.1** — Calidad de aire respirable Grado D.\n• **CGA C-6** — Estándares de cilindros.\n• Análisis de aire cada **3 meses**.\n• Prueba hidrostática de cilindros cada **5 años**.\n\n¿Necesitas más detalle?";
    }
    return "Manejamos normatividad para:\n\n• 🧯 **Extintores**: NOM-100, NOM-106, NOM-154, NOM-002, NFPA 10\n• 🫁 **SCBA**: NOM-116, NFPA 1981, NFPA 1852\n• 🔬 **Detectores multigas**: calibración, bump test, NOM-033\n• 🏗️ **Sistemas de cascada**: CGA G-7.1, CGA C-6\n• 🦺 **EPP**: NOM-017, NOM-113, NOM-115, NOM-116, NFPA 2112\n\n¿Sobre qué norma o tema quieres información?";
  }

  // Price queries
  if (lower.includes("precio") || lower.includes("cuánto") || lower.includes("cuanto") || lower.includes("costo")) {
    const matches = searchProducts(input.replace(/precio|cuánto|cuanto|cuesta|costo|de|el|la|los|las|del/gi, "").trim());
    if (matches.length > 0 && matches.length <= 5) {
      return matches
        .map((p) => `• **${p.name}**: ${formatPrice(p)}${p.inStock ? "" : " ⚠️ Agotado"}`)
        .join("\n");
    }
    if (matches.length > 5) {
      return `Encontré ${matches.length} productos. ¿Podrías ser más específico? Por ejemplo: "precio extintor 6 kg" o "precio overol supervisor".`;
    }
  }

  // Stock queries
  if (lower.includes("disponible") || lower.includes("stock") || lower.includes("hay") || lower.includes("tienen")) {
    const matches = searchProducts(input.replace(/disponible|stock|hay|tienen|de|el|la|los|las/gi, "").trim());
    if (matches.length > 0) {
      return matches
        .slice(0, 6)
        .map((p) => `• ${p.name}: ${p.inStock ? "✅ Disponible" : "❌ Agotado"}${p.purchaseStatus === "Pre-Order" ? " (Pre-orden)" : ""}`)
        .join("\n");
    }
  }

  // Size queries
  if (lower.includes("talla") || lower.includes("medida") || lower.includes("tamaño")) {
    const matches = searchProducts(input.replace(/talla|medida|tamaño|de|el|la|los|las|del|que/gi, "").trim());
    const withSizes = matches.filter((p) => p.sizes);
    if (withSizes.length > 0) {
      return withSizes
        .slice(0, 4)
        .map((p) => {
          const sizes = Object.values(p.sizes!).flat().join(", ");
          return `• **${p.name}**: ${sizes}`;
        })
        .join("\n");
    }
    return "Los productos con tallas incluyen overoles, playeras y calzado. ¿Cuál te interesa?";
  }

  // Category browsing
  if (lower.includes("categoría") || lower.includes("categoria") || lower.includes("qué venden") || lower.includes("que venden") || lower.includes("catálogo")) {
    const cats = [...new Set(products.map((p) => p.category))];
    const summary = cats.map((c) => {
      const count = products.filter((p) => p.category === c).length;
      return `• **${c}** (${count} productos)`;
    });
    return `Tenemos estas categorías:\n${summary.join("\n")}\n\n¿Sobre cuál quieres saber más?`;
  }

  // Specific product categories
  const categoryMap: Record<string, string> = {
    extintor: "Extintores",
    overol: "Overoles",
    playera: "Uniformes",
    polo: "Uniformes",
    sudadera: "Uniformes",
    bota: "Protección pies",
    calzado: "Protección pies",
    casco: "EPP",
    guante: "EPP",
    lente: "EPP",
    chaleco: "EPP",
  };

  for (const [key, cat] of Object.entries(categoryMap)) {
    if (lower.includes(key)) {
      const catProducts = products.filter((p) => p.category === cat);
      if (catProducts.length <= 8) {
        return catProducts
          .map((p) => `• **${p.name}** — ${p.priceOriginalMxn > 0 ? formatPrice(p) : "Próximamente"}${p.inStock ? "" : " (Agotado)"}`)
          .join("\n");
      }
      return `Tenemos ${catProducts.length} productos en ${cat}. Los más populares:\n${catProducts.slice(0, 5).map((p) => `• ${p.name} — ${formatPrice(p)}`).join("\n")}\n\n¿Te interesa alguno en particular?`;
    }
  }

  // Cheapest/most expensive
  if (lower.includes("barato") || lower.includes("económico") || lower.includes("economico")) {
    const available = products.filter((p) => p.inStock && p.priceOriginalMxn > 0).sort((a, b) => a.priceOriginalMxn - b.priceOriginalMxn);
    return `Los más económicos:\n${available.slice(0, 5).map((p) => `• ${p.name} — ${formatPrice(p)}`).join("\n")}`;
  }

  // Maintenance
  if (lower.includes("mantenimiento") || lower.includes("recarga") || lower.includes("servicio")) {
    return "Ofrecemos mantenimiento y recarga de extintores, SCBA, compresores y detectores multigas conforme a NOM-154, NFPA 1852 y CGA G-7.1. Puedes agendar desde la sección de Mantenimiento en el menú.";
  }

  // Delivery
  if (lower.includes("entrega") || lower.includes("envío") || lower.includes("envio")) {
    return "Realizamos entregas en la zona metropolitana. En la ficha del producto selecciona tipo de servicio 'Entrega', elige fecha y ubica tu dirección en el mapa.";
  }

  // Greetings
  if (lower.match(/^(hola|hey|buenas|buenos|qué tal|que tal)/)) {
    return "¡Hola! 👋 Soy Sora, Ejecutiva de Grupo PSI. ¿En qué te puedo apoyar? Manejo productos, precios, disponibilidad, **normas**, **manuales de seguridad** y asesoría técnica.";
  }

  // Generic product search
  const matches = searchProducts(input);
  if (matches.length > 0 && matches.length <= 6) {
    return `Encontré esto:\n${matches.map((p) => `• **${p.name}** — ${p.priceOriginalMxn > 0 ? formatPrice(p) : "Próximamente"}`).join("\n")}\n\n¿Te interesa alguno? Puedes verlo en detalle desde el catálogo.`;
  }

  return "Soy Sora, Ejecutiva de Grupo PSI. Puedo ayudarte con:\n• 💰 Precios (ej: \"precio extintor 6 kg\")\n• 📦 Disponibilidad (ej: \"hay overoles?\")\n• 📏 Tallas (ej: \"tallas de playera polo\")\n• 📋 Categorías (ej: \"qué extintores tienen?\")\n• 📜 **Normas** (ej: \"NOM-154\", \"NFPA 10\", \"norma SCBA\")\n• 📖 **Manuales** (ej: \"manual de extintores\", \"manual EPP\")\n\n¿Qué necesitas?";
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = getSmartResponse(userMsg.content);
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "assistant", content: response },
      ]);
      setIsTyping(false);
    }, 400 + Math.random() * 400);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-[72px] w-[72px] rounded-full shadow-2xl transition-all duration-500 overflow-hidden",
          "animate-glow-pulse hover:scale-110",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
      >
        <video src="/videos/sora.mp4" autoPlay loop muted playsInline className="h-full w-full object-cover scale-150" />
      </button>

      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex w-[370px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl",
          "max-h-[540px] transition-all duration-400",
          open ? "animate-scale-in opacity-100" : "scale-90 opacity-0 pointer-events-none"
        )}
      >
        <div className="relative flex items-center gap-3 overflow-hidden px-4 py-3">
          <video src="/videos/sora-2.mp4" autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover brightness-50" />
          <div className="relative z-10 flex items-center gap-3 w-full">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/30">
              <video src="/videos/sora.mp4" autoPlay loop muted playsInline className="h-full w-full object-cover scale-150" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Sora · Ejecutiva Grupo PSI</div>
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-bounce-soft" />
                En línea
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: 360 }}>
          {messages.map((msg, i) => (
            <div
              key={msg.id}
              className={cn("flex animate-slide-up", msg.role === "user" ? "justify-end" : "justify-start")}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed transition-all duration-300 whitespace-pre-wrap",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                )}
              >
                {msg.content.split(/(\*\*.*?\*\*)/).map((part, idx) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={idx}>{part.slice(2, -2)}</strong>
                  ) : (
                    <span key={idx}>{part}</span>
                  )
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "300ms" }} />
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-3">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre productos, precios..."
              className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none ring-ring transition-all duration-200 focus:ring-2 focus:border-primary"
            />
            <Button type="submit" size="icon" className="shrink-0 rounded-xl transition-transform hover:scale-105 active:scale-95">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
