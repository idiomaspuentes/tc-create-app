import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import { makeStyles } from '@material-ui/core/styles';
import { NoSsr } from '@material-ui/core';

import { AppContext } from '../../App.context';
import { getLanguage } from './helpers';
import * as components from './Components';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    height: 250,
  },
  input: {
    display: 'flex',
    marginBottom: `${theme.spacing(0.5)}px`,
  },
  valueContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    flex: 1,
    alignItems: 'center',
    // overflow: 'hidden',
  },
  noOptionsMessage: { padding: `${theme.spacing(1)}px ${theme.spacing(2)}px` },
  singleValue: { fontSize: 16 },
  placeholder: {
    position: 'absolute',
    left: 2,
    fontSize: 16,
  },
  paper: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing(1),
    left: 0,
    right: 0,
  },
  divider: { height: theme.spacing(2) },
}));

function LanguageSelect({ language, onLanguage }) {
  const appContext = useContext(AppContext);
  const classes = useStyles();

  const handleChange = (object) => {
    const languageId = object.langId;
    const _language = getLanguage({ languageId, languagesJSON: appContext.state.languages });
    onLanguage(_language);
  };

  const getOrgLanguages = () => {
    return appContext.state.organization.repo_languages || ['']
  }

  const orgOptions = getOrgLanguages().map( (langId) => {
      const formattedLanguage = getLanguage({languageId: langId, languagesJSON: appContext.state.languages});
      //const value = formattedLanguage.languageId;
      // test whether formattedLanguage has any properties.
      // if it doesn't, then that means that the org has no languages for resources
      let label;
      if ( formattedLanguage.languageName ){
        const name = `${langId} - ${formattedLanguage.languageName} - ${formattedLanguage.localized}`;
        const gatewayLabel = `(${formattedLanguage.region} ${formattedLanguage.gateway ? 'Gateway' : 'Other'})`;
        label = `${name} ${gatewayLabel}`;
      }
      return { langId, label };
    }
  );

  /*
  const options = gatewayLanguages.map(
    ({
      languageId, languageName, localized, region, gateway,
    }) => {
      const value = languageId;
      const name = `${languageId} - ${languageName} - ${localized}`;
      const gatewayLabel = `(${region} ${gateway ? 'Gateway' : 'Other'})`;
      const label = `${name} ${gatewayLabel}`;
      return { value, label };
    }
  );
  */
  let value;

  if (language) {
    value = orgOptions.filter((object) => object.value === language.languageId)[0];
  }

  return (
    <div className={classes.root}>
      {
        orgOptions[0].label === undefined ? 
        (
          <div><p>No Languages Found</p></div>
        )
        :
        (
          <NoSsr>
            <Select
              className="language-select-dropdown"
              classes={classes}
              options={orgOptions}
              components={components}
              value={value}
              onChange={handleChange}
              placeholder="Select Language"
          />
            <div className={classes.divider} />
          </NoSsr>
        )
      }
    </div>
  );
}

LanguageSelect.propTypes = {
  language: PropTypes.object,
  onLanguage: PropTypes.func.isRequired,
};

export default LanguageSelect;
