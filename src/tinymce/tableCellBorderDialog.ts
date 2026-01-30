type BorderSide = 'top' | 'right' | 'bottom' | 'left';

type BorderFieldKind = 'Width' | 'Style' | 'Color';

type BorderItem = {
  text?: string;
  title?: string;
  value?: string;
  menu?: BorderItem[];
};

type BorderListItem = {
  text: string;
  value?: string;
  items?: BorderListItem[];
};

const BORDER_SIDES: Array<{ key: BorderSide; label: string }> = [
  { key: 'top', label: '상단' },
  { key: 'right', label: '우측' },
  { key: 'bottom', label: '하단' },
  { key: 'left', label: '좌측' },
];

const BORDER_FIELD_KINDS: BorderFieldKind[] = ['Width', 'Style', 'Color'];

const DEFAULT_BORDER_STYLES: BorderItem[] = [
  { title: 'Solid', value: 'solid' },
  { title: 'Dotted', value: 'dotted' },
  { title: 'Dashed', value: 'dashed' },
  { title: 'Double', value: 'double' },
  { title: 'Groove', value: 'groove' },
  { title: 'Ridge', value: 'ridge' },
  { title: 'Inset', value: 'inset' },
  { title: 'Outset', value: 'outset' },
  { title: 'None', value: 'none' },
  { title: 'Hidden', value: 'hidden' },
];

const getFormatName = (style: string): string =>
  `tablecell${style.toLowerCase().replace('-', '')}`;

export const registerTableCellBorderFormats = (editor: any): void => {
  BORDER_SIDES.forEach(({ key }) => {
    BORDER_FIELD_KINDS.forEach((kind) => {
      const styleName = `border-${key}-${kind.toLowerCase()}`;
      const formatName = getFormatName(styleName);
      if (!editor.formatter.has(formatName)) {
        editor.formatter.register(formatName, {
          selector: 'td,th',
          styles: { [styleName]: '%value' },
        });
      }
    });
  });
};

const addPxSuffix = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
};

const rgbToHex = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (!trimmed.toLowerCase().startsWith('rgb')) return trimmed;
  const match = trimmed.match(/rgba?\(([^)]+)\)/i);
  if (!match) return trimmed;
  const parts = match[1].split(',').map((part) => part.trim());
  if (parts.length < 3) return trimmed;
  const toHex = (channel: string): string => {
    const numeric = Number(channel);
    if (Number.isNaN(numeric)) return '00';
    return Math.round(numeric).toString(16).padStart(2, '0');
  };
  return `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`.toUpperCase();
};

const isListGroup = (item: BorderItem): item is BorderItem & { menu: BorderItem[] } =>
  Array.isArray(item.menu);

const buildListItems = (items: BorderItem[]): BorderListItem[] =>
  items.map((item) => {
    const text = item.text ?? item.title ?? '';
    if (isListGroup(item)) {
      return { text, items: buildListItems(item.menu) };
    }
    return { text, value: item.value ?? '' };
  });

const getBorderStyleItems = (editor: any): BorderListItem[] => {
  const styles = editor?.options?.get?.('table_border_styles') as
    | BorderItem[]
    | undefined;
  const items = buildListItems(styles ?? DEFAULT_BORDER_STYLES);
  return [{ text: '선택...', value: '' }, ...items];
};

const getRawStyleValue = (cell: HTMLElement, property: string): string =>
  cell.style.getPropertyValue(property).trim();

const normalizeStyleValue = (value: string): string => value.trim();

const normalizeColorValue = (value: string): string => rgbToHex(value);

const getCellBorderData = (cell: HTMLElement): Record<string, string> => {
  const data: Record<string, string> = {};
  BORDER_SIDES.forEach(({ key }) => {
    const widthValue = getRawStyleValue(cell, `border-${key}-width`);
    const styleValue = normalizeStyleValue(
      getRawStyleValue(cell, `border-${key}-style`),
    );
    const colorValue = normalizeColorValue(
      getRawStyleValue(cell, `border-${key}-color`),
    );
    data[`${key}Width`] = widthValue;
    data[`${key}Style`] = styleValue;
    data[`${key}Color`] = colorValue;
  });
  return data;
};

const getSharedBorderData = (cells: HTMLElement[]): Record<string, string> => {
  if (cells.length === 0) return {};
  const dataList = cells.map(getCellBorderData);
  const shared: Record<string, string> = { ...dataList[0] };
  dataList.slice(1).forEach((data) => {
    Object.keys(shared).forEach((key) => {
      if (shared[key] !== data[key]) {
        shared[key] = '';
      }
    });
  });
  return shared;
};

const getSelectedCells = (editor: any): HTMLElement[] => {
  const pluginCells = editor.plugins?.table?.getSelectedCells?.();
  if (Array.isArray(pluginCells) && pluginCells.length > 0) {
    return pluginCells as HTMLElement[];
  }
  const selected = editor.dom.select('td[data-mce-selected],th[data-mce-selected]');
  if (selected.length > 0) {
    return selected as HTMLElement[];
  }
  const cell = editor.dom.getParent(editor.selection.getNode(), 'td,th');
  return cell ? [cell as HTMLElement] : [];
};

const parseBorderField = (
  key: string,
): { side: BorderSide; kind: BorderFieldKind } | null => {
  for (const kind of BORDER_FIELD_KINDS) {
    if (key.endsWith(kind)) {
      const side = key.slice(0, -kind.length) as BorderSide;
      if (BORDER_SIDES.some((entry) => entry.key === side)) {
        return { side, kind };
      }
    }
  }
  return null;
};

const buildStylePayload = (
  initialData: Record<string, string>,
  data: Record<string, string>,
): Record<string, string> => {
  const payload: Record<string, string> = {};
  Object.keys(data).forEach((key) => {
    if (data[key] === initialData[key]) return;
    const parsed = parseBorderField(key);
    if (!parsed) return;
    const { side, kind } = parsed;
    const styleName = `border-${side}-${kind.toLowerCase()}`;
    const rawValue = String(data[key] ?? '').trim();
    const value = kind === 'Width' && rawValue !== '' ? addPxSuffix(rawValue) : rawValue;
    payload[styleName] = value;
  });
  return payload;
};

const applyBorderChanges = (
  editor: any,
  initialData: Record<string, string>,
  data: Record<string, string>,
): void => {
  const payload = buildStylePayload(initialData, data);
  if (Object.keys(payload).length === 0) {
    return;
  }
  editor.execCommand('mceTableApplyCellStyle', false, payload);
};

export const openTableCellBorderDialog = (editor: any): void => {
  const cells = getSelectedCells(editor);
  if (cells.length === 0) {
    editor.windowManager.alert('테이블 셀을 선택해 주세요.');
    return;
  }
  const initialData = getSharedBorderData(cells);
  const styleItems = getBorderStyleItems(editor);

  editor.windowManager.open({
    title: '셀 테두리 설정',
    size: 'normal',
    body: {
      type: 'tabpanel',
      tabs: BORDER_SIDES.map(({ key, label }) => ({
        title: label,
        name: key,
        items: [
          {
            type: 'input',
            name: `${key}Width`,
            label: '두께',
            placeholder: '0px',
          },
          {
            type: 'listbox',
            name: `${key}Style`,
            label: '선 스타일',
            items: styleItems,
          },
          {
            type: 'colorinput',
            name: `${key}Color`,
            label: '색상',
          },
        ],
      })),
    },
    buttons: [
      { type: 'cancel', text: '취소' },
      { type: 'submit', text: '적용', primary: true },
    ],
    initialData,
    onSubmit: (api: any) => {
      const data = api.getData() as Record<string, string>;
      applyBorderChanges(editor, initialData, data);
      api.close();
    },
  });
};
