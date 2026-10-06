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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          details: Json | null
          id: string
          resource_id: string | null
          resource_label: string | null
          resource_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_label?: string | null
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          resource_id?: string | null
          resource_label?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      knowledge_items: {
        Row: {
          ai_faqs: Json | null
          ai_model: string | null
          ai_objectives: string[] | null
          ai_processed_at: string | null
          ai_questions: Json | null
          ai_summary: string | null
          ai_tags: string[] | null
          approved_at: string | null
          body: string
          category: string | null
          content_type: string
          created_at: string
          id: string
          last_reviewed: string | null
          owner_id: string | null
          owner_name: string | null
          review_comment: string | null
          review_due: string | null
          reviewer_name: string | null
          source: string | null
          status: Database["public"]["Enums"]["knowledge_status"]
          tags: string[]
          team: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          ai_faqs?: Json | null
          ai_model?: string | null
          ai_objectives?: string[] | null
          ai_processed_at?: string | null
          ai_questions?: Json | null
          ai_summary?: string | null
          ai_tags?: string[] | null
          approved_at?: string | null
          body?: string
          category?: string | null
          content_type?: string
          created_at?: string
          id?: string
          last_reviewed?: string | null
          owner_id?: string | null
          owner_name?: string | null
          review_comment?: string | null
          review_due?: string | null
          reviewer_name?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["knowledge_status"]
          tags?: string[]
          team?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          ai_faqs?: Json | null
          ai_model?: string | null
          ai_objectives?: string[] | null
          ai_processed_at?: string | null
          ai_questions?: Json | null
          ai_summary?: string | null
          ai_tags?: string[] | null
          approved_at?: string | null
          body?: string
          category?: string | null
          content_type?: string
          created_at?: string
          id?: string
          last_reviewed?: string | null
          owner_id?: string | null
          owner_name?: string | null
          review_comment?: string | null
          review_due?: string | null
          reviewer_name?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["knowledge_status"]
          tags?: string[]
          team?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      knowledge_versions: {
        Row: {
          body: string
          changed_by: string | null
          created_at: string
          id: string
          item_id: string
          note: string | null
          status: Database["public"]["Enums"]["knowledge_status"]
          title: string
          version: number
        }
        Insert: {
          body: string
          changed_by?: string | null
          created_at?: string
          id?: string
          item_id: string
          note?: string | null
          status: Database["public"]["Enums"]["knowledge_status"]
          title: string
          version: number
        }
        Update: {
          body?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          item_id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["knowledge_status"]
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_versions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "knowledge_items"
            referencedColumns: ["id"]
          },
        ]
      }
      mentor_escalations: {
        Row: {
          created_at: string
          id: string
          question: string
          reason: string | null
          status: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          question: string
          reason?: string | null
          status?: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          question?: string
          reason?: string | null
          status?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      module_progress: {
        Row: {
          attempts: number
          completed_at: string | null
          id: string
          module_id: string
          progress: number
          score: number | null
          started_at: string | null
          state: Database["public"]["Enums"]["module_state"]
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          id?: string
          module_id: string
          progress?: number
          score?: number | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["module_state"]
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          id?: string
          module_id?: string
          progress?: number
          score?: number | null
          started_at?: string | null
          state?: Database["public"]["Enums"]["module_state"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          content: string
          created_at: string
          description: string
          duration_min: number
          id: string
          knowledge_ids: string[]
          objectives: string[]
          pass_mark: number
          published: boolean
          questions: Json
          sort_order: number
          title: string
          track: string
        }
        Insert: {
          content?: string
          created_at?: string
          description?: string
          duration_min?: number
          id?: string
          knowledge_ids?: string[]
          objectives?: string[]
          pass_mark?: number
          published?: boolean
          questions?: Json
          sort_order?: number
          title: string
          track?: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string
          duration_min?: number
          id?: string
          knowledge_ids?: string[]
          objectives?: string[]
          pass_mark?: number
          published?: boolean
          questions?: Json
          sort_order?: number
          title?: string
          track?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          buddy_name: string | null
          created_at: string
          email: string | null
          employee_type: string
          experience_level: string
          full_name: string
          id: string
          joining_date: string | null
          manager_name: string | null
          role_title: string | null
          team: string | null
          tribe: string | null
          unit: string | null
        }
        Insert: {
          buddy_name?: string | null
          created_at?: string
          email?: string | null
          employee_type?: string
          experience_level?: string
          full_name?: string
          id: string
          joining_date?: string | null
          manager_name?: string | null
          role_title?: string | null
          team?: string | null
          tribe?: string | null
          unit?: string | null
        }
        Update: {
          buddy_name?: string | null
          created_at?: string
          email?: string | null
          employee_type?: string
          experience_level?: string
          full_name?: string
          id?: string
          joining_date?: string | null
          manager_name?: string | null
          role_title?: string | null
          team?: string | null
          tribe?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "new_joiner" | "manager" | "sme" | "admin"
      knowledge_status:
        | "draft"
        | "ai_processed"
        | "pending_review"
        | "approved"
        | "published"
        | "review_due"
        | "archived"
      module_state:
        | "not_started"
        | "in_progress"
        | "assessment_pending"
        | "passed"
        | "completed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["new_joiner", "manager", "sme", "admin"],
      knowledge_status: [
        "draft",
        "ai_processed",
        "pending_review",
        "approved",
        "published",
        "review_due",
        "archived",
      ],
      module_state: [
        "not_started",
        "in_progress",
        "assessment_pending",
        "passed",
        "completed",
      ],
    },
  },
} as const
