import React, {
  useMemo,
  useEffect,
  useCallback,
  useState,
  useContext,
} from 'react';
import {
  Modal,
  Paper,
  CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { FileContext, AuthenticationContext, LoginForm, parseError } from 'gitea-react-toolkit';
import { Translatable as MarkDownTranslatable, MarkdownContextProvider } from 'markdown-translatable';

import { FilesHeader } from '../files-header';
import { AppContext } from '../../App.context';
import { TargetFileContext } from '../../core/TargetFile.context';
import TranslatableTSV from './TranslatableTSV';
import TranslatableTnTSV from './TranslatableTnTSV';
import TranslatableObsTnTSV from './TranslatableObsTnTSV';
import TranslatableTqTSV from './TranslatableTqTSV';
import TranslatableObsTqTSV from './TranslatableObsTqTSV';
import TranslatableTwlTSV from './TranslatableTwlTSV';
import TranslatableSnTSV from './TranslatableSnTSV';
import TranslatableObsSnTSV from './TranslatableObsSnTSV';
import TranslatableSqTSV from './TranslatableSqTSV';
import TranslatableObsSqTSV from './TranslatableObsSqTSV';

function Translatable() {
  const classes = useStyles();
  //const [wrapperElement, setWrapperElement] = useState(null);

  const { state: {config, language, sourceRepository, targetRepository, filepath, organization}, actions: {setContentIsDirty} } = useContext(AppContext);

  const { actions: authenticationActions, state: authentication } = useContext(AuthenticationContext);
  const [permalink, setPermalink] = useState();

  const [savingTargetFileContent, setSavingTargetFileContent] = useState();
  const [doSaveRetry, setDoSaveRetry] = useState(false);
  const [errorMessage, setErrorMessage] = useState('Error! File was not saved.  Connection to the server was lost.');
  const [isAuthenticationModalVisible, setAuthenticationModalVisible] = useState(false);
  const closeAuthenticationModal = () => setAuthenticationModalVisible(false);
  const openAuthenticationModal = () => setAuthenticationModalVisible(true);

  const { state: sourceFile } = useContext(FileContext);

  const { state: targetFile, actions: targetFileActions } = useContext(
    TargetFileContext
  );

  useEffect(() => {
    if (!authentication) {
      setAuthenticationModalVisible(true);
      setErrorMessage('Login to load file.');
    }

    const currentPL = window.location.pathname;

    //TODO: Compare current window.location with permalink to avoid history duplication.
    if (organization?.username && language?.languageId && sourceRepository?.name && filepath) {
      setPermalink(`/pl/${organization.username}/${language.languageId}/${sourceRepository.name.split('_')[1]}/${filepath}`);
    }

    if (permalink && currentPL !== permalink) {
      window.history.pushState(
        { id: permalink },
        filepath,
        permalink
      );
    }
  }, [authentication, organization.username, language.languageId, sourceRepository.name, filepath, permalink]);

  useEffect(() => {
    // This does not work in the saveRetry() function.
    if (doSaveRetry) {
      setDoSaveRetry(false);

      targetFileActions.save(savingTargetFileContent)
        .then(() => {
          // Saved successfully.
          closeAuthenticationModal();
        },
        () => {
          // Error saving:
          closeAuthenticationModal();
          alert('Error saving file! File could not be saved.');
        });
    }
  }, [doSaveRetry, targetFileActions, savingTargetFileContent]);

  const authenticationModal = useMemo(() => {
    const saveRetry = ({ username, password, remember }) => {
      authenticationActions.onLoginFormSubmitLogin({ username, password, remember })
        .then(() => {
          setDoSaveRetry(true);
        });
    };

    return (
      (!isAuthenticationModalVisible) ? <></> : (
        <Modal open={true} onClose={closeAuthenticationModal}>
          <Paper className={classes.modal}>
            <LoginForm
              config={config}
              authentication={null/** Override to simulate logged out. */}
              actionText={'Login to try again...'}
              errorText={errorMessage}
              onSubmit={saveRetry}
            />
          </Paper>
        </Modal>
      )
    );
  }, [config, isAuthenticationModalVisible, classes.modal, authenticationActions, errorMessage]);

  const scrollToTop = useCallback(() => {
    window.scrollTo(0, 0);
    // if (wrapperElement && wrapperElement) {
    //   window.scrollTo(0, wrapperElement.offsetParent.offsetTop);
    // }
  }, []);

  const translatableComponent = useMemo(() => {
    let _translatable = (
      <div style={{ textAlign: 'center' }}>
        <CircularProgress />{' '}
      </div>
    );

    const saveOnTranslation = (
      async (content) => {
        setSavingTargetFileContent(content);
        try {
          await targetFileActions.save(content);
        } catch (error) {
          const friendlyError = parseError({ error });

          if (friendlyError.isRecoverable) {
            openAuthenticationModal();
          } else {
            alert("Error saving file! File could not be saved.");
          }
        }
      }
    );

    const autoSaveOnEdit = (
      async (content) => {
        //console.log("tC Create / autosave", targetFile, content);
        targetFileActions.saveCache(content);
      }
    );

    if (
      filepath &&
      sourceFile &&
      targetFile &&
      filepath === sourceFile.filepath &&
      filepath === targetFile.filepath
    ) {
      if (sourceFile.filepath.match(/\.md$/)) {
        let translatableProps = {
          original: sourceFile.content,
          translation: targetFile.content,
          onTranslation: saveOnTranslation,
          onContentIsDirty: setContentIsDirty,
        };
        console.log("Markdown file selected");
        _translatable = <MarkdownContextProvider><MarkDownTranslatable {...translatableProps} /></MarkdownContextProvider>;
      
      } else if (sourceFile.filepath.match(/^tn_OBS\.tsv$/)) {
        console.log("tn_OBS file selected");
        _translatable = <TranslatableObsTnTSV onSave={saveOnTranslation}onEdit={autoSaveOnEdit}  onContentIsDirty={setContentIsDirty} />;
      
      } else if (sourceFile.filepath.match(/^tn_...\.tsv$/)) {
        console.log("tn_... file selected");
        _translatable = <TranslatableTnTSV onSave={saveOnTranslation} onEdit={autoSaveOnEdit} onContentIsDirty={setContentIsDirty} />;
      
      } else if (sourceFile.filepath.match(/^tq_OBS\.tsv$/)) {
        console.log("tq_OBS file selected");
        _translatable = <TranslatableObsTqTSV onSave={saveOnTranslation} onEdit={autoSaveOnEdit} onContentIsDirty={setContentIsDirty} />;
      
      } else if (sourceFile.filepath.match(/^tq_...\.tsv$/)) {
        console.log("tq_... file selected");
        _translatable = <TranslatableTqTSV onSave={saveOnTranslation} onEdit={autoSaveOnEdit} onContentIsDirty={setContentIsDirty} />;
      
      } else if (sourceFile.filepath.match(/^sq_OBS.tsv$/)) {
        console.log("sq_OBS file selected");
        _translatable = <TranslatableObsSqTSV onSave={saveOnTranslation} onEdit={autoSaveOnEdit} onContentIsDirty={setContentIsDirty} />;
      
      } else if (sourceFile.filepath.match(/^sq_...\.tsv$/)) {
        console.log("sq_... file selected");
        _translatable = <TranslatableSqTSV onSave={saveOnTranslation} onEdit={autoSaveOnEdit} onContentIsDirty={setContentIsDirty} />;
      
      } else if (sourceFile.filepath.match(/^sn_OBS.tsv$/)) {
        console.log("sn_OBS file selected");
        _translatable = <TranslatableObsSnTSV onSave={saveOnTranslation} onEdit={autoSaveOnEdit} onContentIsDirty={setContentIsDirty} />;
      
      } else if (sourceFile.filepath.match(/^sn_...\.tsv$/)) {
        console.log("sn_... file selected");
        _translatable = <TranslatableSnTSV onSave={saveOnTranslation} onEdit={autoSaveOnEdit} onContentIsDirty={setContentIsDirty} />;
      
      } else if (sourceFile.filepath.match(/^twl_...\.tsv$/)) {
        console.log("twl_... file selected")
        _translatable = <TranslatableTwlTSV onSave={saveOnTranslation} onEdit={autoSaveOnEdit} onContentIsDirty={setContentIsDirty} />;
      
      } else if (sourceFile.filepath.match(/\.tsv$/)) {
        console.log("tn 9 col file selected")
        _translatable = <TranslatableTSV onSave={saveOnTranslation} onEdit={autoSaveOnEdit} onContentIsDirty={setContentIsDirty} />;
      
      } else {
        console.log("Unsupported file selected")
        _translatable = <h3 style={{ 'textAlign': 'center' }} >Unsupported File. Please select .md or .tsv files.</h3>;
      }
    }
    return _translatable;
  }, [filepath, sourceFile, targetFile, targetFileActions, setContentIsDirty]);

  useEffect(() => {
    scrollToTop();
  }, [filepath, scrollToTop]);

  //console.log("targetFile");
  //console.log(targetFile);
  //console.log("targetRepository");
  //console.log(targetRepository);

  const filesHeader = targetFile && targetRepository && (
    <FilesHeader
      sourceRepository={sourceRepository}
      targetRepository={targetRepository}
      sourceFile={sourceFile}
      targetFile={targetFile}
      language={language}
    />
  );

  return (
    <div className={classes.root}>
      {filesHeader}
      <div id='translatableComponent'>
        {translatableComponent}
      </div>
      {authenticationModal}
    </div>
  );
}

const useStyles = makeStyles((theme) => (
  {
    root: {},
    modal: {
      position: 'absolute',
      top: '10%',
      left: '10%',
      right: '10%',
      maxHeight: '80%',
      overflow: 'scroll',
    }
  }));

export default Translatable;
