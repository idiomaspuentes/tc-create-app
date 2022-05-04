import data from './bcv.json';

export const bookData = ({ bookId }) => {
  const _bookData = data.filter(row => row.id === bookId)[0];
  return _bookData;
};

export const testament = ({ bookId }) => {
  const book = bookData({ bookId });
  return (book) ? book.testament : null;
};

export const chaptersInBook = ({ bookId }) => {
  let chapters = [];

  if (bookId === 'obs') {
    chapters = [...Array(50).keys()].map(i => i + 1);
  } else {
    const book = bookData({ bookId });

    if (book) {
      chapters = book.chapters;
    }
  }
  return chapters;
};

export const versesInChapter = ({ bookId, chapter }) => {
  const verses = chaptersInBook({ bookId })[chapter - 1];
  return verses;
};

export const validateBookId = (reference) => {
  let valid;

  if (reference.bookId === 'obs') {
    valid = true;
  } else if (reference.bookId && !!bookData(reference)) {
    valid = true;
  }
  return valid;
};

export const validateChapter = (reference) => {
  const dependencies = (validateBookId(reference));
  const chapters = chaptersInBook(reference);
  const valid = (dependencies && !!chapters[reference.chapter - 1]);
  return valid;
};

export const validateVerse = (reference) => {
  const dependencies = (validateBookId(reference) && validateChapter(reference));
  const chapters = chaptersInBook(reference);
  const verseCount = chapters[reference.chapter];
  const inRange = (verseCount && reference.verse <= verseCount);
  return (dependencies && inRange);
};

export const validateReference = ({ reference }) => {
  let valid = false;
  const {
    bookId, chapter, verse,
  } = reference;
  const blankReference = (!bookId && !chapter && !verse);
  const validBookId = validateBookId(reference);
  const validChapter = validateChapter(reference);
  const validVerse = (verse) ? validateVerse(reference) : true;

  if (blankReference) {
    valid = true;
  } else if (validBookId && !chapter && !verse) {
    valid = true;
  } else if (validBookId && validChapter && !verse) {
    valid = true;
  } else if (validBookId && validChapter && validVerse) {
    valid = true;
  }
  return valid;
};
