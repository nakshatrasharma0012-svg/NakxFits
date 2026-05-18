export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_workouts: {
        Row: {
          created_at: string
          exercises: Json
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercises?: Json
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercises?: Json
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_demos: {
        Row: {
          created_at: string
          exercise_key: string
          id: string
          image_data_url: string | null
          instructions: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          exercise_key: string
          id?: string
          image_data_url?: string | null
          instructions?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          exercise_key?: string
          id?: string
          image_data_url?: string | null
          instructions?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string
          equipment: string
          id: string
          instructions: string | null
          mode: Database["public"]["Enums"]["workout_mode"][]
          muscle_group: Database["public"]["Enums"]["muscle_group"]
          name: string
        }
        Insert: {
          created_at?: string
          equipment: string
          id?: string
          instructions?: string | null
          mode?: Database["public"]["Enums"]["workout_mode"][]
          muscle_group: Database["public"]["Enums"]["muscle_group"]
          name: string
        }
        Update: {
          created_at?: string
          equipment?: string
          id?: string
          instructions?: string | null
          mode?: Database["public"]["Enums"]["workout_mode"][]
          muscle_group?: Database["public"]["Enums"]["muscle_group"]
          name?: string
        }
        Relationships: []
      }
      foods: {
        Row: {
          carbs_g: number
          created_at: string
          fat_g: number
          fiber_g: number
          id: string
          is_custom: boolean
          is_veg: boolean
          kcal: number
          name: string
          protein_g: number
          serving_g: number
          user_id: string | null
        }
        Insert: {
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          is_custom?: boolean
          is_veg?: boolean
          kcal: number
          name: string
          protein_g?: number
          serving_g?: number
          user_id?: string | null
        }
        Update: {
          carbs_g?: number
          created_at?: string
          fat_g?: number
          fiber_g?: number
          id?: string
          is_custom?: boolean
          is_veg?: boolean
          kcal?: number
          name?: string
          protein_g?: number
          serving_g?: number
          user_id?: string | null
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          carbs_g: number
          created_at: string
          date: string
          fat_g: number
          food_id: string | null
          food_name: string
          id: string
          kcal: number
          meal_type: Database["public"]["Enums"]["meal_type"]
          photo_path: string | null
          protein_g: number
          servings: number
          source: string
          user_id: string
        }
        Insert: {
          carbs_g?: number
          created_at?: string
          date?: string
          fat_g?: number
          food_id?: string | null
          food_name: string
          id?: string
          kcal: number
          meal_type: Database["public"]["Enums"]["meal_type"]
          photo_path?: string | null
          protein_g?: number
          servings?: number
          source?: string
          user_id: string
        }
        Update: {
          carbs_g?: number
          created_at?: string
          date?: string
          fat_g?: number
          food_id?: string | null
          food_name?: string
          id?: string
          kcal?: number
          meal_type?: Database["public"]["Enums"]["meal_type"]
          photo_path?: string | null
          protein_g?: number
          servings?: number
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_food_id_fkey"
            columns: ["food_id"]
            isOneToOne: false
            referencedRelation: "foods"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level"] | null
          age: number | null
          body_type: Database["public"]["Enums"]["body_type"] | null
          carbs_g: number | null
          created_at: string
          daily_kcal: number | null
          fat_g: number | null
          gender: Database["public"]["Enums"]["user_gender"] | null
          goal: Database["public"]["Enums"]["user_goal"] | null
          height_cm: number | null
          id: string
          name: string | null
          onboarded: boolean
          preferred_mode: Database["public"]["Enums"]["workout_mode"] | null
          protein_g: number | null
          target_muscles: Database["public"]["Enums"]["muscle_group"][] | null
          theme_pref: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          body_type?: Database["public"]["Enums"]["body_type"] | null
          carbs_g?: number | null
          created_at?: string
          daily_kcal?: number | null
          fat_g?: number | null
          gender?: Database["public"]["Enums"]["user_gender"] | null
          goal?: Database["public"]["Enums"]["user_goal"] | null
          height_cm?: number | null
          id: string
          name?: string | null
          onboarded?: boolean
          preferred_mode?: Database["public"]["Enums"]["workout_mode"] | null
          protein_g?: number | null
          target_muscles?: Database["public"]["Enums"]["muscle_group"][] | null
          theme_pref?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level"] | null
          age?: number | null
          body_type?: Database["public"]["Enums"]["body_type"] | null
          carbs_g?: number | null
          created_at?: string
          daily_kcal?: number | null
          fat_g?: number | null
          gender?: Database["public"]["Enums"]["user_gender"] | null
          goal?: Database["public"]["Enums"]["user_goal"] | null
          height_cm?: number | null
          id?: string
          name?: string | null
          onboarded?: boolean
          preferred_mode?: Database["public"]["Enums"]["workout_mode"] | null
          protein_g?: number | null
          target_muscles?: Database["public"]["Enums"]["muscle_group"][] | null
          theme_pref?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string
          date: string
          id: string
          mode: Database["public"]["Enums"]["workout_mode"]
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          mode?: Database["public"]["Enums"]["workout_mode"]
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          mode?: Database["public"]["Enums"]["workout_mode"]
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          created_at: string
          exercise_id: string | null
          exercise_name: string | null
          id: string
          reps: number
          session_id: string
          set_no: number
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          exercise_id?: string | null
          exercise_name?: string | null
          id?: string
          reps: number
          session_id: string
          set_no: number
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          exercise_id?: string | null
          exercise_name?: string | null
          id?: string
          reps?: number
          session_id?: string
          set_no?: number
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_level:
        | "sedentary"
        | "light"
        | "moderate"
        | "active"
        | "very_active"
      body_type: "ectomorph" | "mesomorph" | "endomorph"
      meal_type: "breakfast" | "lunch" | "dinner" | "snack"
      muscle_group:
        | "chest"
        | "back"
        | "legs"
        | "shoulders"
        | "arms"
        | "core"
        | "full_body"
        | "cardio"
      user_gender: "male" | "female" | "other"
      user_goal: "lose" | "maintain" | "gain"
      workout_mode: "gym" | "home"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_level: [
        "sedentary",
        "light",
        "moderate",
        "active",
        "very_active",
      ],
      body_type: ["ectomorph", "mesomorph", "endomorph"],
      meal_type: ["breakfast", "lunch", "dinner", "snack"],
      muscle_group: [
        "chest",
        "back",
        "legs",
        "shoulders",
        "arms",
        "core",
        "full_body",
        "cardio",
      ],
      user_gender: ["male", "female", "other"],
      user_goal: ["lose", "maintain", "gain"],
      workout_mode: ["gym", "home"],
    },
  },
} as const
