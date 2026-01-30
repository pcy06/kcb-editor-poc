import { Editor } from '@tinymce/tinymce-react';

import tinymce from 'tinymce';

declare global {
  interface Window {
    tinymce?: typeof tinymce;
    tinyMCE?: typeof tinymce;
  }
}

// Ensure TinyMCE is available on window for theme/plugins that expect it.
window.tinymce = tinymce;
window.tinyMCE = tinymce;

// Theme
import 'tinymce/themes/silver';
// Editor model (prevents runtime fetch of /models/dom/model.js)
import 'tinymce/models/dom';
// Toolbar icons
import 'tinymce/icons/default';
// Editor styles
import 'tinymce/skins/ui/oxide/skin.min.css';

// importing the plugin js.
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/wordcount';
import 'tinymce/plugins/code';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/media';
import 'tinymce/plugins/nonbreaking';
import 'tinymce/plugins/table';
import 'tinymce/plugins/template';
import 'tinymce/plugins/help';
import 'tinymce-i18n/langs6/ko_KR';

// Content styles, including inline UI like fake cursors
import contentCss from 'tinymce/skins/content/default/content.min.css?raw';
import contentUiCss from 'tinymce/skins/ui/oxide/content.min.css?raw';

import { registerTableCellBorderMenu } from './tinymce/tableCellBorder';

export default function TinyEditorComponent() {
  // note that skin and content_css is disabled to avoid the normal
  // loading process and is instead loaded as a string via content_style
  return (
    <Editor
      init={{
        skin: false,
        content_css: false,
        content_style: [contentCss, contentUiCss].join('\n'),
        height: '100%',
        resize: false,
        language: 'ko_KR',
        promotion: false,
        branding: false,
        plugins:
          'advlist autolink link image lists charmap anchor searchreplace wordcount code fullscreen insertdatetime media nonbreaking table template help',
        menubar: 'file edit insert view format table tools help',
        toolbar:
          'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | table | link image media | code fullscreen help',
        contextmenu: 'link image table | cellborder',
        setup: (editor) => {
          registerTableCellBorderMenu(editor);
        },
      }}
    />
  );
}
