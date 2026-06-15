const primitiveTypes = new Set([
  'bool',
  'byte',
  'char',
  'int8',
  'uint8',
  'int16',
  'uint16',
  'int32',
  'uint32',
  'int64',
  'uint64',
  'float32',
  'float64',
  'string',
  'time',
  'duration',
]);

export type RosTypeDef = {
  type: string;
  fieldnames?: string[];
  fieldtypes?: string[];
  fieldarraylen?: number[];
};

function primitiveTemplate(type: string): unknown {
  if (type === 'string') {
    return '';
  }
  if (type === 'bool') {
    return false;
  }
  if (type === 'time' || type === 'duration') {
    return {secs: 0, nsecs: 0};
  }
  return 0;
}

export function buildMessageTemplate(typedefs: RosTypeDef[], rootType: string): unknown {
  const byType = new Map(typedefs.map(def => [def.type, def]));

  const build = (type: string, depth: number): unknown => {
    if (primitiveTypes.has(type)) {
      return primitiveTemplate(type);
    }
    const def = byType.get(type);
    if (!def || depth > 12) {
      return {};
    }

    const message: Record<string, unknown> = {};
    (def.fieldnames || []).forEach((name, index) => {
      const fieldType = def.fieldtypes?.[index] || 'string';
      const arrayLen = def.fieldarraylen?.[index] ?? -1;
      if (arrayLen < 0) {
        message[name] = build(fieldType, depth + 1);
      } else if (arrayLen === 0) {
        message[name] = [];
      } else {
        message[name] = Array.from({length: arrayLen}, () => build(fieldType, depth + 1));
      }
    });
    return message;
  };

  return build(rootType, 0);
}

export function extractNumericLeaves(value: unknown, prefix = ''): Record<string, number> {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return {[prefix || 'value']: value};
  }
  if (!value || typeof value !== 'object') {
    return {};
  }
  if (Array.isArray(value)) {
    return value.reduce<Record<string, number>>((acc, item, index) => {
      Object.assign(acc, extractNumericLeaves(item, prefix ? `${prefix}[${index}]` : `[${index}]`));
      return acc;
    }, {});
  }
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>(
    (acc, [key, child]) => {
      const childPrefix = prefix ? `${prefix}.${key}` : key;
      Object.assign(acc, extractNumericLeaves(child, childPrefix));
      return acc;
    },
    {},
  );
}
