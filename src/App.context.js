import React, { useEffect, 
  //useState //uw-languages-rcl
} from 'react';

// import { loadState } from './core/persistence';
import { useStateReducer } from './core/useStateReducer';
import { useLanguages } from 'uw-languages-rcl';

export const AppContext = React.createContext();

export function AppContextProvider({
  authentication: __authentication,
  language: __language,
  sourceRepository: __sourceRepository,
  filepath: __filepath,
  organization: __organization,
  children,
  resourceLinks: __resourceLinks,
  contentIsDirty: __contentIsDirty
}) {
  const [state, actions] = useStateReducer({
    authentication: __authentication,
    language: __language,
    sourceRepository: __sourceRepository,
    filepath: __filepath,
    organization: __organization,
    resourceLinks: __resourceLinks,
    contentIsDirty: __contentIsDirty,
  });
  // uw-languages-rcl
  const { state: languages } = useLanguages();

  const {
    authentication, language, sourceRepository, organization,
  } = state;

  const { setTargetRepoFromSourceRepo } = actions;

  const authMemo = authentication && JSON.stringify(authentication);

  useEffect(() => {
    if (authMemo && sourceRepository && organization) {
      const _authentication = JSON.parse(authMemo);

      setTargetRepoFromSourceRepo({
        authentication: _authentication,
        sourceRepository,
        language,
        organization,
      });
    }
  }, [
    authMemo,
    sourceRepository,
    language,
    setTargetRepoFromSourceRepo,
    organization,
  ]);

  const value = {
    state: {...state, languages},
    actions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
