import React, {
  useContext, useState, useCallback, useEffect,
} from 'react';
import { MuiThemeProvider } from '@material-ui/core/styles';
import Headroom from 'react-headroom';
import {
  ApplicationBar,
  AuthenticationContextProvider,
  RepositoryContextProvider,
  FileContextProvider,
  OrganizationContextProvider,
} from 'gitea-react-toolkit';

import { RepositoryApi, OrganizationApi } from 'dcs-js';
import { useLanguages } from 'uw-languages-rcl';

import {
  Typography, Link, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
} from '@material-ui/core';
import { useBeforeunload } from 'react-beforeunload';
import { DrawerMenu } from './components/';

import {
  loadState,
  loadAuthentication,
  saveAuthentication,
  loadFileCache,
  saveFileCache,
  removeFileCache,
} from './core/persistence';

import Workspace from './Workspace';
import ConfirmDialog from './components/ConfirmDialog';

import theme from './theme';

import { AppContext, AppContextProvider } from './App.context';
import ConfirmContextProvider from './context/ConfirmContextProvider';
import { getCommitHash } from './utils';
import { localString } from './core/localStrings';
import { onOpenValidation } from './core/onOpenValidations';
import useConfirm from './hooks/useConfirm';
import { getLanguage } from './components/languages/helpers';
import usePermalink from './hooks/usePermalink';


const { version } = require('../package.json');
const commitHash = getCommitHash();
const title = `translationCore Create - v${version}`;

function AppComponent() {
  // this state manage on open validation
  const [criticalErrors, setCriticalErrors] = useState([]);
  // State for autosave
  const [cacheFileKey, setCacheFileKey] = useState('');
  const [cacheWarningMessage, setCacheWarningMessage] = useState();

  const { state, actions } = useContext(AppContext);
  const {
    authentication,
    sourceRepository,
    filepath,
    fontScale,
    config,
    organization,
    contentIsDirty,
  } = state;
  const {
    setAuthentication,
    setSourceRepository,
    setOrganization,
    setFilepath,
  } = actions;

  const drawerMenu = <DrawerMenu commitHash={commitHash} />;

  const _onOpenValidation = (filename,content,url) => {
    const notices = onOpenValidation(filename, content, url);

    if (notices.length > 0) {
      setCriticalErrors(notices);
    } else {
      setCriticalErrors([]);
    }
    return notices;
  };

  const _onLoadCache = async ({ /* authentication, repository, branch, */ html_url, file }) => {
    //console.log("tcc // _onLoadCache", html_url);
    if (html_url) {
      let _cachedFile = await loadFileCache(html_url);

      if (_cachedFile && file) {
        // console.log("tcc // file", file, html_url);
        // console.log("tcc // cached file", _cachedFile);

        if (_cachedFile?.sha && file?.sha && _cachedFile?.sha !== file?.sha) {
          // Allow app to provide CACHED ("offline" content);
          // Might be different BRANCH (different user) or different FILE.
          // Might be STALE (sha has changed on DCS).
          // (NOTE: STALE cache would mean THIS user edited the same file in another browser.)

          const cacheWarningMessage =
            'AutoSaved file: \n' + //_cachedFile.filepath + ".\n" +
            'Edited: ' + _cachedFile.timestamp?.toLocaleString() + '\n' +
            'Checksum: ' + _cachedFile.sha + '\n\n' +
            'Server file (newer): \n' + //file.name + ".\n" +
            'Checksum: ' + file.sha + '\n\n';

          setCacheFileKey(html_url);
          setCacheWarningMessage(cacheWarningMessage);
        }
      }

      return _cachedFile;
    }
  };

  const _onSaveCache = ({/*authentication, repository, branch,*/ file, content }) => {
    //console.log("tcc // _onSaveCache", file, content);

    if (file) {
      saveFileCache(file, content);
    }
  };

  const handleClose = useCallback( () => {
    setCriticalErrors([]);
    setSourceRepository(undefined);
  }, [setCriticalErrors, setSourceRepository]);

  const handleCloseCachedFile = useCallback( () => {
    // CLEAR cache:
    removeFileCache(cacheFileKey);
    // Reset dialog:
    setCacheWarningMessage(null);
    // Close current file:
    handleClose();
  }, [cacheFileKey, setCacheWarningMessage, handleClose]);


  const { isConfirmed } = useConfirm({ contentIsDirty });

  useBeforeunload((event) => {
    if (contentIsDirty) {
      event.preventDefault();
      event.returnValue = localString('ConfirmCloseWindow');
      return localString('ConfirmCloseWindow');
    }
  });

  const onHeadroomPin = () => {
    const el = document.querySelector('#translatableComponent div div[role=\'toolbar\']');

    if (el) {
      el.style.top = '64px';
    }
  };

  const onHeadroomUnfix = () => {
    const el = document.querySelector('#translatableComponent div div[role=\'toolbar\']');

    if (el) {
      el.style.top = '0px';
    }
  };

  const onHeadroomUnpin = () => {
    const el = document.querySelector('#translatableComponent div div[role=\'toolbar\']');

    if (el) {
      el.style.top = '0px';
    }
  };

  const style = {
    app: { fontSize: `${fontScale / 100}em` },
    headroom: { zIndex: '200' },
    workspace: { margin: `${theme.spacing(2)}px` },
  };
  return (
    <div className='App' style={style.app}>
      <MuiThemeProvider theme={theme}>
        <AuthenticationContextProvider
          authentication={authentication}
          onAuthentication={setAuthentication}
          config={config.authentication}
          saveAuthentication={saveAuthentication}
        >
          <OrganizationContextProvider
            authentication={authentication}
            organization={organization}
            onOrganization={setOrganization}
          >
            <RepositoryContextProvider
              authentication={authentication}
              repository={sourceRepository}
              onRepository={setSourceRepository}
              urls={config.repository.urls}
            >
              <FileContextProvider
                authentication={authentication}
                repository={sourceRepository}
                filepath={filepath}
                onFilepath={setFilepath}
                onOpenValidation={_onOpenValidation}
                onLoadCache={_onLoadCache}
                onSaveCache={_onSaveCache}
                onConfirmClose={() => isConfirmed(localString('ConfirmCloseWindow'))}
                releaseFlag={organization?.username !== 'unfoldingWord' ? true:false}
              >
                {
                  (criticalErrors.length > 0 &&
                  <Dialog
                    disableBackdropClick
                    open={(criticalErrors.length > 0)}
                    onClose={handleClose}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                  >
                    <DialogTitle id="alert-dialog-title">
                    This file cannot be opened by tC Create as there are errors in the Master file.
                    Please contact your administrator to address the following error(s)
                    </DialogTitle>
                    <DialogContent>
                      <DialogContentText id="alert-dialog-description">
                        {
                          criticalErrors.map( (msg,idx) => (
                            <>
                            <Typography key={idx}>
                              On <Link href={msg[0]} target="_blank" rel="noopener">
                                line {msg[1]}
                              </Link>
                              &nbsp;{msg[2]}&nbsp;{msg[3]}&nbsp;{msg[4]}&nbsp;{msg[5]}
                            </Typography>
                            </>
                          ))}
                        <br />
                        <Typography key="footer" >Please take a screenshot and contact your administrator.</Typography>
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button data-test-id="h5wiHB7uHFsQeEy-l5eWL" onClick={handleClose} color="primary">
                        Close
                      </Button>
                    </DialogActions>
                  </Dialog>
                  )
                ||
                (
                  <>
                  <Headroom pinStart={64} style={style.headroom}
                    onPin={()=>{
                      onHeadroomPin();
                    }} onUnfix={()=>{
                      onHeadroomUnfix();
                    }} onUnpin={()=>{
                      onHeadroomUnpin();
                    }}
                  >
                    <header id='App-header'>
                      <ApplicationBar
                        title={title}
                        build={commitHash}
                        // buttons={buttons}
                        drawerMenu={drawerMenu}
                      />
                    </header>
                  </Headroom>
                  <div id='Workspace-Container' style={style.workspace}>
                    <Workspace />
                  </div>
                  </>
                )
                }
              </FileContextProvider>
            </RepositoryContextProvider>
          </OrganizationContextProvider>
        </AuthenticationContextProvider>
        <ConfirmDialog contentIsDirty={contentIsDirty || cacheWarningMessage} />

        <Dialog
          open={cacheWarningMessage != null}
          onClose={()=>setCacheWarningMessage(null)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Your file was autosaved, but the file was later edited by another process...
              <p><pre>{cacheWarningMessage}</pre></p>
              Do you want to keep or discard this file?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button data-test-id="ShV9tWcn2YMF7Gau" color="primary" onClick={handleCloseCachedFile}>
                Discard My AutoSaved File
            </Button>
            <Button data-test-id="5LJPR3YqqPx5Ezkj" onClick={()=>{
              // Reset dialog:
              setCacheWarningMessage(null);
            }} color="primary" autoFocus
            >
                Keep My AutoSaved File
            </Button>
          </DialogActions>
        </Dialog>
      </MuiThemeProvider>
    </div>
  );
}

function App(props) {
  const [resumedState, setResumedState] = useState();
  const { pathArray } = usePermalink();
  const { state: languages } = useLanguages();

  const loadFromPermalink = useCallback(async () => {
    if (pathArray.length === 0) {
      return true;
    }

    const [, pl, orgName, langId, resourceId, ...rest] = pathArray;

    const isPermalink = !!orgName && pl === 'pl';

    if (!isPermalink) {
      return false; //It is not a permalink.
    }

    if (languages.length === 0) {
      return true; //It is a permalink but should wait until languages have loaded.
    }

    console.log('Loading app from permalink...');

    /* Permalink structure:
    * .../pl/{orgName}/{lang}/{resourceId}/{path}
    *
    * Example:
    * .../pl/unfoldingWord/en/ta/intro/finding-answers/01.md
    */

    let language = { languageId: langId };
    const sourceRepoName = 'en_' + resourceId;
    const filepath = rest.join('/');

    const orgClient = new OrganizationApi();
    const repoClient = new RepositoryApi();

    const authentication = await loadAuthentication('authentication');

    const organization = isPermalink && await orgClient.orgGet(orgName)
      .then(({ data }) => data)
      .catch(err => {
        alert(`Could not find "${orgName}" organization provided in link.`);
        console.error(err);
      });

    if (!organization) {
      return false;
    }

    //const targetRepo = isPermalink && await repoClient.repoGet(orgName, targetRepoName).then(({ data }) => data);
    const sourceRepository = isPermalink && await repoClient.repoGet('unfoldingWord', sourceRepoName)
      .then(({ data }) => {
        data.tree_url = `api/v1/repos/unfoldingWord/${sourceRepoName}/git/trees/master`;
        return data;
      })
      .catch(err => {
        alert(`Could not find the resource "${langId}_${resourceId}" provided in link in "${orgName}" organization.`);
        console.error(err);
      });

    if (!sourceRepository) {
      return false;
    }

    language = getLanguage({ languageId: langId, languagesJSON: languages });

    if (!language) {
      alert(`Language "${langId}" was not found.`);
      return false;
    }

    const _permalinkState = {
      authentication,
      language,
      sourceRepository,
      filepath,
      organization,
      resourceLinks: null,
    };
    setResumedState(_permalinkState);

    return !!organization;
  }, [languages,pathArray]);

  const resumeState = useCallback(async () => {
    // note that the authentication context manages its own
    // state via provided persistence load and save closures
    console.log('running resumeState...');
    const authentication = await loadAuthentication('authentication');
    const organization = authentication && (await loadState('organization'));
    const language = authentication && (await loadState('language'));
    const sourceRepository =
      authentication && (await loadState('sourceRepository'));
    const resourceLinks = authentication && (await loadState('resourceLinks'));
    const filepath = authentication && (await loadState('filepath'));
    const _resumedState = {
      authentication,
      language,
      sourceRepository,
      filepath,
      organization,
      resourceLinks,
    };
    setResumedState(_resumedState);
  }, []);

  useEffect(() => {
    /* loadFromPermalink() bypasses resumedState, maybe it would be better to try to
    * resumestate and if something is saved in cache ask the user if they want to
    * resume their work or continue to link.
    */
    loadFromPermalink().then((success) => !success && resumeState());
  }, [resumeState,loadFromPermalink]);

  const _props = { ...props, ...resumedState };

  return !resumedState ? (
    <></>
  ) : (
    <AppContextProvider {..._props}>
      <ConfirmContextProvider>
        <AppComponent {...props} />
      </ConfirmContextProvider>
    </AppContextProvider>
  );
}

export default App;
