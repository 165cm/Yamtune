-- セキュリティ警告の修正

-- 1. handle_new_user関数のsearch_pathを固定
-- 既存の関数を安全なsearch_pathで再作成

-- まず既存の関数定義を確認して再作成
-- handle_new_user関数が存在する場合のみ実行
DO $$
BEGIN
  -- 関数が存在するか確認
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user'
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) THEN
    -- 関数のsearch_pathを空に設定（最も安全）
    ALTER FUNCTION public.handle_new_user() SET search_path = '';
  END IF;
END $$;

-- 注意: Leaked Password Protection はSupabaseダッシュボードで設定が必要です
-- Authentication > Settings > Password Protection で有効化してください
