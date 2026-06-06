/**
 * Conocimiento del agente: catálogo de productos/servicios y modelo de
 * precios de Electronic Payments. Esto es lo que la IA "sabe" para poder
 * recomendar la mejor solución a cada lead.
 *
 * Fuente: Propuesta de Cuenta de Comercio (PDF) + tarjeta de precios (2 opciones).
 */

export const EMPRESA = {
  nombre: "Electronic Payments",
  vendedor: "Giancarlo Medina",
  email: "giancarlo.medina@elecpayments.com",
  telefono: "908-346-0883",
  anos: "más de 20 años",
};

export const PRODUCTOS = [
  {
    nombre: "Exatouch® — Punto de Venta Completo",
    categoria: "Sistema POS completo",
    para: "Restaurante, Retail, Servicios",
    desc: "POS desarrollado en casa. Administra inventario, clientes, vendedores, reportes y horarios desde una sola plataforma. Incluye bundle de hardware: terminal todo-en-uno, impresora térmica Epson, PinPad PAX, cajón de dinero, pantalla al cliente, lector de código de barras Zebra, router y cables.",
  },
  {
    nombre: "Familia de terminales Clover®",
    categoria: "Terminales de pago",
    para: "Todos",
    desc: "Station Duo (alto volumen, pantalla dual), Station Solo (todo-en-uno), Mini (mostrador, EMV/contactless), Flex (movilidad total), Compact (portátil elegante), Go (convierte el smartphone en terminal).",
  },
  {
    nombre: "DeliverMe®",
    categoria: "Pedidos en línea",
    para: "Restaurante",
    desc: "Plataforma intuitiva para pedidos pickup o delivery en línea. Abre nuevas fuentes de ingreso y llega a más clientes.",
  },
  {
    nombre: "TableTurn®",
    categoria: "Pago en mesa / propina",
    para: "Restaurante",
    desc: "Pagos contactless y EMV con ajuste de propina, curbside, delivery y pago en mesa para restaurantes que usan Exatouch o MICROS®. Soporta dual pricing.",
  },
  {
    nombre: "eGiftSolutions®",
    categoria: "Tarjetas de regalo y lealtad",
    para: "Todos",
    desc: "Programa interno de tarjetas de regalo y lealtad: diseño, marketing, fulfillment y reportes en línea. Procesamiento de tarjetas regalo gratis con tu cuenta.",
  },
  {
    nombre: "ProCharge®",
    categoria: "Facturación recurrente",
    para: "Servicios, oficinas médicas y profesionales",
    desc: "Ecosistema de pagos: terminal virtual, facturación recurrente, e-invoicing, integración 'Pay Now' en tu sitio, dual pricing, plugin contable, app móvil y reportes en tiempo real.",
  },
  {
    nombre: "Electronic Payments Capital (EPI Capital)",
    categoria: "Financiamiento",
    para: "Todos",
    desc: "Financiamiento basado en ingresos en alianza con YouLend. Desde $3,000 hasta $300,000, decisión en 24 horas, fondos en 2 días hábiles. Repagas con un % de tus ventas, sin colateral ni costos iniciales.",
  },
];

export const BENEFICIOS = [
  "Enfoque 100% interno: desarrollamos y soportamos nuestra propia tecnología (cambios en días, no semanas).",
  "Soporte experto 24/7 desde EE.UU., los 7 días de la semana.",
  "Precios justos, claros y sin tarifas ocultas (Customer Bill of Rights).",
  "Soluciones a la medida de cada comerciante.",
  "Fondeo al día siguiente con horarios de corte extendidos.",
  "Acceso en tiempo real a lotes y depósitos vía Merchant Support Center.",
];

/**
 * Las DOS opciones de precio. El agente recomienda una según el perfil del lead.
 */
export const OPCIONES_PRECIO = {
  opcion1: {
    nombre: "Opción 1 — Flat-Rate Dual Pricing",
    costoInicial: "$0 — todo incluido",
    mensualidad: "Ninguna",
    tarifa: "4%–8% (la paga el cliente que paga con tarjeta)",
    equipo: "Gratis + soporte y mantenimiento completo",
    seguro: "Chargebacks 100% cubiertos",
    marketing: "Diseño, impresión de menús y ad support gratis",
    incluye: [
      "Sistema POS y equipo GRATIS",
      "Instalación y setup gratis",
      "Soporte continuo de hardware gratis",
      "Mantenimiento y reemplazos gratis",
      "Cobertura total de seguro para chargebacks",
      "Diseño e impresión de menús gratis",
      "Soporte de marketing y publicidad gratis",
    ],
    pros: ["Sin pagos iniciales ni mensuales", "Todo incluido (hardware, seguro, soporte, marketing)", "Programa fácil y predecible"],
    idealPara: "Negocios que quieren cero costo inicial, cero riesgo y cero mensualidad, pasando el fee al cliente.",
  },
  opcion2: {
    nombre: "Opción 2 — Interchange Plus Pricing",
    costoInicial: "Depende del equipo (compra o lease)",
    mensualidad: "Según volumen de procesamiento",
    tarifa: "1.6%–2.8% promedio según tipo de tarjeta y uso (la paga el comercio)",
    equipo: "Compra o lease aparte",
    seguro: "Responsabilidad estándar",
    marketing: "No incluido",
    incluye: ["Compra de equipo o trato a la medida", "Soporte y servicio estándar"],
    pros: ["Tarifa efectiva de procesamiento más baja", "Más ahorro para negocios de alto volumen", "Opciones de equipo flexibles"],
    idealPara: "Negocios de alto volumen que buscan la tarifa de procesamiento más baja posible y prefieren asumir el costo del equipo.",
  },
};

/** Arma el bloque de contexto que se le manda a la IA. */
export function contextoParaIA() {
  const prods = PRODUCTOS.map((p) => `- ${p.nombre} [${p.categoria}] (para: ${p.para}): ${p.desc}`).join("\n");
  const o1 = OPCIONES_PRECIO.opcion1;
  const o2 = OPCIONES_PRECIO.opcion2;
  return `EMPRESA: ${EMPRESA.nombre} — ${EMPRESA.anos} ayudando a negocios con POS y procesamiento de pagos.
Vendedor: ${EMPRESA.vendedor} (${EMPRESA.email}, ${EMPRESA.telefono}). No menciones ningún cargo o puesto del vendedor.

CATÁLOGO DE PRODUCTOS Y SERVICIOS:
${prods}

BENEFICIOS CLAVE:
${BENEFICIOS.map((b) => "- " + b).join("\n")}

MODELO DE PRECIOS (dos opciones):

${o1.nombre}
  Costo inicial: ${o1.costoInicial} | Mensualidad: ${o1.mensualidad} | Tarifa de procesamiento: ${o1.tarifa}
  Equipo: ${o1.equipo} | Seguro: ${o1.seguro} | Marketing: ${o1.marketing}
  Ideal para: ${o1.idealPara}

${o2.nombre}
  Costo inicial: ${o2.costoInicial} | Mensualidad: ${o2.mensualidad} | Tarifa de procesamiento: ${o2.tarifa}
  Equipo: ${o2.equipo} | Seguro: ${o2.seguro} | Marketing: ${o2.marketing}
  Ideal para: ${o2.idealPara}`;
}
