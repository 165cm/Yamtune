export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
        }
      }
      families: {
        Row: {
          id: string
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          created_at?: string
        }
      }
      members: {
        Row: {
          id: string
          family_id: string
          name: string
          birth_date: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          birth_date: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          birth_date?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      member_foods: {
        Row: {
          id: string
          member_id: string
          food_name: string
          category: string
          severity: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          member_id: string
          food_name: string
          category: string
          severity?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          food_name?: string
          category?: string
          severity?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          brand: string | null
          barcode: string | null
          image_hash: string | null
          image_url: string | null
          nutrition: Json
          category: string | null
          created_by: string | null
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          brand?: string | null
          barcode?: string | null
          image_hash?: string | null
          image_url?: string | null
          nutrition: Json
          category?: string | null
          created_by?: string | null
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          brand?: string | null
          barcode?: string | null
          image_hash?: string | null
          image_url?: string | null
          nutrition?: Json
          category?: string | null
          created_by?: string | null
          verified?: boolean
          created_at?: string
        }
      }
      user_products: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          title: string
          description: string | null
          image_url: string | null
          cooking_time: number | null
          servings: number | null
          difficulty: string | null
          ingredients: Json
          steps: Json
          nutrition_score: number | null
          hidden_veggies: Json | null
          target_nutrients: Json | null
          community_score: number
          total_cooks: number
          source_product_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          image_url?: string | null
          cooking_time?: number | null
          servings?: number | null
          difficulty?: string | null
          ingredients: Json
          steps: Json
          nutrition_score?: number | null
          hidden_veggies?: Json | null
          target_nutrients?: Json | null
          community_score?: number
          total_cooks?: number
          source_product_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          cooking_time?: number | null
          servings?: number | null
          difficulty?: string | null
          ingredients?: Json
          steps?: Json
          nutrition_score?: number | null
          hidden_veggies?: Json | null
          target_nutrients?: Json | null
          community_score?: number
          total_cooks?: number
          source_product_id?: string | null
          created_at?: string
        }
      }
      cooking_records: {
        Row: {
          id: string
          user_id: string
          recipe_id: string
          member_id: string | null
          reaction: string
          completion: string
          overcame_foods: string[] | null
          modifications: string | null
          allow_anonymous_stats: boolean
          cooked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          recipe_id: string
          member_id?: string | null
          reaction: string
          completion: string
          overcame_foods?: string[] | null
          modifications?: string | null
          allow_anonymous_stats?: boolean
          cooked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          recipe_id?: string
          member_id?: string | null
          reaction?: string
          completion?: string
          overcame_foods?: string[] | null
          modifications?: string | null
          allow_anonymous_stats?: boolean
          cooked_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
