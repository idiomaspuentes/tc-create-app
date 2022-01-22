import {
  useCallback, useEffect, useState,
} from 'react';
import { uuid } from 'uuidv4';

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
  console.log({ table });
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
    console.log('adding phrase');

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
      console.log('getting new content');
      let anyAreFound = false;
      const newContent = content.replaceAll(regexp, (found) => {
        anyAreFound = true;
        const words = found.split(' ');
        const phrase = phrases.find(({ phrase }) => phrase === found);
        console.log(phrase.id);
        const newWords = words.map((word) => `<span id="${phrase.id}" class="hl-word">${word}</span>`);
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
      console.log('adding new event listener');
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

    for (const element of document.querySelectorAll('[contenteditable=true]')) {
      const wrapper = highlightContainer(element, phrases, regexp);

      if (wrapper) {
        wrappersList = [...wrappersList, wrapper];
      }
    }
    return wrappersList;
  }, [highlightContainer]);

  useEffect(() => {
    let wrappers = [];

    if (table && _phrases.length > 0 && tableChanged) {
      console.log({ _phrases });
      wrappers = highLight(_phrases);
      console.log(' repair ');
      console.log({ wrappers });
    }
    return () => wrappers && wrappers?.forEach(({ wrapper, onInput }) => {
      console.log('cleaning mess.');
      wrapper.removeEventListener('input', onInput);
      wrapper.remove();
    });
  }, [highLight, table, _phrases, tableChanged]);

  return { removePhrase, addPhrase };
};

export default useHighlighter;