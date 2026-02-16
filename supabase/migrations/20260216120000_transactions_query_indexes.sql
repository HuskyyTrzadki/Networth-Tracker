-- Query-shape-aligned indexes for transaction-heavy reads:
-- - paginated list (portfolio scope + date ordering + leg ordering),
-- - stock trade markers (instrument + ASSET leg filters),
-- - snapshot rebuild range reads (portfolio/date constraints).

create index if not exists transactions_user_portfolio_trade_created_leg_idx
  on public.transactions(user_id, portfolio_id, trade_date desc, created_at desc, leg_key);

create index if not exists transactions_user_instrument_leg_trade_created_idx
  on public.transactions(user_id, instrument_id, leg_role, trade_date asc, created_at asc)
  where instrument_id is not null;

create index if not exists transactions_user_portfolio_trade_idx
  on public.transactions(user_id, portfolio_id, trade_date);
