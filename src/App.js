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

import { DrawerMenu } from './components/';

import {
  loadState,
  loadAuthentication,
  saveAuthentication,
} from './core/persistence';

import Workspace from './Workspace';

import theme from './theme';

import { AppContext, AppContextProvider } from './App.context';
import { getCommitHash } from './utils';
import { localString } from './core/localStrings';
import { onOpenValidation } from './core/onOpenValidations';

import { Typography, Link } from '@material-ui/core';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@material-ui/core';
import { useBeforeunload } from 'react-beforeunload';

const { version } = require('../package.json');
const commitHash = getCommitHash(); 
const title = `translationCore Create - v${version}`;

function AppComponent() {
  // this state manage on open validation 
  const [criticalErrors, setCriticalErrors] = useState([]);

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
  }

  const handleClose = useCallback( () => {
    setCriticalErrors([]);
    setSourceRepository(undefined);
  }, [setCriticalErrors, setSourceRepository]);

  const _onConfirmClose = useCallback(() => {
    if (contentIsDirty) {
      const doClose = window.confirm(localString('ConfirmCloseWindow'));
      return doClose;
    } else {
      return true;
    }
  }, [contentIsDirty]);
 
  useBeforeunload((event) => {
    if (contentIsDirty) {
      event.preventDefault();
      event.returnValue = localString('ConfirmCloseWindow');
      return localString('ConfirmCloseWindow');
    }
  });

  const onHeadroomPin = () =>
  {
    const el = document.querySelector("#translatableComponent div div[role='toolbar']");
    if (el)
    {
      el.style.top = '64px';
    }
  }

  const onHeadroomUnfix = () =>
  {
    const el = document.querySelector("#translatableComponent div div[role='toolbar']");
    if (el)
    {
      el.style.top = '0px';
    }
  }

  const onHeadroomUnpin = () =>
  {
    const el = document.querySelector("#translatableComponent div div[role='toolbar']");
    if (el)
    {
      el.style.top = '0px';
    }
  }

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
                onConfirmClose={_onConfirmClose}
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
                        criticalErrors.map( (msg,idx) => {
                          return (
                            <>
                            <Typography key={idx}>
                              On <Link href={msg[0]} target="_blank" rel="noopener">
                                line {msg[1]}
                              </Link>
                              &nbsp;{msg[2]}&nbsp;{msg[3]}&nbsp;{msg[4]}&nbsp;{msg[5]}
                            </Typography>
                            </>
                          )
                      })}
                        <br/>
                        <Typography key="footer" >Please take a screenshot and contact your administrator.</Typography>
                      </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleClose} color="primary">
                        Close
                      </Button>
                    </DialogActions>
                  </Dialog>
                ) 
                ||
                (
                  <>
                  <Headroom pinStart={64} style={style.headroom}
                    onPin={()=>{onHeadroomPin();}} onUnfix={()=>{onHeadroomUnfix();}} onUnpin={()=>{onHeadroomUnpin();}}
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
      </MuiThemeProvider>
    </div>
  );
}

function App(props) {
  const [resumedState, setResumedState] = useState();

  const resumeState = useCallback(async () => {
    // note that the authentication context manages its own
    // state via provided persistence load and save closures
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
    resumeState();
  }, [resumeState]);

  const _props = { ...props, ...resumedState };

  return !resumedState ? (
    <></>
  ) : (
    <AppContextProvider {..._props}>
      <AppComponent {...props} />
    </AppContextProvider>
  );
}

export default App;
