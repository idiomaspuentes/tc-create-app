import React, { useMemo, useCallback, useContext } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Grid,
  Chip,
  Tooltip,
} from '@material-ui/core';
import Path from 'path';

import {
  Publish,
  GetApp,
} from '@material-ui/icons';
import { License } from 'scripture-resources-rcl';

import { AppContext } from '../../App.context';
import { getLanguage } from '../languages/helpers';
import { localString } from '../../core/localStrings';
import { SERVER_URL } from '../../core/state.defaults';

function FilesHeader({
  sourceRepository,
  targetRepository,
  sourceFile,
  targetFile,
  language,
}) {
  const appContext = useContext(AppContext);

  const classes = useStyles({ header: { cursor: 'pointer' } });

  const openLink = useCallback((link) => window.open(link, '_blank'), []);

  const chip = useCallback(({
    label, onDelete, style, onClick, deleteIcon, iconTooltip, deleteIconTooltip, licenseLink,
  }) => (
    <Chip
      onClick={onClick}
      icon={<License rights='View License' licenseLink={licenseLink} /> }
      label={<Tooltip title={localString(iconTooltip)} arrow><span>{label}</span></Tooltip>}
      onDelete={onDelete}
      deleteIcon={<Tooltip title={localString(deleteIconTooltip)} arrow>{deleteIcon}</Tooltip>}
      variant="outlined"
      className={classes.header}
      style={style}
    />
  ), [classes.header]);
  const sourceBranch = sourceRepository.branch || sourceRepository.default_branch;
  const targetBranch = targetRepository.branch || targetRepository.default_branch;

  let sourceCompareLink, targetCompareLink;
  const sourceLanguage = getLanguage({ 
    languageId: sourceRepository.name.split('_')[0],
    languagesJSON: appContext.state.languages,
  });
  const sourceOwner = sourceRepository.owner.username;
  const targetOwner = targetRepository.owner.username;

  if (sourceLanguage.languageName === language.languageName) {
    if (sourceRepository.full_name === targetRepository.full_name) {
      sourceCompareLink = `${targetRepository.html_url}/compare/${targetBranch}...${sourceBranch}`;
      targetCompareLink = `${sourceRepository.html_url}/compare/${sourceBranch}...${targetBranch}`;
    } else {
      sourceCompareLink = `${sourceRepository.html_url}/compare/${sourceBranch}...${targetOwner}:${targetBranch}`;
      targetCompareLink = `${targetRepository.html_url}/compare/${targetBranch}...${sourceOwner}:${sourceBranch}`;
    }
  } else {
    sourceCompareLink = `${targetRepository.html_url}/compare/${targetBranch}...master`;
    targetCompareLink = `${targetRepository.html_url}/compare/master...${targetBranch}`;
  }

  const sourceChip = useMemo(() => {
    const { full_name } = sourceRepository;
    let label = `${sourceLanguage.languageName} - ${full_name}/${sourceBranch}`;
    let openDcsLink = sourceFile.html_url;
    let licenseLink= sourceRepository.html_url + '/src/branch/' + sourceBranch + '/LICENSE.md';

    // test for translator role and override lable, dcs link and compare link
    if ( full_name !== targetRepository.full_name && sourceRepository?.catalog?.prod?.branch_or_tag_name) {
      // https://qa.door43.org/unfoldingWord/en_tn/src/tag/v47/en_tn_66-JUD.tsv
      const prodTag = sourceRepository.catalog.prod.branch_or_tag_name;
      label = `${sourceLanguage.languageName} - ${full_name}/${prodTag}`;
      openDcsLink = SERVER_URL + "/" + Path.join('unfoldingword',sourceRepository.name,'src','tag', prodTag, sourceFile.path);
      licenseLink = SERVER_URL + "/" + Path.join('unfoldingword',sourceRepository.name,'src','tag', prodTag, 'LICENSE.md')
    }
    const onClick = () => openLink(openDcsLink);
    const onDelete = () => sourceCompareLink && openLink(sourceCompareLink);
    const style = { background: '#fff9' };
    const deleteIcon = <GetApp />;
    const iconTooltip='OpenSourceText';
    const deleteIconTooltip = 'CompareSource';
    return chip({
      label, onDelete, style, onClick, deleteIcon, iconTooltip, deleteIconTooltip, licenseLink,
    });
  }, [sourceRepository, targetRepository, sourceFile, chip, openLink, sourceCompareLink, sourceBranch, sourceLanguage.languageName]);

  const targetChip = useMemo(() => {
    const { full_name } = targetRepository;
    const label = `${language.languageName} - ${full_name}/${targetBranch}`;
    const onClick = () => openLink(targetFile.html_url);
    const style = { background: '#fff9' };
    const onDelete = () => targetCompareLink && openLink(targetCompareLink);
    const deleteIcon = <Publish />;
    const iconTooltip='OpenTargetText';
    const deleteIconTooltip = 'CompareTarget';
    const licenseLink= targetRepository.html_url +
      '/src/branch/' + targetBranch + '/LICENSE.md';
    return chip({
      label, onDelete, style, onClick, deleteIcon, iconTooltip, deleteIconTooltip, licenseLink,
    });
  }, [targetRepository, language, targetFile.html_url, chip, openLink, targetCompareLink, targetBranch]);

  return (
    <Grid className={classes.headers} container wrap="nowrap" spacing={2}>
      <Grid item xs={12}>
        {sourceChip}
      </Grid>
      <Grid item xs={12}>
        {targetChip}
      </Grid>
    </Grid>
  );
}

const useStyles = makeStyles(theme => ({
  headers: { marginBottom: `${theme.spacing(0.5)}px` },
  header: {
    justifyContent: 'space-between',
    width: '100%',
  },
}));

export default FilesHeader;