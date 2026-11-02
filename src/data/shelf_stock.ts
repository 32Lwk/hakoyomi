import { DEMO_PRODUCTS } from "@/data/demo_products";
import { MOCK_STORE, type ShelfLocation } from "@/data/mock_store";

// 棚割り（L-20261103-37・-38）。商品ごとに段・列を手で決めず、売場（段の売場名）ごとの商品リストと並べ方の規則から決める。
// 規則：
// - 売場の中は対象（品名に出る語）ごとにまとめ、その中をブランドごとにまとめる。対象の語がない商品はブランドだけでまとめる
// - 塊は品数の多い順（同じ数なら五十音順）。ブランドの中は品名の五十音順
// - 塊は1つの段に横並び。段は真ん中から埋め、次に上、次に下（6段なら 3・4→2→1→5→6）
// - 塊の間と段の頭に、イメージ図の箱を0〜2個挟む（位置は棚と売場名から決まり、毎回同じ）。入りきらなければ挟む数を減らす
// - 売場が2本以上にまたがるときは、本の大きさに合わせて塊の切れ目で分ける
// - 売れ筋や推奨の順ではない
// 商品を足すときは、STOCK の売場に id を足すだけでよい。

// 対象。品名に出る語だけで分ける（効能の判断はしない。画面にも出さない）
const TARGETS: [string, RegExp][] = [
  ["頭痛", /頭痛/],
  ["生理痛", /ルナ|生理/],
  ["小児用", /小児|ジュニア|こども|キッズ|チュロップ|プチ/],
  ["コンタクト", /コンタクト|CL/],
  ["ドライアイ", /ドライ|なみだ/],
  ["アレルギー", /アレルギー|(^|[^A-Za-z])AL([^A-Za-z]|$)/],
  ["去たん", /去たん/],
  ["口内炎", /口内炎/],
  ["のど", /のど/],
  ["下痢", /下痢|止瀉/],
];

export function targetOf(name: string): string | null {
  return TARGETS.find(([, re]) => re.test(name))?.[0] ?? null;
}

// シリーズ名で探されるブランド。上から順に当て、当たらない商品は品名をそのままブランドとみなす（1品だけのブランド）
const BRANDS: [string, RegExp][] = [
  ["アルガード", /アルガード/],
  ["パブロン", /パブロン/],
  ["エスタック", /エスタック/],
  ["ルル", /ルル/],
  ["パイロン", /パイロン/],
  ["ベンザブロック", /ベンザブロック/],
  ["コルゲンコーワ", /コルゲン/],
  ["ストナ", /ストナ/],
  ["ブロン", /(?<!スカイブ)ブロン/],
  ["メジコン", /メジコン/],
  ["イブ", /^イブ/],
  ["ナロン", /ナロン/],
  ["セデス", /セデス/],
  ["ノーシン", /ノーシン/],
  ["バファリン", /バファリン/],
  ["リングル", /リングル/],
  ["ドリエル", /ドリエル/],
  ["アレグラ", /アレグラ/],
  ["センパア", /センパア/],
  ["トラベルミン", /トラベルミン/],
  ["ナザール", /ナザール/],
  ["ガストール", /ガストール/],
  ["大正胃腸薬", /^大正.*胃腸薬/],
  ["太田胃散", /^太田/],
  ["キャベコーワ", /キャベ/],
  ["第一三共胃腸薬", /第一三共胃腸薬/],
  ["ビオフェルミン", /ビオフェルミン/],
  ["正露丸", /正露丸/],
  ["ロート", /ロート/],
  ["マイティア", /マイティア/],
  ["サンテ", /^サンテ/],
  ["スマイル", /^スマイル/],
  ["チョコラBB", /チョコラBB/],
  ["キューピーコーワ", /キューピーコーワ/],
  ["ハイチオール", /ハイチオール/],
  ["ユンケル", /ユンケル/],
  ["ツムラ", /^ツムラ/],
  ["クラシエ", /クラシエ/],
  ["サロンパス", /サロンパス/],
  ["バンテリン", /バンテリン/],
  ["トラフル", /トラフル/],
  ["大正クイックケア", /大正クイックケア/],
  ["ムヒ", /ムヒ/],
  ["ロキソニン", /ロキソニン/],
  ["レスタミン", /レスタミン/],
];

export function brandOf(name: string): string {
  return BRANDS.find(([, re]) => re.test(name))?.[0] ?? name;
}

// 売場名 → 商品 id（並びは規則で決まるので、このリストの順は問わない）。
// 追加の経緯：L-20261103-03・-24・-25・-32・-33・-34・-36・-40
const STOCK: Record<string, string[]> = {
  "第1類（解熱鎮痛）": [
    "loxonin-s", // ロキソニンS
    "loxonin-s-premium", // ロキソニンSプレミアム
    "med-00553", // ロキソニンSクイック
  ],
  "第1類（胃腸・鼻炎）": [],
  "第1類（外用・発毛）": [],
  "要指導医薬品": [],
  "かぜ薬": [
    "shin-lulu-a-s", // 新ルル-A錠s
    "lulu-attack-ex", // ルルアタックEX
    "benza-block-l", // ベンザブロックL錠
    "shin-contac-kaze", // 新コンタックかぜ総合
    "shin-estac-granule", // 新エスタック顆粒
    "estac-ibu-fine-ex", // エスタックイブファインEX
    "shin-lulu-a-gold-s", // 新ルルAゴールドs
    "lulu-attack-nx", // ルルアタックNX
    "benza-block-s", // ベンザブロックS錠
    "pylon-pl-granule", // パイロンPL顆粒
    "med-05883", // パブロンSゴールドW錠
    "med-06448", // エスタックイブTT
    "med-05907", // パイロンPL錠
    "med-05882", // パブロンSゴールドW微粒
    "med-05450", // 新ルルAゴールドDXα
    "med-05591", // ルルアタックNXプレミアム
    "med-05596", // ルルアタックEXプレミアム
    "med-05594", // ルルアタックFXa
    "med-05599", // ルルアタックCX
    "med-05598", // ルルアタックCXプレミアム
    "med-05906", // パイロンPL錠Pro
    "med-05905", // パイロンPL錠ゴールド
    "med-06453", // エスタックEXネオ
    "med-06220", // コルゲンコーワIB透明カプセルαプラス
    "med-06118", // ストナアイビージェルEX
  ],
  "小児用かぜ薬": [],
  "かぜの漢方薬": [
    "med-06002", // ツムラ漢方小青竜湯エキス顆粒
    "med-05996", // ツムラ漢方麦門冬湯エキス顆粒
    "med-05995", // ツムラ漢方補中益気湯エキス顆粒
    "med-05349", // ツムラ漢方葛根湯加川きゅう辛夷エキス顆粒
    "med-06003", // ツムラ漢方小柴胡湯エキス顆粒
    "med-05992", // ツムラ漢方麻黄附子細辛湯エキス顆粒
    "med-05993", // ツムラ漢方麻黄湯エキス顆粒
    "med-05994", // ツムラ漢方麻杏甘石湯エキス顆粒
    "med-06004", // ツムラ漢方柴胡桂枝湯エキス顆粒A
    "med-06005", // ツムラ漢方桂枝湯エキス顆粒
    "med-06006", // ツムラ漢方桔梗湯エキス顆粒
    "med-05338", // 「クラシエ」漢方葛根湯加川きゅう辛夷エキス顆粒
  ],
  "せき止め": [
    "benza-block-cough", // ベンザブロックせき止め錠
    "shin-bron-ace", // 新ブロン液エース
    "pabron-s-cough", // パブロンSせき止め
    "mucodyne-pro500", // ムコダイン去たん錠Pro500
    "stona-kyotan", // ストナ去たんカプセル
    "ss-bron-ace-tab", // 新エスエスブロン錠エース
    "medicon-pro", // メジコンせき止め錠Pro
    "askuron", // アスクロン
    "med-06455", // エスエスブロン液L
    "med-05476", // 新トニン咳止め液
    "med-05751", // プレコール持続性せき止めカプセル
    "med-06018", // ダスモックb
    "med-05639", // メジコンせき止め液Pro
    "med-06128", // スカイブブロンストレート
  ],
  "のど・トローチ": [],
  "うがい薬": [],
  "解熱鎮痛薬": [
    "eve-a", // イブA錠
    "bufferin-a", // バファリンA
    "tylenol-a", // タイレノールA
    "naron-ace", // ナロンエースT
    "shin-sedes", // 新セデス錠
    "eve-quick-dx", // イブクイック頭痛薬DX
    "bufferin-premium", // バファリンプレミアム
    "excedrin-a", // エキセドリンA錠
    "calonal-a", // カロナールA
    "med-00193", // イブA錠EX
    "med-00274", // ナロンエースプレミアム
    "med-00243", // セデス・ハイ
    "med-00233", // リングルアイビー錠α200
    "med-00177", // ノーシン
    "med-00323", // バファリンプレミアムDXクイック+
    "med-00319", // バファリンルナi
    "med-00191", // イブクイック頭痛薬
    "med-00196", // イブスリーショットプレミアム
    "med-00571", // ナロンm
    "med-00228", // リングルアイビー
    "med-00179", // ノーシンホワイト錠
    "med-00185", // ノーシンアイ頭痛薬
    "med-00246", // セデスV
    "med-00199", // エルペインコーワα
    "med-00577", // バファリンルナJ
    "med-00186", // オトナノーシンピュア
    "med-00182", // 小中学生用ノーシンピュア
  ],
  "睡眠改善薬": [
    "drewell", // ドリエル
    "drewell-ex", // ドリエルEX
    "dreamin-z", // ドリーミンZ
  ],
  "乗り物酔い": [
    "med-00522", // センパアPro
    "med-00598", // トラベルミン1
    "med-00616", // センパアトラベル1
    "med-00635", // パンシロントラベルSP
    "med-00652", // トラベルミン
    "med-00650", // トラベルミンR
    "med-00651", // トラベルミン ファミリー
    "med-00619", // トラベルミン チュロップぶどう味
    "med-00617", // センパア プチベリー
    "med-00614", // センパア ドリンク
    "med-00630", // トリブラプレミアム錠
    "med-00520", // アネロン「ニスキャップ」
    "med-00660", // センパア・QT
  ],
  "鼻炎薬": [
    "allegra-fx", // アレグラFX
    "alesion-20", // アレジオン20
    "pabron-bien-ex", // パブロン鼻炎速溶錠EX
    "stona-rhini-s", // ストナリニS
    "algard-gold-z", // ロートアルガード鼻炎内服薬ゴールドZ
    "colgen-film-alpha", // コルゲンコーワ鼻炎フィルムα
    "stona-rhini-z-gel", // ストナリニZジェル
    "jikinin-bien-ag", // ジキニン鼻炎AG顆粒
    "med-05114", // ストナリニ・サット
    "med-05107", // コルゲンコーワ鼻炎ソフトミニカプセル
    "med-05149", // アルガードクイックチュアブル
    "med-05202", // アレグラFXジュニア
    "med-05011", // パブロン鼻炎カプセルSα小児用
    "med-03563", // レスタミンコーワ糖衣錠
    "med-03562", // レスタミンUコーワ錠
    "med-03564", // レスタミンコーワα錠
  ],
  "点鼻薬": [
    "med-05216", // ナザールスプレー
    "med-05231", // パブロン点鼻
    "med-05220", // ナシビンMスプレー
    "med-05277", // ロートアルガードST鼻炎スプレー
    "med-05221", // ナザールGスプレー
    "med-05222", // ナザールGスプレークール
    "med-05223", // 新ルル点鼻薬
    "med-05086", // コールタイジン点鼻液a
    "med-05276", // アルガード鼻炎クールスプレーa
    "med-05239", // ハナスキット鼻炎スプレー
    "med-05074", // ナザールαAR0.1%<季節性アレルギー専用>
  ],
  "目薬": [
    "med-06556", // ヒアレインS
    "med-06750", // サンテメディカル12
    "med-06747", // サンテFXVプラス
    "med-06748", // サンテPC
    "med-06740", // サンテボーティエ
    "med-06746", // サンテALクールII
    "med-06844", // スマイル40EXa
    "med-06847", // スマイル40EXゴールド
    "med-06641", // ロートCキューブm
    "med-06651", // Vロートドライアイプレミアム
    "med-06650", // ロートリセコンタクトw
    "med-06660", // なみだロートドライエイド
    "med-06679", // アイボンd
    "med-06611", // ソフトサンティア
    "med-06902", // サンテFXネオ
    "med-06956", // サンテFX AL
    "med-06751", // サンテメディカルアクティブ
    "med-06741", // サンテビオ
    "med-06919", // サンテ抗菌新目薬
    "med-06875", // ロートリセb
    "med-07231", // ロートビタ40α
    "med-07257", // Vロートゴールド40
    "med-07234", // ロートクール40α
    "med-06879", // Vロートプレミアム
    "med-06881", // Vロートアクティブプレミアム
    "med-06625", // NewマイティアCL-s
    "med-06626", // NewマイティアCLクールHi-s
    "med-06776", // マイティアアイテクトEX
    "med-06777", // マイティアVプラス
  ],
  "胃腸薬": [
    "med-00083", // 太田胃散
    "med-00086", // 太田漢方胃腸薬II
    "med-00097", // 新キャベ2コーワ
    "med-00102", // 大正胃腸薬K
    "med-00104", // 大正漢方胃腸薬〈錠剤〉
    "med-00138", // ガストール錠
    "med-00080", // セルベール
    "med-04221", // ロート防風通聖散錠満量a
    "med-00118", // 第一三共胃腸薬細粒s
    "med-00122", // 第一三共胃腸薬グリーン錠
    "med-00137", // ガストール細粒
    "med-00142", // 液キャベコーワ
    "med-00133", // ストマーゼ顆粒
    "med-00085", // 太田胃散A<錠剤>
  ],
  "便秘薬": [
    "med-04107", // 大地の漢方便秘薬
    "med-04104", // 大正漢方便秘薬
  ],
  "整腸・下痢止め": [
    "med-00147", // ストッパ下痢止めEX
    "med-00145", // ビオフェルミン止瀉薬
    "med-00144", // 正露丸《瓶》
    "med-00146", // ビオフェルミン下痢止め
    "med-00152", // 正露丸糖衣錠G
  ],
  "漢方薬": [
    "med-04159", // 防風通聖散料エキス顆粒クラシエ
    "med-04210", // ツムラ漢方防風通聖散エキス顆粒
    "med-03986", // ツムラ漢方桂枝茯苓丸料エキス顆粒A
    "med-00998", // ツムラ漢方釣藤散エキス顆粒
    "med-01061", // ツムラ漢方苓桂朮甘湯エキス顆粒
    "med-03936", // ツムラ漢方黄連解毒湯エキス顆粒A
    "med-04810", // ツムラ漢方猪苓湯エキス顆粒A
    "med-04058", // ツムラ漢方十味敗毒湯エキス顆粒
    "med-04276", // ツムラ漢方麻子仁丸料エキス顆粒
    "med-04780", // ツムラ漢方柴胡加竜骨牡蛎湯エキス顆粒
  ],
  "皮膚薬": [
    "med-03539", // リンデロンVs軟膏
    "med-03160", // ベトネベートN軟膏AS
    "med-01633", // ペアアクネクリームW
    "med-01624", // オデキュアEX
    "med-01559", // オロナインH軟膏
    "med-04341", // メンソレータム軟膏c
    "med-04370", // 新レスタミンコーワ軟膏
    "med-04371", // レスタミンコーワパウダークリーム
  ],
  "水虫": [
    "med-01521", // ラミシールATクリーム
    "med-01369", // ブテナロックVαクリーム
    "med-01348", // ダマリングランデX
  ],
  "口内炎・のど": [
    "med-01540", // 口内炎軟膏大正クイックケア
    "med-01536", // トラフルダイレクトa
    "med-01555", // トラフル軟膏PROクイック
    "med-02933", // トラフル クイックショット
    "med-02953", // チョコラBB口内炎リペアショット
    "med-03011", // トラフル軟膏
    "med-01541", // 口内炎パッチ大正クイックケア
    "med-02924", // のどぬーるナイテクト
    "med-02948", // コフジスACのどスプレー
    "med-02927", // ストナのどスプレー
    "med-02934", // ルルのどスプレー
    "med-02991", // ムヒののどスプレー
    "med-02969", // 浅田飴AZのどスプレーS
    "med-02925", // ハレナーススプレー
  ],
  "痔の薬": [
    "med-03046", // プリザエース坐剤T
    "med-03058", // メンソレータムリシーナ軟膏A
  ],
  "殺菌消毒": [],
  "湿布・外用鎮痛": [
    "med-02048", // ロキソニンSテープ
    "med-01997", // フェイタスZαジクサス
    "med-01942", // ボルタレンEXテープ
    "med-02825", // サロンパスAe
    "med-01755", // バンテリンコーワゲルα
    "med-01754", // バンテリンコーワクリームα
    "med-01982", // サロンパスEX
    "med-02715", // サロンパス-ハイ
    "med-02713", // サロンパス30
    "med-01812", // バンテリンコーワパップS
  ],
  "虫さされ・かゆみ": [
    "med-03162", // ムヒアルファEX
    "med-03169", // ムヒアルファSII
    "med-03167", // 液体ムヒS2a
  ],
  "ビタミン剤": [
    "med-07285", // アリナミンA
    "med-07092", // チョコラBBプラス
    "med-01123", // チョコラBBローヤルT
    "med-01148", // キューピーコーワゴールドα
    "med-04595", // ハイチオールCプラス2
    "med-04323", // ハイシーBメイト2
    "med-04318", // エバユースBBプラスC
    "med-00717", // ユンケル黄帝
    "med-00781", // チオビタゴールド
    "med-00169", // ヘパリーゼドリンクII
    "med-00021", // チョコラBBルーセントC
    "med-01151", // キューピーコーワゴールドαプレミアム
    "med-07109", // チョコラBBピュア
    "med-07091", // チョコラBBジュニア
    "med-04596", // ハイチオールCプラスEX
  ],
  "滋養強壮": [
    "med-01312", // ユンケル黄帝顆粒
  ],
  "ドリンク剤": [
    "med-00764", // リポビタンD PRO
    "med-00723", // スパークユンケルDCF
  ],
};

const ja = (a: string, b: string) => a.localeCompare(b, "ja");

type Item = { id: string; name: string };
// 塊：対象（またはブランド）1つ。中はブランドごとの並び
type Group = Item[][];

// 位置から決まる乱数（毎回同じ並びにする）
function random(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return (max: number) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) % (max + 1);
  };
}

// 段の埋める順。真ん中→上→下（6段：3・4→2→1→5→6、3段：2→1→3、2段：1→2）
export function tierOrder(tiers: number[]): number[] {
  const n = tiers.length;
  const lo = Math.ceil(n / 2) - 1;
  const hi = Math.floor(n / 2);
  const order = [lo, hi].filter((x, i, a) => a.indexOf(x) === i);
  for (let i = lo - 1; i >= 0; i--) order.push(i);
  for (let i = hi + 1; i < n; i++) order.push(i);
  return order.map((i) => tiers[i]);
}

type Slot = { tier: number; column: number };

// 1本の中に塊を置く。挟む箱の数の上限 gap で入りきらなければ null
function fill(groups: Group[], rows: number[], columns: number, rnd: (max: number) => number, gap: number) {
  const out = new Map<string, Slot>();
  let r = 0;
  let col = rnd(gap);
  // まだ何も置いていない段
  let fresh = true;
  // len 個が今の段に入らなければ次の段へ。空の段なら頭の箱を減らして入れる
  const room = (len: number) => {
    if (col + len <= columns) return true;
    if (fresh) {
      col = Math.max(0, columns - len);
      return true;
    }
    r++;
    if (r >= rows.length) return false;
    col = Math.min(rnd(gap), columns - Math.min(len, columns));
    fresh = true;
    return true;
  };
  const put = (items: Item[]) => {
    for (const it of items) {
      if (col >= columns && !room(1)) return false;
      out.set(it.id, { tier: rows[r], column: col + 1 });
      col++;
      fresh = false;
    }
    return true;
  };
  for (const group of groups) {
    const size = group.reduce((n, b) => n + b.length, 0);
    if (size <= columns) {
      if (!room(size) || !put(group.flat())) return null;
    } else {
      // 1段に入らない塊は、ブランドごとに段に収める（ブランドも入らなければ段を折り返す）
      for (const brand of group) if (!room(Math.min(brand.length, columns)) || !put(brand)) return null;
    }
    col += rnd(gap);
  }
  return out;
}

function place(): ShelfLocation[] {
  const names = new Map(DEMO_PRODUCTS.map((p) => [p.id, p.name]));
  const out: ShelfLocation[] = [];
  for (const [section, ids] of Object.entries(STOCK)) {
    // 売場が使う本と、その本の中の段（上から）
    const bays = MOCK_STORE.shelves.flatMap((shelf) => {
      const tiers: number[] = [];
      let top = 1;
      for (const x of shelf.sections) {
        if (x.name === section) for (let t = 0; t < x.tiers; t++) tiers.push(top + t);
        top += x.tiers;
      }
      return tiers.length ? [{ shelf, tiers, size: tiers.length * shelf.columns }] : [];
    });
    // 対象 → ブランド → 品。外したデモ商品（demoSkus.json にない id）は置かない
    const tree = new Map<string, Map<string, Item[]>>();
    for (const id of ids) {
      const name = names.get(id);
      if (!name) continue;
      const brand = brandOf(name);
      const key = targetOf(name) ?? `ブランド:${brand}`;
      const brands = tree.get(key) ?? new Map<string, Item[]>();
      brands.set(brand, [...(brands.get(brand) ?? []), { id, name }]);
      tree.set(key, brands);
    }
    const bySize = <T>(list: [string, T][], size: (x: T) => number) =>
      list.sort(([a, x], [b, y]) => size(y) - size(x) || ja(a, b)).map(([, x]) => x);
    const groups: Group[] = bySize([...tree], (b) => [...b.values()].flat().length).map((brands) =>
      bySize([...brands], (items) => items.length).map((items) => items.sort((x, y) => ja(x.name, y.name))),
    );
    const count = groups.flat(2).length;
    const total = bays.reduce((n, b) => n + b.size, 0);
    if (count > total) throw new Error(`売場「${section}」に商品が入りきらない`);

    // 本ごとに塊を分ける。塊の切れ目で、本の大きさの割合に近いところ
    const cuts = groups.reduce<number[]>((acc, g) => [...acc, acc.at(-1)! + g.flat().length], [0]);
    let from = 0;
    let gi = 0;
    let room = total;
    bays.forEach((bay, i) => {
      room -= bay.size;
      let to = count;
      if (i < bays.length - 1) {
        const target = (count * (total - room)) / total;
        const ok = cuts.filter((c) => c >= from && c - from <= bay.size && count - c <= room);
        to = ok.length
          ? ok.reduce((a, b) => (Math.abs(b - target) < Math.abs(a - target) ? b : a))
          : Math.min(from + bay.size, count);
      }
      // この本の塊（切れ目で収まらなかったときは、品で切る）
      const mine: Group[] = [];
      let n = from;
      while (n < to && gi < groups.length) {
        const g = groups[gi];
        const len = g.flat().length;
        if (n + len <= to) {
          mine.push(g);
          gi++;
          n += len;
        } else {
          const rest = g.flat();
          mine.push([rest.slice(0, to - n)]);
          groups[gi] = [rest.slice(to - n)];
          n = to;
        }
      }
      const rows = tierOrder(bay.tiers);
      const rnd = random(`${bay.shelf.id}:${section}`);
      const slots =
        fill(mine, rows, bay.shelf.columns, rnd, 2) ??
        fill(mine, rows, bay.shelf.columns, rnd, 1) ??
        fill(mine, rows, bay.shelf.columns, rnd, 0) ??
        // 塊の形を保てないほど詰まっているときは、段の順に詰める
        new Map(
          mine.flat(2).map((it, k) => [
            it.id,
            { tier: rows[Math.floor(k / bay.shelf.columns)], column: (k % bay.shelf.columns) + 1 },
          ]),
        );
      for (const it of mine.flat(2)) out.push({ productId: it.id, shelfId: bay.shelf.id, ...slots.get(it.id)! });
      from = to;
    });
  }
  return out;
}

export const SHELF_LOCATIONS: ShelfLocation[] = place();
