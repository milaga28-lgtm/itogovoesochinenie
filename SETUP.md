# Как опубликовать сайт и включить регистрацию

## 1. Публикация на GitHub Pages (бесплатно)

1. Открой репозиторий на GitHub → **Settings** → **Pages**.
2. В блоке **Build and deployment** выбери **Source: Deploy from a branch**.
3. Выбери ветку (`main` после слияния изменений) и папку **`/ (root)`** → **Save**.
4. Через 1–2 минуты сайт появится по адресу
   `https://<твой-логин>.github.io/itogovoesochinenie/`.

Сайт полностью статический: сервер не нужен, платить ни за что не придётся.
Каждый раз, когда в ветку попадают изменения, GitHub Pages обновляет сайт сам.

## 2. Регистрация по почте (необязательно)

Без этого шага сайт работает полностью, черновики хранятся в браузере.
Регистрация нужна, чтобы видеть, сколько людей пользуется сайтом, и чтобы
черновики сохранялись в аккаунте.

1. Зарегистрируйся на [supabase.com](https://supabase.com) (бесплатный тариф) и создай проект.
2. Открой **SQL Editor** → **New query**, вставь код ниже и нажми **Run**:

```sql
-- черновики сочинений: каждый видит только свои
create table if not exists public.drafts (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  topic text,
  body text,
  state jsonb,
  updated_at timestamptz default now()
);
alter table public.drafts enable row level security;
create policy "own drafts" on public.drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- счётчик посещений по разделам (без личных данных: только раздел и дата)
create table if not exists public.visits (
  day date not null default current_date,
  page text not null,
  n integer not null default 0,
  primary key (day, page)
);
alter table public.visits enable row level security;

create or replace function public.track_visit(p_page text)
returns void language sql security definer set search_path = public as $$
  insert into visits(day, page, n) values (current_date, left(p_page, 40), 1)
  on conflict (day, page) do update set n = visits.n + 1;
$$;

-- сколько человек зарегистрировалось (показывается на странице профиля)
create or replace function public.users_count()
returns integer language sql security definer set search_path = public as $$
  select count(*)::int from auth.users;
$$;

grant execute on function public.track_visit(text) to anon, authenticated;
grant execute on function public.users_count() to anon, authenticated;
```

3. **Authentication → URL Configuration**: в **Site URL** и **Redirect URLs** впиши адрес сайта,
   например `https://<твой-логин>.github.io/itogovoesochinenie/`.
4. **Project Settings → API**: скопируй **Project URL** и **anon public** ключ и вставь их в файл
   `config.js`:

```js
window.APP_CONFIG = {
  supabaseUrl: 'https://xxxx.supabase.co',
  supabaseAnonKey: 'eyJ...'
};
```

`anon`-ключ публичный: его можно хранить в репозитории, данные защищены правилами доступа из SQL выше.
Никогда не вставляй сюда `service_role`-ключ.

### Где смотреть статистику

- **Authentication → Users** — сколько человек зарегистрировалось.
- **Table Editor → visits** — сколько раз открывали каждый раздел по дням.
  Что именно делает конкретный человек, не записывается.

## 3. Как устроен проект

| Файл | Что внутри |
| --- | --- |
| `index.html` | каркас страницы |
| `assets/style.css` | оформление, цвета разделов, ночная тема |
| `assets/app.js` | все разделы, конструктор, читалка, вход |
| `data/data.js` | произведения, тезисы, клише, сочинения (собирается скриптом) |
| `data/bank.json` | аргументы из сборников |
| `texts/*.json` | полные тексты классики |
| `build/` | исходники данных и скрипты сборки |

Пересобрать данные: `node build/assemble.js <папка с исходниками> .`
(подробности в `build/README.md`).
