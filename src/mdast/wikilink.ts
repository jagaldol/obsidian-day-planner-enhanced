const asciiPunctuation = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
// Unicode reserves these 32 code points for internal, non-interchange use.
const protectionStart = 0xfdd0;

const wikilinkRegExp = /!?\[\[[^\r\n]*?\]\]/gu;
const protectedPunctuationRegExp = /[\uFDD0-\uFDEF]/gu;

function protectPunctuation(input: string) {
  return input.replace(/[!-/:-@[-`{-~]/gu, (character) => {
    const index = asciiPunctuation.indexOf(character);

    if (index === -1) {
      return character;
    }

    return String.fromCharCode(protectionStart + index);
  });
}

const protectedWikilinkRegExp = new RegExp(
  `${protectPunctuation("!")}?${protectPunctuation(
    "[[",
  )}[^\r\n]*?${protectPunctuation("]]")}`,
  "gu",
);

function restorePunctuation(input: string) {
  return input.replace(protectedPunctuationRegExp, (character) => {
    const index = character.charCodeAt(0) - protectionStart;

    return asciiPunctuation.at(index) ?? character;
  });
}

/**
 * Shields Obsidian wikilinks from CommonMark parsing while preserving UTF-16
 * length so mdast source positions continue to match the original note.
 */
export function protectWikilinks(input: string) {
  return input.replace(wikilinkRegExp, protectPunctuation);
}

/** Restores only complete wikilinks produced by {@link protectWikilinks}. */
export function restoreWikilinks(input: string) {
  return input.replace(protectedWikilinkRegExp, restorePunctuation);
}
