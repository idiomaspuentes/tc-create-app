import { useCallback, useReducer } from 'react';
import { ensureRepo } from 'gitea-react-toolkit';

import { stateReducer } from './state.reducer';
import { saveState } from './persistence';
import defaults from './state.defaults';

export const useStateReducer = ({
  authentication,
  language,
  sourceRepository,
  filepath,
  organization,
  resourceLinks,
  contentIsDirty,
}) => {
  const _defaults = {
    ...defaults,
    authentication,
    sourceRepository,
    language,
    filepath,
    organization,
    resourceLinks,
    contentIsDirty,
  };
  const [state, dispatch] = useReducer(stateReducer, _defaults);

  const setOrganization = useCallback(
    (value) => {
      if (value !== state.organization) {
        dispatch({ type: 'set_organization', value });
        saveState('organization', value);
      }
    },
    [state.organization]
  );

  const setValidationPriority = useCallback( (value) => {
    dispatch({ type: 'set_validation_priority', value });
  }, []);

  const setFontScale = useCallback((value) => {
    dispatch({ type: 'set_font_scale', value });
  }, []);

  const setExpandedScripture = useCallback((value) => {
    dispatch({ type: 'set_expanded_scripture', value });
  }, []);

  const setConfig = useCallback((value) => {
    dispatch({ type: 'set_config', value });
  }, []);

  const setSourceRepository = useCallback((value) => {
    dispatch({ type: 'set_source_repository', value });
    saveState('sourceRepository', value);

    if (!value) {
      dispatch({ type: 'set_target_repository' });
    }
  }, []);

  const setFilepath = useCallback(
    (value) => {
      if (value !== state.filepath) {
        dispatch({ type: 'set_filepath', value });
        saveState('filepath', value);
      }
    },
    [state.filepath]
  );

  const setLanguage = useCallback(
    (value) => {
      if (value !== state.language) {
        dispatch({ type: 'set_language', value });
        saveState('language', value);

        if (!value) {
          setSourceRepository();
        } // reset if no language
      }
    },
    [state.language, setSourceRepository]
  );

  const clearState = useCallback(() => {
    setOrganization();
    setSourceRepository();
    setLanguage();
    setFilepath();
  }, [setFilepath, setLanguage, setOrganization, setSourceRepository]);

  const setAuthentication = useCallback(
    (value) => {
      if (JSON.stringify(value) !== JSON.stringify(state.authentication)) {
        dispatch({ type: 'set_authentication', value });
        /*
        saveState('authentication', value);
        */

        if (!value) {
          //logged out reset state
          clearState();
        }
      }
    },
    [clearState, state.authentication]
  );

  const setTargetRepository = useCallback((value) => {
    dispatch({ type: 'set_target_repository', value });
  }, []);

  const setTargetRepoFromSourceRepo = useCallback(
    ({
      authentication, sourceRepository, language, organization,
    }) => {
      if (authentication && sourceRepository && language) {
        const repositoryNameArray = sourceRepository.name.split('_');
        const resourceNameArray = repositoryNameArray.slice(1);
        const translationRepoName = `${
          language.languageId
        }_${resourceNameArray.join('_')}`;
        const branch = `${authentication.user.username}-tc-create-1`;
        const owner = organization.username;
        const { description } = sourceRepository;
        const params = {
          owner,
          repo: translationRepoName,
          config: authentication.config,
          settings: { description },
          branch,
        };

        ensureRepo(params)
          .then((res) => {
            const repo = { ...res, branch };
            setTargetRepository(repo);
          })
          .catch((err) => {
            setTimeout(() => {
              clearState();
              alert(
                `The organization "${owner}" does not contain the selected translation ${language.languageName} for the repository "${description}"\nPlease make sure that your repository has been set up correctly by your organization administrator.`
              );
            }, 200);
            console.error(err);
          });
      } else {
        setTargetRepository();
      }
    },
    [clearState, setTargetRepository]
  );

  const setResourceLinks = useCallback(
    (value) => {
      if (value !== state.resourceLinks) {
        dispatch({ type: 'set_resource_links', value });
        saveState('resourceLinks', value);
      }
    },
    [state.resourceLinks]
  );

  const setContentIsDirty = useCallback(
    (value) => {
      if (value !== state.contentIsDirty) {
        dispatch({ type: 'set_content_is_dirty', value });
        saveState('contentIsDirty', value);
      }
    },
    [state.contentIsDirty]
  );

  const actions = {
    setAuthentication,
    setLanguage,
    setFontScale,
    setExpandedScripture,
    setConfig,
    setResourceLinks,
    setContentIsDirty,
    setSourceRepository,
    setTargetRepository,
    setTargetRepoFromSourceRepo,
    setFilepath,
    setOrganization,
    setValidationPriority,
  };
  return [state, actions];
};
