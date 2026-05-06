do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'transactions_sale_payments_revenue_chk'
  ) then
    alter table public.transactions
      add constraint transactions_sale_payments_revenue_chk
      check (venda_id is null or tipo = 'RECEITA') not valid;
  end if;
end
$$;

alter table public.transactions
  validate constraint transactions_sale_payments_revenue_chk;
