import React, { useContext, useState, useCallback, useEffect } from 'react';
import { MuiThemeProvider } from '@material-ui/core/styles';
import Headroom from 'react-headroom';
import {
  ApplicationBar,
  AuthenticationContextProvider,
  RepositoryContextProvider,
  FileContextProvider,
  OrganizationContextProvider,
} from 'gitea-react-toolkit';

import DrawerMenu from './components/drawer-menu/DrawerMenu';
import { loadState } from './core/persistence';
import Workspace from './Workspace';

import theme from './theme';

import { AppContext, AppContextProvider } from './App.context';

const { version } = require('../package.json');
const title = `translationCore Create - v${version}`;

function AppComponent() {
  const { state, actions } = useContext(AppContext);
  const {
    authentication,
    sourceRepository,
    filepath,
    fontScale,
    config,
    organization,
  } = state;
  const {
    setAuthentication,
    setSourceRepository,
    setOrganization,
    setFilepath,
  } = actions;

  const drawerMenu = <DrawerMenu />;

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
              >
                <header id='App-header'>
                  <Headroom style={style.headroom}>
                    <ApplicationBar
                      title={title}
                      // buttons={buttons}
                      drawerMenu={drawerMenu}
                    />
                  </Headroom>
                </header>
                <div style={style.workspace}>
                  <Workspace />
                </div>
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
    const organization = await loadState('organization');
    const authentication = await loadState('authentication');
    const language = await loadState('language');
    const sourceRepository = await loadState('sourceRepository');
    const resourceLinks = await loadState('resourceLinks');
    const filepath = await loadState('filepath');
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
