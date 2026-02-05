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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      daily_forecasts: {
        Row: {
          birth_moon_sign: string
          created_at: string
          current_moon_sign: string
          energy: string
          forecast_text: string
          headline: string
          id: string
          lucky_focus: string
          updated_at: string
        }
        Insert: {
          birth_moon_sign: string
          created_at?: string
          current_moon_sign: string
          energy: string
          forecast_text: string
          headline: string
          id?: string
          lucky_focus: string
          updated_at?: string
        }
        Update: {
          birth_moon_sign?: string
          created_at?: string
          current_moon_sign?: string
          energy?: string
          forecast_text?: string
          headline?: string
          id?: string
          lucky_focus?: string
          updated_at?: string
        }
        Relationships: []
      }
      moon_phase_texts: {
        Row: {
          created_at: string
          id: string
          modifier_text: string
          phase_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          modifier_text: string
          phase_name: string
        }
        Update: {
          created_at?: string
          id?: string
          modifier_text?: string
          phase_name?: string
        }
        Relationships: []
      }
      moon_sign_library: {
        Row: {
          created_at: string
          element: string
          elemental_affinity: Json
          essence: Json
          id: string
          ritual: Json
          ruling_planet: string
          shadow: Json
          sign_name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          element: string
          elemental_affinity?: Json
          essence?: Json
          id?: string
          ritual?: Json
          ruling_planet: string
          shadow?: Json
          sign_name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          element?: string
          elemental_affinity?: Json
          essence?: Json
          id?: string
          ritual?: Json
          ruling_planet?: string
          shadow?: Json
          sign_name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      signups: {
        Row: {
          birth_date: string
          created_at: string
          email: string
          id: string
          moon_element: string | null
          moon_sign: string
          moon_symbol: string | null
        }
        Insert: {
          birth_date: string
          created_at?: string
          email: string
          id?: string
          moon_element?: string | null
          moon_sign: string
          moon_symbol?: string | null
        }
        Update: {
          birth_date?: string
          created_at?: string
          email?: string
          id?: string
          moon_element?: string | null
          moon_sign?: string
          moon_symbol?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          birth_city: string | null
          birth_time: string | null
          birthday: string | null
          created_at: string
          email: string | null
          id: string
          moon_sign: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_city?: string | null
          birth_time?: string | null
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          moon_sign?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_city?: string | null
          birth_time?: string | null
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          moon_sign?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
