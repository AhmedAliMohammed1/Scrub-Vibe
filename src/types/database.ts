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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          anonymous_id: string
          device_type: string | null
          event_name: string
          id: number
          locale: string | null
          metadata: Json
          occurred_at: string
          path: string
          product_id: number | null
          referrer_host: string | null
          session_id: string
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          anonymous_id: string
          device_type?: string | null
          event_name: string
          id?: never
          locale?: string | null
          metadata?: Json
          occurred_at?: string
          path: string
          product_id?: number | null
          referrer_host?: string | null
          session_id: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          anonymous_id?: string
          device_type?: string | null
          event_name?: string
          id?: never
          locale?: string | null
          metadata?: Json
          occurred_at?: string
          path?: string
          product_id?: number | null
          referrer_host?: string | null
          session_id?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          id: number
          quantity: number
          updated_at: string
          user_id: string
          variant_id: number
        }
        Insert: {
          created_at?: string
          id?: never
          quantity?: number
          updated_at?: string
          user_id: string
          variant_id: number
        }
        Update: {
          created_at?: string
          id?: never
          quantity?: number
          updated_at?: string
          user_id?: string
          variant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          parent_id: number | null
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: never
          is_active?: boolean
          parent_id?: number | null
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: never
          is_active?: boolean
          parent_id?: number | null
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_translations: {
        Row: {
          category_id: number
          description: string | null
          locale: string
          name: string
          seo_description: string | null
          seo_title: string | null
        }
        Insert: {
          category_id: number
          description?: string | null
          locale: string
          name: string
          seo_description?: string | null
          seo_title?: string | null
        }
        Update: {
          category_id?: number
          description?: string | null
          locale?: string
          name?: string
          seo_description?: string | null
          seo_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "category_translations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_otp_requests: {
        Row: {
          created_at: string
          id: number
          ip_hash: string | null
          phone: string
          provider_request_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          ip_hash?: string | null
          phone: string
          provider_request_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          ip_hash?: string | null
          phone?: string
          provider_request_id?: string | null
        }
        Relationships: []
      }
      checkout_phone_verifications: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
          token_hash: string
          verified_at: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone: string
          token_hash: string
          verified_at?: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          token_hash?: string
          verified_at?: string
        }
        Relationships: []
      }
      cms_banners: {
        Row: {
          bg_color: string
          body_ar: string | null
          body_en: string | null
          created_at: string
          cta_text_ar: string | null
          cta_text_en: string | null
          cta_url: string | null
          ends_at: string | null
          id: number
          image_path: string | null
          is_active: boolean
          overlay_opacity: number
          position: number
          secondary_cta_text_ar: string | null
          secondary_cta_text_en: string | null
          secondary_cta_url: string | null
          starts_at: string | null
          subtitle_ar: string | null
          subtitle_en: string | null
          text_color: string
          title_ar: string
          title_en: string
          type: string
          updated_at: string
        }
        Insert: {
          bg_color?: string
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          cta_text_ar?: string | null
          cta_text_en?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: never
          image_path?: string | null
          is_active?: boolean
          overlay_opacity?: number
          position?: number
          secondary_cta_text_ar?: string | null
          secondary_cta_text_en?: string | null
          secondary_cta_url?: string | null
          starts_at?: string | null
          subtitle_ar?: string | null
          subtitle_en?: string | null
          text_color?: string
          title_ar?: string
          title_en?: string
          type: string
          updated_at?: string
        }
        Update: {
          bg_color?: string
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          cta_text_ar?: string | null
          cta_text_en?: string | null
          cta_url?: string | null
          ends_at?: string | null
          id?: never
          image_path?: string | null
          is_active?: boolean
          overlay_opacity?: number
          position?: number
          secondary_cta_text_ar?: string | null
          secondary_cta_text_en?: string | null
          secondary_cta_url?: string | null
          starts_at?: string | null
          subtitle_ar?: string | null
          subtitle_en?: string | null
          text_color?: string
          title_ar?: string
          title_en?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          apartment: string | null
          building: string | null
          city: string
          city_code: string
          created_at: string
          custom_label: string | null
          floor: string | null
          governorate_code: string
          id: number
          is_default: boolean
          label: string
          landmark: string | null
          phone: string
          recipient_name: string
          street_address: string
          updated_at: string
          user_id: string
        }
        Insert: {
          apartment?: string | null
          building?: string | null
          city: string
          city_code: string
          created_at?: string
          custom_label?: string | null
          floor?: string | null
          governorate_code: string
          id?: never
          is_default?: boolean
          label?: string
          landmark?: string | null
          phone: string
          recipient_name: string
          street_address: string
          updated_at?: string
          user_id: string
        }
        Update: {
          apartment?: string | null
          building?: string | null
          city?: string
          city_code?: string
          created_at?: string
          custom_label?: string | null
          floor?: string | null
          governorate_code?: string
          id?: never
          is_default?: boolean
          label?: string
          landmark?: string | null
          phone?: string
          recipient_name?: string
          street_address?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_governorate_code_fkey"
            columns: ["governorate_code"]
            isOneToOne: false
            referencedRelation: "shipping_governorates"
            referencedColumns: ["code"]
          },
        ]
      }
      discount_campaigns: {
        Row: {
          budget_minor: number | null
          channel: string
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          ends_on: string
          id: number
          is_active: boolean
          name_ar: string
          name_en: string
          starts_on: string
          updated_at: string
          utm_campaign: string | null
        }
        Insert: {
          budget_minor?: number | null
          channel?: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          ends_on: string
          id?: never
          is_active?: boolean
          name_ar: string
          name_en: string
          starts_on: string
          updated_at?: string
          utm_campaign?: string | null
        }
        Update: {
          budget_minor?: number | null
          channel?: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          ends_on?: string
          id?: never
          is_active?: boolean
          name_ar?: string
          name_en?: string
          starts_on?: string
          updated_at?: string
          utm_campaign?: string | null
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          campaign_id: number | null
          code: string
          created_at: string
          created_by: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          ends_on: string | null
          id: number
          is_active: boolean
          maximum_discount_minor: number | null
          minimum_subtotal_minor: number
          per_customer_limit: number
          starts_on: string | null
          updated_at: string
          usage_limit: number | null
          value: number
        }
        Insert: {
          campaign_id?: number | null
          code: string
          created_at?: string
          created_by?: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          ends_on?: string | null
          id?: never
          is_active?: boolean
          maximum_discount_minor?: number | null
          minimum_subtotal_minor?: number
          per_customer_limit?: number
          starts_on?: string | null
          updated_at?: string
          usage_limit?: number | null
          value: number
        }
        Update: {
          campaign_id?: number | null
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          ends_on?: string | null
          id?: never
          is_active?: boolean
          maximum_discount_minor?: number | null
          minimum_subtotal_minor?: number
          per_customer_limit?: number
          starts_on?: string | null
          updated_at?: string
          usage_limit?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "discount_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_redemptions: {
        Row: {
          campaign_id: number | null
          discount_code_id: number
          discount_minor: number
          id: number
          order_id: string
          redeemed_at: string
          subtotal_minor: number
          user_id: string | null
        }
        Insert: {
          campaign_id?: number | null
          discount_code_id: number
          discount_minor: number
          id?: never
          order_id: string
          redeemed_at?: string
          subtotal_minor: number
          user_id?: string | null
        }
        Update: {
          campaign_id?: number | null
          discount_code_id?: number
          discount_minor?: number
          id?: never
          order_id?: string
          redeemed_at?: string
          subtotal_minor?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_redemptions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "discount_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_redemptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          low_stock_threshold: number
          on_hand: number
          reserved: number
          updated_at: string
          variant_id: number
        }
        Insert: {
          low_stock_threshold?: number
          on_hand?: number
          reserved?: number
          updated_at?: string
          variant_id: number
        }
        Update: {
          low_stock_threshold?: number
          on_hand?: number
          reserved?: number
          updated_at?: string
          variant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          actor_id: string | null
          created_at: string
          id: number
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          quantity_delta: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          variant_id: number
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: never
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          quantity_delta: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          variant_id: number
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: never
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          quantity_delta?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          variant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          consented_at: string
          email: string
          id: number
          is_active: boolean
          locale: string
          source: string
          unsubscribed_at: string | null
        }
        Insert: {
          consented_at?: string
          email: string
          id?: never
          is_active?: boolean
          locale?: string
          source?: string
          unsubscribed_at?: string | null
        }
        Update: {
          consented_at?: string
          email?: string
          id?: never
          is_active?: boolean
          locale?: string
          source?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          cod_deposit_line_minor: number | null
          cod_deposit_unit_minor: number
          colour_ar: string | null
          colour_code: string | null
          colour_en: string | null
          created_at: string
          id: number
          image_url: string | null
          line_total_minor: number | null
          order_id: string
          product_id: number | null
          quantity: number
          size: string | null
          sku: string
          title_ar: string
          title_en: string
          unit_price_minor: number
          variant_id: number | null
        }
        Insert: {
          cod_deposit_line_minor?: number | null
          cod_deposit_unit_minor?: number
          colour_ar?: string | null
          colour_code?: string | null
          colour_en?: string | null
          created_at?: string
          id?: never
          image_url?: string | null
          line_total_minor?: number | null
          order_id: string
          product_id?: number | null
          quantity: number
          size?: string | null
          sku: string
          title_ar: string
          title_en: string
          unit_price_minor: number
          variant_id?: number | null
        }
        Update: {
          cod_deposit_line_minor?: number | null
          cod_deposit_unit_minor?: number
          colour_ar?: string | null
          colour_code?: string | null
          colour_en?: string | null
          created_at?: string
          id?: never
          image_url?: string | null
          line_total_minor?: number | null
          order_id?: string
          product_id?: number | null
          quantity?: number
          size?: string | null
          sku?: string
          title_ar?: string
          title_en?: string
          unit_price_minor?: number
          variant_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          actor_id: string | null
          created_at: string
          id: number
          note: string | null
          order_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: never
          note?: string | null
          order_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: never
          note?: string | null
          order_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          apartment: string | null
          building: string | null
          cancelled_at: string | null
          city: string
          cod_balance_due_minor: number
          cod_deposit_method: string | null
          cod_deposit_minor: number
          cod_surcharge_minor: number
          courier: string | null
          created_at: string
          currency: string
          customer_name: string
          customer_notes: string | null
          delivered_at: string | null
          delivery_max_days: number | null
          delivery_min_days: number | null
          discount_campaign_id: number | null
          discount_campaign_name_ar: string | null
          discount_campaign_name_en: string | null
          discount_code: string | null
          discount_code_id: number | null
          discount_minor: number
          email: string | null
          floor: string | null
          governorate: string
          id: string
          landmark: string | null
          order_number: string
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          paymob_intention_id: string | null
          paymob_order_id: string | null
          paymob_transaction_id: string | null
          phone: string
          phone_verified_at: string
          reservation_expires_at: string | null
          shipment_number: string | null
          shipped_at: string | null
          shipping_base_minor: number
          shipping_city_code: string | null
          shipping_city_name_ar: string | null
          shipping_city_name_en: string | null
          shipping_discount_minor: number
          shipping_governorate_code: string | null
          shipping_governorate_name_ar: string | null
          shipping_governorate_name_en: string | null
          shipping_minor: number
          shipping_zone_code: string | null
          shipping_zone_id: number | null
          shipping_zone_name_ar: string | null
          shipping_zone_name_en: string | null
          status: Database["public"]["Enums"]["order_status"]
          street_address: string
          subtotal_minor: number
          total_minor: number
          tracking_token_hash: string
          tracking_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          apartment?: string | null
          building?: string | null
          cancelled_at?: string | null
          city: string
          cod_balance_due_minor?: number
          cod_deposit_method?: string | null
          cod_deposit_minor?: number
          cod_surcharge_minor?: number
          courier?: string | null
          created_at?: string
          currency?: string
          customer_name: string
          customer_notes?: string | null
          delivered_at?: string | null
          delivery_max_days?: number | null
          delivery_min_days?: number | null
          discount_campaign_id?: number | null
          discount_campaign_name_ar?: string | null
          discount_campaign_name_en?: string | null
          discount_code?: string | null
          discount_code_id?: number | null
          discount_minor?: number
          email?: string | null
          floor?: string | null
          governorate: string
          id?: string
          landmark?: string | null
          order_number: string
          paid_at?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          paymob_intention_id?: string | null
          paymob_order_id?: string | null
          paymob_transaction_id?: string | null
          phone: string
          phone_verified_at: string
          reservation_expires_at?: string | null
          shipment_number?: string | null
          shipped_at?: string | null
          shipping_base_minor?: number
          shipping_city_code?: string | null
          shipping_city_name_ar?: string | null
          shipping_city_name_en?: string | null
          shipping_discount_minor?: number
          shipping_governorate_code?: string | null
          shipping_governorate_name_ar?: string | null
          shipping_governorate_name_en?: string | null
          shipping_minor?: number
          shipping_zone_code?: string | null
          shipping_zone_id?: number | null
          shipping_zone_name_ar?: string | null
          shipping_zone_name_en?: string | null
          status: Database["public"]["Enums"]["order_status"]
          street_address: string
          subtotal_minor?: number
          total_minor?: number
          tracking_token_hash: string
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          apartment?: string | null
          building?: string | null
          cancelled_at?: string | null
          city?: string
          cod_balance_due_minor?: number
          cod_deposit_method?: string | null
          cod_deposit_minor?: number
          cod_surcharge_minor?: number
          courier?: string | null
          created_at?: string
          currency?: string
          customer_name?: string
          customer_notes?: string | null
          delivered_at?: string | null
          delivery_max_days?: number | null
          delivery_min_days?: number | null
          discount_campaign_id?: number | null
          discount_campaign_name_ar?: string | null
          discount_campaign_name_en?: string | null
          discount_code?: string | null
          discount_code_id?: number | null
          discount_minor?: number
          email?: string | null
          floor?: string | null
          governorate?: string
          id?: string
          landmark?: string | null
          order_number?: string
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          paymob_intention_id?: string | null
          paymob_order_id?: string | null
          paymob_transaction_id?: string | null
          phone?: string
          phone_verified_at?: string
          reservation_expires_at?: string | null
          shipment_number?: string | null
          shipped_at?: string | null
          shipping_base_minor?: number
          shipping_city_code?: string | null
          shipping_city_name_ar?: string | null
          shipping_city_name_en?: string | null
          shipping_discount_minor?: number
          shipping_governorate_code?: string | null
          shipping_governorate_name_ar?: string | null
          shipping_governorate_name_en?: string | null
          shipping_minor?: number
          shipping_zone_code?: string | null
          shipping_zone_id?: number | null
          shipping_zone_name_ar?: string | null
          shipping_zone_name_en?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          street_address?: string
          subtotal_minor?: number
          total_minor?: number
          tracking_token_hash?: string
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_discount_campaign_id_fkey"
            columns: ["discount_campaign_id"]
            isOneToOne: false
            referencedRelation: "discount_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_zone_id_fkey"
            columns: ["shipping_zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_proofs: {
        Row: {
          amount_minor: number
          created_at: string
          id: string
          order_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: string
          storage_path: string
          submitted_by: string | null
        }
        Insert: {
          amount_minor?: number
          created_at?: string
          id?: string
          order_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          storage_path: string
          submitted_by?: string | null
        }
        Update: {
          amount_minor?: number
          created_at?: string
          id?: string
          order_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: string
          storage_path?: string
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_proofs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          amount_minor: number | null
          currency: string | null
          error_code: string | null
          external_order_id: string | null
          id: number
          integration_id: number | null
          order_id: string | null
          outcome: string
          payload_digest: string
          processed_at: string | null
          provider: string
          provider_event_id: string
          received_at: string
          transaction_id: string | null
        }
        Insert: {
          amount_minor?: number | null
          currency?: string | null
          error_code?: string | null
          external_order_id?: string | null
          id?: number
          integration_id?: number | null
          order_id?: string | null
          outcome?: string
          payload_digest: string
          processed_at?: string | null
          provider: string
          provider_event_id: string
          received_at?: string
          transaction_id?: string | null
        }
        Update: {
          amount_minor?: number | null
          currency?: string | null
          error_code?: string | null
          external_order_id?: string | null
          id?: number
          integration_id?: number | null
          order_id?: string | null
          outcome?: string
          payload_digest?: string
          processed_at?: string | null
          provider?: string
          provider_event_id?: string
          received_at?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhook_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_ar: string | null
          alt_en: string
          created_at: string
          height: number | null
          id: number
          position: number
          product_id: number
          storage_path: string
          width: number | null
        }
        Insert: {
          alt_ar?: string | null
          alt_en: string
          created_at?: string
          height?: number | null
          id?: never
          position?: number
          product_id: number
          storage_path: string
          width?: number | null
        }
        Update: {
          alt_ar?: string | null
          alt_en?: string
          created_at?: string
          height?: number | null
          id?: never
          position?: number
          product_id?: number
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          code: string
          id: number
          label_ar: string
          label_en: string
          option_id: number
          position: number
          swatch_hex: string | null
        }
        Insert: {
          code: string
          id?: never
          label_ar: string
          label_en: string
          option_id: number
          position?: number
          swatch_hex?: string | null
        }
        Update: {
          code?: string
          id?: never
          label_ar?: string
          label_en?: string
          option_id?: number
          position?: number
          swatch_hex?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          code: string
          id: number
          name_ar: string
          name_en: string
          position: number
          product_id: number
        }
        Insert: {
          code: string
          id?: never
          name_ar: string
          name_en: string
          position?: number
          product_id: number
        }
        Update: {
          code?: string
          id?: never
          name_ar?: string
          name_en?: string
          position?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_translations: {
        Row: {
          care_instructions: string | null
          description: string | null
          locale: string
          product_id: number
          search_document: unknown
          seo_description: string | null
          seo_title: string | null
          title: string
        }
        Insert: {
          care_instructions?: string | null
          description?: string | null
          locale: string
          product_id: number
          search_document?: unknown
          seo_description?: string | null
          seo_title?: string | null
          title: string
        }
        Update: {
          care_instructions?: string | null
          description?: string | null
          locale?: string
          product_id?: number
          search_document?: unknown
          seo_description?: string | null
          seo_title?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_values: {
        Row: {
          option_value_id: number
          variant_id: number
        }
        Insert: {
          option_value_id: number
          variant_id: number
        }
        Update: {
          option_value_id?: number
          variant_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_values_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_values_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          barcode: string | null
          compare_at_price_minor: number | null
          cost_minor: number | null
          created_at: string
          id: number
          is_active: boolean
          price_override_minor: number | null
          product_id: number
          sku: string
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          barcode?: string | null
          compare_at_price_minor?: number | null
          cost_minor?: number | null
          created_at?: string
          id?: never
          is_active?: boolean
          price_override_minor?: number | null
          product_id: number
          sku: string
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          barcode?: string | null
          compare_at_price_minor?: number | null
          cost_minor?: number | null
          created_at?: string
          id?: never
          is_active?: boolean
          price_override_minor?: number | null
          product_id?: number
          sku?: string
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price_minor: number
          brand: string
          category_id: number | null
          cod_deposit_minor: number
          compare_at_price_minor: number | null
          cost_minor: number | null
          created_at: string
          created_by: string | null
          currency: string
          fit: string | null
          gender: string | null
          id: number
          material: string | null
          published_at: string | null
          scheduled_for: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
          updated_by: string | null
          vendor: string | null
        }
        Insert: {
          base_price_minor: number
          brand?: string
          category_id?: number | null
          cod_deposit_minor?: number
          compare_at_price_minor?: number | null
          cost_minor?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          fit?: string | null
          gender?: string | null
          id?: never
          material?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          updated_by?: string | null
          vendor?: string | null
        }
        Update: {
          base_price_minor?: number
          brand?: string
          category_id?: number | null
          cod_deposit_minor?: number
          compare_at_price_minor?: number | null
          cost_minor?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string
          fit?: string | null
          gender?: string | null
          id?: never
          material?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
          updated_by?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          marketing_consent: boolean
          phone: string | null
          preferred_locale: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          marketing_consent?: boolean
          phone?: string | null
          preferred_locale?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          marketing_consent?: boolean
          phone?: string | null
          preferred_locale?: string
          updated_at?: string
        }
        Relationships: []
      }
      shipping_cities: {
        Row: {
          code: string
          governorate_code: string
          id: number
          is_active: boolean
          name_ar: string
          name_en: string
          position: number
        }
        Insert: {
          code: string
          governorate_code: string
          id?: never
          is_active?: boolean
          name_ar: string
          name_en: string
          position?: number
        }
        Update: {
          code?: string
          governorate_code?: string
          id?: never
          is_active?: boolean
          name_ar?: string
          name_en?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipping_cities_governorate_code_fkey"
            columns: ["governorate_code"]
            isOneToOne: false
            referencedRelation: "shipping_governorates"
            referencedColumns: ["code"]
          },
        ]
      }
      shipping_governorates: {
        Row: {
          code: string
          is_active: boolean
          name_ar: string
          name_en: string
          position: number
          zone_id: number
        }
        Insert: {
          code: string
          is_active?: boolean
          name_ar: string
          name_en: string
          position?: number
          zone_id: number
        }
        Update: {
          code?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          position?: number
          zone_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipping_governorates_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          cod_enabled: boolean
          cod_surcharge_minor: number
          code: string
          created_at: string
          delivery_max_days: number
          delivery_min_days: number
          free_shipping_threshold_minor: number | null
          id: number
          is_active: boolean
          name_ar: string
          name_en: string
          position: number
          shipping_fee_minor: number
          updated_at: string
        }
        Insert: {
          cod_enabled?: boolean
          cod_surcharge_minor?: number
          code: string
          created_at?: string
          delivery_max_days: number
          delivery_min_days: number
          free_shipping_threshold_minor?: number | null
          id?: never
          is_active?: boolean
          name_ar: string
          name_en: string
          position?: number
          shipping_fee_minor: number
          updated_at?: string
        }
        Update: {
          cod_enabled?: boolean
          cod_surcharge_minor?: number
          code?: string
          created_at?: string
          delivery_max_days?: number
          delivery_min_days?: number
          free_shipping_threshold_minor?: number | null
          id?: never
          is_active?: boolean
          name_ar?: string
          name_en?: string
          position?: number
          shipping_fee_minor?: number
          updated_at?: string
        }
        Relationships: []
      }
      size_chart_entries: {
        Row: {
          category: string
          chest_max_cm: number
          chest_min_cm: number
          created_at: string
          garment_length_cm: number | null
          hip_max_cm: number
          hip_min_cm: number
          id: string
          inseam_cm: number | null
          note_ar: string | null
          note_en: string | null
          product_id: number | null
          size: string
          sort_order: number
          updated_at: string
          waist_max_cm: number
          waist_min_cm: number
        }
        Insert: {
          category: string
          chest_max_cm: number
          chest_min_cm: number
          created_at?: string
          garment_length_cm?: number | null
          hip_max_cm: number
          hip_min_cm: number
          id?: string
          inseam_cm?: number | null
          note_ar?: string | null
          note_en?: string | null
          product_id?: number | null
          size: string
          sort_order?: number
          updated_at?: string
          waist_max_cm: number
          waist_min_cm: number
        }
        Update: {
          category?: string
          chest_max_cm?: number
          chest_min_cm?: number
          created_at?: string
          garment_length_cm?: number | null
          hip_max_cm?: number
          hip_min_cm?: number
          id?: string
          inseam_cm?: number | null
          note_ar?: string | null
          note_en?: string | null
          product_id?: number | null
          size?: string
          sort_order?: number
          updated_at?: string
          waist_max_cm?: number
          waist_min_cm?: number
        }
        Relationships: [
          {
            foreignKeyName: "size_chart_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: number
          product_id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: never
          product_id: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: never
          product_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_inventory: {
        Args: { p_new_on_hand: number; p_reason: string; p_variant_id: number }
        Returns: undefined
      }
      admin_analytics_summary: { Args: { p_days?: number }; Returns: Json }
      admin_create_product: {
        Args: {
          p_base_price_minor: number
          p_category_id: number
          p_color_ar: string
          p_color_code: string
          p_color_en: string
          p_compare_at_price_minor: number
          p_cost_minor: number
          p_description_ar: string
          p_description_en: string
          p_fit: string
          p_gender: string
          p_image_url: string
          p_low_stock_threshold: number
          p_material: string
          p_sizes: string[]
          p_slug: string
          p_status: Database["public"]["Enums"]["product_status"]
          p_stock: number
          p_swatch_hex: string
          p_title_ar: string
          p_title_en: string
        }
        Returns: number
      }
      admin_create_product_with_colours: {
        Args: {
          p_base_price_minor: number
          p_category_id: number
          p_colours: Json
          p_compare_at_price_minor: number
          p_cost_minor: number
          p_description_ar: string
          p_description_en: string
          p_fit: string
          p_gender: string
          p_image_url: string
          p_low_stock_threshold: number
          p_material: string
          p_sizes: string[]
          p_slug: string
          p_status: Database["public"]["Enums"]["product_status"]
          p_stock: number
          p_title_ar: string
          p_title_en: string
        }
        Returns: number
      }
      admin_set_product_status: {
        Args: {
          p_product_id: number
          p_status: Database["public"]["Enums"]["product_status"]
        }
        Returns: undefined
      }
      admin_update_order: {
        Args: {
          p_courier?: string
          p_note?: string
          p_order_id: string
          p_payment_status: Database["public"]["Enums"]["payment_status"]
          p_proof_status?: string
          p_shipment_number?: string
          p_status: Database["public"]["Enums"]["order_status"]
          p_tracking_url?: string
        }
        Returns: undefined
      }
      create_promotional_order: {
        Args: {
          p_order: Json
          p_proof_path?: string
          p_tracking_token_hash: string
          p_user_id: string
          p_verification_token_hash: string
        }
        Returns: Json
      }
      create_verified_order: {
        Args: {
          p_order: Json
          p_proof_path?: string
          p_tracking_token_hash: string
          p_user_id: string
          p_verification_token_hash: string
        }
        Returns: Json
      }
      preview_discount_code: {
        Args: {
          p_code: string
          p_items: Json
          p_payment_method?: string
          p_phone?: string
        }
        Returns: Json
      }
      process_paymob_callback: {
        Args: {
          p_amount_minor: number
          p_currency: string
          p_event_id: string
          p_external_order_id: string
          p_integration_id: number
          p_order_number: string
          p_payload_digest: string
          p_success: boolean
          p_transaction_id: string
        }
        Returns: Json
      }
      release_expired_order_reservations: { Args: never; Returns: number }
      subscribe_newsletter: {
        Args: { p_email: string; p_locale?: string }
        Returns: undefined
      }
      sync_customer_cart_and_wishlist: {
        Args: { p_cart?: Json; p_wishlist?: number[] }
        Returns: Json
      }
      track_store_event: {
        Args: {
          p_anonymous_id: string
          p_device_type?: string
          p_event_name: string
          p_locale?: string
          p_metadata?: Json
          p_path: string
          p_product_id?: number
          p_referrer_host?: string
          p_session_id: string
          p_utm_campaign?: string
          p_utm_medium?: string
          p_utm_source?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "customer"
        | "support"
        | "warehouse"
        | "content_editor"
        | "product_manager"
        | "analyst"
        | "admin"
        | "super_admin"
      discount_type: "percentage" | "fixed"
      inventory_movement_type:
        | "receipt"
        | "reservation"
        | "release"
        | "sale"
        | "return"
        | "damage"
        | "adjustment"
      order_status:
        | "awaiting_payment"
        | "payment_review"
        | "confirmed"
        | "processing"
        | "ready_to_ship"
        | "shipped"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
        | "returned"
      payment_method: "cod" | "vodafone_cash" | "instapay" | "paymob"
      payment_status:
        | "pending"
        | "proof_submitted"
        | "paid"
        | "rejected"
        | "failed"
        | "cod_due"
        | "cod_collected"
        | "refunded"
      product_status: "draft" | "active" | "scheduled" | "archived"
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
  graphql_public: {
    Enums: {},
  },
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
      discount_type: ["percentage", "fixed"],
      inventory_movement_type: [
        "receipt",
        "reservation",
        "release",
        "sale",
        "return",
        "damage",
        "adjustment",
      ],
      order_status: [
        "awaiting_payment",
        "payment_review",
        "confirmed",
        "processing",
        "ready_to_ship",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
      ],
      payment_method: ["cod", "vodafone_cash", "instapay", "paymob"],
      payment_status: [
        "pending",
        "proof_submitted",
        "paid",
        "rejected",
        "failed",
        "cod_due",
        "cod_collected",
        "refunded",
      ],
      product_status: ["draft", "active", "scheduled", "archived"],
    },
  },
} as const
