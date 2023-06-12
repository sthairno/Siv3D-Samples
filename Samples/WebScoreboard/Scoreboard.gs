const Spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
const ScoreboardSheet = Spreadsheet.getSheets()[0];
const QuerySheet = Spreadsheet.getSheets()[1];
const ResultSheet = Spreadsheet.getSheets()[2];
const DefaultScore = 0;

/**
 * シート「検索クエリ」のセルB2に値を設定
 * @param {string} value クエリ
 */
function query(value)
{
  QuerySheet.getRange(2, 2).setValue(value);
}

/**
 * 値をnumber型に変換し、失敗した場合はDefaultScoreを返す
 * @param {any} value ユーザー名
 */
function parseScore(value)
{
  if (typeof(value) === "number" &&
    isFinite(value))
  {
    return value;
  }

  if (typeof(value) === "string" &&
    value.match(/^[+-]?(\d*[.])?\d+$/g))
  {
    return parseFloat(value);
  }

  return DefaultScore;
}

/**
 * スコアを追加
 * @param {string} username ユーザー名
 * @param {number} score スコア
 */
function pushScore(username, score)
{
  // 日本時間、現在のタイムスタンプを作成
  let timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');

  // ユーザー名が正しくない場合は匿名にする
  if (typeof(username) !== "string" ||
    username.length == 0)
  {
    username = "[匿名]";
  }

  // スコアを読み込む
  score = parseScore(score);

  // スコアデータを追加
  ScoreboardSheet.appendRow([
    timestamp, username, score
  ]);
}

/**
 * 上位のスコアを取得
 * @param {number} count 取得個数
 * @return {{ username: string, score: number }[]} スコアの一覧
 */
function getTopScores(count=10)
{
  // クエリ文字列を設定
  query(`select B, C where A is not null order by C desc limit ${count}`);

  let srcData = ResultSheet.getDataRange().getValues();
  let labelList = srcData.shift();
  
  let dstData = srcData;

  // データの形式を変換
  dstData = dstData.map(row => {
    let obj = { };
    row.forEach((value, i) => {
      obj[labelList[i]] = value;
    });
    return obj;
  });

  // 特定のキーの型を変換
  dstData = dstData.map(record => {
    if ("username" in record)
    {
      record.username = String(record.username);
    }
    if ("score" in record)
    {
      record.score = parseScore(record.score);
    }
    return record;
  });

  return dstData;
}

/**
 * GET
 */
function doGet(e)
{
  let list = [];

  if ("count" in e.parameter &&
    e.parameter.count.match(/^\d+$/g))
  {
    let count = parseInt(e.parameter.count, 10);
    list = getTopScores(count);
  }
  else
  {
    list = getTopScores();
  }

  return ContentService.createTextOutput()
    .setContent(JSON.stringify(list))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST
 */
function doPost(e)
{
  let error = "";
  if (!("username" in e.parameter))
  {
    error += "パラメータusernameが存在しません\n";
  }
  if (!("score" in e.parameter))
  {
    error += "パラメータscoreが存在しません\n";
  }

  if (error.length > 0)
  {
    throw Error(error);
  }

  pushScore(e.parameter.username, e.parameter.score);

  return ContentService.createTextOutput("OK");
}



function pushScoreTest()
{
  const users = [ "太郎", "一郎", "二郎", "三郎" ];
  let user = users[Math.floor(Math.random() * users.length)];
  pushScore(user, Math.random() * 100);
}

function pushScoreTest2()
{
  pushScore("", Math.random() * 100);
}

function getTopScoresTest()
{
  Logger.log(JSON.stringify(getTopScores()));
  Logger.log(JSON.stringify(getTopScores(3)));
}