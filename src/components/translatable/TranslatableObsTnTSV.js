import React, {
  useState, useCallback, useContext, useMemo, useEffect, useRef,
} from 'react';

import { CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';

import { DataTable } from 'datatable-translatable';
import * as parser from 'uw-tsv-parser';

import { ResourcesContextProvider, 
  //ResourcesContext 
} from 'scripture-resources-rcl';
import { FileContext } from 'gitea-react-toolkit';

import {
  defaultResourceLinks,
  stripDefaultsFromResourceLinks,
  generateAllResourceLinks,
} from '../../core/resourceLinks';
import { SERVER_URL } from '../../core/state.defaults';
import { TargetFileContext } from '../../core/TargetFile.context';

import { AppContext } from '../../App.context';
import RowHeaderObsTn from './RowHeaderObsTn';

import usePermalink from '../../hooks/usePermalink';
import useHighlighter from '../../hooks/useHighlighter';

import * as cv from 'uw-content-validation';
import * as csv from '../../core/csvMaker';
import { contentValidateTSV } from '../../core/contentValidate';

const delimiters = { row: '\n', cell: '\t' };

// columns Reference	ID	Tags	SupportReference	Quote	Occurrence	Note
const _config = {
  compositeKeyIndices: [0, 1],
  columnsFilter: ['Reference', 'ID', 'Tags', 'Quote', 'Occurrence'],
  columnsShowDefault: [
    'Note',
  ],
}
;



function TranslatableObsTnTSVWrapper({ onSave, onEdit, onContentIsDirty }) {
  // manage the state of the resources for the provider context
  const [resources, setResources] = useState([]);
  const [open, setOpen] = React.useState(false);
  const { queryParams } = usePermalink();

  const {
    state: { resourceLinks, expandedScripture, validationPriority, targetRepository, organization },
    actions: { setResourceLinks },
  } = useContext(AppContext);
  const langId = targetRepository.language;

  const { state: sourceFile } = useContext(FileContext);
  const { state: targetFile } = useContext(
    TargetFileContext
  );

  //const bookId = sourceFile.filepath.split(/\d+-|\./)[1].toLowerCase();
  // filename pattern tn_TIT.tsv
  const bookId = sourceFile.filepath
  .split('_')[1]
  .split('.')[0]
  .toLowerCase();

  
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
    const reference = rowData[1].split(delimiters.cell)[0];
    const [chapter, verse] = reference.split(":");
    const uid = rowData[2].split(delimiters.cell)[1];
    let rowId = `header-${chapter}-${verse}-${uid}`;
    return rowId;
  }, []);

  const serverConfig = {
    server: SERVER_URL,
    cache: {
      maxAge: 1 * 1 * 1 * 60 * 1000, // override cache to 1 minute
    },
  };

  const handleClose = useCallback( () => {
    setOpen(false);
  }, [setOpen]);

  const _onValidate = useCallback(async (rows) => {
    // NOTE! the content on-screen, in-memory does NOT include
    // the headers. This must be added.
    // function contentValidateTSV(rows, header, username, langId, bookID, filename, cvFunction) {

    let data = [];
    const header = "Reference\tID\tTags\tSupportReference\tQuote\tOccurrence\tNote\n";
    if ( targetFile && rows ) {
      data = await contentValidateTSV(rows, header, organization.username, 
        langId, bookId.toUpperCase(), targetFile.name, cv.checkTN_TSV7Table,
        {}, validationPriority
      );
      if ( data.length < 2 ) {
        alert("No Validation Errors Found");
        setOpen(false);
        return;
      }
    
      let ts = new Date().toISOString();
      let fn = 'Validation-' + targetFile.name + '-' + ts + '.csv';
      csv.download(fn, csv.toCSV(data));    
    }

    setOpen(false);
  },[targetFile, validationPriority, langId, bookId, organization.username]);

  const onValidate = useCallback( (rows) => {
    setOpen(true);
    setTimeout( () => _onValidate(rows), 1);
  }, [_onValidate]);



  const tableRef = useRef(null);
  const [table, setTable] = useState({ ref: null, state: null });
  const { addPhrase, poppers } = useHighlighter({ container: table });


  const [options, setOptions] = useState({
    page: 0,
    rowsPerPage: 25,
    rowsPerPageOptions: [10, 25, 50, 100],
    onTableChange: function (action, tableState) {
      console.log('table changed');
      setTable({ ref: tableRef.current, state: tableState });
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


  const rowHeader = useCallback((rowData, actionsMenu) => (<RowHeaderObsTn
    bookId={bookId}
    open={expandedScripture}
    rowData={rowData}
    actionsMenu={actionsMenu}
    delimiters={delimiters}
  />), [expandedScripture, bookId]);


  const datatable = useMemo(() => {
    _config.rowHeader = rowHeader;
    return (
      <DataTable
        sourceFile={sourceFile.content}
        targetFile={targetFile.content}
        onSave={onSave}
        onEdit={onEdit}
        onValidate={onValidate}
        onContentIsDirty={onContentIsDirty}
        delimiters={delimiters}
        config={_config}
        generateRowId={generateRowId}
        options={options}
        parser={parser}
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
      <TranslatableObsTnTSV datatable={datatable} />
      {poppers}
      {open &&  <Dialog
        disableBackdropClick
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Validation Running, Please Wait"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <div style={{ textAlign: 'center' }}>
              <CircularProgress />{' '}
            </div>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    }
    </ResourcesContextProvider>
    </>
  );
}

function TranslatableObsTnTSV({ datatable }) {
  //const { state: { books } } = useContext(ResourcesContext);
  return datatable;
  /*
  return books ? datatable :
    (<div style={{
      width: '100%', display: 'flex', justifyContent: 'center',
    }}
    ><CircularProgress /></div>);
    */
}

export default TranslatableObsTnTSVWrapper;