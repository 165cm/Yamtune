// 一般的に子供が苦手/好きな食べ物のプリセット
export const foodPresets = {
  dislike: [
    { name: "ピーマン", emoji: "🫑" },
    { name: "にんじん", emoji: "🥕" },
    { name: "なす", emoji: "🍆" },
    { name: "トマト", emoji: "🍅" },
    { name: "きのこ", emoji: "🍄" },
    { name: "ほうれん草", emoji: "🥬" },
    { name: "玉ねぎ", emoji: "🧅" },
    { name: "ねぎ", emoji: "🧅" },
    { name: "セロリ", emoji: "🥬" },
    { name: "ブロッコリー", emoji: "🥦" },
    { name: "ゴーヤ", emoji: "🥒" },
    { name: "レバー", emoji: "🫀" },
    { name: "魚", emoji: "🐟" },
    { name: "納豆", emoji: "🫘" },
  ],
  like: [
    { name: "カレー", emoji: "🍛" },
    { name: "ハンバーグ", emoji: "🍔" },
    { name: "からあげ", emoji: "🍗" },
    { name: "ラーメン", emoji: "🍜" },
    { name: "オムライス", emoji: "🍳" },
    { name: "スパゲッティ", emoji: "🍝" },
    { name: "お寿司", emoji: "🍣" },
    { name: "ポテト", emoji: "🍟" },
    { name: "ピザ", emoji: "🍕" },
    { name: "アイス", emoji: "🍨" },
    { name: "いちご", emoji: "🍓" },
    { name: "りんご", emoji: "🍎" },
    { name: "バナナ", emoji: "🍌" },
    { name: "チョコレート", emoji: "🍫" },
  ],
}

// 食べ物名から絵文字を取得
export function getFoodEmoji(foodName: string): string {
  const allFoods = [...foodPresets.dislike, ...foodPresets.like]
  const found = allFoods.find(f => f.name === foodName)
  return found?.emoji || "🍽️"
}

// カテゴリー別の絵文字マッピング
export const categoryEmojis: Record<string, string> = {
  // 野菜
  "野菜": "🥬",
  "葉物野菜": "🥬",
  "根菜": "🥕",
  // 果物
  "果物": "🍎",
  "フルーツ": "🍎",
  // 肉類
  "肉": "🥩",
  "肉類": "🥩",
  "鶏肉": "🍗",
  "豚肉": "🥓",
  "牛肉": "🥩",
  // 魚介類
  "魚": "🐟",
  "魚介類": "🦐",
  "海鮮": "🦐",
  // 乳製品
  "乳製品": "🧀",
  "チーズ": "🧀",
  "牛乳": "🥛",
  // 穀物
  "穀物": "🌾",
  "パン": "🍞",
  "ご飯": "🍚",
  "麺": "🍜",
  // 豆類
  "豆": "🫘",
  "豆類": "🫘",
  // お菓子・デザート
  "お菓子": "🍪",
  "デザート": "🍰",
  "スイーツ": "🍰",
  // 飲料
  "飲料": "🥤",
  "ジュース": "🧃",
  "お茶": "🍵",
  // 調味料
  "調味料": "🧂",
  // その他
  "冷凍食品": "🧊",
  "レトルト": "📦",
  "缶詰": "🥫",
  "インスタント": "📦",
}

// カテゴリー名から絵文字を取得
export function getCategoryEmoji(category: string): string {
  if (!category) return "📦"

  // 完全一致を先にチェック
  if (categoryEmojis[category]) {
    return categoryEmojis[category]
  }

  // 部分一致をチェック
  for (const [key, emoji] of Object.entries(categoryEmojis)) {
    if (category.includes(key) || key.includes(category)) {
      return emoji
    }
  }

  return "📦"
}

// 調味料ストックのプリセット
export const pantryPresets = {
  basic: {
    label: "基本調味料",
    emoji: "🧂",
    items: [
      { name: "醤油", emoji: "🫗" },
      { name: "みりん", emoji: "🍶" },
      { name: "料理酒", emoji: "🍶" },
      { name: "塩", emoji: "🧂" },
      { name: "砂糖", emoji: "🍬" },
      { name: "酢", emoji: "🫗" },
      { name: "味噌", emoji: "🫕" },
    ],
  },
  oils: {
    label: "油類",
    emoji: "🫒",
    items: [
      { name: "サラダ油", emoji: "🫒" },
      { name: "ごま油", emoji: "🫒" },
      { name: "オリーブオイル", emoji: "🫒" },
      { name: "バター", emoji: "🧈" },
    ],
  },
  sauces: {
    label: "ソース・たれ",
    emoji: "🥫",
    items: [
      { name: "めんつゆ", emoji: "🫗" },
      { name: "ポン酢", emoji: "🍋" },
      { name: "ソース", emoji: "🥫" },
      { name: "ケチャップ", emoji: "🍅" },
      { name: "マヨネーズ", emoji: "🥚" },
      { name: "焼肉のたれ", emoji: "🥩" },
    ],
  },
  spices: {
    label: "スパイス・香辛料",
    emoji: "🌶️",
    items: [
      { name: "こしょう", emoji: "🌶️" },
      { name: "にんにく", emoji: "🧄" },
      { name: "しょうが", emoji: "🫚" },
      { name: "鷹の爪", emoji: "🌶️" },
      { name: "カレー粉", emoji: "🍛" },
    ],
  },
  dashi: {
    label: "だし・スープ",
    emoji: "🍲",
    items: [
      { name: "だしの素", emoji: "🍲" },
      { name: "コンソメ", emoji: "🥣" },
      { name: "鶏ガラスープの素", emoji: "🐔" },
      { name: "中華だし", emoji: "🥡" },
    ],
  },
  others: {
    label: "その他",
    emoji: "📦",
    items: [
      { name: "片栗粉", emoji: "🌾" },
      { name: "小麦粉", emoji: "🌾" },
      { name: "パン粉", emoji: "🍞" },
      { name: "ごま", emoji: "🫘" },
    ],
  },
}

// すべての調味料をフラットな配列で取得
export function getAllPantryItems(): Array<{ name: string; emoji: string; category: string }> {
  const items: Array<{ name: string; emoji: string; category: string }> = []
  for (const [categoryKey, category] of Object.entries(pantryPresets)) {
    for (const item of category.items) {
      items.push({
        ...item,
        category: category.label,
      })
    }
  }
  return items
}
