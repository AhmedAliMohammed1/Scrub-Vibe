export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      analytics_events: {
        Row: {
          anonymous_id: string;
          device_type: string | null;
          event_name: string;
          id: number;
          locale: string | null;
          metadata: Json;
          occurred_at: string;
          path: string;
          product_id: number | null;
          referrer_host: string | null;
          session_id: string;
          user_id: string | null;
          utm_campaign: string | null;
          utm_medium: string | null;
          utm_source: string | null;
        };
        Insert: {
          anonymous_id: string;
          device_type?: string | null;
          event_name: string;
          id?: never;
          locale?: string | null;
          metadata?: Json;
          occurred_at?: string;
          path: string;
          product_id?: number | null;
          referrer_host?: string | null;
          session_id: string;
          user_id?: string | null;
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Update: {
          anonymous_id?: string;
          device_type?: string | null;
          event_name?: string;
          id?: never;
          locale?: string | null;
          metadata?: Json;
          occurred_at?: string;
          path?: string;
          product_id?: number | null;
          referrer_host?: string | null;
          session_id?: string;
          user_id?: string | null;
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          created_at: string;
          id: number;
          is_active: boolean;
          parent_id: number | null;
          position: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: never;
          is_active?: boolean;
          parent_id?: number | null;
          position?: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: never;
          is_active?: boolean;
          parent_id?: number | null;
          position?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      category_translations: {
        Row: {
          category_id: number;
          description: string | null;
          locale: string;
          name: string;
          seo_description: string | null;
          seo_title: string | null;
        };
        Insert: {
          category_id: number;
          description?: string | null;
          locale: string;
          name: string;
          seo_description?: string | null;
          seo_title?: string | null;
        };
        Update: {
          category_id?: number;
          description?: string | null;
          locale?: string;
          name?: string;
          seo_description?: string | null;
          seo_title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "category_translations_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory: {
        Row: {
          low_stock_threshold: number;
          on_hand: number;
          reserved: number;
          updated_at: string;
          variant_id: number;
        };
        Insert: {
          low_stock_threshold?: number;
          on_hand?: number;
          reserved?: number;
          updated_at?: string;
          variant_id: number;
        };
        Update: {
          low_stock_threshold?: number;
          on_hand?: number;
          reserved?: number;
          updated_at?: string;
          variant_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: true;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_movements: {
        Row: {
          actor_id: string | null;
          created_at: string;
          id: number;
          movement_type: Database["public"]["Enums"]["inventory_movement_type"];
          quantity_delta: number;
          reason: string | null;
          reference_id: string | null;
          reference_type: string | null;
          variant_id: number;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          movement_type: Database["public"]["Enums"]["inventory_movement_type"];
          quantity_delta: number;
          reason?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          variant_id: number;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"];
          quantity_delta?: number;
          reason?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          variant_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_subscribers: {
        Row: {
          consented_at: string;
          email: string;
          id: number;
          is_active: boolean;
          locale: string;
          source: string;
          unsubscribed_at: string | null;
        };
        Insert: {
          consented_at?: string;
          email: string;
          id?: never;
          is_active?: boolean;
          locale?: string;
          source?: string;
          unsubscribed_at?: string | null;
        };
        Update: {
          consented_at?: string;
          email?: string;
          id?: never;
          is_active?: boolean;
          locale?: string;
          source?: string;
          unsubscribed_at?: string | null;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          alt_ar: string | null;
          alt_en: string;
          created_at: string;
          height: number | null;
          id: number;
          position: number;
          product_id: number;
          storage_path: string;
          width: number | null;
        };
        Insert: {
          alt_ar?: string | null;
          alt_en: string;
          created_at?: string;
          height?: number | null;
          id?: never;
          position?: number;
          product_id: number;
          storage_path: string;
          width?: number | null;
        };
        Update: {
          alt_ar?: string | null;
          alt_en?: string;
          created_at?: string;
          height?: number | null;
          id?: never;
          position?: number;
          product_id?: number;
          storage_path?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_option_values: {
        Row: {
          code: string;
          id: number;
          label_ar: string;
          label_en: string;
          option_id: number;
          position: number;
          swatch_hex: string | null;
        };
        Insert: {
          code: string;
          id?: never;
          label_ar: string;
          label_en: string;
          option_id: number;
          position?: number;
          swatch_hex?: string | null;
        };
        Update: {
          code?: string;
          id?: never;
          label_ar?: string;
          label_en?: string;
          option_id?: number;
          position?: number;
          swatch_hex?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "product_options";
            referencedColumns: ["id"];
          },
        ];
      };
      product_options: {
        Row: {
          code: string;
          id: number;
          name_ar: string;
          name_en: string;
          position: number;
          product_id: number;
        };
        Insert: {
          code: string;
          id?: never;
          name_ar: string;
          name_en: string;
          position?: number;
          product_id: number;
        };
        Update: {
          code?: string;
          id?: never;
          name_ar?: string;
          name_en?: string;
          position?: number;
          product_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_translations: {
        Row: {
          care_instructions: string | null;
          description: string | null;
          locale: string;
          product_id: number;
          search_document: unknown;
          seo_description: string | null;
          seo_title: string | null;
          title: string;
        };
        Insert: {
          care_instructions?: string | null;
          description?: string | null;
          locale: string;
          product_id: number;
          search_document?: unknown;
          seo_description?: string | null;
          seo_title?: string | null;
          title: string;
        };
        Update: {
          care_instructions?: string | null;
          description?: string | null;
          locale?: string;
          product_id?: number;
          search_document?: unknown;
          seo_description?: string | null;
          seo_title?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_translations_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variant_values: {
        Row: {
          option_value_id: number;
          variant_id: number;
        };
        Insert: {
          option_value_id: number;
          variant_id: number;
        };
        Update: {
          option_value_id?: number;
          variant_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "product_variant_values_option_value_id_fkey";
            columns: ["option_value_id"];
            isOneToOne: false;
            referencedRelation: "product_option_values";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_variant_values_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          barcode: string | null;
          compare_at_price_minor: number | null;
          cost_minor: number | null;
          created_at: string;
          id: number;
          is_active: boolean;
          price_override_minor: number | null;
          product_id: number;
          sku: string;
          updated_at: string;
          weight_grams: number | null;
        };
        Insert: {
          barcode?: string | null;
          compare_at_price_minor?: number | null;
          cost_minor?: number | null;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          price_override_minor?: number | null;
          product_id: number;
          sku: string;
          updated_at?: string;
          weight_grams?: number | null;
        };
        Update: {
          barcode?: string | null;
          compare_at_price_minor?: number | null;
          cost_minor?: number | null;
          created_at?: string;
          id?: never;
          is_active?: boolean;
          price_override_minor?: number | null;
          product_id?: number;
          sku?: string;
          updated_at?: string;
          weight_grams?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          base_price_minor: number;
          brand: string;
          category_id: number | null;
          compare_at_price_minor: number | null;
          cost_minor: number | null;
          created_at: string;
          created_by: string | null;
          currency: string;
          fit: string | null;
          gender: string | null;
          id: number;
          material: string | null;
          published_at: string | null;
          scheduled_for: string | null;
          slug: string;
          status: Database["public"]["Enums"]["product_status"];
          updated_at: string;
          updated_by: string | null;
          vendor: string | null;
        };
        Insert: {
          base_price_minor: number;
          brand?: string;
          category_id?: number | null;
          compare_at_price_minor?: number | null;
          cost_minor?: number | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          fit?: string | null;
          gender?: string | null;
          id?: never;
          material?: string | null;
          published_at?: string | null;
          scheduled_for?: string | null;
          slug: string;
          status?: Database["public"]["Enums"]["product_status"];
          updated_at?: string;
          updated_by?: string | null;
          vendor?: string | null;
        };
        Update: {
          base_price_minor?: number;
          brand?: string;
          category_id?: number | null;
          compare_at_price_minor?: number | null;
          cost_minor?: number | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string;
          fit?: string | null;
          gender?: string | null;
          id?: never;
          material?: string | null;
          published_at?: string | null;
          scheduled_for?: string | null;
          slug?: string;
          status?: Database["public"]["Enums"]["product_status"];
          updated_at?: string;
          updated_by?: string | null;
          vendor?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          marketing_consent: boolean;
          phone: string | null;
          preferred_locale: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          marketing_consent?: boolean;
          phone?: string | null;
          preferred_locale?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          marketing_consent?: boolean;
          phone?: string | null;
          preferred_locale?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          granted_at: string;
          granted_by: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          granted_at?: string;
          granted_by?: string | null;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          granted_at?: string;
          granted_by?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_adjust_inventory: {
        Args: {
          p_new_on_hand: number;
          p_reason: string;
          p_variant_id: number;
        };
        Returns: undefined;
      };
      admin_analytics_summary: {
        Args: { p_days?: number };
        Returns: Json;
      };
      admin_create_product: {
        Args: {
          p_base_price_minor: number;
          p_category_id: number;
          p_color_ar: string;
          p_color_code: string;
          p_color_en: string;
          p_compare_at_price_minor: number | null;
          p_cost_minor: number | null;
          p_description_ar: string;
          p_description_en: string;
          p_fit: string;
          p_gender: string;
          p_image_url: string;
          p_low_stock_threshold: number;
          p_material: string;
          p_sizes: string[];
          p_slug: string;
          p_status: Database["public"]["Enums"]["product_status"];
          p_stock: number;
          p_swatch_hex: string;
          p_title_ar: string;
          p_title_en: string;
        };
        Returns: number;
      };
      admin_create_product_with_colours: {
        Args: {
          p_base_price_minor: number;
          p_category_id: number;
          p_colours: Json;
          p_compare_at_price_minor: number | null;
          p_cost_minor: number | null;
          p_description_ar: string;
          p_description_en: string;
          p_fit: string;
          p_gender: string;
          p_image_url: string;
          p_low_stock_threshold: number;
          p_material: string;
          p_sizes: string[];
          p_slug: string;
          p_status: Database["public"]["Enums"]["product_status"];
          p_stock: number;
          p_title_ar: string;
          p_title_en: string;
        };
        Returns: number;
      };
      admin_set_product_status: {
        Args: {
          p_product_id: number;
          p_status: Database["public"]["Enums"]["product_status"];
        };
        Returns: undefined;
      };
      track_store_event: {
        Args: {
          p_anonymous_id: string;
          p_device_type?: string;
          p_event_name: string;
          p_locale?: string;
          p_metadata?: Json;
          p_path: string;
          p_product_id?: number;
          p_referrer_host?: string;
          p_session_id: string;
          p_utm_campaign?: string;
          p_utm_medium?: string;
          p_utm_source?: string;
        };
        Returns: undefined;
      };
      subscribe_newsletter: {
        Args: { p_email: string; p_locale?: string };
        Returns: undefined;
      };
    };
    Enums: {
      app_role:
        | "customer"
        | "support"
        | "warehouse"
        | "content_editor"
        | "product_manager"
        | "analyst"
        | "admin"
        | "super_admin";
      inventory_movement_type:
        | "receipt"
        | "reservation"
        | "release"
        | "sale"
        | "return"
        | "damage"
        | "adjustment";
      product_status: "draft" | "active" | "scheduled" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "customer",
        "support",
        "warehouse",
        "content_editor",
        "product_manager",
        "analyst",
        "admin",
        "super_admin",
      ],
      inventory_movement_type: [
        "receipt",
        "reservation",
        "release",
        "sale",
        "return",
        "damage",
        "adjustment",
      ],
      product_status: ["draft", "active", "scheduled", "archived"],
    },
  },
} as const;
