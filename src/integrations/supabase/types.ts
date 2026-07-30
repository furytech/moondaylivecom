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
      blog_posts: {
        Row: {
          author: string
          category: string
          constellation_graphic_path: string | null
          content: string
          created_at: string
          cta_type: string
          excerpt: string | null
          featured: boolean
          id: string
          image_url: string | null
          keywords: string[] | null
          meta_description: string | null
          meta_title: string | null
          publish_at: string | null
          published_at: string | null
          read_time: number
          reddit_post: string | null
          reviewed_by: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          zodiac_sign_tag: string | null
        }
        Insert: {
          author?: string
          category?: string
          constellation_graphic_path?: string | null
          content?: string
          created_at?: string
          cta_type?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          publish_at?: string | null
          published_at?: string | null
          read_time?: number
          reddit_post?: string | null
          reviewed_by?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          zodiac_sign_tag?: string | null
        }
        Update: {
          author?: string
          category?: string
          constellation_graphic_path?: string | null
          content?: string
          created_at?: string
          cta_type?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          image_url?: string | null
          keywords?: string[] | null
          meta_description?: string | null
          meta_title?: string | null
          publish_at?: string | null
          published_at?: string | null
          read_time?: number
          reddit_post?: string | null
          reviewed_by?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          zodiac_sign_tag?: string | null
        }
        Relationships: []
      }
      content_drafts: {
        Row: {
          app_atmospheric_text: string | null
          app_experiential_text: string | null
          cosmic_weather_id: string
          created_at: string
          id: string
          reddit_payload: Json | null
          status: string
          substack_payload: Json | null
          updated_at: string
        }
        Insert: {
          app_atmospheric_text?: string | null
          app_experiential_text?: string | null
          cosmic_weather_id: string
          created_at?: string
          id?: string
          reddit_payload?: Json | null
          status?: string
          substack_payload?: Json | null
          updated_at?: string
        }
        Update: {
          app_atmospheric_text?: string | null
          app_experiential_text?: string | null
          cosmic_weather_id?: string
          created_at?: string
          id?: string
          reddit_payload?: Json | null
          status?: string
          substack_payload?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_drafts_cosmic_weather_id_fkey"
            columns: ["cosmic_weather_id"]
            isOneToOne: false
            referencedRelation: "cosmic_weather"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmic_weather: {
        Row: {
          created_at: string
          id: string
          is_processed: boolean
          moon_sign_draconic: string | null
          moon_sign_sidereal: string | null
          moon_sign_tropical: string | null
          sun_sign_sidereal: string | null
          sun_sign_tropical: string | null
          trigger_timestamp: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_processed?: boolean
          moon_sign_draconic?: string | null
          moon_sign_sidereal?: string | null
          moon_sign_tropical?: string | null
          sun_sign_sidereal?: string | null
          sun_sign_tropical?: string | null
          trigger_timestamp: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_processed?: boolean
          moon_sign_draconic?: string | null
          moon_sign_sidereal?: string | null
          moon_sign_tropical?: string | null
          sun_sign_sidereal?: string | null
          sun_sign_tropical?: string | null
          trigger_timestamp?: string
          updated_at?: string
        }
        Relationships: []
      }
      cron_secrets: {
        Row: {
          created_at: string
          name: string
          secret_value: string
        }
        Insert: {
          created_at?: string
          name: string
          secret_value: string
        }
        Update: {
          created_at?: string
          name?: string
          secret_value?: string
        }
        Relationships: []
      }
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      mfa_backup_codes: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      moon_history: {
        Row: {
          climate_score: number
          created_at: string
          id: string
          volatility_alert: boolean
          zodiac_sign: string
        }
        Insert: {
          climate_score: number
          created_at?: string
          id?: string
          volatility_alert?: boolean
          zodiac_sign: string
        }
        Update: {
          climate_score?: number
          created_at?: string
          id?: string
          volatility_alert?: boolean
          zodiac_sign?: string
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
      moon_transitions: {
        Row: {
          created_at: string
          from_sign: string
          id: string
          to_sign: string
          transition_at: string
          transition_date: string | null
        }
        Insert: {
          created_at?: string
          from_sign: string
          id?: string
          to_sign: string
          transition_at: string
          transition_date?: string | null
        }
        Update: {
          created_at?: string
          from_sign?: string
          id?: string
          to_sign?: string
          transition_at?: string
          transition_date?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_natal_profiles: {
        Row: {
          created_at: string
          natal_moon_sidereal: string | null
          natal_moon_tropical: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          natal_moon_sidereal?: string | null
          natal_moon_tropical?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          natal_moon_sidereal?: string | null
          natal_moon_tropical?: string | null
          updated_at?: string
          user_id?: string
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
          is_subscriber: boolean
          moon_alert_frequency: string | null
          moon_sign: string | null
          subscription_status: string
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
          is_subscriber?: boolean
          moon_alert_frequency?: string | null
          moon_sign?: string | null
          subscription_status?: string
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
          is_subscriber?: boolean
          moon_alert_frequency?: string | null
          moon_sign?: string | null
          subscription_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
