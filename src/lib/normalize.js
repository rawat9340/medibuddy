/**
 * Converts a raw label into the shape the UI renders.
 *
 * openfda fields are arrays, sometimes contain duplicates or differently-cased
 * repeats, and are often missing. All of that is resolved here, once, when the
 * data arrives — so components never repeat this work on render and don't need
 * useMemo to avoid it.
 */

const list = (v) =>
  (Array.isArray(v) ? v : v == null ? [] : [v])
    .map((s) => String(s).trim())
    .filter(Boolean);

// Keeps the first spelling seen: ['Advil', 'ADVIL'] -> ['Advil']
const unique = (arr) => {
  const seen = new Map();
  arr.forEach((s) => {
    const key = s.toLowerCase();
    if (!seen.has(key)) seen.set(key, s);
  });
  return [...seen.values()];
};
const values = (v) => unique(list(v));

// "Nonsteroidal Anti-inflammatory Drug [EPC]" -> "Nonsteroidal Anti-inflammatory Drug"
const stripClassTag = (s) => s.replace(/\s*\[[^\]]+\]$/, '');
const classes = (v) => unique(list(v).map(stripClassTag));

// Generic names arrive in caps ("IBUPROFEN"); they're conventionally lowercase.
const lower = (arr) => unique(arr.map((s) => s.toLowerCase()));

// Label sections worth showing, in reading order. Titles follow the
// consumer-facing "Drug Facts" wording where one exists.
const LABEL_SECTIONS = [
  ['boxed_warning', 'Boxed warning', { open: true, tone: 'danger' }],
  ['purpose', 'Purpose', { open: true }],
  ['indications_and_usage', 'Uses', { open: true }],
  ['active_ingredient', 'Active ingredients'],
  ['dosage_and_administration', 'Directions'],
  ['warnings', 'Warnings'],
  ['contraindications', 'Contraindications'],
  ['do_not_use', 'Do not use'],
  ['ask_doctor', 'Ask a doctor before use'],
  ['ask_doctor_or_pharmacist', 'Ask a doctor or pharmacist before use'],
  ['when_using', 'When using this product'],
  ['stop_use', 'Stop use and ask a doctor if'],
  ['pregnancy_or_breast_feeding', 'Pregnancy or breast-feeding'],
  ['keep_out_of_reach_of_children', 'Keep out of reach of children'],
  ['adverse_reactions', 'Side effects'],
  ['drug_interactions', 'Drug interactions'],
  ['overdosage', 'Overdose'],
  ['storage_and_handling', 'Storage'],
  ['inactive_ingredient', 'Inactive ingredients'],
  ['questions', 'Questions'],
];

function labelSections(raw) {
  return LABEL_SECTIONS.flatMap(([key, title, opts = {}]) => {
    const paragraphs = list(raw[key]);
    return paragraphs.length ? [{ key, title, paragraphs, open: !!opts.open, tone: opts.tone ?? null }] : [];
  });
}

export function toMedicine(raw) {
  const o = raw.openfda ?? {};
  return {
    id: raw.id,
    brandNames: values(o.brand_name),
    genericNames: lower(values(o.generic_name)),
    manufacturers: values(o.manufacturer_name),
    productTypes: values(o.product_type),
    routes: values(o.route),
    substances: lower(values(o.substance_name)),
    drugClasses: classes(o.pharm_class_epc),
    mechanisms: classes(o.pharm_class_moa),
    physiologicEffects: classes(o.pharm_class_pe),
    chemicalClasses: classes(o.pharm_class_cs),
    productNdcs: values(o.product_ndc),
    packageNdcs: values(o.package_ndc),
    applicationNumbers: values(o.application_number),
    rxcui: values(o.rxcui),
    unii: values(o.unii),
    splSetId: list(o.spl_set_id)[0] ?? raw.set_id ?? null,
    effectiveTime: raw.effective_time ?? null,
    label: labelSections(raw),
  };
}
