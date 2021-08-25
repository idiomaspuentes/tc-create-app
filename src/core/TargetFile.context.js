import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useFile, FileContext } from 'gitea-react-toolkit';
import { AppContext } from '../App.context';

const TargetFileContext = React.createContext();

function TargetFileContextProvider({
  onOpenValidation, 
  children
}) {
  const {
    state: {
      authentication, targetRepository, filepath, setFilepath,
    } = {},
  } = useContext(AppContext);

  const { state: sourceFile, stateValues: sourceStateValues } = useContext(FileContext) || {};

  const appContext = useContext(AppContext);
  const sourceContext = useContext(FileContext);

  /* Some useful debugging logs left here for the future.
  console.log("--TargetFileContextProvider--");
  console.log("app context:", appContext);
  console.log("source file context:", sourceContext);
  console.log("target repository:",targetRepository);
  console.log("filepath:", filepath);
  */

  let _defaultContent;
  if ( appContext?.state?.sourceRepository?.id === appContext?.state?.targetRepository?.id ) {
    // this is the editor role; they need latest content from master
    // to be on the source side and as the default content 
    // if a new file is being edited.
    _defaultContent = sourceFile && sourceFile.content;
  } else {
    // this is the translator role; they require the source side content
    // to be from the published catalog. For now this is latest prod content.
    // it also needs to be the default content.
    _defaultContent = sourceContext?.state?.publishedContent;
    // also replease the source content
    sourceFile.content = _defaultContent;
  }

  const {
    state, stateValues, actions, component, components, config,
  } = useFile({
    config: (authentication && authentication.config),
    authentication,
    repository: targetRepository,
    filepath,
    onFilepath: setFilepath,
    defaultContent: _defaultContent,
    onOpenValidation: onOpenValidation,
    onConfirmClose: null,
  });

  const context = {
    state: { ...state }, 
    stateValues,
    sourceStateValues,
    actions: { ...actions }, 
    component,
    components,
    config,
  };

  return (
    <TargetFileContext.Provider value={context}>
      {children}
    </TargetFileContext.Provider>
  );
};

TargetFileContextProvider.propTypes = {
  /** Children to render inside of Provider */
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node,
  ]).isRequired,
};

export {
  TargetFileContextProvider,
  TargetFileContext,
};
