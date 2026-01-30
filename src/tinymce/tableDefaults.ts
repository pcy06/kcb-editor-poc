const DEFAULT_BORDER_WIDTH = '1px';
const DEFAULT_BORDER_STYLE = 'solid';
const DEFAULT_BORDER_COLOR = '#000000';

const BORDER_SIDES = ['top', 'right', 'bottom', 'left'] as const;

export const TABLE_BORDER_FALLBACK_RESET_CSS = `
table[border]:not([border="0"]):not([style*=border-width]) td,
table[border]:not([border="0"]):not([style*=border-width]) th {
  border-width: 0;
}

table[border]:not([border="0"]):not([style*=border-style]) td,
table[border]:not([border="0"]):not([style*=border-style]) th {
  border-style: none;
}

table[border]:not([border="0"]):not([style*=border-color]) td,
table[border]:not([border="0"]):not([style*=border-color]) th {
  border-color: transparent;
}
`.trim();

const applyDefaultBordersToTable = (editor: any, table: HTMLElement): void => {
  const cells = editor.dom.select('td,th', table) as HTMLElement[];
  if (cells.length === 0) return;

  editor.undoManager.ignore(() => {
    cells.forEach((cell) => {
      editor.dom.setStyle(cell, 'border-width', DEFAULT_BORDER_WIDTH);
      editor.dom.setStyle(cell, 'border-style', DEFAULT_BORDER_STYLE);
      editor.dom.setStyle(cell, 'border-color', DEFAULT_BORDER_COLOR);

      BORDER_SIDES.forEach((side) => {
        editor.dom.setStyle(cell, `border-${side}-width`, DEFAULT_BORDER_WIDTH);
        editor.dom.setStyle(cell, `border-${side}-style`, DEFAULT_BORDER_STYLE);
        editor.dom.setStyle(cell, `border-${side}-color`, DEFAULT_BORDER_COLOR);
      });
    });
  });

  editor.dispatch('TableModified', { table, style: true });
};

export const registerDefaultTableBorders = (editor: any): void => {
  editor.on('ExecCommand', (event: any) => {
    if (event.command !== 'mceInsertTable') return;
    setTimeout(() => {
      const table = editor.dom.getParent(
        editor.selection.getNode(),
        'table',
      );
      if (table) {
        applyDefaultBordersToTable(editor, table as HTMLElement);
      }
    }, 0);
  });
};
