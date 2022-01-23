import {
  Paper, Popper, Typography,
} from '@material-ui/core';
import React, { useEffect, useCallback } from 'react';

function HighlightPopper({ id, message }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [phraseElements, setPhraseElements] = React.useState(null);

  const isMouseOver = (elPos, pointer) => {
    if ((pointer.x > elPos.left) && (pointer.x < elPos.right) && (pointer.y < elPos.bottom) && (pointer.y > elPos.top)) {
      return true;
    }
  };

  const onMouseEnter = useCallback((e) => {
    const currentPhrases = e.target.querySelectorAll(`.phrase-${id}`) || [];

    if (currentPhrases.length > 0) {
      setPhraseElements(currentPhrases);
    }
  },[id]);

  const onMouseLeave = useCallback(() => {
    setAnchorEl(null);
    setPhraseElements(null);
  }, []);

  const onMouseUp = useCallback((e) => {
    if (phraseElements) {
      let clickedELement = null;

      for (const element of phraseElements) {
        const elPos = element.getBoundingClientRect();
        const mouseOver = isMouseOver(elPos, { x: e.pageX, y: e.pageY });

        if (mouseOver) {
          clickedELement = element;
        };
      }
      setAnchorEl(clickedELement);
    }
  }, [phraseElements]);

  useEffect(() => {
    const containers = document.querySelectorAll(`.hl-container`) || [];

    containers.forEach(container => {
      container.parentNode.addEventListener('mouseenter', onMouseEnter);
      container.parentNode.addEventListener('mouseleave', onMouseLeave);
      container.parentNode.addEventListener('mouseup', onMouseUp);
    });

    return () => {
      containers.forEach(container => {
        if (!container?.parentNode) {
          return;
        }
        container.parentNode.removeEventListener('mouseenter', onMouseEnter);
        container.parentNode.removeEventListener('mouseleave', onMouseLeave);
        container.parentNode.removeEventListener('mouseup', onMouseUp);
      });
    };
  },[id, onMouseEnter, onMouseLeave, onMouseUp]);
  return message && (
    <Popper id={`popper-${id}`} open={Boolean(anchorEl)} anchorEl={anchorEl} placement="top" style={{ marginBottom: '0.25rem' }}>
      <Paper elevation={3}><Typography variant="body1" color="initial" style={{ padding: '0.5rem' }}>{message}</Typography></Paper>
    </Popper>
  );
}

export default HighlightPopper;