# Supabase SQL History

이 문서는 TCG Sail에서 Supabase SQL Editor로 실제 실행한 SQL을 기록합니다.

현재 실행한 SQL은 3개입니다.

1. `purchases`, `sales` 테이블, trigger, index, RLS 정책 생성
2. 상품군 `category` check constraint 갱신
3. 구매일 기준 원화 환산 환율 컬럼 추가

앱 코드는 어떤 컬럼을 사용하는지 보여주지만, 실제 DB의 RLS 정책, check constraint, trigger, index는 Supabase에 적용된 SQL을 별도로 봐야 정확히 알 수 있습니다. 운영/복구/새 프로젝트 생성 시 이 문서를 기준으로 SQL Editor에서 다시 적용합니다.

## Auth

- Supabase Auth의 이메일/비밀번호 로그인을 사용합니다.
- 현재는 Supabase 대시보드에서 회원가입을 막고, 필요한 유저만 직접 생성하는 방식입니다.
- RLS는 모든 사용자가 자기 `user_id` 데이터만 읽고 쓸 수 있도록 제한합니다.

## 1. Purchases And Sales Tracking With RLS

```sql
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  product_name text not null,
  language text not null check (language in ('한글판', '북미판', '일본판')),
  category text not null check (category in ('부스터 박스', 'ETB', '부스터 번들', '틴', '싱글 카드', '기타')),
  purchase_date date not null,

  quantity integer not null check (quantity > 0),
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  shipping_fee numeric(14, 2) not null default 0 check (shipping_fee >= 0),
  tax_fee numeric(14, 2) not null default 0 check (tax_fee >= 0),
  extra_fee numeric(14, 2) not null default 0 check (extra_fee >= 0),

  currency text not null check (currency in ('KRW', 'USD', 'JPY')),
  marketplace text not null,
  memo text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (id, user_id)
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  purchase_id uuid not null,
  product_name text not null,
  language text not null check (language in ('한글판', '북미판', '일본판')),
  category text not null check (category in ('부스터 박스', 'ETB', '부스터 번들', '틴', '싱글 카드', '기타')),
  sale_date date not null,

  quantity integer not null check (quantity > 0),
  unit_sale_price numeric(14, 2) not null check (unit_sale_price >= 0),
  shipping_fee numeric(14, 2) not null default 0 check (shipping_fee >= 0),
  platform_fee numeric(14, 2) not null default 0 check (platform_fee >= 0),

  marketplace text not null,
  memo text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sales_purchase_owner_fk
    foreign key (purchase_id, user_id)
    references purchases (id, user_id)
    on delete cascade
);

drop trigger if exists purchases_set_updated_at on purchases;
create trigger purchases_set_updated_at
before update on purchases
for each row
execute function set_updated_at();

drop trigger if exists sales_set_updated_at on sales;
create trigger sales_set_updated_at
before update on sales
for each row
execute function set_updated_at();

create index if not exists purchases_user_id_purchase_date_idx
on purchases (user_id, purchase_date desc);

create index if not exists sales_user_id_sale_date_idx
on sales (user_id, sale_date desc);

create index if not exists sales_purchase_id_idx
on sales (purchase_id);

alter table purchases enable row level security;
alter table sales enable row level security;

drop policy if exists purchases_select_owner on purchases;
drop policy if exists purchases_insert_owner on purchases;
drop policy if exists purchases_update_owner on purchases;
drop policy if exists purchases_delete_owner on purchases;

create policy purchases_select_owner
on purchases
for select
to authenticated
using (auth.uid() = user_id);

create policy purchases_insert_owner
on purchases
for insert
to authenticated
with check (auth.uid() = user_id);

create policy purchases_update_owner
on purchases
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy purchases_delete_owner
on purchases
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists sales_select_owner on sales;
drop policy if exists sales_insert_owner on sales;
drop policy if exists sales_update_owner on sales;
drop policy if exists sales_delete_owner on sales;

create policy sales_select_owner
on sales
for select
to authenticated
using (auth.uid() = user_id);

create policy sales_insert_owner
on sales
for insert
to authenticated
with check (auth.uid() = user_id);

create policy sales_update_owner
on sales
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy sales_delete_owner
on sales
for delete
to authenticated
using (auth.uid() = user_id);
```

## 2. Validate Purchase And Sales Categories

상품군 변경 시 앱의 `CATEGORIES`와 DB의 `category` check constraint를 함께 맞춥니다.

```sql
alter table purchases
drop constraint if exists purchases_category_check;

alter table purchases
add constraint purchases_category_check
check (category in ('부스터 박스', '박스(한판/일판)', 'ETB', '부스터 번들', '틴', '싱글 카드', '등급 카드', '기타'));

alter table sales
drop constraint if exists sales_category_check;

alter table sales
add constraint sales_category_check
check (category in ('부스터 박스', '박스(한판/일판)', 'ETB', '부스터 번들', '틴', '싱글 카드', '등급 카드', '기타'));
```

## Marketplace

`marketplace`는 `text not null`이며 check constraint를 두지 않습니다. 앱에서 기본 선택지를 제공하되, `기타` 선택 시 최대 50자 직접 입력값을 저장합니다.

## 3. Add Purchase Exchange Rate

외화 구매를 등록할 때 구매일 기준 원화 환산 환율을 저장합니다. 기존 구매 데이터는 환율이 없을 수 있으므로 nullable 컬럼으로 유지합니다.

```sql
alter table purchases
add column if not exists exchange_rate_krw numeric(14, 6);
```
