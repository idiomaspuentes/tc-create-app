import React, {
  useState, useCallback, useContext, useMemo, useEffect, useRef,
} from 'react';

import {
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
} from '@material-ui/core';

import { DataTable } from 'datatable-translatable';

import { ResourcesContextProvider, ResourcesContext } from 'scripture-resources-rcl';
import { FileContext } from 'gitea-react-toolkit';

import * as cv from 'uw-content-validation';
import {
  defaultResourceLinks,
  stripDefaultsFromResourceLinks,
  generateAllResourceLinks,
} from '../../core/resourceLinks';
import { SERVER_URL } from '../../core/state.defaults';
import { TargetFileContext } from '../../core/TargetFile.context';

import { AppContext } from '../../App.context';

import * as csv from '../../core/csvMaker';
import usePermalink from '../../hooks/usePermalink';
import useHighlighter from '../../hooks/useHighlighter';
import RowHeader from './RowHeader';

const delimiters = { row: '\n', cell: '\t' };
const _config = {
  compositeKeyIndices: [0, 1, 2, 3],
  columnsFilter: ['Chapter', 'Verse', 'SupportReference'],
  columnsShowDefault: [
    'SupportReference',
    'OccurrenceNote',
  ],
};

function TranslatableTSVWrapper({
  onSave, onEdit, onContentIsDirty,
}) {
  // manage the state of the resources for the provider context
  const [resources, setResources] = useState([]);
  const [open, setOpen] = React.useState(false);
  const { queryParams } = usePermalink();

  const {
    state: {
      resourceLinks, expandedScripture, validationPriority, organization,
    },
    actions: { setResourceLinks },
  } = useContext(AppContext);

  const { state: sourceFile } = useContext(FileContext);
  const { state: targetFile } = useContext(
    TargetFileContext
  );

  const bookId = sourceFile.filepath.split(/\d+-|\./)[1].toLowerCase();

  const onResourceLinks = useCallback(
    (_resourceLinks) => {
      // Remove bookId and remove defaults:
      const persistedResourceLinks = stripDefaultsFromResourceLinks({
        resourceLinks: _resourceLinks,
        bookId,
      });
      // Persist to App context:
      setResourceLinks(persistedResourceLinks);
    },
    [bookId, setResourceLinks]
  );

  // Build bookId and add defaults:
  const defaultResourceLinksWithBookId = generateAllResourceLinks({
    bookId,
    defaultResourceLinks,
  });
  const allResourceLinksWithBookId = generateAllResourceLinks({
    bookId,
    resourceLinks,
  });

  const generateRowId = useCallback((rowData) => {
    const [chapter] = rowData[2].split(delimiters.cell);
    const [verse] = rowData[3].split(delimiters.cell);
    const [uid] = rowData[4].split(delimiters.cell);
    return `header-${chapter}-${verse}-${uid}`;
  }, []);

  const serverConfig = {
    server: SERVER_URL,
    cache: { maxAge: 1 * 1 * 1 * 60 * 1000 /* override cache to 1 minute */},
  };

  const handleClose = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const _onValidate = useCallback(async (rows) => {
    // sample name: en_tn_08-RUT.tsv
    // NOTE! the content on-screen, in-memory does NOT include
    // the headers. So the initial value of tsvRows will be
    // the headers.
    if (targetFile && rows) {
      const _name = targetFile.name.split('_');
      const langId = _name[0];
      const bookID = _name[2].split('-')[1].split('.')[0];
      let rowsString = 'Book\tChapter\tVerse\tID\tSupportReference\tOrigQuote\tOccurrence\tGLQuote\tOccurrenceNote\n';

      for (let i = 0; i < rows.length; i++) {
        let rowString = '';

        for (let j = 0; j < rows[i].length; j++) {
          rowString += rows[i][j];

          if (j < (rows[i].length - 1)) {
            rowString += '\t';
          }
        }
        rowsString += rowString;
        rowsString += '\n';
      }

      // const rawResults = await cv.checkTN_TSV9Table(langId, 'TN', bookID, 'dummy', rowsString, '', {suppressNoticeDisablingFlag: false});
      const rawResults = await cv.checkDeprecatedTN_TSV9Table(organization.username, langId, bookID, targetFile.name, rowsString, { suppressNoticeDisablingFlag: false });
      const nl = rawResults.noticeList;
      let hdrs = ['Priority', 'Chapter', 'Verse', 'Line', 'Row ID', 'Details', 'Char Pos', 'Excerpt', 'Message', 'Location'];
      let data = [];
      data.push(hdrs);
      let inPriorityRange = false;

      Object.keys(nl).forEach(key => {
        inPriorityRange = false; // reset for each
        const rowData = nl[key];

        if (validationPriority === 'med' && rowData.priority > 599) {
          inPriorityRange = true;
        } else if (validationPriority === 'high' && rowData.priority > 799) {
          inPriorityRange = true;
        } else if (validationPriority === 'low') {
          inPriorityRange = true;
        }

        if (inPriorityRange) {
          csv.addRow(data, [
            String(rowData.priority),
            String(rowData.C),
            String(rowData.V),
            String(rowData.lineNumber),
            String(rowData.rowID),
            String(rowData.fieldName || ''),
            String(rowData.characterIndex || ''),
            String(rowData.extract || ''),
            String(rowData.message),
            String(rowData.location),
          ]);
        }
      });

      if (data.length < 2) {
        alert('No Validation Errors Found');
        setOpen(false);
        return;
      }

      let ts = new Date().toISOString();
      let fn = 'Validation-' + targetFile.name + '-' + ts + '.csv';
      csv.download(fn, csv.toCSV(data));

      //setOpen(false);
    }
    setOpen(false);
  }, [targetFile, validationPriority, organization.username]);

  const onValidate = useCallback((rows) => {
    setOpen(true);
    setTimeout(() => _onValidate(rows), 1);
  }, [_onValidate]);

  const tableRef = useRef(null);
  const [table, setTable] = useState(null);
  const [tableChanged, setTableChanged] = useState(null);
  const { addPhrase, poppers } = useHighlighter({ table, tableChanged });

  useEffect(() => {
    if (tableChanged) {
      setTable(tableRef.current);
    }
  }, [tableChanged]);

  const [options, setOptions] = useState({
    page: 0,
    rowsPerPage: 25,
    rowsPerPageOptions: [10, 25, 50, 100],
    onTableChange: function (action, tableState) {
      setTableChanged(tableState);
    },
    setTableProps: () => (
      { ref: tableRef }
    ),
  });

  const [columns, setColumns] = useState();

  useEffect(() => {
    if (!columns && targetFile.content) {
      setColumns(targetFile.content.slice(0, targetFile.content.indexOf('\n')).split('\t'));
    }
  }, [columns, targetFile.content]);

  useEffect(() => {
    const exludedFromSearch = ['columns', 'check', 'hint'];

    if (queryParams) {
      //Sets searchText to first searchable param in query string.
      for (let key of queryParams.keys()) {
        if (!exludedFromSearch.includes(key) && !options.searchText) {
          setOptions({ ...options, searchText: queryParams.get(key) });
        }
      }
    }
  },[options, queryParams]);

  useEffect(() => {
    if (queryParams && columns) {
      const checkText = queryParams.get('check');
      const hint = queryParams.get('hint');
      const message = () => hint && (<><b>Hint:</b> {hint}</>);

      if (checkText) {
        addPhrase({ phrase: checkText, message: message() });
        // addPhrase({ phrase: 'sustantivo abstracto', message: 'test message' });
      }

      const queryColumns = queryParams.get('columns')?.split(',');
      const validColumns = columns.map(column => queryColumns && queryColumns.includes(column) && column) || [];

      const columnsShowDefault = columns.map(column =>
        queryParams.get(column) && column
      );

      _config.columnsShowDefault = [
        ..._config.columnsShowDefault,
        ...columnsShowDefault,
        ...validColumns,
      ];
    }
  }, [queryParams, columns, addPhrase]);


  const rowHeader = useCallback((rowData, actionsMenu) => (<RowHeader
    open={expandedScripture}
    rowData={rowData}
    actionsMenu={actionsMenu}
    delimiters={delimiters}
  />), [expandedScripture]);


  const datatable = useMemo(() => {
    _config.rowHeader = rowHeader;
    return (
      <DataTable
        sourceFile={sourceFile?.content}
        targetFile={targetFile?.content}
        onSave={onSave}
        onEdit={onEdit}
        onValidate={onValidate}
        onContentIsDirty={onContentIsDirty}
        delimiters={delimiters}
        config={_config}
        generateRowId={generateRowId}
        options={options}
      />
    );
  }, [sourceFile.content, targetFile.content, onSave, onEdit, onValidate, onContentIsDirty, generateRowId, options, rowHeader]);
  return (
    <>
    <ResourcesContextProvider
      reference={{ bookId }}
      defaultResourceLinks={defaultResourceLinksWithBookId}
      resourceLinks={allResourceLinksWithBookId}
      onResourceLinks={onResourceLinks}
      resources={resources}
      onResources={setResources}
      config={serverConfig}
    >
      <TranslatableTSV datatable={datatable} />
      {poppers}
      {open && <Dialog
        disableBackdropClick
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{'Validation Running, Please Wait'}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <div style={{ textAlign: 'center' }}>
              <CircularProgress />{' '}
            </div>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button data-test-id="KNdmPAULAWTECbgCLgyJy" onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      }
    </ResourcesContextProvider>
    </>
  );
}

function TranslatableTSV({ datatable }) {
  const { state: { books } } = useContext(ResourcesContext);
  return books ? datatable :
    (<div style={{
      width: '100%', display: 'flex', justifyContent: 'center',
    }}
    ><CircularProgress /></div>);
}

export default TranslatableTSVWrapper;