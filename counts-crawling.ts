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

function saveDictValuesToFile(dict: any, filePath: string) {
  fs.writeFileSync(filePath, JSON.stringify(dict));
}

function loadCurrentWords(filePath: string) {
  const read = fs.readFileSync(filePath, 'utf-8');
  // console.log('Read: ' + read);
  const json = JSON.parse(read);
  return json;
}

function addWordToJson(word: string, object: object) {
  if (object[word] === undefined) {
    object[word] = 0;
  }

  object[word] += 1;
}

async function refreshDictionaryFromChitanka(textId: number) {
  const targetPath = 'words-with-counts.json';

  const wordsWithCounts = loadCurrentWords(targetPath);
  const length = Object.keys(wordsWithCounts).length;
  console.log(`Fetched ${length} words`);

  const backupDir = `dontgitme/backup/withcounts_backup${length}`;
  console.log(`Saving backup to ${backupDir}`);
  saveDictValuesToFile(wordsWithCounts, backupDir);

  console.log(`Reading text with id ${textId}`);
  const webUrl = `https://chitanka.info/text/${textId}/0`;

  await getAllParWordsFrom(webUrl).then((words) => {
    words.forEach((word) => {
      addWordToJson(word, wordsWithCounts);
    });
    console.log('Added all words');
  });

  const newLength = Object.keys(wordsWithCounts).length;
  console.log(`Saving ${newLength} words to ${targetPath}`);
  saveDictValuesToFile(wordsWithCounts, targetPath);
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

    const randomId = getRandomInt(100, 40000);
    await refreshDictionaryFromChitanka(randomId);

    console.log(`Sleeping for ${randomIntervalSeconds}s...`);
    await sleep(randomIntervalSeconds);
  }
}

main();
// refreshDictionaryFromChitanka(1000);
