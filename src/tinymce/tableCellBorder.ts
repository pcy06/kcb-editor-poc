import {
  openTableCellBorderDialog,
  registerTableCellBorderFormats,
} from './tableCellBorderDialog';

const MENU_ITEM_ID = 'tablecellborder';

export const registerTableCellBorderMenu = (editor: any): void => {
  const ensureFormats = () => registerTableCellBorderFormats(editor);
  if (editor?.formatter?.has) {
    ensureFormats();
  } else {
    editor.on('init', ensureFormats);
  }

  editor.ui.registry.addMenuItem(MENU_ITEM_ID, {
    text: '셀 테두리 설정',
    onAction: () => openTableCellBorderDialog(editor),
  });

  editor.ui.registry.addContextMenu('cellborder', {
    update: (element) =>
      editor.dom.getParent(element, 'td,th') ? MENU_ITEM_ID : '',
  });
};
