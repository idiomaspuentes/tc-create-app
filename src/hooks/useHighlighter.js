import React, {
  useCallback, useEffect, useState, useMemo,
} from 'react';

import { uuid } from 'uuidv4';
import HighlightPopper from './HighlightPopper';

/**
 * Highlights given phrases contained in given HtmlElement
 * @constructor
 * @param {HTMLElement} table - The title of the book.
 * @param {Object[]} phrases - The author of the book.
 * @param {string} phrases[].phrase - The phrase to highlight.
 * @param {string} [phrases[].message] - The message to show in popup.
 * @returns {Array} - Array of utility functions (addPhrase, removePhrase).
 */
const useHighlighter = ({
  table, phrases, tableChanged,
}) => {
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  const [highlightAdded, setHighlightAdded] = useState(false);
  const [_phrases, setPhrases] = useState([]);

  if (phrases) {
    setPhrases(phrases);
  }

  /**
  * Add a phrase to highlighter
  * @constructor
  * @param {Object} newPhrase - A phrase describer.
  * @param {string} newPhrase.phrase - The phrase to highlight.
  * @param {string} [newPhrase.message] - The message to show in popup.
  */
  const addPhrase = (newPhrase) => {
    if (!_phrases.some(({ phrase }) => phrase === newPhrase.phrase)){
      setPhrases([..._phrases, { ...newPhrase, id: uuid().slice(1, 6) }]);
    }
  };

  /**
  * Removes a phrase from highlighter
  * @constructor
  * @param {string} phraseToRemove - The phrase to remove from highlighter.
  */
  const removePhrase = (phraseToRemove) => {
    setPhrases(phrases.filter(({ phrase }) => phrase !== phraseToRemove));
  };

  const highlightContainer = useCallback((element, phrases, regexp) => {
    const getNewContent = (content, phrases, regexp) => {
      let anyAreFound = false;
      const newContent = content.replaceAll(regexp, (found) => {
        anyAreFound = true;
        const words = found.split(' ');
        const phrase = phrases.find(({ phrase }) => phrase === found);
        const newWords = words.map((word) => `<span aria-describedby="popper-${phrase.id}" class="phrase-${phrase.id} hl-word">${word}</span>`);
        return newWords.join(' ');
      });
      return anyAreFound && newContent;
    };

    const newContent = getNewContent(element.innerHTML, phrases, regexp);

    if (newContent) {
      const wrapper = element.cloneNode();
      wrapper.contentEditable = false;
      wrapper.classList.add('hl-container');
      wrapper.innerHTML = newContent;
      element.parentNode.style.position = 'relative';
      element.parentNode.insertBefore(wrapper, element);
      const onInput = (e) => {
        wrapper.innerHTML = getNewContent(e.target.innerHTML, phrases, regexp);
      };
      element.addEventListener('input', onInput);
      return { wrapper, onInput };
    }
  },[]);

  const highLight = useCallback((phrases) => {
    let wrappersList = [];

    const pattern = phrases.map(({ phrase }) => escapeRegExp(phrase)).join('|');
    const regexp = new RegExp(pattern, 'g');
    const elements = document.querySelectorAll('[contenteditable=true]');
    setHighlightAdded(false);

    for (const element of elements) {
      const wrapper = highlightContainer(element, phrases, regexp);

      if (wrapper) {
        wrappersList = [...wrappersList, wrapper];
      }

      if (element === elements[elements.length - 1]) {
        setHighlightAdded(true);
      }
    }
    return wrappersList;
  }, [highlightContainer]);

  useEffect(() => {
    let wrappers = [];

    if (table && _phrases.length > 0 && tableChanged) {
      wrappers = highLight(_phrases);
    }
    return () => wrappers && wrappers?.forEach(({ wrapper, onInput }) => {
      wrapper.removeEventListener('input', onInput);
      wrapper.remove();
    });
  }, [highLight, table, _phrases, tableChanged]);

  const poppers = useMemo(() => highlightAdded && <>{_phrases.map(({ id, message }) => message && <HighlightPopper key={id} id={id} message={message}></HighlightPopper>)}</>
    ,[_phrases, highlightAdded]);

  return {
    removePhrase, addPhrase, poppers,
  };
};

export default useHighlighter;