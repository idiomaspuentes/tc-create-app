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
import TranslatableTqTSV from './TranslatableTqTSV';
import TranslatableTwlTSV from './TranslatableTwlTSV';

function Translatable() {
  const classes = useStyles();
  //const [wrapperElement, setWrapperElement] = useState(null);

  const { state: {config, language, sourceRepository, targetRepository, filepath}, actions: {setContentIsDirty} } = useContext(AppContext);

  const { actions: {authenticationActions} } = useContext(AuthenticationContext);

  const [savingTargetFileContent, setSavingTargetFileContent] = useState();
  const [doSaveRetry, setDoSaveRetry] = useState(false);

  const [isAuthenticationModalVisible, setAuthenticationModalVisible] = useState(false);
  const closeAuthenticationModal = () => setAuthenticationModalVisible(false);
  const openAuthenticationModal = () => setAuthenticationModalVisible(true);


  const { state: sourceFile } = useContext(FileContext);

  const { state: targetFile, actions: targetFileActions } = useContext(
    TargetFileContext
  );

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
            alert("Error saving file! File could not be saved.");
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
              errorText={'Error! File was not saved.  Connection to the server was lost.'}
              onSubmit={saveRetry}
            />
          </Paper>
        </Modal>
      )
    );
  }, [config, isAuthenticationModalVisible, classes.modal, authenticationActions]);

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
        _translatable = <MarkdownContextProvider><MarkDownTranslatable {...translatableProps} /></MarkdownContextProvider>;
      } else if (sourceFile.filepath.match(/^tq_...\.tsv$/)) {
        _translatable = <TranslatableTqTSV onSave={saveOnTranslation} onContentIsDirty={setContentIsDirty} />;
      } else if (sourceFile.filepath.match(/^twl_...\.tsv$/)) {
        _translatable = <TranslatableTwlTSV onSave={saveOnTranslation} onContentIsDirty={setContentIsDirty} />;
      } else if (sourceFile.filepath.match(/\.tsv$/)) {
        _translatable = <TranslatableTSV onSave={saveOnTranslation} onContentIsDirty={setContentIsDirty} />;
      } else {
        _translatable = <h3 style={{ 'textAlign': 'center' }} >Unsupported File. Please select .md or .tsv files.</h3>;
      }
    }
    return _translatable;
  }, [filepath, sourceFile, targetFile, targetFileActions, setContentIsDirty]);

  useEffect(() => {
    scrollToTop();
  }, [filepath, scrollToTop]);

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
