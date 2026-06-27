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
      affirmations: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_favorite: boolean
          position: number
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          position?: number
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_favorite?: boolean
          position?: number
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          current_streak: number
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          current_streak?: number
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          current_streak?: number
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          days: number
          description: string
          ends_at: string | null
          id: string
          is_public: boolean
          owner_id: string
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          days?: number
          description?: string
          ends_at?: string | null
          id?: string
          is_public?: boolean
          owner_id: string
          starts_at?: string
          title: string
        }
        Update: {
          created_at?: string
          days?: number
          description?: string
          ends_at?: string | null
          id?: string
          is_public?: boolean
          owner_id?: string
          starts_at?: string
          title?: string
        }
        Relationships: []
      }
      cheers: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_logs: {
        Row: {
          checked_action_ids: Json
          created_at: string
          goal_id: string
          id: string
          log_date: string
          note: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checked_action_ids?: Json
          created_at?: string
          goal_id: string
          id?: string
          log_date: string
          note?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checked_action_ids?: Json
          created_at?: string
          goal_id?: string
          id?: string
          log_date?: string
          note?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          actions: Json
          category: string
          completed_at: string | null
          created_at: string
          deadline: string | null
          id: string
          image_url: string | null
          title: string
          updated_at: string
          user_id: string
          vision: string
        }
        Insert: {
          actions?: Json
          category: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          vision?: string
        }
        Update: {
          actions?: Json
          category?: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          vision?: string
        }
        Relationships: []
      }
      manifold_edges: {
        Row: {
          created_at: string
          flow: string | null
          id: string
          label: string
          source_id: string
          target_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          flow?: string | null
          id?: string
          label?: string
          source_id: string
          target_id: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          flow?: string | null
          id?: string
          label?: string
          source_id?: string
          target_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manifold_edges_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "manifold_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manifold_edges_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "manifold_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      manifold_node_logs: {
        Row: {
          checked_action_ids: Json
          created_at: string
          id: string
          log_date: string
          node_id: string
          note: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checked_action_ids?: Json
          created_at?: string
          id?: string
          log_date: string
          node_id: string
          note?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checked_action_ids?: Json
          created_at?: string
          id?: string
          log_date?: string
          node_id?: string
          note?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manifold_node_logs_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "manifold_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      manifold_nodes: {
        Row: {
          actions: Json
          category: string | null
          completed_at: string | null
          created_at: string
          description: string
          horizon: string | null
          id: string
          image_url: string | null
          kind: string
          layer: string
          meta: Json
          priority: number
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
          vision: string
          x: number | null
          y: number | null
        }
        Insert: {
          actions?: Json
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string
          horizon?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          layer: string
          meta?: Json
          priority?: number
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
          vision?: string
          x?: number | null
          y?: number | null
        }
        Update: {
          actions?: Json
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string
          horizon?: string | null
          id?: string
          image_url?: string | null
          kind?: string
          layer?: string
          meta?: Json
          priority?: number
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          vision?: string
          x?: number | null
          y?: number | null
        }
        Relationships: []
      }
      pairs: {
        Row: {
          a_user_id: string
          b_user_id: string | null
          created_at: string
          id: string
          invite_code: string
          status: string
        }
        Insert: {
          a_user_id: string
          b_user_id?: string | null
          created_at?: string
          id?: string
          invite_code: string
          status?: string
        }
        Update: {
          a_user_id?: string
          b_user_id?: string | null
          created_at?: string
          id?: string
          invite_code?: string
          status?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          handle: string | null
          id: string
          is_public: boolean
          life_vision: string | null
          nickname: string | null
          persona_age_bucket: string | null
          persona_region: string | null
          persona_role: string | null
          share_life_vision: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          handle?: string | null
          id: string
          is_public?: boolean
          life_vision?: string | null
          nickname?: string | null
          persona_age_bucket?: string | null
          persona_region?: string | null
          persona_role?: string | null
          share_life_vision?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          handle?: string | null
          id?: string
          is_public?: boolean
          life_vision?: string | null
          nickname?: string | null
          persona_age_bucket?: string | null
          persona_region?: string | null
          persona_role?: string | null
          share_life_vision?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      routine_logs: {
        Row: {
          checked_item_ids: Json
          created_at: string
          id: string
          log_date: string
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checked_item_ids?: Json
          created_at?: string
          id?: string
          log_date: string
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checked_item_ids?: Json
          created_at?: string
          id?: string
          log_date?: string
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "routine_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_template_items: {
        Row: {
          action_id: string | null
          created_at: string
          goal_id: string | null
          id: string
          label: string
          phase: number
          position: number
          template_id: string
          user_id: string
        }
        Insert: {
          action_id?: string | null
          created_at?: string
          goal_id?: string | null
          id?: string
          label: string
          phase?: number
          position?: number
          template_id: string
          user_id: string
        }
        Update: {
          action_id?: string | null
          created_at?: string
          goal_id?: string | null
          id?: string
          label?: string
          phase?: number
          position?: number
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "routine_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_templates: {
        Row: {
          created_at: string
          effective_from: string
          id: string
          is_active: boolean
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          effective_from?: string
          id?: string
          is_active?: boolean
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: string
          is_active?: boolean
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      shared_finance_summaries: {
        Row: {
          id: string
          month: number
          note: string
          shared_at: string
          totals: Json
          user_id: string
          year: number
        }
        Insert: {
          id?: string
          month: number
          note?: string
          shared_at?: string
          totals: Json
          user_id: string
          year: number
        }
        Update: {
          id?: string
          month?: number
          note?: string
          shared_at?: string
          totals?: Json
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      shared_visions: {
        Row: {
          goal_id: string
          id: string
          shared_at: string
          snapshot: Json
          user_id: string
        }
        Insert: {
          goal_id: string
          id?: string
          shared_at?: string
          snapshot: Json
          user_id: string
        }
        Update: {
          goal_id?: string
          id?: string
          shared_at?: string
          snapshot?: Json
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      compute_streak: { Args: { _user_id: string }; Returns: number }
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
