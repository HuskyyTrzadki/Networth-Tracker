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
      cron_portfolio_snapshots_state: {
        Row: {
          cursor_user_id: string | null
          done: boolean
          job_date: string
          updated_at: string
        }
        Insert: {
          cursor_user_id?: string | null
          done?: boolean
          job_date: string
          updated_at?: string
        }
        Update: {
          cursor_user_id?: string | null
          done?: boolean
          job_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_instruments: {
        Row: {
          annual_rate_pct: number
          client_request_id: string
          created_at: string
          currency: string
          id: string
          kind: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
          valuation_kind: string
        }
        Insert: {
          annual_rate_pct?: number
          client_request_id: string
          created_at?: string
          currency: string
          id?: string
          kind?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          valuation_kind?: string
        }
        Update: {
          annual_rate_pct?: number
          client_request_id?: string
          created_at?: string
          currency?: string
          id?: string
          kind?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          valuation_kind?: string
        }
        Relationships: []
      }
      demo_bundle_instance_portfolios: {
        Row: {
          bundle_id: string
          created_at: string
          portfolio_id: string
          portfolio_template_key: string
          user_id: string
        }
        Insert: {
          bundle_id: string
          created_at?: string
          portfolio_id: string
          portfolio_template_key: string
          user_id: string
        }
        Update: {
          bundle_id?: string
          created_at?: string
          portfolio_id?: string
          portfolio_template_key?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_bundle_instance_portfolios_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "demo_bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_bundle_instance_portfolios_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_bundle_instances: {
        Row: {
          bundle_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          bundle_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          bundle_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_bundle_instances_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "demo_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_bundle_portfolios: {
        Row: {
          base_currency: string
          bundle_id: string
          created_at: string
          id: string
          is_tax_advantaged: boolean
          name: string
          sort_order: number
          template_key: string
        }
        Insert: {
          base_currency: string
          bundle_id: string
          created_at?: string
          id?: string
          is_tax_advantaged?: boolean
          name: string
          sort_order: number
          template_key: string
        }
        Update: {
          base_currency?: string
          bundle_id?: string
          created_at?: string
          id?: string
          is_tax_advantaged?: boolean
          name?: string
          sort_order?: number
          template_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_bundle_portfolios_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "demo_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_bundle_transactions: {
        Row: {
          asset_source: string
          bundle_id: string
          cash_currency: string | null
          cashflow_type: string | null
          consume_cash: boolean
          created_at: string
          custom_annual_rate_pct: number | null
          custom_currency: string | null
          custom_kind: string | null
          custom_name: string | null
          custom_valuation_kind: string | null
          fee: number
          id: string
          notes: string | null
          portfolio_template_key: string
          price: number
          provider: string | null
          provider_key: string | null
          quantity: number
          side: Database["public"]["Enums"]["transaction_side"]
          sort_order: number
          trade_date: string
        }
        Insert: {
          asset_source: string
          bundle_id: string
          cash_currency?: string | null
          cashflow_type?: string | null
          consume_cash?: boolean
          created_at?: string
          custom_annual_rate_pct?: number | null
          custom_currency?: string | null
          custom_kind?: string | null
          custom_name?: string | null
          custom_valuation_kind?: string | null
          fee?: number
          id?: string
          notes?: string | null
          portfolio_template_key: string
          price: number
          provider?: string | null
          provider_key?: string | null
          quantity: number
          side: Database["public"]["Enums"]["transaction_side"]
          sort_order: number
          trade_date: string
        }
        Update: {
          asset_source?: string
          bundle_id?: string
          cash_currency?: string | null
          cashflow_type?: string | null
          consume_cash?: boolean
          created_at?: string
          custom_annual_rate_pct?: number | null
          custom_currency?: string | null
          custom_kind?: string | null
          custom_name?: string | null
          custom_valuation_kind?: string | null
          fee?: number
          id?: string
          notes?: string | null
          portfolio_template_key?: string
          price?: number
          provider?: string | null
          provider_key?: string | null
          quantity?: number
          side?: Database["public"]["Enums"]["transaction_side"]
          sort_order?: number
          trade_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_bundle_transactions_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "demo_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_bundle_snapshot_cache: {
        Row: {
          as_of_eur: string | null
          as_of_pln: string | null
          as_of_usd: string | null
          bucket_date: string
          bundle_id: string
          captured_at: string
          id: string
          is_partial_eur: boolean
          is_partial_pln: boolean
          is_partial_usd: boolean
          missing_fx_eur: number
          missing_fx_pln: number
          missing_fx_usd: number
          missing_quotes_eur: number
          missing_quotes_pln: number
          missing_quotes_usd: number
          net_external_cashflow_eur: number | null
          net_external_cashflow_pln: number | null
          net_external_cashflow_usd: number | null
          net_implicit_transfer_eur: number | null
          net_implicit_transfer_pln: number | null
          net_implicit_transfer_usd: number | null
          portfolio_template_key: string | null
          scope: Database["public"]["Enums"]["portfolio_snapshot_scope"]
          total_value_eur: number | null
          total_value_pln: number | null
          total_value_usd: number | null
        }
        Insert: {
          as_of_eur?: string | null
          as_of_pln?: string | null
          as_of_usd?: string | null
          bucket_date: string
          bundle_id: string
          captured_at?: string
          id?: string
          is_partial_eur?: boolean
          is_partial_pln?: boolean
          is_partial_usd?: boolean
          missing_fx_eur?: number
          missing_fx_pln?: number
          missing_fx_usd?: number
          missing_quotes_eur?: number
          missing_quotes_pln?: number
          missing_quotes_usd?: number
          net_external_cashflow_eur?: number | null
          net_external_cashflow_pln?: number | null
          net_external_cashflow_usd?: number | null
          net_implicit_transfer_eur?: number | null
          net_implicit_transfer_pln?: number | null
          net_implicit_transfer_usd?: number | null
          portfolio_template_key?: string | null
          scope: Database["public"]["Enums"]["portfolio_snapshot_scope"]
          total_value_eur?: number | null
          total_value_pln?: number | null
          total_value_usd?: number | null
        }
        Update: {
          as_of_eur?: string | null
          as_of_pln?: string | null
          as_of_usd?: string | null
          bucket_date?: string
          bundle_id?: string
          captured_at?: string
          id?: string
          is_partial_eur?: boolean
          is_partial_pln?: boolean
          is_partial_usd?: boolean
          missing_fx_eur?: number
          missing_fx_pln?: number
          missing_fx_usd?: number
          missing_quotes_eur?: number
          missing_quotes_pln?: number
          missing_quotes_usd?: number
          net_external_cashflow_eur?: number | null
          net_external_cashflow_pln?: number | null
          net_external_cashflow_usd?: number | null
          net_implicit_transfer_eur?: number | null
          net_implicit_transfer_pln?: number | null
          net_implicit_transfer_usd?: number | null
          portfolio_template_key?: string | null
          scope?: Database["public"]["Enums"]["portfolio_snapshot_scope"]
          total_value_eur?: number | null
          total_value_pln?: number | null
          total_value_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_bundle_snapshot_cache_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "demo_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_bundles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
        }
        Relationships: []
      }
      fx_daily_rates_cache: {
        Row: {
          as_of: string
          base_currency: string
          fetched_at: string
          id: string
          provider: string
          quote_currency: string
          rate: number
          rate_date: string
          source_timezone: string
        }
        Insert: {
          as_of: string
          base_currency: string
          fetched_at?: string
          id?: string
          provider?: string
          quote_currency: string
          rate: number
          rate_date: string
          source_timezone?: string
        }
        Update: {
          as_of?: string
          base_currency?: string
          fetched_at?: string
          id?: string
          provider?: string
          quote_currency?: string
          rate?: number
          rate_date?: string
          source_timezone?: string
        }
        Relationships: []
      }
      fx_rates_cache: {
        Row: {
          as_of: string
          base_currency: string
          fetched_at: string
          id: string
          provider: string
          quote_currency: string
          rate: number
        }
        Insert: {
          as_of: string
          base_currency: string
          fetched_at?: string
          id?: string
          provider?: string
          quote_currency: string
          rate: number
        }
        Update: {
          as_of?: string
          base_currency?: string
          fetched_at?: string
          id?: string
          provider?: string
          quote_currency?: string
          rate?: number
        }
        Relationships: []
      }
      guest_upgrade_nudge_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          step: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          step: number
          user_id?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          step?: number
          user_id?: string
        }
        Relationships: []
      }
      instrument_daily_prices_cache: {
        Row: {
          adj_close: number | null
          as_of: string
          close: number
          currency: string
          exchange_timezone: string
          fetched_at: string
          high: number | null
          id: string
          low: number | null
          open: number | null
          price_date: string
          provider: string
          provider_key: string
          volume: number | null
        }
        Insert: {
          adj_close?: number | null
          as_of: string
          close: number
          currency: string
          exchange_timezone: string
          fetched_at?: string
          high?: number | null
          id?: string
          low?: number | null
          open?: number | null
          price_date: string
          provider: string
          provider_key: string
          volume?: number | null
        }
        Update: {
          adj_close?: number | null
          as_of?: string
          close?: number
          currency?: string
          exchange_timezone?: string
          fetched_at?: string
          high?: number | null
          id?: string
          low?: number | null
          open?: number | null
          price_date?: string
          provider?: string
          provider_key?: string
          volume?: number | null
        }
        Relationships: []
      }
      instrument_eps_ttm_events_cache: {
        Row: {
          eps_ttm: number | null
          fetched_at: string
          id: string
          period_end_date: string
          provider: string
          provider_key: string
          source: string
        }
        Insert: {
          eps_ttm?: number | null
          fetched_at?: string
          id?: string
          period_end_date: string
          provider?: string
          provider_key: string
          source?: string
        }
        Update: {
          eps_ttm?: number | null
          fetched_at?: string
          id?: string
          period_end_date?: string
          provider?: string
          provider_key?: string
          source?: string
        }
        Relationships: []
      }
      instrument_fundamental_time_series_cache: {
        Row: {
          fetched_at: string
          id: string
          metric: string
          period_end_date: string
          period_type: string
          provider: string
          provider_key: string
          source: string
          value: number | null
        }
        Insert: {
          fetched_at?: string
          id?: string
          metric: string
          period_end_date: string
          period_type: string
          provider?: string
          provider_key: string
          source: string
          value?: number | null
        }
        Update: {
          fetched_at?: string
          id?: string
          metric?: string
          period_end_date?: string
          period_type?: string
          provider?: string
          provider_key?: string
          source?: string
          value?: number | null
        }
        Relationships: []
      }
      instrument_quotes_cache: {
        Row: {
          as_of: string
          currency: string
          day_change: number | null
          day_change_percent: number | null
          fetched_at: string
          id: string
          instrument_id: string
          price: number
          provider: string
          provider_key: string
        }
        Insert: {
          as_of: string
          currency: string
          day_change?: number | null
          day_change_percent?: number | null
          fetched_at?: string
          id?: string
          instrument_id: string
          price: number
          provider: string
          provider_key: string
        }
        Update: {
          as_of?: string
          currency?: string
          day_change?: number | null
          day_change_percent?: number | null
          fetched_at?: string
          id?: string
          instrument_id?: string
          price?: number
          provider?: string
          provider_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "instrument_quotes_cache_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
        ]
      }
      instrument_revenue_geo_breakdown_cache: {
        Row: {
          fetched_at: string
          history_by_country: Json
          id: string
          latest_by_country: Json
          metadata: Json
          provider: string
          provider_key: string
          series_order: string[]
          source: string
        }
        Insert: {
          fetched_at?: string
          history_by_country?: Json
          id?: string
          latest_by_country?: Json
          metadata?: Json
          provider?: string
          provider_key: string
          series_order?: string[]
          source?: string
        }
        Update: {
          fetched_at?: string
          history_by_country?: Json
          id?: string
          latest_by_country?: Json
          metadata?: Json
          provider?: string
          provider_key?: string
          series_order?: string[]
          source?: string
        }
        Relationships: []
      }
      instrument_valuation_summary_cache: {
        Row: {
          as_of: string | null
          cash: number | null
          debt: number | null
          dividend_yield: number | null
          ev_to_ebitda: number | null
          fetched_at: string
          id: string
          market_cap: number | null
          operating_margin: number | null
          payout_date: string | null
          payout_ratio: number | null
          pe_ttm: number | null
          price_to_book: number | null
          price_to_sales: number | null
          profit_margin: number | null
          provider: string
          provider_key: string
          quarterly_earnings_yoy: number | null
          quarterly_revenue_yoy: number | null
        }
        Insert: {
          as_of?: string | null
          cash?: number | null
          debt?: number | null
          dividend_yield?: number | null
          ev_to_ebitda?: number | null
          fetched_at?: string
          id?: string
          market_cap?: number | null
          operating_margin?: number | null
          payout_date?: string | null
          payout_ratio?: number | null
          pe_ttm?: number | null
          price_to_book?: number | null
          price_to_sales?: number | null
          profit_margin?: number | null
          provider?: string
          provider_key: string
          quarterly_earnings_yoy?: number | null
          quarterly_revenue_yoy?: number | null
        }
        Update: {
          as_of?: string | null
          cash?: number | null
          debt?: number | null
          dividend_yield?: number | null
          ev_to_ebitda?: number | null
          fetched_at?: string
          id?: string
          market_cap?: number | null
          operating_margin?: number | null
          payout_date?: string | null
          payout_ratio?: number | null
          pe_ttm?: number | null
          price_to_book?: number | null
          price_to_sales?: number | null
          profit_margin?: number | null
          provider?: string
          provider_key?: string
          quarterly_earnings_yoy?: number | null
          quarterly_revenue_yoy?: number | null
        }
        Relationships: []
      }
      instruments: {
        Row: {
          created_at: string
          currency: string
          exchange: string | null
          id: string
          instrument_type: Database["public"]["Enums"]["instrument_type"] | null
          logo_url: string | null
          name: string
          provider: string
          provider_key: string
          region: string | null
          symbol: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency: string
          exchange?: string | null
          id?: string
          instrument_type?:
            | Database["public"]["Enums"]["instrument_type"]
            | null
          logo_url?: string | null
          name: string
          provider: string
          provider_key: string
          region?: string | null
          symbol: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          exchange?: string | null
          id?: string
          instrument_type?:
            | Database["public"]["Enums"]["instrument_type"]
            | null
          logo_url?: string | null
          name?: string
          provider?: string
          provider_key?: string
          region?: string | null
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      macro_cpi_pl_cache: {
        Row: {
          as_of: string
          fetched_at: string
          id: string
          metric: string
          period_date: string
          provider: string
          value: number
        }
        Insert: {
          as_of?: string
          fetched_at?: string
          id?: string
          metric: string
          period_date: string
          provider: string
          value: number
        }
        Update: {
          as_of?: string
          fetched_at?: string
          id?: string
          metric?: string
          period_date?: string
          provider?: string
          value?: number
        }
        Relationships: []
      }
      portfolio_currency_exposure_cache: {
        Row: {
          as_of: string | null
          fetched_at: string
          holdings_fingerprint: string
          id: string
          model: string
          portfolio_id: string | null
          prompt_version: string
          result_json: Json
          scope: Database["public"]["Enums"]["portfolio_snapshot_scope"]
          user_id: string
        }
        Insert: {
          as_of?: string | null
          fetched_at?: string
          holdings_fingerprint: string
          id?: string
          model: string
          portfolio_id?: string | null
          prompt_version: string
          result_json?: Json
          scope: Database["public"]["Enums"]["portfolio_snapshot_scope"]
          user_id: string
        }
        Update: {
          as_of?: string | null
          fetched_at?: string
          holdings_fingerprint?: string
          id?: string
          model?: string
          portfolio_id?: string | null
          prompt_version?: string
          result_json?: Json
          scope?: Database["public"]["Enums"]["portfolio_snapshot_scope"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_currency_exposure_cache_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_snapshot_rebuild_state: {
        Row: {
          created_at: string
          dirty_from: string | null
          from_date: string | null
          id: string
          message: string | null
          portfolio_id: string | null
          processed_until: string | null
          scope: Database["public"]["Enums"]["portfolio_snapshot_scope"]
          status: string
          to_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dirty_from?: string | null
          from_date?: string | null
          id?: string
          message?: string | null
          portfolio_id?: string | null
          processed_until?: string | null
          scope: Database["public"]["Enums"]["portfolio_snapshot_scope"]
          status?: string
          to_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dirty_from?: string | null
          from_date?: string | null
          id?: string
          message?: string | null
          portfolio_id?: string | null
          processed_until?: string | null
          scope?: Database["public"]["Enums"]["portfolio_snapshot_scope"]
          status?: string
          to_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_snapshot_rebuild_state_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_snapshots: {
        Row: {
          as_of_eur: string | null
          as_of_pln: string | null
          as_of_usd: string | null
          bucket_date: string
          captured_at: string
          id: string
          is_partial_eur: boolean
          is_partial_pln: boolean
          is_partial_usd: boolean
          missing_fx_eur: number
          missing_fx_pln: number
          missing_fx_usd: number
          missing_quotes_eur: number
          missing_quotes_pln: number
          missing_quotes_usd: number
          net_external_cashflow_eur: number | null
          net_external_cashflow_pln: number | null
          net_external_cashflow_usd: number | null
          net_implicit_transfer_eur: number | null
          net_implicit_transfer_pln: number | null
          net_implicit_transfer_usd: number | null
          portfolio_id: string | null
          scope: Database["public"]["Enums"]["portfolio_snapshot_scope"]
          total_value_eur: number | null
          total_value_pln: number | null
          total_value_usd: number | null
          user_id: string
        }
        Insert: {
          as_of_eur?: string | null
          as_of_pln?: string | null
          as_of_usd?: string | null
          bucket_date: string
          captured_at?: string
          id?: string
          is_partial_eur?: boolean
          is_partial_pln?: boolean
          is_partial_usd?: boolean
          missing_fx_eur?: number
          missing_fx_pln?: number
          missing_fx_usd?: number
          missing_quotes_eur?: number
          missing_quotes_pln?: number
          missing_quotes_usd?: number
          net_external_cashflow_eur?: number | null
          net_external_cashflow_pln?: number | null
          net_external_cashflow_usd?: number | null
          net_implicit_transfer_eur?: number | null
          net_implicit_transfer_pln?: number | null
          net_implicit_transfer_usd?: number | null
          portfolio_id?: string | null
          scope: Database["public"]["Enums"]["portfolio_snapshot_scope"]
          total_value_eur?: number | null
          total_value_pln?: number | null
          total_value_usd?: number | null
          user_id: string
        }
        Update: {
          as_of_eur?: string | null
          as_of_pln?: string | null
          as_of_usd?: string | null
          bucket_date?: string
          captured_at?: string
          id?: string
          is_partial_eur?: boolean
          is_partial_pln?: boolean
          is_partial_usd?: boolean
          missing_fx_eur?: number
          missing_fx_pln?: number
          missing_fx_usd?: number
          missing_quotes_eur?: number
          missing_quotes_pln?: number
          missing_quotes_usd?: number
          net_external_cashflow_eur?: number | null
          net_external_cashflow_pln?: number | null
          net_external_cashflow_usd?: number | null
          net_implicit_transfer_eur?: number | null
          net_implicit_transfer_pln?: number | null
          net_implicit_transfer_usd?: number | null
          portfolio_id?: string | null
          scope?: Database["public"]["Enums"]["portfolio_snapshot_scope"]
          total_value_eur?: number | null
          total_value_pln?: number | null
          total_value_usd?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_snapshots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          archived_at: string | null
          base_currency: string
          created_at: string
          id: string
          is_tax_advantaged: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          base_currency?: string
          created_at?: string
          id?: string
          is_tax_advantaged?: boolean
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          base_currency?: string
          created_at?: string
          id?: string
          is_tax_advantaged?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          guest_upgrade_nudge_15_dismissed_at: string | null
          guest_upgrade_nudge_5_dismissed_at: string | null
          last_active_at: string
          upgraded_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          guest_upgrade_nudge_15_dismissed_at?: string | null
          guest_upgrade_nudge_5_dismissed_at?: string | null
          last_active_at?: string
          upgraded_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          guest_upgrade_nudge_15_dismissed_at?: string | null
          guest_upgrade_nudge_5_dismissed_at?: string | null
          last_active_at?: string
          upgraded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stock_watchlist: {
        Row: {
          created_at: string
          currency: string
          id: string
          logo_url: string | null
          name: string
          provider_key: string
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency: string
          id?: string
          logo_url?: string | null
          name: string
          provider_key: string
          symbol: string
          user_id?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          name?: string
          provider_key?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          cashflow_type: Database["public"]["Enums"]["cashflow_type"] | null
          client_request_id: string
          created_at: string
          custom_instrument_id: string | null
          dividend_event_key: string | null
          fee: number
          group_id: string
          id: string
          instrument_id: string | null
          leg_key: string
          leg_role: Database["public"]["Enums"]["transaction_leg_role"]
          notes: string | null
          portfolio_id: string
          price: number
          quantity: number
          settlement_fx_as_of: string | null
          settlement_fx_provider: string | null
          settlement_fx_rate: number | null
          side: Database["public"]["Enums"]["transaction_side"]
          trade_date: string
          user_id: string
        }
        Insert: {
          cashflow_type?: Database["public"]["Enums"]["cashflow_type"] | null
          client_request_id: string
          created_at?: string
          custom_instrument_id?: string | null
          dividend_event_key?: string | null
          fee?: number
          group_id: string
          id?: string
          instrument_id?: string | null
          leg_key: string
          leg_role: Database["public"]["Enums"]["transaction_leg_role"]
          notes?: string | null
          portfolio_id: string
          price: number
          quantity: number
          settlement_fx_as_of?: string | null
          settlement_fx_provider?: string | null
          settlement_fx_rate?: number | null
          side: Database["public"]["Enums"]["transaction_side"]
          trade_date: string
          user_id?: string
        }
        Update: {
          cashflow_type?: Database["public"]["Enums"]["cashflow_type"] | null
          client_request_id?: string
          created_at?: string
          custom_instrument_id?: string | null
          dividend_event_key?: string | null
          fee?: number
          group_id?: string
          id?: string
          instrument_id?: string | null
          leg_key?: string
          leg_role?: Database["public"]["Enums"]["transaction_leg_role"]
          notes?: string | null
          portfolio_id?: string
          price?: number
          quantity?: number
          settlement_fx_as_of?: string | null
          settlement_fx_provider?: string | null
          settlement_fx_rate?: number | null
          side?: Database["public"]["Enums"]["transaction_side"]
          trade_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_custom_instrument_id_fkey"
            columns: ["custom_instrument_id"]
            isOneToOne: false
            referencedRelation: "custom_instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_instrument_id_fkey"
            columns: ["instrument_id"]
            isOneToOne: false
            referencedRelation: "instruments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      count_tradingview_revenue_geo_backfill_candidates: {
        Args: { p_provider?: string; p_stale_before?: string }
        Returns: number
      }
      get_cash_balances: {
        Args: { p_portfolio_ids?: string[] }
        Returns: {
          currency: string
          portfolio_id: string
          quantity: number
        }[]
      }
      get_custom_portfolio_anchors: {
        Args: { p_custom_instrument_ids?: string[]; p_portfolio_id?: string }
        Returns: {
          annual_rate_pct: number
          created_at: string
          currency: string
          custom_instrument_id: string
          price: number
          trade_date: string
        }[]
      }
      get_custom_portfolio_anchors_admin_as_of: {
        Args: {
          p_bucket_date: string
          p_custom_instrument_ids?: string[]
          p_portfolio_id?: string
          p_user_id: string
        }
        Returns: {
          annual_rate_pct: number
          created_at: string
          currency: string
          custom_instrument_id: string
          price: number
          trade_date: string
        }[]
      }
      get_custom_portfolio_holdings: {
        Args: { p_portfolio_id?: string }
        Returns: {
          currency: string
          custom_instrument_id: string
          name: string
          quantity: number
        }[]
      }
      get_custom_portfolio_holdings_admin_as_of: {
        Args: {
          p_bucket_date: string
          p_portfolio_id?: string
          p_user_id: string
        }
        Returns: {
          currency: string
          custom_instrument_id: string
          name: string
          quantity: number
        }[]
      }
      get_external_cashflows_admin: {
        Args: {
          p_bucket_date: string
          p_portfolio_id?: string
          p_user_id: string
        }
        Returns: {
          currency: string
          net_amount: number
        }[]
      }
      get_implicit_transfers_admin: {
        Args: {
          p_bucket_date: string
          p_portfolio_id?: string
          p_user_id: string
        }
        Returns: {
          currency: string
          net_amount: number
        }[]
      }
      get_portfolio_holdings: {
        Args: { p_portfolio_id?: string }
        Returns: {
          currency: string
          exchange: string
          instrument_id: string
          instrument_type: Database["public"]["Enums"]["instrument_type"]
          logo_url: string
          name: string
          provider: string
          provider_key: string
          quantity: number
          symbol: string
        }[]
      }
      get_portfolio_holdings_admin: {
        Args: { p_portfolio_id?: string; p_user_id: string }
        Returns: {
          currency: string
          exchange: string
          instrument_id: string
          instrument_type: Database["public"]["Enums"]["instrument_type"]
          logo_url: string
          name: string
          provider: string
          provider_key: string
          quantity: number
          symbol: string
        }[]
      }
      get_portfolio_holdings_admin_as_of: {
        Args: {
          p_bucket_date: string
          p_portfolio_id?: string
          p_user_id: string
        }
        Returns: {
          currency: string
          exchange: string
          instrument_id: string
          instrument_type: Database["public"]["Enums"]["instrument_type"]
          logo_url: string
          name: string
          provider: string
          provider_key: string
          quantity: number
          symbol: string
        }[]
      }
      list_tradingview_revenue_geo_backfill_candidates: {
        Args: {
          p_limit?: number
          p_provider?: string
          p_stale_before?: string
        }
        Returns: {
          cache_fetched_at: string | null
          exchange: string | null
          instrument_type: Database["public"]["Enums"]["instrument_type"]
          name: string | null
          provider: string
          provider_key: string
          symbol: string
          updated_at: string
        }[]
      }
      replace_transaction_group: {
        Args: { p_group_id: string; p_new_legs: Json; p_user_id: string }
        Returns: {
          group_id: string
          new_trade_date: string
          old_trade_date: string
          portfolio_id: string
          replaced_count: number
        }[]
      }
      replace_transaction_group_with_custom_rate: {
        Args: {
          p_custom_annual_rate_pct?: number
          p_custom_instrument_id?: string
          p_group_id: string
          p_new_legs: Json
          p_user_id: string
        }
        Returns: {
          group_id: string
          new_trade_date: string
          old_trade_date: string
          portfolio_id: string
          replaced_count: number
        }[]
      }
    }
    Enums: {
      cashflow_type:
        | "DEPOSIT"
        | "WITHDRAWAL"
        | "DIVIDEND"
        | "INTEREST"
        | "FEE"
        | "TAX"
        | "TRADE_SETTLEMENT"
      instrument_type:
        | "EQUITY"
        | "ETF"
        | "CRYPTOCURRENCY"
        | "MUTUALFUND"
        | "CURRENCY"
        | "INDEX"
        | "OPTION"
        | "FUTURE"
        | "MONEYMARKET"
        | "ECNQUOTE"
        | "ALTSYMBOL"
      portfolio_snapshot_scope: "PORTFOLIO" | "ALL"
      transaction_leg_role: "ASSET" | "CASH"
      transaction_side: "BUY" | "SELL"
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
      cashflow_type: [
        "DEPOSIT",
        "WITHDRAWAL",
        "DIVIDEND",
        "INTEREST",
        "FEE",
        "TAX",
        "TRADE_SETTLEMENT",
      ],
      instrument_type: [
        "EQUITY",
        "ETF",
        "CRYPTOCURRENCY",
        "MUTUALFUND",
        "CURRENCY",
        "INDEX",
        "OPTION",
        "FUTURE",
        "MONEYMARKET",
        "ECNQUOTE",
        "ALTSYMBOL",
      ],
      portfolio_snapshot_scope: ["PORTFOLIO", "ALL"],
      transaction_leg_role: ["ASSET", "CASH"],
      transaction_side: ["BUY", "SELL"],
    },
  },
} as const
