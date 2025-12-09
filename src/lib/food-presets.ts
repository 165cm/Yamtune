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
