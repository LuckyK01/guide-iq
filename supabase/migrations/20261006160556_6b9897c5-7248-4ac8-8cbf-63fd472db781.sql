create type public.app_role as enum ('new_joiner','manager','sme','admin');
create type public.knowledge_status as enum ('draft','ai_processed','pending_review','approved','published','review_due','archived');
create type public.module_state as enum ('not_started','in_progress','assessment_pending','passed','completed');

create table public.profiles (
  id uuid primary key,
  full_name text not null default '',
  email text,
  employee_type text not null default 'employee',
  role_title text default '',
  unit text default 'Global Solutions',
  tribe text default '',
  team text default '',
  joining_date date default current_date,
  experience_level text not null default 'experienced',
  manager_name text default '',
  buddy_name text default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('manager','sme','admin'))
$$;

create policy "own roles or admin" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin insert roles" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(),'admin'));
create policy "admin delete roles" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(),'admin'));
grant insert, delete on public.user_roles to authenticated;

create policy "read own or staff" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "update own" on public.profiles for update to authenticated using (id = auth.uid());
create policy "staff update" on public.profiles for update to authenticated using (public.has_role(auth.uid(),'manager') or public.has_role(auth.uid(),'admin'));

create table public.knowledge_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content_type text not null default 'Policy',
  category text default '',
  tags text[] not null default '{}',
  team text default 'All',
  source text default '',
  body text not null default '',
  status knowledge_status not null default 'draft',
  version int not null default 1,
  owner_id uuid,
  owner_name text default '',
  ai_summary text,
  ai_tags text[],
  ai_faqs jsonb,
  ai_objectives text[],
  ai_questions jsonb,
  ai_model text,
  ai_processed_at timestamptz,
  reviewer_name text,
  review_comment text,
  approved_at timestamptz,
  last_reviewed date,
  review_due date default (current_date + 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.knowledge_items to authenticated;
grant all on public.knowledge_items to service_role;
alter table public.knowledge_items enable row level security;
create policy "learners read published" on public.knowledge_items for select to authenticated
  using (status = 'published' or public.is_staff(auth.uid()));
create policy "staff insert" on public.knowledge_items for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update" on public.knowledge_items for update to authenticated using (public.is_staff(auth.uid()));
create policy "admin delete" on public.knowledge_items for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.knowledge_versions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.knowledge_items(id) on delete cascade,
  version int not null,
  title text not null,
  body text not null,
  status knowledge_status not null,
  changed_by text,
  note text,
  created_at timestamptz not null default now()
);
grant select, insert on public.knowledge_versions to authenticated;
grant all on public.knowledge_versions to service_role;
alter table public.knowledge_versions enable row level security;
create policy "staff read versions" on public.knowledge_versions for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff write versions" on public.knowledge_versions for insert to authenticated with check (public.is_staff(auth.uid()));

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  track text not null default 'mandatory',
  objectives text[] not null default '{}',
  content text not null default '',
  duration_min int not null default 30,
  pass_mark int not null default 70,
  questions jsonb not null default '[]',
  knowledge_ids uuid[] not null default '{}',
  sort_order int not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.modules to authenticated;
grant all on public.modules to service_role;
alter table public.modules enable row level security;
create policy "read published modules" on public.modules for select to authenticated using (published or public.is_staff(auth.uid()));
create policy "staff manage modules" on public.modules for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module_id uuid not null references public.modules(id) on delete cascade,
  state module_state not null default 'not_started',
  progress int not null default 0,
  attempts int not null default 0,
  score int,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, module_id)
);
grant select, insert, update on public.module_progress to authenticated;
grant all on public.module_progress to service_role;
alter table public.module_progress enable row level security;
create policy "own progress read" on public.module_progress for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "own progress insert" on public.module_progress for insert to authenticated with check (user_id = auth.uid());
create policy "own progress update" on public.module_progress for update to authenticated using (user_id = auth.uid());

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text,
  action text not null,
  resource_type text not null,
  resource_id text,
  resource_label text,
  details jsonb,
  created_at timestamptz not null default now()
);
grant select, insert on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "insert own audit" on public.audit_logs for insert to authenticated with check (actor_id = auth.uid());
create policy "staff read audit" on public.audit_logs for select to authenticated using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager'));

create table public.mentor_escalations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_name text,
  question text not null,
  reason text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.mentor_escalations to authenticated;
grant all on public.mentor_escalations to service_role;
alter table public.mentor_escalations enable row level security;
create policy "own esc insert" on public.mentor_escalations for insert to authenticated with check (user_id = auth.uid());
create policy "own or staff esc read" on public.mentor_escalations for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "staff esc update" on public.mentor_escalations for update to authenticated using (public.is_staff(auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email);
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  insert into public.user_roles (user_id, role) values (new.id, 'new_joiner');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

insert into public.knowledge_items (title, content_type, category, tags, source, body, status, version, owner_name, reviewer_name, approved_at, last_reviewed) values
('Company Culture & Values','Policy','Culture','{values,ethics,culture}','HR Handbook v3, section 1','Our values are Team Spirit, Innovation, Responsibility and Commitment. Every employee is expected to act with integrity, transparency and respect. Concerns about ethics can be raised confidentially through the Speak Up channel.','published',3,'HR Team','HR Business Partner',now(),current_date),
('Leave & Time-off Policy','Policy','HR Policy','{leave,holidays,time-off}','HR Handbook v3, section 4','Full-time employees receive 24 days of paid annual leave per year, accrued monthly. Leave requests must be submitted in the HR portal at least 5 working days in advance and approved by your manager. Sick leave of more than 2 consecutive days requires a medical certificate.','published',2,'HR Team','HR Business Partner',now(),current_date),
('IT Access & Laptop Setup SOP','SOP','IT','{laptop,vpn,access,it}','IT Service Desk SOP-012','On day one you receive a laptop from the IT desk. Activate your account with the temporary password emailed to your manager, enrol in multi-factor authentication, then connect to VPN using the Global Connect client. Request tool access (Jira, Confluence, Git) through the Access Request form; approvals take 1-2 working days.','published',1,'IT Service Desk','IT Lead',now(),current_date),
('Customer Handling Guidelines','Training material','Functional','{customer,support,escalation}','Customer Excellence Playbook','Acknowledge every customer query within 4 business hours. Use the CARE model: Clarify, Acknowledge, Resolve, Educate. Escalate unresolved issues older than 48 hours to your team lead.','pending_review',1,'Customer Excellence SME',null,null,null),
('Expense Reimbursement FAQ','FAQ','Finance','{expenses,finance}','Finance Wiki','Submit expenses within 30 days with receipts attached. Travel must be pre-approved.','draft',1,'Finance Team',null,null,null);

insert into public.modules (title, description, track, objectives, content, duration_min, sort_order, questions) values
('Company Culture & Values','Understand our mission, vision, and values.','mandatory','{"Name the four company values","Know how to raise an ethics concern"}','Our values are Team Spirit, Innovation, Responsibility and Commitment. Integrity and transparency guide every decision. Concerns can be raised via the confidential Speak Up channel.',25,1,
 '[{"q":"Which of these is one of our company values?","type":"mcq","options":["Speed","Responsibility","Profit","Hierarchy"],"answer":[1]},{"q":"Ethics concerns can be raised confidentially.","type":"tf","options":["True","False"],"answer":[0]}]'),
('Policies & Compliance','Leave, IT access and core policies every joiner must know.','mandatory','{"Request leave correctly","Set up IT access and MFA"}','Annual leave is 24 days, requested 5 working days in advance. On day one, activate your account, enrol MFA and connect to VPN.',30,2,
 '[{"q":"How many days in advance must leave be requested?","type":"mcq","options":["1","3","5","10"],"answer":[2]},{"q":"Select all day-one IT steps","type":"multi","options":["Enrol MFA","Connect to VPN","Order a new laptop","Activate account"],"answer":[0,1,3]}]'),
('Product Knowledge Basics','Learn about core product knowledge essentials.','role','{"Describe the core product lines"}','Our product portfolio spans core banking platforms, payments and client reporting. Each team owns a product area.',45,3,
 '[{"q":"Product areas are owned by individual teams.","type":"tf","options":["True","False"],"answer":[0]}]'),
('Customer Handling','Develop strategies to handle customer queries effectively.','role','{"Apply the CARE model","Know escalation timelines"}','Use the CARE model: Clarify, Acknowledge, Resolve, Educate. Escalate issues older than 48 hours.',40,4,
 '[{"q":"What does the C in CARE stand for?","type":"mcq","options":["Close","Clarify","Call","Confirm"],"answer":[1]}]'),
('Team Collaboration','Enhance your ability to work in collaborative environments.','experience','{"Use team rituals effectively"}','Teams run daily stand-ups, fortnightly retros, and document decisions in Confluence.',50,5,
 '[{"q":"Where are team decisions documented?","type":"mcq","options":["Email","Confluence","Chat only","Nowhere"],"answer":[1]}]');