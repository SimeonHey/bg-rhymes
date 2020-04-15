import * as rp from 'request-promise';
import * as cheerio from 'cheerio';
import * as fs from 'fs';

function getWordsInStrnig(str: string, separators: string[]) {
  const allRegExp = separators.map((sVal: string) => new RegExp(sVal));
  const reducedRegExp = allRegExp.reduce(
    (reduced: RegExp, current: RegExp) =>
      new RegExp(reduced.source + '|' + current.source)
  );

  return str.trim().split(reducedRegExp);
}

function isWordCyrilic(word: string) {
  return new RegExp('^[w\u0430-\u044f]+$').test(word);
}

async function getAllParWordsFrom(url: string) {
  const promise = rp.get(url);

  const data = await promise;
  const $ = cheerio.load(data);
  const paragraphsText = $('p').text();
  const wordsSplit = getWordsInStrnig(paragraphsText, [' ', '\n']);
  const cyrilicWords = wordsSplit.filter(isWordCyrilic);
  return cyrilicWords;
}

function saveDictValuesToFile(dict: Set<string>, filePath: string) {
  console.log(`Saving ${dict.size} values to ${filePath}`);
  fs.writeFileSync(filePath, Array.from(dict.values()));
}

function loadCurrentWords(filePath: string) {
  const text = fs.readFileSync(filePath).toString('utf-8');
  const words = text.split(',');
  console.log(`Fetched ${words.length} words`);

  return new Set<string>(words);
}

async function refreshDictionaryFromChitanka(textId: number) {
  const dictionary = loadCurrentWords('dict.csv');
  const backupSize = dictionary.size;

  const backupDir = `dontgitme/backup/countIs${backupSize}`;
  console.log(`Saving backup to ${backupDir}`);
  saveDictValuesToFile(dictionary, backupDir);

  const webUrl = `https://chitanka.info/text/${textId}/0`;

  await getAllParWordsFrom(webUrl).then((words) => {
    words.forEach((word) => {
      dictionary.add(word);
    });
    console.log('Added all words');
  });

  console.log('Saving dict');
  saveDictValuesToFile(dictionary, 'no-count-words.csv');
}

const randomIntervalSeconds = 5;

function sleep(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

function getRandomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * Math.floor(max));
}

async function main() {
  while (true) {
    console.log('\n\n----------\nWoken up!');

    const randomId = getRandomInt(100, 4000);
    await refreshDictionaryFromChitanka(randomId);

    console.log(`Sleeping for ${randomIntervalSeconds}s...`);
    await sleep(randomIntervalSeconds);
  }
}

main();
